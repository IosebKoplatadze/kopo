import { getPreferenceValues } from "@raycast/api";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

interface Preferences {
  provider: "anthropic" | "openai";
  anthropicApiKey: string;
  anthropicModel: string;
  openaiApiKey: string;
  openaiModel: string;
}

const prompt = (text: string) =>
  `Rephrase the text below. Preserve its meaning and language. ` +
  `Return only the rephrased text — no quotes, no commentary:\n\n${text}`;

export async function rephrase(text: string): Promise<string> {
  const prefs = getPreferenceValues<Preferences>();

  if (prefs.provider === "openai") {
    if (!prefs.openaiApiKey) throw new Error("Set your OpenAI API key in extension preferences");
    const client = new OpenAI({ apiKey: prefs.openaiApiKey });
    const resp = await client.chat.completions.create({
      model: prefs.openaiModel,
      messages: [{ role: "user", content: prompt(text) }],
    });
    return resp.choices[0]?.message.content?.trim() ?? "";
  }

  if (!prefs.anthropicApiKey) throw new Error("Set your Anthropic API key in extension preferences");
  const client = new Anthropic({ apiKey: prefs.anthropicApiKey });
  const resp = await client.messages.create({
    model: prefs.anthropicModel,
    max_tokens: 16000,
    messages: [{ role: "user", content: prompt(text) }],
  });
  return resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}
