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
