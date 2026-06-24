# Kopo

A tiny Raycast extension that rewrites your **selected text** using configurable **presets** — e.g. "Slack message", "Formal email", "Translate", "Summarize" — and pastes the result back or shows it in a modal.

It runs on your **Claude subscription** via the `claude` CLI (Claude Code), so there's **no API key and no per-token billing**.

## Commands

- **Kopo – Presets** — the manager. Lists your presets; pressing **Enter** rephrases the current selection with the highlighted preset. Create / edit / duplicate / delete / reorder presets right here — no rebuild.
- **Kopo Slot 1…5** — one per preset *position*. Assign each a **global keyboard shortcut** in Raycast Settings; triggering it rephrases the selection with the preset in that slot (slot N = the Nth preset in the manager list).

## Presets

A preset is `{ name, instruction, systemPrompt, model, mode }`, stored in Raycast's local storage:

- **Instruction** — how to rewrite. Use `{text}` where the selection goes (appended if omitted).
- **System Prompt** — overall behavior (default keeps output to just the rewritten text).
- **Model** — `sonnet`, `opus`, … or blank for your Claude Code default.
- **Output** — paste back over the selection, or show in a modal.

Two presets are seeded on first run ("Slack message", "Formal email"); edit or delete them freely.

## Keyboard shortcuts

- **In the manager:** arrow / type-to-filter to any preset, **Enter** to run. Edit `⌘E`, New `⌘N`, Duplicate `⌘D`, Delete `⌃X`, Move `⌘⌥↑/↓`.
- **Global:** Raycast Settings → Extensions → Kopo → assign a hotkey to **Kopo Slot 1…5**. Reorder presets in the manager to decide which preset each slot runs. (Need more than 5 global hotkeys? Add more `slot-N` commands.)

## Setup

1. **Have Claude Code installed and signed in** (`claude` on your PATH, logged in with your Claude Pro/Max subscription).
2. **Mint a headless token** — GUI apps like Raycast don't inherit your shell login:
   ```sh
   claude setup-token
   ```
3. **Run in dev mode** and keep the terminal open:
   ```sh
   pnpm install
   pnpm run dev
   ```
4. In Raycast, open **Kopo – Presets → ⌘K → Configure Command** and set:
   - **Claude Token** — paste the `setup-token` value.
   - **Claude CLI Path** — full path to `claude` (`which claude`); required because Raycast spawns with a minimal PATH.

## How it works

For each run, Kopo spawns `claude -p "<prompt>"` (prompt = the preset's instruction with `{text}` substituted) with:

- `--system-prompt` from the preset,
- `--model` from the preset (if set),
- `CLAUDE_CODE_OAUTH_TOKEN` from the **Claude Token** preference (headless auth, no keychain/profile dependency),
- the `claude` binary's own directory prepended to `PATH` so its `#!/usr/bin/env node` shebang finds `node`,
- `--no-session-persistence` so rephrases don't pile up in Claude Code's thread history,
- stdin ignored so `claude -p` doesn't block.

## Notes

- **Subscription, not API key.** Uses your Claude subscription through the official CLI — not the Anthropic API, and not Claude Pro/ChatGPT OAuth (not available to third-party apps).
- claude **refuses** to rephrase text containing secrets (e.g. an `sk-ant-…` token) — expected, not a bug.
- Latency: each run cold-starts `claude -p` (a couple seconds).
- Publishing to the Raycast Store would require a valid `author` (a real raycast.com username).
