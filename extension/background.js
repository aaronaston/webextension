const DEFAULT_PROMPT = `You are a clinical workflow assistant. Use the provided DOM snapshot and page metadata to summarize the current clinical context (patient charts, schedules, etc.) and suggest next-step actions. Highlight any detected PHI handling considerations.`;
const DEFAULT_MODEL = 'gpt-4o-mini';
const MAX_DOM_CHARS = 4000;

const tabState = new Map();
let tabStateReady = loadTabStateFromStorage();

const analysisCache = new Map();
let cacheReady = loadAnalysisCacheFromStorage();

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

async function setTabStateEntry(tabId, state, options = {}) {
  const { skipPersist = false } = options;
  await tabStateReady;
  tabState.set(tabId, state);
  if (!skipPersist) {
    await persistTabState();
  }
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

async function loadAnalysisCacheFromStorage() {
  try {
    const { analysisCache: stored = {} } = await storageGet({ analysisCache: {} });
    Object.entries(stored).forEach(([key, entry]) => {
      if (entry) {
        analysisCache.set(key, entry);
      }
    });
  } catch (error) {
    console.error('[CCA][background] Failed to load analysis cache', error);
  }
}

function serializeAnalysisCache() {
  const serialized = {};
  analysisCache.forEach((value, key) => {
    serialized[key] = value;
  });
  return serialized;
}

async function persistAnalysisCache() {
  try {
    await storageSet({ analysisCache: serializeAnalysisCache() });
  } catch (error) {
    console.error('[CCA][background] Failed to persist analysis cache', error);
  }
}

async function setCacheEntry(key, value) {
  await cacheReady;
  analysisCache.set(key, value);
  await persistAnalysisCache();
}

async function getCacheEntry(key) {
  await cacheReady;
  return analysisCache.get(key);
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
  const config = await loadConfig(payload.url);
  const truncatedDom = payload.dom.slice(0, MAX_DOM_CHARS);
  const cacheKey = generateCacheKey({
    url: payload.url,
    title: payload.title,
    contextSummary: payload.contextSummary,
    truncatedDom,
    promptTemplate: config.prompt,
  });

  const cachedEntry = await getCacheEntry(cacheKey);
  if (cachedEntry) {
    console.log('[CCA][background] using cached analysis', { tabId });
    await setTabStateEntry(tabId, {
      status: 'success',
      result: cachedEntry.result,
      contextSummary: cachedEntry.contextSummary,
      updatedAt: Date.now(),
    });
    notifyPopupUpdate(tabId);
    return;
  }

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

  const prompt = buildPrompt(config.prompt, payload, truncatedDom);
  console.log('[CCA][background] querying OpenAI (streaming)', { tabId, model: config.model });

  await setTabStateEntry(tabId, {
    status: 'streaming',
    result: '',
    updatedAt: Date.now(),
    contextSummary: payload.contextSummary,
  }, { skipPersist: true });
  notifyPopupUpdate(tabId);

  let finalText = '';
  try {
    finalText = await streamOpenAI({
      apiKey: config.apiKey,
      model: config.model || DEFAULT_MODEL,
      prompt,
      onDelta: async (text) => {
        await setTabStateEntry(tabId, {
          status: 'streaming',
          result: text,
          updatedAt: Date.now(),
          contextSummary: payload.contextSummary,
        }, { skipPersist: true });
        notifyPopupUpdate(tabId);
      },
    });
  } catch (streamError) {
    console.warn('[CCA][background] Streaming failed, falling back to non-streaming request', streamError);
    try {
      await setTabStateEntry(tabId, {
        status: 'loading',
        updatedAt: Date.now(),
        contextSummary: payload.contextSummary,
      }, { skipPersist: true });
      notifyPopupUpdate(tabId);
      finalText = await queryOpenAI({
        apiKey: config.apiKey,
        model: config.model || DEFAULT_MODEL,
        prompt,
      });
    } catch (fallbackError) {
      await setTabStateEntry(tabId, {
        status: 'error',
        error: fallbackError.message,
        updatedAt: Date.now(),
      });
      notifyPopupUpdate(tabId);
      throw fallbackError;
    }
  }

  await setCacheEntry(cacheKey, {
    result: finalText,
    contextSummary: payload.contextSummary,
    promptTemplate: config.prompt,
    cachedAt: Date.now(),
  });

  await setTabStateEntry(tabId, {
    status: 'success',
    result: finalText,
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

function buildPrompt(promptTemplate, payload, truncatedDomOverride) {
  const truncatedDom = typeof truncatedDomOverride === 'string'
    ? truncatedDomOverride
    : payload.dom.slice(0, MAX_DOM_CHARS);
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

function generateCacheKey({ url, title, contextSummary, truncatedDom, promptTemplate }) {
  const data = JSON.stringify([url, title, contextSummary, truncatedDom, promptTemplate]);
  return `cca_${hashString(data)}`;
}

function hashString(input) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0; // force 32-bit
  }
  return (hash >>> 0).toString(16);
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

async function streamOpenAI({ apiKey, model, prompt, onDelta }) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: prompt,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`OpenAI request failed: ${errorPayload.message || response.statusText}`);
  }

  if (!response.body || !response.body.getReader) {
    throw new Error('Streaming not supported in this environment');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let finalText = '';
  let streamDone = false;

  const processDataPayload = async (payload) => {
    const trimmed = payload.trim();
    if (!trimmed) {
      return;
    }
    if (trimmed === '[DONE]') {
      streamDone = true;
      return;
    }

    let event;
    try {
      event = JSON.parse(trimmed);
    } catch (error) {
      console.warn('[CCA][background] Unable to parse streaming chunk', error, trimmed);
      return;
    }

    if (typeof event.index === 'number' && event.index !== 0) {
      return;
    }

    const type = event.type || '';
    if (type === 'response.error') {
      const message = event.error?.message || 'OpenAI streaming error';
      throw new Error(message);
    }

    if (type === 'response.output_text.delta') {
      const delta = typeof event.delta === 'string' ? event.delta : '';
      if (delta) {
        finalText += delta;
        if (onDelta) {
          await onDelta(finalText);
        }
      }
      return;
    }

    const normalized = normalizeOutputText(event.output_text)
      || normalizeOutputText(event.delta)
      || normalizeOutputText(event.text)
      || normalizeOutputText(event.response?.output_text);

    if (normalized) {
      finalText = normalized;
      if (onDelta) {
        await onDelta(finalText);
      }
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      buffer += decoder.decode();
    } else {
      buffer += decoder.decode(value, { stream: true });
    }

    let boundary;
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const lines = rawEvent.split('\n');
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const payload = line.slice(5);
          await processDataPayload(payload);
          if (streamDone) {
            break;
          }
        }
      }
      if (streamDone) {
        break;
      }
    }

    if (done || streamDone) {
      break;
    }
  }

  if (!streamDone && buffer.trim()) {
    const lines = buffer.trim().split('\n');
    for (const line of lines) {
      if (line.startsWith('data:')) {
        await processDataPayload(line.slice(5));
        if (streamDone) {
          break;
        }
      }
    }
  }

  return finalText;
}

function normalizeOutputText(value) {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.filter((entry) => typeof entry === 'string' && entry.length > 0).join('');
  }
  if (typeof value === 'object') {
    if (typeof value.text === 'string') {
      return value.text;
    }
    if (Array.isArray(value.text)) {
      return value.text.join('');
    }
    if (Array.isArray(value.content)) {
      return value.content
        .map((chunk) => {
          if (typeof chunk === 'string') {
            return chunk;
          }
          if (chunk && typeof chunk === 'object' && typeof chunk.text === 'string') {
            return chunk.text;
          }
          return '';
        })
        .filter(Boolean)
        .join('');
    }
  }
  return '';
}
