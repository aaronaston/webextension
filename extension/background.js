const DEFAULT_PROMPT = `You are a clinical workflow assistant. Use the provided DOM snapshot and page metadata to summarize the current clinical context (patient charts, schedules, etc.) and suggest next-step actions. Highlight any detected PHI handling considerations.`;
const DEFAULT_MODEL = 'gpt-4o-mini';
const MAX_DOM_CHARS = 4000;

const tabState = new Map();
let tabStateReady = loadTabStateFromStorage();

function storageGet(keys) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(keys, (items) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          reject(new Error(runtimeError.message));
          return;
        }
        resolve(items);
      });
    } catch (error) {
      reject(error);
    }
  });
}

function storageSet(items) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set(items, () => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          reject(new Error(runtimeError.message));
          return;
        }
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function loadTabStateFromStorage() {
  try {
    const { tabState: stored = {} } = await storageGet({ tabState: {} });
    Object.entries(stored).forEach(([storedTabId, state]) => {
      const numericTabId = Number(storedTabId);
      if (!Number.isNaN(numericTabId) && state) {
        tabState.set(numericTabId, state);
      }
    });
  } catch (error) {
    console.error('[CCA][background] Failed to load persisted tab state', error);
  }
}

function serializeTabState() {
  const serialized = {};
  tabState.forEach((value, key) => {
    serialized[key] = value;
  });
  return serialized;
}

async function persistTabState() {
  try {
    await storageSet({ tabState: serializeTabState() });
  } catch (error) {
    console.error('[CCA][background] Failed to persist tab state', error);
  }
}

async function setTabStateEntry(tabId, state) {
  await tabStateReady;
  tabState.set(tabId, state);
  await persistTabState();
}

async function deleteTabStateEntry(tabId) {
  await tabStateReady;
  if (tabState.delete(tabId)) {
    await persistTabState();
  }
}

async function getTabStateEntry(tabId) {
  await tabStateReady;
  return tabState.get(tabId);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;
  console.log('[CCA][background] message received', { type: message?.type, tabId });

  if (message?.type === 'PAGE_CONTEXT' && tabId) {
    handlePageContext(tabId, message.payload).catch(async (error) => {
      console.error('[CCA][background] Failed to process page context', error);
      await setTabStateEntry(tabId, {
        status: 'error',
        error: error.message,
        updatedAt: Date.now(),
      });
      notifyPopupUpdate(tabId);
    });
    return; // no async sendResponse
  }

  if (message?.type === 'POPUP_REQUEST') {
    (async () => {
      await tabStateReady;
      const targetTabId = tabId || message.tabId;
      if (!targetTabId) {
        console.warn('[CCA][background] POPUP_REQUEST missing tabId');
        sendResponse({ status: 'error', error: 'Unable to determine active tab.' });
        return;
      }

      const response = (await getTabStateEntry(targetTabId)) || { status: 'idle' };
      console.log('[CCA][background] responding to POPUP_REQUEST', { tabId: targetTabId, status: response.status });
      sendResponse(response);
    })().catch((error) => {
      console.error('[CCA][background] Failed to respond to POPUP_REQUEST', error);
      sendResponse({ status: 'error', error: error.message });
    });
    return true; // async sendResponse
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  deleteTabStateEntry(tabId).catch((error) => {
    console.error('[CCA][background] Failed to clear tab state on removal', { tabId, error: error.message });
  });
});

async function handlePageContext(tabId, payload) {
  console.log('[CCA][background] handlePageContext', { tabId, reason: payload?.reason });
  await setTabStateEntry(tabId, {
    status: 'loading',
    updatedAt: Date.now(),
  });
  notifyPopupUpdate(tabId);

  const config = await loadConfig(payload.url);
  if (!config.apiKey) {
    console.warn('[CCA][background] missing API key');
    await setTabStateEntry(tabId, {
      status: 'needs_api_key',
      message: 'Set an OpenAI API key in the extension options.',
      updatedAt: Date.now(),
    });
    notifyPopupUpdate(tabId);
    return;
  }

  const prompt = buildPrompt(config.prompt, payload);
  console.log('[CCA][background] querying OpenAI', { tabId, model: config.model });

  const openAIResponse = await queryOpenAI({
    apiKey: config.apiKey,
    model: config.model || DEFAULT_MODEL,
    prompt,
  });

  await setTabStateEntry(tabId, {
    status: 'success',
    result: openAIResponse,
    updatedAt: Date.now(),
    contextSummary: payload.contextSummary,
  });
  console.log('[CCA][background] OpenAI response stored', { tabId });
  notifyPopupUpdate(tabId);
}

function notifyPopupUpdate(tabId) {
  console.log('[CCA][background] notifying popup', { tabId });
  chrome.runtime.sendMessage({ type: 'CONTEXT_UPDATED', tabId });
}

async function loadConfig(url) {
  console.log('[CCA][background] loading config', { url });
  const { openAI = {} } = await storageGet({ openAI: {} });
  const hostname = extractHostname(url);
  const siteConfig = (openAI.sites && openAI.sites[hostname]) || {};

  return {
    apiKey: openAI.apiKey || '',
    model: siteConfig.model || openAI.model || DEFAULT_MODEL,
    prompt: siteConfig.prompt || openAI.defaultPrompt || DEFAULT_PROMPT,
  };
}

function extractHostname(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch (error) {
    console.warn('[CCA][background] Unable to parse URL for hostname', url, error);
    return 'unknown';
  }
}

function buildPrompt(promptTemplate, payload) {
  const truncatedDom = payload.dom.slice(0, MAX_DOM_CHARS);
  const contextLines = [
    `Page URL: ${payload.url}`,
    `Title: ${payload.title}`,
    `Update trigger: ${payload.reason || 'unknown'}`,
    `Detected context: ${payload.contextSummary}`,
    `Timestamp: ${new Date().toISOString()}`,
    `DOM Snapshot (first ${MAX_DOM_CHARS} chars):`,
    truncatedDom,
  ];

  return `${promptTemplate}\n\n${contextLines.join('\n')}`;
}

async function queryOpenAI({ apiKey, model, prompt }) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: prompt,
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`OpenAI request failed: ${errorPayload.message || response.statusText}`);
  }

  const data = await response.json();
  if (data.output_text) {
    return Array.isArray(data.output_text) ? data.output_text.join('\n') : String(data.output_text);
  }

  if (Array.isArray(data.output)) {
    return data.output
      .map((item) => {
        if (item && typeof item === 'object' && Array.isArray(item.content)) {
          return item.content.map((chunk) => chunk.text || '').join('\n');
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }

  return JSON.stringify(data);
}
