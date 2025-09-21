# Clinical Context Assistant Extension

This repository contains a Manifest V3 browser extension that watches EMR web applications, summarizes the current clinical context, and sends a configurable prompt to OpenAI for adaptive assistance. The UI provides a popup for quick insights and an options page for managing credentials, default prompts, and site-specific overrides.

## Features

- Automatically inspects DOM text to infer whether a patient chart, schedule, medications, or other clinical elements are visible.
- Streams page snapshots to a background service worker that calls OpenAI's `/v1/responses` endpoint.
- Lets users store an OpenAI API key, default model, and default prompt in browser storage.
- Supports per-hostname overrides so each EMR (e.g., `epic.example.com`) can have custom prompts or models.
- Offers a popup with real-time status updates, detected clinical context, and generated AI insights.
- Provides an options page for editing prompts, managing site overrides, and adding new hostnames.

## Getting Started

1. **Install dependencies** – none are required beyond a modern Chromium-based or Firefox browser that supports Manifest V3.
2. **Configure OpenAI access** – obtain an API key with permission to call the desired GPT model (e.g., GPT-5 when available) from the [OpenAI dashboard](https://platform.openai.com/).
3. **Load the extension**:
   - **Chrome / Edge**: open `chrome://extensions`, toggle on **Developer mode**, click **Load unpacked**, and choose the `extension/` directory from this repository.
   - **Firefox**: open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on**, and select any file inside the `extension/` directory (Firefox will load the whole folder).
4. **Open the options page** (from the extension's action menu or popup) and add:
   - Your OpenAI API key.
   - A default model (e.g., `gpt-5-preview` or another supported identifier).
   - A default prompt that describes the behaviour you want.
   - Optional site overrides for specific EMR hostnames.
5. Navigate to an EMR or other clinical web app. The extension silently observes DOM updates and, when content changes, sends a snapshot to OpenAI. Open the popup to view detected context and generated guidance.

### Customizing prompts per site

1. From the options page, enter a hostname such as `cerner.examplehealth.org` and click **Add site**.
2. Adjust the prompt and model fields for that site to tailor OpenAI's behaviour.
3. Click **Save Changes**. Settings are stored in browser `chrome.storage.local`, so they persist across sessions but remain on-device.

### Privacy and PHI handling

- All DOM text sent to OpenAI may include PHI. Configure your prompts to enforce privacy guardrails and comply with institutional requirements.
- No external services are used beyond OpenAI. Credentials and prompts are stored locally.
- Consider rotating API keys and auditing OpenAI usage logs regularly.

## Project Structure

```
extension/
├── background.js      # Service worker handling OpenAI requests and tab state
├── content-script.js  # Observes DOM updates and extracts clinical cues
├── manifest.json      # Extension manifest (Manifest V3)
├── options.css        # Styling for the options page
├── options.html       # Options page markup
├── options.js         # Options page logic (storage + site overrides)
├── popup.css          # Styling for the popup UI
├── popup.html         # Popup markup
└── popup.js           # Popup logic for displaying AI insights

mock-emr/
├── app.js             # Patient data model and lightweight UI logic
├── index.html         # Single-page mock EMR shell
└── styles.css         # Layout and visual design for the mock EMR
```

Documentation for broader product goals remains in [`docs/requirements.md`](docs/requirements.md).

### Using the mock EMR sandbox

The `mock-emr/` directory provides a static, single-page web application that mimics a simplified electronic medical record. It includes a roster of 10 fictional patients, full International Patient Summary sections, and reverse-chronological SOAP encounter notes so you can exercise the extension's context detection.

To launch it locally:

1. From the repository root, start a static web server (any tool works). For example:
   ```bash
   npx serve mock-emr
   ```
   or
   ```bash
   python3 -m http.server --directory mock-emr 8000
   ```
2. Open the served URL (e.g., `http://localhost:8000/`) in your browser.
3. Load the extension in the same browser profile and interact with the mock EMR to observe detected patient context and generated insights.

## Development Notes

- The extension currently truncates DOM text to reduce payload size before sending it to OpenAI. Adjust `MAX_DOM_CHARS` in `background.js` or the text walker logic in `content-script.js` as needed.
- Mutation events trigger analysis with a debounce. You can tune `CONTEXT_UPDATE_DEBOUNCE_MS` in `content-script.js` to balance responsiveness with API call volume.
- The project intentionally avoids build tooling so it can be loaded directly in browsers. For TypeScript or bundling support, integrate your preferred tooling pipeline.

## Testing

Browser extensions require manual verification. Recommended steps:

1. Load the extension in a test browser profile.
2. Configure the options page with a mock or test OpenAI key.
3. Visit representative EMR pages (or staging environments) to validate context detection.
4. Observe the popup for accurate updates and ensure OpenAI responses render as expected.
