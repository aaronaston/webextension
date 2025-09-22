const DEFAULT_PROMPT = `You are a clinical workflow assistant. Use the provided DOM snapshot and page metadata to summarize the current clinical context (patient charts, schedules, etc.) and suggest next-step actions. Highlight any detected PHI handling considerations.`;
const DEFAULT_MODEL = 'gpt-4o-mini';
const MAX_DOM_CHARS = 4000;

const tabState = new Map();
let tabStateReady = loadTabStateFromStorage();


function defaultChatState() {
  return {
    status: 'idle',
    messages: [],
    pendingAssistant: null,
    error: null,
    updatedAt: null,
  };
}

function defaultTabState() {
  return {
    status: 'idle',
    result: '',
    updatedAt: null,
    contextSummary: '',
    isEmr: false,
    chat: defaultChatState(),
    chatSessions: {},
    activeChatKey: null,
    defaultPrompt: '',
    defaultPromptLabel: '',
    model: DEFAULT_MODEL,
    lastContext: null,
    patientKey: null,
    patientLabel: '',
    message: '',
  };
}

function normalizeTabState(state) {
  if (!state || typeof state !== 'object') {
    return defaultTabState();
  }
  const normalized = {
    ...defaultTabState(),
    ...state,
  };
  const sessions = normalized.chatSessions && typeof normalized.chatSessions === 'object'
    ? { ...normalized.chatSessions }
    : {};
  Object.keys(sessions).forEach((key) => {
    sessions[key] = normalizeChatState(sessions[key]);
  });
  normalized.chatSessions = sessions;
  let activeKey = normalized.activeChatKey && sessions[normalized.activeChatKey]
    ? normalized.activeChatKey
    : null;
  if (!activeKey) {
    const keys = Object.keys(sessions);
    activeKey = keys.length > 0 ? keys[0] : null;
  }
  if (activeKey && !sessions[activeKey]) {
    sessions[activeKey] = defaultChatState();
  }
  normalized.activeChatKey = activeKey;
  normalized.chat = normalizeChatState(activeKey ? sessions[activeKey] : defaultChatState());
  return normalized;
}

function summarizePromptLabel(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return '';
  }
  const cleaned = prompt.replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    return '';
  }
  const words = cleaned.split(' ').slice(0, 5).join(' ');
  return words.length < cleaned.length ? `${words}...` : words;
}

function normalizeChatState(chatState) {
  if (!chatState || typeof chatState !== 'object') {
    return defaultChatState();
  }
  return {
    ...defaultChatState(),
    ...chatState,
    messages: Array.isArray(chatState.messages) ? [...chatState.messages] : [],
    pendingAssistant: chatState.pendingAssistant || null,
    error: chatState.error || null,
  };
}

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
        tabState.set(numericTabId, normalizeTabState(state));
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

async function setTabStateEntry(tabId, updates, options = {}) {
  const { skipPersist = false } = options;
  await tabStateReady;
  const current = normalizeTabState(tabState.get(tabId));
  const next = {
    ...current,
  };

  if (updates && typeof updates === 'object') {
    Object.entries(updates).forEach(([key, value]) => {
      switch (key) {
        case 'chatSessions': {
          const mergedSessions = { ...current.chatSessions };
          Object.entries(value || {}).forEach(([sessionKey, sessionValue]) => {
            mergedSessions[sessionKey] = normalizeChatState(sessionValue);
          });
          next.chatSessions = mergedSessions;
          break;
        }
        case 'activeChatKey':
          next.activeChatKey = value;
          break;
        case 'chat':
          // chat is derived below
          break;
        default:
          next[key] = value;
      }
    });
  }

  if (!next.chatSessions || typeof next.chatSessions !== 'object') {
    next.chatSessions = {};
  }

  let activeKey = next.activeChatKey && next.chatSessions[next.activeChatKey]
    ? next.activeChatKey
    : null;
  if (!activeKey) {
    const keys = Object.keys(next.chatSessions);
    activeKey = keys.length > 0 ? keys[0] : null;
  }
  if (activeKey && !next.chatSessions[activeKey]) {
    next.chatSessions[activeKey] = defaultChatState();
  }
  next.activeChatKey = activeKey;
  const activeChat = normalizeChatState(activeKey ? next.chatSessions[activeKey] : defaultChatState());
  if (activeKey) {
    next.chatSessions[activeKey] = activeChat;
  }
  next.chat = activeChat;

  tabState.set(tabId, next);
  if (!skipPersist) {
    await persistTabState();
  }
  return next;
}

async function deleteTabStateEntry(tabId) {
  await tabStateReady;
  if (tabState.delete(tabId)) {
    await persistTabState();
  }
}

