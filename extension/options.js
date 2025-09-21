const DEFAULT_PROMPT = `You are a clinical workflow assistant. Summarize the clinical context, identify the active subject (patient, provider, population), and recommend safe next actions while highlighting privacy considerations.`;

function storageGet(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (items) => {
      const runtimeError = chrome.runtime.lastError;
      if (runtimeError) {
        reject(new Error(runtimeError.message));
        return;
      }
      resolve(items);
    });
  });
}

function storageSet(items) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(items, () => {
      const runtimeError = chrome.runtime.lastError;
      if (runtimeError) {
        reject(new Error(runtimeError.message));
        return;
      }
      resolve();
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('api-key');
  const defaultModelInput = document.getElementById('default-model');
  const defaultPromptInput = document.getElementById('default-prompt');
  const siteListEl = document.getElementById('site-list');
  const addSiteButton = document.getElementById('add-site');
  const newSiteInput = document.getElementById('new-site');
  const saveButton = document.getElementById('save');
  const statusEl = document.getElementById('status');

  let settings = await loadSettings();
  render();

  addSiteButton.addEventListener('click', () => {
    const hostname = (newSiteInput.value || '').trim().toLowerCase();
    if (!hostname) {
      return;
    }
    if (!settings.sites[hostname]) {
      settings.sites[hostname] = { prompt: settings.defaultPrompt, model: settings.model };
      renderSites();
    }
    newSiteInput.value = '';
  });

  saveButton.addEventListener('click', async () => {
    settings.apiKey = apiKeyInput.value.trim();
    settings.model = defaultModelInput.value.trim() || settings.model;
    settings.defaultPrompt = defaultPromptInput.value;

    settings.sites = collectSiteSettings();
    try {
      await storageSet({ openAI: settings });
      showStatus('Saved!', 2000);
    } catch (error) {
      showStatus(`Error saving: ${error.message}`);
    }
  });

  function render() {
    apiKeyInput.value = settings.apiKey;
    defaultModelInput.value = settings.model;
    defaultPromptInput.value = settings.defaultPrompt;
    renderSites();
  }

  function renderSites() {
    siteListEl.innerHTML = '';
    Object.entries(settings.sites).forEach(([hostname, siteConfig]) => {
      const container = document.createElement('div');
      container.className = 'site-config';

      const header = document.createElement('header');
      const title = document.createElement('strong');
      title.textContent = hostname;
      const removeBtn = document.createElement('button');
      removeBtn.className = 'secondary';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => {
        delete settings.sites[hostname];
        renderSites();
      });
      header.appendChild(title);
      header.appendChild(removeBtn);
      container.appendChild(header);

      const modelLabel = document.createElement('label');
      modelLabel.textContent = 'Model';
      const modelInput = document.createElement('input');
      modelInput.type = 'text';
      modelInput.value = siteConfig.model || '';
      modelLabel.appendChild(modelInput);
      container.appendChild(modelLabel);

      const promptLabel = document.createElement('label');
      promptLabel.textContent = 'Prompt';
      const promptArea = document.createElement('textarea');
      promptArea.rows = 6;
      promptArea.value = siteConfig.prompt || '';
      promptLabel.appendChild(promptArea);
      container.appendChild(promptLabel);

      container.dataset.hostname = hostname;
      siteListEl.appendChild(container);
    });
  }

  function collectSiteSettings() {
    const updated = {};
    siteListEl.querySelectorAll('.site-config').forEach((configEl) => {
      const hostname = configEl.dataset.hostname;
      const [modelInput] = configEl.getElementsByTagName('input');
      const [promptArea] = configEl.getElementsByTagName('textarea');
      updated[hostname] = {
        model: modelInput.value.trim(),
        prompt: promptArea.value,
      };
    });
    return updated;
  }

  function showStatus(message, timeout) {
    statusEl.textContent = message;
    if (timeout) {
      setTimeout(() => {
        if (statusEl.textContent === message) {
          statusEl.textContent = '';
        }
      }, timeout);
    }
  }
});

async function loadSettings() {
  let openAI;
  try {
    ({ openAI } = await storageGet({ openAI: null }));
  } catch (error) {
    console.error('[CCA][options] Failed to load settings', error);
    return {
      apiKey: '',
      model: 'gpt-4o-mini',
      defaultPrompt: DEFAULT_PROMPT,
      sites: {},
    };
  }

  if (openAI) {
    return {
      apiKey: openAI.apiKey || '',
      model: openAI.model || 'gpt-4o-mini',
      defaultPrompt: openAI.defaultPrompt || DEFAULT_PROMPT,
      sites: openAI.sites || {},
    };
  }
  return {
    apiKey: '',
    model: 'gpt-4o-mini',
    defaultPrompt: DEFAULT_PROMPT,
    sites: {},
  };
}
