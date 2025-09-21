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
          analysisText.textContent = state.result;
        }
        break;
      default:
        statusEl.textContent = 'Status unavailable.';
    }
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === 'CONTEXT_UPDATED') {
      refresh();
    }
  });

  refresh();
});
