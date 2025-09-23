# Clinical Context Assistant Extension

This repository contains a Manifest V2 browser extension that monitors clinical web applications, detects on-screen context, and routes structured prompts to OpenAI for adaptive assistance. The extension keeps per-tab state so clinicians can revisit a patient chart, view a generated patient header, and continue a streaming chat without losing conversation history.

## Capabilities

- Observes DOM updates with a debounced content script and flags likely EMR pages using lightweight heuristics (patient identifiers, scheduling keywords, vitals, etc.).
- Captures a trimmed DOM snapshot (up to 4,000 characters) and sends it to the background page, which stores context metadata and persists chat state per patient.
- Generates a three-line patient header by calling the OpenAI `/v1/responses` endpoint with a purpose-built prompt and caches the result per tab/patient fingerprint.
- Provides a popup UI that surfaces page-detection status, the cached patient header, the context summary, and a multi-turn chat interface with streaming updates.
- Offers predefined prompt chips and a "use default prompt" shortcut so clinicians can quickly re-run common analyses.
- Lets users configure an OpenAI API key, a default model, a default prompt, and per-host overrides through the options page; settings are stored in `chrome.storage.local` only.

## Getting Started

1. **Choose a supported browser** – the implementation targets Chrome/Chromium-based browsers that still accept Manifest V2 extensions. Firefox support has not yet been validated.
2. **Load the unpacked extension**:
   - Open `chrome://extensions/`, enable **Developer mode**, click **Load unpacked**, and select the `extension/` directory.
   - Reload the extension after making code changes; the background page is non-persistent and will restart automatically.
3. **Open the options page** (from the popup ⚙️ button or the extensions menu) and provide:
   - An OpenAI API key with access to the desired model (defaults to `gpt-4o-mini`).
   - A default clinical workflow prompt; the built-in system prompt is pre-populated.
   - Optional per-host overrides to change the model or prompt for specific EMR domains.
4. **Navigate to an EMR or the bundled mock EMR**. The content script will observe DOM changes, classify the page, and stream context to the background page.
5. **Use the popup** to:
   - Confirm EMR detection and review the generated patient header.
   - Inspect the detected context summary.
   - Chat with the assistant using free-form input, the default prompt, or prompt chips. Conversations are cached per patient key so revisiting a chart restores history.

## Project Structure

```
extension/
├── background.js      # Core logic, tab state, OpenAI calls, chat + patient header orchestration
├── constants.js       # System prompt and prompt chip presets shared by options + popup
├── content-script.js  # DOM observer, context detection, hashing + messaging to background
├── manifest.json      # Manifest V2 definition with background scripts and popup/options pages
├── options.*          # Configuration UI for API credentials and per-site overrides
├── popup.*            # Popup UI + styling for status, context, and chat
└── \*.css             # Styling for options and popup surfaces

mock-emr/
├── app.js             # Lightweight data model + interactions for the mock EMR
├── index.html         # Single-page shell for exercising the extension
└── styles.css         # Mock EMR layout
```

Additional context and requirements live in `docs/requirements.md`.

## Using the Mock EMR Sandbox

1. From the repository root, start a static web server. For example:

   ```bash
   npx serve mock-emr
   # or
   python3 -m http.server --directory mock-emr 8000
   ```

2. Open the served URL (e.g., `http://localhost:8000/`) in the same browser profile where the extension is loaded.
3. Interact with patient charts, vitals, and encounter notes to exercise context detection, patient header creation, and chat responses.

## Development Notes

- **Manifest V2 today, MV3 tomorrow:** Chrome still accepts Manifest V2 for the moment, but migration to Manifest V3 is on the roadmap. Review `docs/requirements.md` before changing the manifest or service-worker model.
- **Context throttling:** `content-script.js` debounces DOM updates by 1.5 seconds and deduplicates payloads using a hash of the title, summary, and first 2,000 characters.
- **Payload limits:** `background.js` trims DOM text to `MAX_DOM_CHARS` (4,000) before sending it to OpenAI; adjust carefully to stay within request size limits.
- **Chat streaming:** The assistant chat uses the OpenAI `/v1/responses` streaming API. Partial deltas update the popup UI while the request is in-flight, and errors reset the chat session state.
- **Patient headers:** The background script fingerprints chart content and caches three-line Markdown headers by patient key to avoid unnecessary repeat calls.
- **Storage:** Tab/chat state is persisted in `chrome.storage.local` so closing the popup does not lose progress. API credentials and per-site settings live under the `openAI` key.
- **Logging:** Console logs are prefixed with `[CCA]` for quick filtering. Avoid adding verbose logging that could leak PHI.

## Testing

Manual verification is currently required:

1. Load the extension in a development profile.
2. Enter a valid or mockable OpenAI API key and configure prompts.
3. Exercise both typical EMR pages and non-EMR websites to confirm detection, patient headers, and chat behaviour.
4. Use the mock EMR to regression-test DOM extraction changes and prompt tweaks.

## Known Limitations

- Manifest V2 lifecycle constraints mean the background page may restart between updates; tab state restores from storage, but transient requests may be interrupted.
- The EMR detection heuristics rely on simple keyword matches and can misclassify complex layouts; strengthen them before deploying widely.
- No in-page overlay is injected yet. All insights surface through the popup.
- Privacy guardrails depend on prompt discipline and the OpenAI processing pipeline; review institutional requirements before handling real PHI.