async function getTabStateEntry(tabId) {
  await tabStateReady;
  const state = tabState.get(tabId);
  if (!state) {
    const normalized = defaultTabState();
    tabState.set(tabId, normalized);
    return normalized;
  }
  const normalized = normalizeTabState(state);
  tabState.set(tabId, normalized);
  return normalized;
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

  if (message?.type === 'CHAT_REQUEST') {
    const targetTabId = tabId || message.tabId;
    if (!targetTabId) {
      sendResponse({ ok: false, error: 'Unable to determine active tab.' });
      return false;
    }

    sendResponse({ ok: true });

    (async () => {
      try {
        await handleChatRequest(targetTabId, message);
      } catch (error) {
        console.error('[CCA][background] Chat request failed', error);
        const current = await getTabStateEntry(targetTabId);
        await setTabStateEntry(targetTabId, {
          chat: {
            ...current.chat,
            status: 'error',
            error: error.message,
            pendingAssistant: null,
            updatedAt: Date.now(),
          },
        });
        notifyPopupUpdate(targetTabId);
      }
    })();

    return true;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  deleteTabStateEntry(tabId).catch((error) => {
    console.error('[CCA][background] Failed to clear tab state on removal', { tabId, error: error.message });
  });
});

async function handlePageContext(tabId, payload) {
  console.log('[CCA][background] handlePageContext', { tabId, reason: payload?.reason });
  const prevState = await getTabStateEntry(tabId);
  const config = await loadConfig(payload.url);
  const truncatedDom = payload.dom.slice(0, MAX_DOM_CHARS);
  const now = Date.now();
  const contextChanged = Boolean(
    prevState.lastContext
      && (prevState.lastContext.url !== payload.url
        || prevState.lastContext.title !== payload.title
        || prevState.lastContext.contextSummary !== payload.contextSummary)
  );

  const patientKey = payload.patientKey || `${payload.url}#${payload.title}`;
  const patientLabel = payload.patientLabel || payload.title || 'Current chart';

  const updates = {
    isEmr: Boolean(payload.isEmr),
    defaultPrompt: config.prompt || DEFAULT_PROMPT,
    defaultPromptLabel: summarizePromptLabel(config.prompt || DEFAULT_PROMPT),
    model: config.model || DEFAULT_MODEL,
    contextSummary: payload.contextSummary,
    lastContext: {
      url: payload.url,
      title: payload.title,
      reason: payload.reason,
      contextSummary: payload.contextSummary,
      dom: truncatedDom,
    },
    patientKey,
    patientLabel,
  };

  if (!payload.isEmr) {
    updates.status = 'no_emr';
    updates.result = '';
    updates.updatedAt = now;
    updates.isEmr = false;
    updates.message = 'No EMR detected on this page.';
    updates.patientKey = null;
    updates.patientLabel = '';
    updates.activeChatKey = null;
    await setTabStateEntry(tabId, updates);
    notifyPopupUpdate(tabId);
    return;
  }

  if (!config.apiKey) {
    updates.status = 'needs_api_key';
    updates.result = '';
    updates.updatedAt = now;
    updates.isEmr = true;
    updates.message = 'Add an OpenAI API key in options to enable chat.';
    updates.activeChatKey = patientKey;
    if (!prevState.chatSessions?.[patientKey]) {
      updates.chatSessions = { [patientKey]: defaultChatState() };
    }
    await setTabStateEntry(tabId, updates);
    notifyPopupUpdate(tabId);
    return;
  }

  updates.status = 'ready';
  updates.result = '';
  updates.updatedAt = now;
  updates.isEmr = true;
  updates.message = '';
  updates.activeChatKey = patientKey;

  if (!prevState.chatSessions?.[patientKey]) {
    updates.chatSessions = { [patientKey]: defaultChatState() };
  }

  if (contextChanged && prevState.chatSessions?.[patientKey]) {
    const restoredSession = normalizeChatState(prevState.chatSessions[patientKey]);
    updates.chatSessions = {
      ...(updates.chatSessions || {}),
      [patientKey]: {
        ...restoredSession,
        status: 'idle',
        pendingAssistant: null,
        error: null,
      },
    };
  }

  await setTabStateEntry(tabId, updates);
  notifyPopupUpdate(tabId);
}

