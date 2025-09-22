document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const contextSection = document.getElementById('context-summary');
  const contextText = document.getElementById('context-text');
  const analysisSection = document.getElementById('analysis');
  const analysisText = document.getElementById('analysis-text');
  const openOptionsBtn = document.getElementById('open-options');

  openOptionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

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
    chrome.runtime.sendMessage({ type: 'POPUP_REQUEST', tabId: tab.id }, (response) => {
      if (chrome.runtime.lastError) {
        updateUI({ status: 'error', error: chrome.runtime.lastError.message });
        return;
      }
      updateUI(response || { status: 'idle' });
    });
  }

  function updateUI(state) {
    contextSection.classList.add('hidden');
    analysisSection.classList.add('hidden');
    contextText.textContent = '';
    analysisText.innerHTML = '';

    switch (state.status) {
      case 'idle':
        statusEl.textContent = 'Waiting for page analysis.';
        break;
      case 'loading':
        statusEl.textContent = 'Analyzing page with OpenAI…';
        break;
      case 'needs_api_key':
        statusEl.textContent = state.message || 'Add an OpenAI API key in options.';
        break;
      case 'error':
        statusEl.textContent = `Error: ${state.error || 'Unknown error'}`;
        break;
      case 'success':
        statusEl.textContent = `Updated ${new Date(state.updatedAt).toLocaleTimeString()}`;
        if (state.contextSummary) {
          contextSection.classList.remove('hidden');
          contextText.textContent = state.contextSummary;
        }
        if (state.result) {
          analysisSection.classList.remove('hidden');
          renderMarkdown(analysisText, state.result);
          analysisText.scrollTop = 0;
        }
        break;
      default:
        statusEl.textContent = 'Status unavailable.';
    }
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
