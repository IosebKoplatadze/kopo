import { getPreferenceValues } from "@raycast/api";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

interface Preferences {
  claudePath: string;
  model: string;
}

const instruction = (text: string) =>
  `Rephrase the text below. Preserve its meaning and language. ` +
  `Return only the rephrased text — no quotes, no commentary:\n\n${text}`;

// Drives the `claude` CLI (Claude Code) the user is already signed into, so it
// runs on their Claude subscription — no API key, no OAuth to reimplement.
export async function rephrase(text: string): Promise<string> {
  const { claudePath, model } = getPreferenceValues<Preferences>();
  const args = ["-p", instruction(text)];
  if (model) args.unshift("--model", model);

  try {
    const { stdout } = await run(claudePath || "claude", args, {
      maxBuffer: 4 * 1024 * 1024,
    });
    return stdout.trim();
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      throw new Error("Claude CLI not found — set its path in Kopo preferences");
    }
    throw e;
  }
}
