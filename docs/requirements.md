# Clinical Web Extension Requirements

## 1. Overview
- **Purpose:** Deliver a browser extension that watches EMR-style web pages, captures on-screen clinical context, and uses OpenAI models to surface patient-aware insights and chat support.
- **Primary Users:** Clinicians and informatics teams evaluating AI copilots without deep EMR integrations.
- **Current Stack:** Manifest V2 Chrome extension (background event page + popup/options pages) calling the OpenAI `/v1/responses` API with streaming support; default model `gpt-4o-mini`.
- **Value Proposition:** Works on top of existing EMR UIs, offers configurable prompts per site, and maintains patient-specific chat state without backend infrastructure.

## 2. Goals and Non-Goals
- **Goals**
  - Detect core EMR scenarios (single patient chart, schedules, vitals, meds) using DOM heuristics with minimal site-specific configuration.
  - Provide configurable prompts/models per hostname stored locally in `chrome.storage.local`.
  - Surface AI output through the extension popup: patient header, context summary, streaming chat, and quick prompt chips.
  - Persist tab + chat state so clinicians can revisit charts and continue conversations.
- **Non-Goals (Current Release)**
  - Building server-side services beyond OpenAI.
  - Mobile or tablet optimization.
  - Multi-user sync or cloud storage of prompts or chat transcripts.
  - Injecting in-page overlays (future roadmap).

## 3. Supported Platforms & Compatibility
- **Browsers:** Implemented and validated on Chrome/Chromium with Manifest V2 background scripts. Firefox parity and Manifest V3 migration are backlog items.
- **Operating Systems:** Works on Windows, macOS, and Linux desktop builds of Chrome.
- **EMR Targets:** Designed for configurable deployment across EMR hostnames via per-site prompts/models.

## 4. High-Level Architecture
- **Components:**
  - `content-script.js`: observes DOM mutations, extracts text, fingerprints patient context, and sends payloads to the background page.
  - `background.js`: normalizes per-tab state, orchestrates OpenAI calls (patient header + chat), and broadcasts updates to the popup.
  - `popup.html/js`: displays current detection status, cached patient header, context summary, and streaming chat UI with prompt chips.
  - `options.html/js`: captures API key, default prompt, model, and per-host overrides.
  - `constants.js`: shared system prompt and prompt chip definitions.
- **Data Flow:**
  1. Content script debounces DOM updates (1.5s) and hashes payloads to avoid duplicates.
  2. Background page stores per-tab/per-patient state, determines applicable prompt/model, and drives OpenAI requests.
  3. Patient header requests use non-streaming calls; chat uses streaming to update partial responses.
  4. Popup requests state via messaging and re-renders when `CONTEXT_UPDATED` events arrive.
- **Persistence:** API settings and tab/chat state are persisted in `chrome.storage.local`.

## 5. Context Detection Requirements
- **Inputs:** Document title, the first ~2,000 text nodes, URL hostname.
- **Heuristics:** Keyword matches for `patient`, `MRN`, `schedule`, `medication`, `vitals`, `labs`, etc. Title parsing and regex extraction provide a `patientLabel` hint.
- **Patient Fingerprint:** Hash of title + DOM snippet to distinguish patient charts and scope chat sessions.
- **Triggers:** Initial load, DOMContentLoaded if needed, and any MutationObserver events (debounced).
- **Future Improvements:** Expand selector-based detection, allow per-site overrides, and add PHI redaction hooks.

## 6. Prompt & Customization Management
- **Storage Model:** `openAI` object in `chrome.storage.local` containing `apiKey`, `model`, `defaultPrompt`, and `sites` dictionary.
- **Options UI:** Manage API key, default model/prompt, add/remove hostname-specific overrides (model + prompt text).
- **Prompt Chips:** Defined in `constants.js`, rendered into the popup for quick insert; keep the shared file authoritative.
- **Schema Changes:** Require documented migration steps; update options UI to edit any new fields.

## 7. OpenAI Integration
- **Endpoints:** `/v1/responses` for both synchronous (patient header) and streaming (chat) requests.
- **Models:** Default `gpt-4o-mini`; per-host overrides supported. Future models must stay compatible with the Responses API.
- **Prompts:**
  - System prompt in `constants.js` ensures clinical tone and brevity.
  - Patient header prompt enforces a three-line Markdown output and caches results per patient fingerprint.
  - Chat prompt concatenates most recent DOM snapshot and conversation history.
- **Guardrails:** Trim DOM to `MAX_DOM_CHARS` (4,000) and avoid logging PHI. Errors feed back into tab state so the UI can surface issues.

