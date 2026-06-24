# Kopo

A tiny Raycast extension that rewrites your **selected text** — by default into a short, friendly, lowercase Slack message — and pastes it back (or shows it in a modal).

It runs on your **Claude subscription** via the `claude` CLI (Claude Code), so there's **no API key and no per-token billing**.

## Commands

- **Kopo** — rephrase the selection and paste it back over it.
- **Kopo (Modal)** — rephrase and show the result in a window with Copy / Paste actions.

## Setup

1. **Have Claude Code installed and signed in** (`claude` on your PATH, logged in with your Claude Pro/Max subscription).
2. **Mint a headless token** — GUI apps like Raycast don't inherit your shell login, so Kopo authenticates with an explicit token:
   ```sh
   claude setup-token
   ```
   Copy the token it prints.
3. **Run the extension in dev mode** and keep the terminal open:
   ```sh
   pnpm install
   pnpm run dev
   ```
4. In Raycast, open **Kopo → ⌘K → Configure Command** and fill in:
   - **Claude Token** — paste the `setup-token` value.
   - **Claude CLI Path** — full path to `claude` (run `which claude`); defaults to a typical nvm path. Required because Raycast spawns with a minimal PATH.
   - **Model** *(optional)* — e.g. `sonnet`, `opus`; blank uses your Claude Code default.

## Usage

Select text anywhere, then run **Kopo** (paste-back) or **Kopo (Modal)** (preview).

## Customizing the rewrite

The prompt lives in one function — edit `instruction()` in [`src/rephrase.ts`](src/rephrase.ts) to change the style (tone, language, format).

## How it works

`rephrase()` spawns `claude -p "<prompt>"` with:

- `CLAUDE_CODE_OAUTH_TOKEN` set from the **Claude Token** preference (headless auth, no keychain/profile dependency),
- the `claude` binary's own directory prepended to `PATH` so its `#!/usr/bin/env node` shebang finds `node`,
- `--no-session-persistence` so rephrases don't pile up in Claude Code's thread history,
- stdin ignored so `claude -p` doesn't block waiting for input.

## Notes

- **Subscription, not API key.** This uses your Claude subscription through the official CLI — not the Anthropic API, and not Claude Pro/ChatGPT OAuth (which isn't available to third-party apps).
- claude will **refuse** to rephrase text that contains secrets (e.g. an `sk-ant-…` token) — that's expected, not a bug.
- Latency: each run cold-starts `claude -p` (a couple seconds).
- Publishing to the Raycast Store would require a valid `author` (a real raycast.com username) and a 512×512 `assets/extension-icon.png`.
