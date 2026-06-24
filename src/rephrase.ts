import { getPreferenceValues } from "@raycast/api";
import { spawn } from "node:child_process";
import { dirname } from "node:path";

interface Preferences {
  oauthToken: string;
  claudePath: string;
  model: string;
}

const instruction = (text: string) =>
  `"make as Slack message, short, firendly, profesional, no upper cases, use short abreviations like: u=you, ur=your, i will=ll...

  '${text}'"`;

// Drives the `claude` CLI (Claude Code) on the user's Claude subscription — no
// API key. GUI apps like Raycast spawn without the shell profile or the parent
// auth context, so we authenticate explicitly with a long-lived token from
// `claude setup-token` (CLAUDE_CODE_OAUTH_TOKEN) and prepend claude's own dir to
// PATH so its `#!/usr/bin/env node` shebang finds node sitting next to it.
export function rephrase(text: string): Promise<string> {
  const { oauthToken, claudePath, model } = getPreferenceValues<Preferences>();
  const bin = claudePath || "claude";
  // --no-session-persistence: don't write each rephrase into Claude Code's
  // resumable thread history (print-mode only).
  const args = ["-p", "--no-session-persistence", instruction(text)];
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
