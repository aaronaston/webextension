const DEFAULT_PROMPT = `You are a clinical workflow assistant. Use the provided DOM snapshot and page metadata to summarize the current clinical context (patient charts, schedules, etc.) and suggest next-step actions. Highlight any detected PHI handling considerations.`;
const DEFAULT_MODEL = 'gpt-4o-mini';
const MAX_DOM_CHARS = 4000;

const tabState = new Map();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'PAGE_CONTEXT' && sender.tab?.id) {
    handlePageContext(sender.tab.id, message.payload).catch((error) => {
      console.error('Failed to process page context', error);
      tabState.set(sender.tab.id, {
        status: 'error',
        error: error.message,
        updatedAt: Date.now(),
      });
      notifyPopupUpdate(sender.tab.id);
    });
  } else if (message?.type === 'POPUP_REQUEST' && sender.tab?.id) {
    sendResponse(tabState.get(sender.tab.id) || { status: 'idle' });
  }
  return true;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabState.delete(tabId);
});

async function handlePageContext(tabId, payload) {
  const config = await loadConfig(payload.url);
  if (!config.apiKey) {
    tabState.set(tabId, {
      status: 'needs_api_key',
      message: 'Set an OpenAI API key in the extension options.',
      updatedAt: Date.now(),
    });
    notifyPopupUpdate(tabId);
    return;
  }

  const prompt = buildPrompt(config.prompt, payload);
  tabState.set(tabId, { status: 'loading', updatedAt: Date.now() });
  notifyPopupUpdate(tabId);

  const openAIResponse = await queryOpenAI({
    apiKey: config.apiKey,
    model: config.model || DEFAULT_MODEL,
    prompt,
  });

  tabState.set(tabId, {
    status: 'success',
    result: openAIResponse,
    updatedAt: Date.now(),
    contextSummary: payload.contextSummary,
  });
  notifyPopupUpdate(tabId);
}

function notifyPopupUpdate(tabId) {
  chrome.runtime.sendMessage({ type: 'CONTEXT_UPDATED', tabId });
}

async function loadConfig(url) {
  const { openAI = {} } = await chrome.storage.local.get({ openAI: {} });
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
    console.warn('Unable to parse URL for hostname', url, error);
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
