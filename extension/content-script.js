const CONTEXT_UPDATE_DEBOUNCE_MS = 1500;
let pendingUpdate = null;
let lastPayloadHash = '';

function scheduleContextUpdate(reason) {
  console.log('[CCA][content] scheduleContextUpdate', { reason });
  if (pendingUpdate) {
    clearTimeout(pendingUpdate);
  }
  pendingUpdate = setTimeout(() => {
    pendingUpdate = null;
    console.log('[CCA][content] debounced update triggered', { reason });
    sendContext(reason);
  }, CONTEXT_UPDATE_DEBOUNCE_MS);
}

function sendContext(reason) {
  const payload = collectContext(reason);
  const payloadHash = JSON.stringify([payload.title, payload.contextSummary, payload.dom.slice(0, 2000)]);
  if (payloadHash === lastPayloadHash) {
    console.log('[CCA][content] skipping duplicate payload', { reason });
    return;
  }
  lastPayloadHash = payloadHash;
  console.log('[CCA][content] sending PAGE_CONTEXT', { reason, title: payload.title, contextSummary: payload.contextSummary });
  chrome.runtime.sendMessage({
    type: 'PAGE_CONTEXT',
    payload,
  });
}

function collectContext(reason) {
  const title = document.title || 'Untitled';
  const domText = extractDomText();
  console.log('[CCA][content] collectContext', { reason, title, domLength: domText.length });
  return {
    url: window.location.href,
    title,
    dom: domText,
    reason,
    contextSummary: detectClinicalContext({ title, domText }),
  };
}

function extractDomText() {
  if (!document.body) {
    return '';
  }
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  const chunks = [];
  let count = 0;
  while (walker.nextNode() && count < 2000) {
    const value = walker.currentNode.nodeValue;
    if (value && value.trim()) {
      chunks.push(value.trim());
      count += 1;
    }
  }
  return chunks.join('\n');
}

function detectClinicalContext({ title, domText }) {
  const text = `${title}\n${domText}`.toLowerCase();
  const indicators = [];

  if (/(mrn|dob|patient)/.test(text)) {
    indicators.push('Possible patient chart in view');
  }
  if (/schedule|appointment|calendar/.test(text)) {
    indicators.push('Scheduling context detected');
  }
  if (/medication|rx|prescription/.test(text)) {
    indicators.push('Medication information present');
  }
  if (/vital(s)?|bp|blood pressure/.test(text)) {
    indicators.push('Vitals referenced');
  }
  if (/lab(s)?|result(s)?/.test(text)) {
    indicators.push('Lab results referenced');
  }
  if (indicators.length === 0) {
    indicators.push('General clinical content');
  }

  return indicators.join('; ');
}

const observer = new MutationObserver(() => scheduleContextUpdate('dom_mutation'));
observer.observe(document.documentElement, {
  subtree: true,
  childList: true,
  characterData: true,
});

console.log('[CCA][content] mutation observer initialized');

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log('[CCA][content] document ready, scheduling initial update');
  scheduleContextUpdate('initial_load');
} else {
  window.addEventListener('DOMContentLoaded', () => scheduleContextUpdate('dom_content_loaded'));
}

window.addEventListener('beforeunload', () => {
  observer.disconnect();
});
