const SYSTEM_PROMPT = 
`You are a clinical workflow assistant. Use the supplied information to assist \
the user as best you can. Be brief unless the users asks otherwise.`;

const promptChips = [
  {
    label: 'Summarize',
    prompt: 'Summarize the current clinical context and suggest next-step actions.',
  },
  {
    label: 'Extract',
    prompt: 'Extract any patient information and relevant clinical details.',
  },
  {
    label: 'Plan',
    prompt: 'Create a to-do list of next steps based on the current clinical context.',
  },
  {
    label: 'Questions',
    prompt: 'Generate questions to clarify the current clinical context.',
  },
];

const PATIENT_HEADER_INSTRUCTIONS = [
  'You are a clinical documentation assistant reviewing an electronic medical record (EMR).',
  'Identify the patient who is the subject of the chart and assemble a concise three-line Markdown header.',
  'Only use information explicitly present in the supplied context. If a field is missing, write "Unknown" or "Not documented".',
  'Compute age relative to the current date when a full DOB is available; otherwise use "Unknown".',
  'Prefer the clearest identifiers (e.g., MRN, chart number) and primary contact details (phone, email).',
  'Respond with exactly three Markdown lines and no other commentary or code fences.',
  'Line 1: **Patient:** <Full name> (<Identifier list or "None">)',
  'Line 2: **DOB:** <YYYY-MM-DD or best available> (Age <## or "Unknown">, <Gender or "Unknown">)',
  'Line 3: **Primary Contact:** <Key contact method or "Not documented">',
  'Do not include the words "Line 1", numbers, bullet markers, or any explanations in the output.',
];
