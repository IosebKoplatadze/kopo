import { AI, getPreferenceValues } from "@raycast/api";

// Maps the user's provider preference to a concrete Raycast AI model.
// Both run on the user's Raycast Pro subscription — no API key needed.
const MODEL = {
  claude: AI.Model["Anthropic_Claude_4.6_Sonnet"],
  gpt: AI.Model["OpenAI_GPT-5.2"],
} satisfies Record<string, AI.Model>;

interface Preferences {
  model: keyof typeof MODEL;
}

export function rephrase(text: string): Promise<string> {
  const { model } = getPreferenceValues<Preferences>();
  return AI.ask(
    `Rephrase the text below. Preserve its meaning and language. ` +
      `Return only the rephrased text — no quotes, no commentary:\n\n${text}`,
    { model: MODEL[model] },
  );
}