## 8. UI/UX Requirements
- **Popup:** Primary surface—shows detection badge, patient header (once ready), context summary, streaming chat, and prompt chips. Must remain keyboard navigable.
- **Options:** Single-page form accessible from popup or extensions menu; show save status feedback and prevent accidental data loss.
- **Empty States:** Communicate when no EMR detected, when an API key is missing, or when chat is unavailable.
- **Accessibility:** Maintain semantic headings, aria roles (e.g., chat log `role="log"`), and high-contrast-friendly colors.
- **Roadmap:** In-page overlays and manual context overrides remain future enhancements.

## 9. Security, Privacy & Compliance
- Handle all content as PHI:
  - Do not persist PHI outside browser storage.
  - Avoid console logs containing raw DOM text or API payloads.
  - Document OpenAI retention expectations and encourage institutional review before deployment.
- API keys stay local; remind users not to sync settings unless their profile is secured.
- Extension requests `<all_urls>` host permissions solely for DOM access; keep the permission footprint minimal.

## 10. Performance & Reliability
- **Debounce:** `content-script.js` uses a 1.5s debounce plus payload hashing to limit redundant background calls.
- **Streaming:** Handle partial deltas and fall back gracefully if streaming fails (chat status transitions to error and surfaces message).
- **Background Restarts:** Tab state reloads from storage when the non-persistent background page is recreated.
- **Limits:** Keep OpenAI payloads under platform limits; revisit `MAX_DOM_CHARS` if API size restrictions change.
- **Offline Handling:** TODO—currently there is no offline check; future work should detect `navigator.onLine` and gate requests.

## 11. Extensibility & Future Considerations
- Migrate to Manifest V3 service worker once Chrome sunsets MV2.
- Add redaction hooks and configurable selectors for sensitive fields.
- Explore alternate AI providers or local inference via adapter layers.
- Support exporting/importing site configurations for sharing.
- Build optional in-page overlays for richer UX beyond the popup.

## 12. Documentation & Onboarding
- Keep `README.md` aligned with implementation (features, setup, mock EMR usage).
- Provide runbooks for typical workflows (entering API keys, verifying patient headers, resetting chat).
- Record troubleshooting guidance for common OpenAI errors (invalid key, quota exceeded, streaming timeout).
- Update this requirements document when architecture or platform support materially changes.

## 13. Current Gaps & Risks
- **Manifest V2 Sunset:** Chrome will retire MV2; schedule migration milestones and testing for MV3.
- **Detection Accuracy:** Heuristic-based detection may misclassify complex EMR layouts; invest in configurable selectors.
- **OpenAI Costs & Latency:** Streaming reduces perceived latency but still incurs token costs; add usage throttles and user-visible limits.
- **PHI Exposure:** Payloads contain PHI; ensure organizational approval and explore client-side redaction.
- **Offline/Retry Logic:** Lack of offline detection may result in failed requests without clear messaging.

## 14. Coding Agent Baseline Instructions
- **Scope:** Apply these guardrails whenever updating files in `extension/`; touch `mock-emr/` only when tasks explicitly require sandbox tweaks.
- **Architecture Alignment:** Preserve the current zero-build Manifest V2 structure; document implications before starting MV3 migration work.
- **Core Surfaces:** Treat `extension/background.js`, `extension/content-script.js`, `extension/options.js`, and `extension/popup.js` as primary entry points and document any new modules.
- **Context Detection:** Tune DOM observers, debounce values (`CONTEXT_UPDATE_DEBOUNCE_MS`), and extraction heuristics carefully; explain new selectors and payload limits with succinct comments where needed.
- **OpenAI Integration:** Route API calls through `extension/background.js`, respect rate/token protections, and avoid logging PHI. Surface new settings through the options UI instead of hard-coding secrets.
- **Storage & Configuration:** Use storage helpers in `extension/options.js`; accompany schema changes with migration guidance and UI affordances.
- **UI Consistency:** Keep popup and options layouts synchronized (`extension/popup.html`, `extension/options.html`, and related CSS/JS); maintain keyboard navigation, loading states, and clear error messaging.
- **Privacy Guardrails:** Minimize DOM text sent to OpenAI, follow guidance in this document, and flag any expanded data flows before implementation.
- **Coding Standards:** Stick with modern ES conventions without introducing build tooling; add succinct comments only when logic is non-obvious.
- **Testing Expectations:** Validate changes against the mock EMR plus at least one EMR-like page; capture reproduction steps and observed behavior in task notes or PR descriptions.
- **Workflow Hygiene:** Summaries or PRs should describe changes, risks, and open questions. If you encounter unexpected repo state, pause and escalate instead of reverting user-owned edits.
- **Reference Materials:** Revisit `README.md` and this requirements file before major work to stay aligned with product and design goals.
