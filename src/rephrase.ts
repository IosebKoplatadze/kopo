import { getPreferenceValues } from "@raycast/api";
import { spawn } from "node:child_process";
import { dirname } from "node:path";

interface Preferences {
  oauthToken: string;
  claudePath: string;
  model: string;
  systemPrompt: string;
  instruction: string;
}

const DEFAULT_INSTRUCTION =
  "rewrite as a short, friendly, professional slack message in all lowercase, using common abbreviations (u=you, ur=your, ll=i will): {text}";

// Build the user prompt: substitute the selection into {text}, or append it.
function buildPrompt(template: string, text: string): string {
  const tpl = template || DEFAULT_INSTRUCTION;
  return tpl.includes("{text}") ? tpl.replaceAll("{text}", text) : `${tpl}\n\n${text}`;
}

// Drives the `claude` CLI (Claude Code) on the user's Claude subscription — no
// API key. Args are passed directly to spawn (no shell), so the user's text,
// instruction, and system prompt can't break or inject into the command.
export function rephrase(text: string): Promise<string> {
  const { oauthToken, claudePath, model, systemPrompt, instruction } = getPreferenceValues<Preferences>();
  const bin = claudePath || "claude";

  const args = ["-p", "--no-session-persistence", buildPrompt(instruction, text)];
  if (systemPrompt) args.unshift("--system-prompt", systemPrompt);
  if (model) args.unshift("--model", model);

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
    child.on("error", (e) =>
      reject(
        "code" in e && e.code === "ENOENT"
          ? new Error("Claude CLI not found — set its path in Kopo preferences")
          : e,
      ),
    );
    child.on("close", (code) => {
      if (code === 0) return resolve(out.trim());
      const msg = (err || out || `claude exited ${code}`).trim();
      if (!oauthToken && /not logged in/i.test(msg)) {
        return reject(new Error("Not logged in — run `claude setup-token` and paste the token into Kopo's preferences"));
      }
      reject(new Error(msg));
    });
  });
}
