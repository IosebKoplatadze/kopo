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
// Runs through a login shell (`zsh -lc`) so claude inherits the shell-profile
// environment (PATH for node + the login/auth env) that GUI apps like Raycast
// don't load. Prompt/model/path go via env vars so the user's text — quotes,
// backticks, $(...) and all — can't break or inject into the command.
export function rephrase(text: string): Promise<string> {
  const { claudePath, model } = getPreferenceValues<Preferences>();
  const cmd = `"$KOPO_CLAUDE"${model ? ' --model "$KOPO_MODEL"' : ""} -p "$KOPO_PROMPT"`;
  const env = {
    ...process.env,
    KOPO_CLAUDE: claudePath || "claude",
    KOPO_MODEL: model ?? "",
    KOPO_PROMPT: instruction(text),
  };

  return new Promise((resolve, reject) => {
    const child = spawn("/bin/zsh", ["-lc", cmd], { stdio: ["ignore", "pipe", "pipe"], env });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve(out.trim()) : reject(new Error((err || out || `claude exited ${code}`).trim())),
    );
  });
}