async function handleChatRequest(tabId, message) {
  const state = await getTabStateEntry(tabId);
  if (!state.isEmr) {
    throw new Error('No EMR detected on this page.');
  }

  const patientKey = state.activeChatKey;
  if (!patientKey) {
    throw new Error('No patient selected. Navigate to a patient chart to start chatting.');
  }

  const existingSession = normalizeChatState(state.chatSessions?.[patientKey]);
  if (existingSession.status === 'streaming') {
    throw new Error('Assistant is already responding.');
  }

  const contextUrl = state.lastContext?.url || message.pageUrl || state.lastContext?.url || '';
  const config = await loadConfig(contextUrl);
  if (!config.apiKey) {
    throw new Error('OpenAI API key is required for chat.');
  }

  const defaultPromptText = state.defaultPrompt || config.prompt || DEFAULT_PROMPT;
  let userMessage = '';
  if (message.useDefaultPrompt) {
    userMessage = defaultPromptText;
  } else {
    userMessage = (message.message || '').trim();
  }

  if (!userMessage) {
    throw new Error('Enter a message to send.');
  }

  const userEntry = {
    role: 'user',
    content: userMessage,
    createdAt: Date.now(),
  };

  const conversationMessages = [...existingSession.messages, userEntry];

  await setTabStateEntry(tabId, {
    activeChatKey: patientKey,
    chatSessions: {
      [patientKey]: {
        ...existingSession,
        status: 'streaming',
        messages: conversationMessages,
        pendingAssistant: '',
        error: null,
        updatedAt: Date.now(),
      },
    },
    message: '',
  }, { skipPersist: true });
  notifyPopupUpdate(tabId);

  const lastContext = state.lastContext || {};
  const promptPayload = {
    url: lastContext.url || '',
    title: lastContext.title || '',
    dom: lastContext.dom || '',
    reason: 'chat',
    contextSummary: lastContext.contextSummary || state.contextSummary || '',
  };
  const systemPrompt = buildPrompt(defaultPromptText, promptPayload, lastContext.dom || '');
  const conversationLines = conversationMessages
    .map((entry) => {
      const speaker = entry.role === 'assistant' ? 'Assistant' : 'Clinician';
      return `${speaker}: ${entry.content}`;
    })
    .join('\n');
  const chatPrompt = `${systemPrompt}

Conversation so far:
${conversationLines}
Assistant:`;

  const model = state.model || config.model || DEFAULT_MODEL;
  let finalText = '';

  try {
    finalText = await streamOpenAI({
      apiKey: config.apiKey,
      model,
      prompt: chatPrompt,
      onDelta: async (text) => {
        await setTabStateEntry(tabId, {
          activeChatKey: patientKey,
          chatSessions: {
            [patientKey]: {
              ...existingSession,
              status: 'streaming',
              messages: conversationMessages,
              pendingAssistant: text,
              error: null,
              updatedAt: Date.now(),
            },
          },
        }, { skipPersist: true });
        notifyPopupUpdate(tabId);
      },
    });
  } catch (streamError) {
    await setTabStateEntry(tabId, {
      activeChatKey: patientKey,
      chatSessions: {
        [patientKey]: {
          ...existingSession,
          status: 'error',
          messages: conversationMessages,
          pendingAssistant: null,
          error: streamError.message || 'OpenAI request failed.',
          updatedAt: Date.now(),
        },
      },
    });
    notifyPopupUpdate(tabId);
    return;
  }

  finalText = finalText.trim();

  if (!finalText) {
    await setTabStateEntry(tabId, {
      activeChatKey: patientKey,
      chatSessions: {
        [patientKey]: {
          ...existingSession,
          status: 'idle',
          messages: conversationMessages,
          pendingAssistant: null,
          error: null,
          updatedAt: Date.now(),
        },
      },
    });
    notifyPopupUpdate(tabId);
    return;
  }

  const assistantEntry = {
    role: 'assistant',
    content: finalText,
    createdAt: Date.now(),
  };

  const finalMessages = [...conversationMessages, assistantEntry];

  await setTabStateEntry(tabId, {
    activeChatKey: patientKey,
    chatSessions: {
      [patientKey]: {
        ...existingSession,
        status: 'idle',
        messages: finalMessages,
        pendingAssistant: null,
        error: null,
        updatedAt: Date.now(),
      },
    },
  });
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
async function queryOpenAI({ apiKey, model, prompt, input }) {
  const requestBody = { model };
  if (input !== undefined && input !== null) {
    requestBody.input = input;
  } else if (prompt !== undefined && prompt !== null) {
    requestBody.input = prompt;
  } else {
    throw new Error('No prompt or input provided for OpenAI request.');
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
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

async function streamOpenAI({ apiKey, model, prompt, input, onDelta }) {
  const requestBody = { model, stream: true };
  if (input !== undefined && input !== null) {
    requestBody.input = input;
  } else if (prompt !== undefined && prompt !== null) {
    requestBody.input = prompt;
  } else {
    throw new Error('No prompt or input provided for OpenAI streaming request.');
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
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
