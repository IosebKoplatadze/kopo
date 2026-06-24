import { getPreferenceValues } from "@raycast/api";
import { spawn } from "node:child_process";
import { dirname } from "node:path";

interface Preferences {
  claudePath: string;
  model: string;
}

const instruction = (text: string) =>
  `"make as Slack message, short, firendly, profesional, no upper cases, use short abreviations like: u=you, ur=your, i will=ll...

  '${text}'"`;

// Drives the `claude` CLI (Claude Code) the user is already signed into, so it
// runs on their Claude subscription — no API key, no OAuth to reimplement.
export function rephrase(text: string): Promise<string> {
  const { claudePath, model } = getPreferenceValues<Preferences>();
  const bin = claudePath || "claude";
  const args = ["-p", instruction(text)];
  if (model) args.unshift("--model", model);

  // Raycast spawns with a minimal PATH; prepend claude's own dir so its
  // `#!/usr/bin/env node` shebang finds the node binary sitting next to it.
  const env = { ...process.env, PATH: `${dirname(bin)}:${process.env.PATH ?? ""}` };

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
    child.on("close", (code) =>
      code === 0
        ? resolve(out.trim())
        : reject(new Error((err || out || `claude exited ${code}`).trim())),
    );
  });
}
