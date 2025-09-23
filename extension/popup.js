document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const contextSection = document.getElementById('context-summary');
  const contextText = document.getElementById('context-text');
  const analysisSection = document.getElementById('analysis');
  const analysisText = document.getElementById('analysis-text');
  const detectionBadge = document.getElementById('detection-badge');
  const detectionMessage = document.getElementById('detection-message');
  const chatSection = document.getElementById('chat');
  const chatControls = document.getElementById('chat-controls');
  const chatLog = document.getElementById('chat-log');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatSubmit = document.getElementById('chat-submit');
  const resetChatBtn = document.getElementById('reset-chat');
  const openOptionsBtn = document.getElementById('open-options');

  let activeTabId = null;

  openOptionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = (chatInput.value || '').trim();
    if (!message) {
      chatInput.focus();
      return;
    }
    chatInput.value = '';
    sendChatMessage({ text: message });
  });

  chatControls.addEventListener('click', (event) => {
    const target = event.target.closest('button[data-prompt-chip]');
    if (!target || target.disabled) {
      return;
    }
    event.preventDefault();
    const presetPrompt = target.getAttribute('data-prompt') || '';
    chatInput.value = presetPrompt;
    chatInput.focus();
    chatInput.setSelectionRange(chatInput.value.length, chatInput.value.length);
  });

  resetChatBtn.addEventListener('click', () => {
    resetChat();
  });

  chatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      chatForm.requestSubmit();
    }
  });

  function sendChatMessage({ text = '', useDefault = false }) {
    if (!activeTabId) {
      statusEl.textContent = 'No active tab detected.';
      return;
    }

    const payload = {
      type: 'CHAT_REQUEST',
      tabId: activeTabId,
    };

    if (useDefault) {
      payload.useDefaultPrompt = true;
    } else if (text) {
      payload.message = text;
    } else {
      chatInput.focus();
      return;
    }

    chatSubmit.disabled = true;
    chatInput.disabled = true;
    setChipButtonsDisabled(true);
    resetChatBtn.disabled = true;

    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime.lastError) {
        statusEl.textContent = chrome.runtime.lastError.message;
        chatSubmit.disabled = false;
        chatInput.disabled = false;
        setChipButtonsDisabled(false);
        resetChatBtn.disabled = false;
        return;
      }
      if (response && response.ok === false && response.error) {
        statusEl.textContent = response.error;
        chatSubmit.disabled = false;
        chatInput.disabled = false;
        setChipButtonsDisabled(false);
        resetChatBtn.disabled = false;
      }
    });
  }

  function resetChat() {
    if (!activeTabId) {
      statusEl.textContent = 'No active tab detected.';
      return;
    }

    chatSubmit.disabled = true;
    chatInput.disabled = true;
    setChipButtonsDisabled(true);
    resetChatBtn.disabled = true;
    statusEl.textContent = 'Resetting chat...';

    chrome.runtime.sendMessage({ type: 'RESET_CHAT', tabId: activeTabId }, (response) => {
      if (chrome.runtime.lastError) {
        statusEl.textContent = chrome.runtime.lastError.message;
        chatSubmit.disabled = false;
        chatInput.disabled = false;
        setChipButtonsDisabled(false);
        resetChatBtn.disabled = false;
        return;
      }

      if (response && response.ok === false && response.error) {
        statusEl.textContent = response.error;
        chatSubmit.disabled = false;
        chatInput.disabled = false;
        setChipButtonsDisabled(false);
        resetChatBtn.disabled = false;
        return;
      }

      refresh();
    });
  }

  function queryTabs(queryInfo) {
    return new Promise((resolve, reject) => {
      chrome.tabs.query(queryInfo, (tabs) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          reject(new Error(runtimeError.message));
          return;
        }
        resolve(tabs);
      });
    });
  }

  async function refresh() {
    let tabs;
    try {
      tabs = await queryTabs({ active: true, currentWindow: true });
    } catch (error) {
      updateUI({ status: 'error', error: error.message });
      return;
    }

    const [tab] = tabs || [];
    if (!tab) {
      updateUI({ status: 'error', error: 'No active tab detected.' });
      return;
    }
    activeTabId = tab.id;
    chrome.runtime.sendMessage({ type: 'POPUP_REQUEST', tabId: tab.id }, (response) => {
      if (chrome.runtime.lastError) {
        updateUI({ status: 'error', error: chrome.runtime.lastError.message });
        return;
      }
      updateUI(response || { status: 'idle' });
    });
  }

  function updateUI(rawState) {
    const state = normalizeState(rawState);
    renderDetection(state);
    renderAnalysis(state);
    renderChat(state);
  }

  function normalizeState(rawState) {
    const state = rawState || {};
    let status = state.status || 'idle';
    if ((status === 'streaming' || status === 'success') && !(state.result && state.result.trim())) {
      status = 'ready';
    }
    return {
      status,
      result: state.result || '',
      contextSummary: state.contextSummary || '',
      updatedAt: state.updatedAt || null,
      message: state.message || '',
      error: state.error || '',
      isEmr: Boolean(state.isEmr),
      defaultPromptLabel: state.defaultPromptLabel || '',
      defaultPrompt: state.defaultPrompt || '',
      promptChips: Array.isArray(state.promptChips) ? state.promptChips : [],
      patientLabel: state.patientLabel || state.lastContext?.title || '',
      patientKey: state.patientKey || null,
      activeChatKey: state.activeChatKey || null,
      lastContext: state.lastContext || null,
      chatSessions: state.chatSessions || {},
      chat: normalizeChat(state.chat),
    };
  }

  function normalizeChat(chatState) {
    const base = {
      status: 'idle',
      messages: [],
      pendingAssistant: null,
      error: null,
      updatedAt: null,
    };
    if (!chatState || typeof chatState !== 'object') {
      return base;
    }
    return {
      ...base,
      ...chatState,
      messages: Array.isArray(chatState.messages) ? chatState.messages : [],
      pendingAssistant: chatState.pendingAssistant || null,
      error: chatState.error || null,
    };
  }

  function renderDetection(state) {
    detectionBadge.classList.remove('emr', 'not-emr');
    if (!state.isEmr) {
      detectionBadge.textContent = 'No EMR detected';
      detectionBadge.classList.add('not-emr');
      detectionMessage.textContent = 'Open a supported chart to enable chat.';
    } else {
      const label = state.patientLabel || 'this chart';
      detectionBadge.textContent = 'EMR detected';
      detectionBadge.classList.add('emr');
      if (state.status === 'needs_api_key') {
        detectionMessage.textContent = 'Add an OpenAI API key in options to enable chat.';
      } else {
        detectionMessage.textContent = `Chat with ${label} using the form below.`;
      }
    }
  }

  function renderAnalysis(state) {
    const status = state.status;
    const previousScrollTop = analysisText.scrollTop;
    const previousScrollHeight = analysisText.scrollHeight;
    const scrollableHeight = Math.max(previousScrollHeight - analysisText.clientHeight, 0);
    const userWasAtBottom = scrollableHeight <= 0 || scrollableHeight - previousScrollTop <= 16;
    let contentUpdated = false;

    contextSection.classList.add('hidden');
    analysisSection.classList.add('hidden');
    contextText.textContent = '';
    analysisText.innerHTML = '';

    switch (status) {
      case 'no_emr':
        statusEl.textContent = 'No EMR detected. Open a supported chart to start chatting.';
        break;
      case 'ready':
        statusEl.textContent = 'Chat ready. Ask a question below.';
        break;
      case 'idle':
        statusEl.textContent = 'Detecting EMR context...';
        break;
      case 'loading':
        statusEl.textContent = 'Analyzing page with OpenAI...';
        analysisSection.classList.remove('hidden');
        analysisText.textContent = 'Contacting OpenAI...';
        contentUpdated = true;
        break;
      case 'needs_api_key':
        statusEl.textContent = state.message || 'Add an OpenAI API key in options.';
        break;
      case 'error':
        statusEl.textContent = `Error: ${state.error || 'Unknown error'}`;
        analysisSection.classList.remove('hidden');
        analysisText.textContent = state.error || 'Unknown error';
        contentUpdated = true;
        break;
      case 'streaming':
        statusEl.textContent = 'Generating analysis...';
        if (state.isEmr && state.contextSummary) {
          contextSection.classList.remove('hidden');
          contextText.textContent = state.contextSummary;
        }
        analysisSection.classList.remove('hidden');
        if (state.result) {
          renderMarkdown(analysisText, state.result);
        } else {
          analysisText.textContent = 'Waiting for response...';
        }
        contentUpdated = true;
        break;
      case 'success':
        statusEl.textContent = state.updatedAt
          ? `Updated ${new Date(state.updatedAt).toLocaleTimeString()}`
          : 'Analysis ready.';
        if (state.isEmr && state.contextSummary) {
          contextSection.classList.remove('hidden');
          contextText.textContent = state.contextSummary;
        }
        if (state.result) {
          analysisSection.classList.remove('hidden');
          renderMarkdown(analysisText, state.result);
          contentUpdated = true;
        }
        break;
      default:
        statusEl.textContent = 'Status unavailable.';
    }

    if (contentUpdated) {
      requestAnimationFrame(() => {
        if (status === 'streaming' || status === 'success') {
          if (userWasAtBottom) {
            analysisText.scrollTop = analysisText.scrollHeight;
          } else {
            const maxScrollTop = Math.max(analysisText.scrollHeight - analysisText.clientHeight, 0);
            analysisText.scrollTop = Math.min(previousScrollTop, maxScrollTop);
          }
        } else {
          analysisText.scrollTop = 0;
        }
      });
    } else {
      analysisText.scrollTop = 0;
    }
  }

  function renderChat(state) {
    const chatState = state.chat;
    const label = state.patientLabel || 'this chart';

    if (!state.isEmr) {
      chatSection.classList.add('hidden');
      chatSubmit.disabled = true;
      chatInput.disabled = true;
      chatInput.placeholder = 'Chat unavailable';
      clearPromptChips();
      resetChatBtn.disabled = true;
      return;
    }

    chatSection.classList.remove('hidden');

    if (state.status === 'needs_api_key') {
      clearPromptChips();
      chatLog.innerHTML = '';
      chatLog.appendChild(renderChatMessage({
        role: 'assistant',
        content: 'Add an OpenAI API key in options to start chatting.',
      }));
      chatInput.disabled = true;
      chatSubmit.disabled = true;
      chatInput.placeholder = 'Chat unavailable';
      resetChatBtn.disabled = true;
      return;
    }

    chatInput.placeholder = `Ask about ${label}...`;

    const disableInput = chatState.status === 'streaming' || chatState.status === 'disabled';
    chatInput.disabled = disableInput;
    chatSubmit.disabled = disableInput;
    renderPromptChips(state, { disable: disableInput });
    const hasChatHistory = chatState.messages.length > 0
      || Boolean(chatState.pendingAssistant)
      || (chatState.status === 'error' && chatState.error);
    resetChatBtn.disabled = disableInput || !hasChatHistory;

    const wasAtBottom = chatLog.scrollHeight - chatLog.clientHeight - chatLog.scrollTop <= 16;
    chatLog.innerHTML = '';

    chatState.messages.forEach((entry) => {
      chatLog.appendChild(renderChatMessage(entry));
    });

    if (chatState.pendingAssistant) {
      chatLog.appendChild(renderChatMessage({
        role: 'assistant',
        content: chatState.pendingAssistant,
        streaming: true,
      }));
    }

    if (chatState.status === 'error' && chatState.error) {
      chatLog.appendChild(renderChatMessage({
        role: 'assistant',
        content: `Warning: ${chatState.error}`,
        error: true,
      }));
    } else if (chatState.messages.length === 0 && !chatState.pendingAssistant) {
      chatLog.appendChild(renderChatMessage({
        role: 'assistant',
        content: `Ask a question about ${label} to begin.`,
      }));
    }

    requestAnimationFrame(() => {
      if (wasAtBottom) {
        chatLog.scrollTop = chatLog.scrollHeight;
      }
    });
  }

  function buildPromptChipList(state) {
    const chips = Array.isArray(state.promptChips) ? state.promptChips : [];
    const normalized = chips
      .filter((chip) => chip && typeof chip === 'object')
      .map((chip) => ({
        label: typeof chip.label === 'string' ? chip.label.trim() : '',
        prompt: typeof chip.prompt === 'string' ? chip.prompt : '',
      }))
      .filter((chip) => chip.label && chip.prompt);

    return normalized;
  }

  function renderPromptChips(state, options = {}) {
    const { disable = false } = options;
    const chips = buildPromptChipList(state);

    chatControls.innerHTML = '';

    if (chips.length === 0) {
      chatControls.classList.add('hidden');
      return;
    }

    chatControls.classList.remove('hidden');

    chips.forEach((chip) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chip';
      button.dataset.promptChip = 'true';
      if (chip.prompt) {
        button.dataset.prompt = chip.prompt;
      }
      button.textContent = chip.label;
      button.title = `Insert "${chip.label}"`;
      button.disabled = Boolean(disable);
      chatControls.appendChild(button);
    });
  }

  function clearPromptChips() {
    chatControls.innerHTML = '';
    chatControls.classList.add('hidden');
  }

  function setChipButtonsDisabled(disabled) {
    chatControls.querySelectorAll('button[data-prompt-chip]').forEach((button) => {
      button.disabled = disabled;
    });
  }


  function renderMarkdown(target, markdown) {
    target.innerHTML = '';
    if (!markdown) {
      return;
    }

    const lines = markdown.split(/\r?\n/);
    let paragraphBuffer = [];
    let currentList = null;
    let currentListType = null;
    let inCodeBlock = false;
    let codeBlockLanguage = '';
    const codeLines = [];

    const flushParagraph = () => {
      if (paragraphBuffer.length === 0) {
        return;
      }
      const paragraph = document.createElement('p');
      parseInline(paragraphBuffer.join(' '), paragraph);
      target.appendChild(paragraph);
      paragraphBuffer = [];
    };

    const flushList = () => {
      if (!currentList) {
        return;
      }
      target.appendChild(currentList);
      currentList = null;
      currentListType = null;
    };

    const flushCodeBlock = () => {
      if (codeLines.length === 0) {
        return;
      }
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.textContent = codeLines.join('\n');
      if (codeBlockLanguage) {
        code.dataset.lang = codeBlockLanguage;
      }
      pre.appendChild(code);
      target.appendChild(pre);
      codeLines.length = 0;
      codeBlockLanguage = '';
    };

    lines.forEach((line) => {
      const trimmedLine = line.replace(/\s+$/, '');
      const workingLine = trimmedLine.replace(/^ {0,3}/, '');

      if (inCodeBlock) {
        if (workingLine.startsWith('```')) {
          inCodeBlock = false;
          flushCodeBlock();
        } else {
          codeLines.push(line);
        }
        return;
      }

      if (workingLine.startsWith('```')) {
        flushParagraph();
        flushList();
        inCodeBlock = true;
        codeBlockLanguage = workingLine.slice(3).trim();
        return;
      }

      if (workingLine === '') {
        flushParagraph();
        flushList();
        return;
      }

      const headingMatch = workingLine.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        flushParagraph();
        flushList();
        const level = Math.min(headingMatch[1].length, 6);
        const heading = document.createElement(`h${level}`);
        parseInline(headingMatch[2].trim(), heading);
        target.appendChild(heading);
        return;
      }

      const unorderedMatch = workingLine.match(/^[-*+]\s+(.*)$/);
      if (unorderedMatch) {
        flushParagraph();
        if (!currentList || currentListType !== 'ul') {
          flushList();
          currentList = document.createElement('ul');
          currentListType = 'ul';
        }
        const li = document.createElement('li');
        parseInline(unorderedMatch[1].trim(), li);
        currentList.appendChild(li);
        return;
      }

      const orderedMatch = workingLine.match(/^\d+[.)]\s+(.*)$/);
      if (orderedMatch) {
        flushParagraph();
        if (!currentList || currentListType !== 'ol') {
          flushList();
          currentList = document.createElement('ol');
          currentListType = 'ol';
        }
        const li = document.createElement('li');
        parseInline(orderedMatch[1].trim(), li);
        currentList.appendChild(li);
        return;
      }

      paragraphBuffer.push(workingLine);
    });

    if (inCodeBlock) {
      flushCodeBlock();
    }
    flushParagraph();
    flushList();
  }

  function renderChatMessage(entry) {
    const role = entry.role === 'assistant' ? 'assistant' : 'user';
    const wrapper = document.createElement('div');
    const classes = ['chat-message', role];
    if (entry.streaming) {
      classes.push('streaming');
    }
    if (entry.error) {
      classes.push('error');
    }
    wrapper.className = classes.join(' ');

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    const content = entry.content || '';
    if (role === 'assistant' && !entry.error) {
      if (entry.streaming) {
        bubble.textContent = content;
      } else {
        renderMarkdown(bubble, content);
      }
    } else {
      bubble.textContent = content;
    }

    if (entry.error) {
      bubble.classList.add('error');
    }

    wrapper.appendChild(bubble);
    return wrapper;
  }

  function parseInline(text, parent) {
    if (!text) {
      return;
    }
    const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^\)]+\))/;
    let remaining = text;

    while (remaining.length > 0) {
      const match = pattern.exec(remaining);
      if (!match) {
        parent.appendChild(document.createTextNode(remaining));
        break;
      }

      const index = match.index;
      if (index > 0) {
        parent.appendChild(document.createTextNode(remaining.slice(0, index)));
      }

      const token = match[0];
      if (token.startsWith('**')) {
        const strong = document.createElement('strong');
        parseInline(token.slice(2, -2), strong);
        parent.appendChild(strong);
      } else if (token.startsWith('*')) {
        const emphasis = document.createElement('em');
        parseInline(token.slice(1, -1), emphasis);
        parent.appendChild(emphasis);
      } else if (token.startsWith('`')) {
        const code = document.createElement('code');
        code.textContent = token.slice(1, -1);
        parent.appendChild(code);
      } else if (token.startsWith('[')) {
        const linkMatch = token.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
        if (linkMatch) {
          const anchor = document.createElement('a');
          anchor.textContent = linkMatch[1];
          const href = sanitizeUrl(linkMatch[2]);
          if (href) {
            anchor.href = href;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
          }
          parent.appendChild(anchor);
        } else {
          parent.appendChild(document.createTextNode(token));
        }
      }

      remaining = remaining.slice(index + token.length);
    }
  }

  function sanitizeUrl(url) {
    if (!url) {
      return null;
    }
    const trimmed = url.trim();
    if (trimmed === '') {
      return null;
    }
    if (/^(https?:|mailto:|tel:|#)/i.test(trimmed)) {
      return trimmed;
    }
    return null;
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === 'CONTEXT_UPDATED') {
      refresh();
    }
  });

  refresh();
});
