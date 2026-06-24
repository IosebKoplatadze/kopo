import { getPreferenceValues } from "@raycast/api";
import { spawn } from "node:child_process";

interface Preferences {
  claudePath: string;
  model: string;
}

const instruction = (text: string) =>
  `"make as Slack message, short, firendly, profesional, no upper cases, use short abreviations like: u=you, ur=your, i will=ll...

  '${text}'"`;

// Drives the `claude` CLI (Claude Code) the user is already signed into, so it
// runs on their Claude subscription — no API key, no OAuth to reimplement.
// stdin is ignored so `claude -p` doesn't block waiting on it (the prompt is an arg).
export function rephrase(text: string): Promise<string> {
  const { claudePath, model } = getPreferenceValues<Preferences>();
  const args = ["-p", instruction(text)];
  if (model) args.unshift("--model", model);

  return new Promise((resolve, reject) => {
    const child = spawn(claudePath || "claude", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });
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
    child.on("close", (code) =>
      code === 0 ? resolve(out.trim()) : reject(new Error(err.trim() || `claude exited ${code}`)),
    );
  });
}
