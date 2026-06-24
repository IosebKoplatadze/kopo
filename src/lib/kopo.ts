import { getPreferenceValues, LocalStorage } from "@raycast/api";
import { spawn } from "node:child_process";
import { dirname } from "node:path";

export type OutputMode = "paste" | "modal";

export interface Preset {
  id: string;
  name: string;
  instruction: string; // may contain {text}; selection is appended if omitted
  systemPrompt: string;
  model: string; // "" = your Claude Code default
  mode: OutputMode;
}

interface Preferences {
  oauthToken: string;
  claudePath: string;
}

const STORE_KEY = "kopo-presets";

export const DEFAULT_PRESETS: Preset[] = [
  {
    id: "slack",
    name: "Slack message",
    instruction:
      "rewrite as a short, friendly, professional slack message in all lowercase, using common abbreviations (u=you, ur=your, ll=i will): {text}",
    systemPrompt:
      "You rewrite the user's text. Output only the rewritten text — no preamble, no quotes, no commentary.",
    model: "sonnet",
    mode: "paste",
  },
  {
    id: "formal",
    name: "Formal email",
    instruction: "rewrite as a polished, professional email. keep it concise: {text}",
    systemPrompt:
      "You rewrite the user's text. Output only the rewritten text — no preamble, no quotes, no commentary.",
    model: "sonnet",
    mode: "modal",
  },
];

export async function getPresets(): Promise<Preset[]> {
  const raw = await LocalStorage.getItem<string>(STORE_KEY);
  if (!raw) {
    await savePresets(DEFAULT_PRESETS);
    return DEFAULT_PRESETS;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Preset[]) : DEFAULT_PRESETS;
  } catch {
    return DEFAULT_PRESETS;
  }
}

export async function savePresets(presets: Preset[]): Promise<void> {
  await LocalStorage.setItem(STORE_KEY, JSON.stringify(presets));
}

export function newId(): string {
  return `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

function buildPrompt(instruction: string, text: string): string {
  const tpl = instruction || "{text}";
  return tpl.includes("{text}") ? tpl.replaceAll("{text}", text) : `${tpl}\n\n${text}`;
}

// Drives the `claude` CLI on the user's Claude subscription — no API key.
// Args go directly to spawn (no shell), so text/instruction/system can't inject.
export function rephrase(preset: Preset, text: string): Promise<string> {
  const { oauthToken, claudePath } = getPreferenceValues<Preferences>();
  const bin = claudePath || "claude";

  const args = ["-p", "--no-session-persistence", buildPrompt(preset.instruction, text)];
  if (preset.systemPrompt) args.unshift("--system-prompt", preset.systemPrompt);
  if (preset.model) args.unshift("--model", preset.model);

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PATH: `${dirname(bin)}:${process.env.PATH ?? ""}`,
  };
  if (oauthToken) env.CLAUDE_CODE_OAUTH_TOKEN = oauthToken;

  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"], env });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e: NodeJS.ErrnoException) =>
      reject(
        e.code === "ENOENT"
          ? new Error("Claude CLI not found — set its path in Kopo preferences")
          : e,
      ),
    );
    child.on("close", (code) => {
      if (code === 0) return resolve(out.trim());
      const msg = (err || out || `claude exited ${code}`).trim();
      if (!oauthToken && /not logged in/i.test(msg)) {
        return reject(
          new Error("Not logged in — run `claude setup-token` and paste the token into Kopo's preferences"),
        );
      }
      reject(new Error(msg));
    });
  });
}
