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
  const payloadHash = JSON.stringify([payload.patientKey, payload.title, payload.contextSummary, payload.dom.slice(0, 2000)]);
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
  const contextInfo = detectClinicalContext({ title, domText });
  console.log('[CCA][content] collectContext', {
    reason,
    title,
    domLength: domText.length,
    isEmr: contextInfo.isEmr,
  });
  const patientKey = createPatientKey({ title, domText });
  const patientLabel = contextInfo.patientLabel || title;
  return {
    url: window.location.href,
    title,
    dom: domText,
    reason,
    contextSummary: contextInfo.summary,
    isEmr: contextInfo.isEmr,
    patientKey,
    patientLabel,
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
  let isEmr = false;
  let patientLabel = title;

  const titleMatch = title.match(/^(.*?)\s[-|\u2013]/);
  if (titleMatch && titleMatch[1]) {
    patientLabel = titleMatch[1].trim();
  }

  const domNameMatch = domText.match(/patient\s*[:\-]\s*([A-Za-z ,.'-]+)/i);
  if (domNameMatch && domNameMatch[1]) {
    patientLabel = domNameMatch[1].trim();
  }

  if (/(mrn|dob|patient|chart)/.test(text)) {
    indicators.push('Possible patient chart in view');
    isEmr = true;
  }
  if (/schedule|appointment|calendar/.test(text)) {
    indicators.push('Scheduling context detected');
    isEmr = true;
  }
  if (/medication|rx|prescription/.test(text)) {
    indicators.push('Medication information present');
    isEmr = true;
  }
  if (/vital(s)?|bp|blood pressure/.test(text)) {
    indicators.push('Vitals referenced');
    isEmr = true;
  }
  if (/lab(s)?|result(s)?/.test(text)) {
    indicators.push('Lab results referenced');
    isEmr = true;
  }

  if (indicators.length === 0) {
    indicators.push('General clinical content');
  }

  return {
    summary: indicators.join('; '),
    isEmr,
    patientLabel,
  };
}

function createPatientKey({ title, domText }) {
  const snippet = `${title}\n${domText.slice(0, 500)}`;
  return `patient_${hashString(snippet)}`;
}

function hashString(input) {
  if (!input) {
    return '0';
  }
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return (hash >>> 0).toString(16);
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
