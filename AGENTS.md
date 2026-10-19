# AGENTS.md

Context for AI coding agents working on **Kopo** — a Raycast extension (TypeScript, pnpm) that rewrites the user's selected text via configurable presets. Read `README.md` for the user-facing overview; this file is the stuff you can't infer from the code.

## Commands

```sh
pnpm install
pnpm run dev        # ray develop — installs the dev extension into Raycast; KEEP RUNNING
pnpm run build      # ray build — bundles all entry points (esbuild; does NOT fail on type errors)
npx tsc --noEmit    # the real typecheck — run it alongside build
pnpm run lint       # ray lint  — NOTE: fails on `author` (not a real raycast.com user). Publishing-only; ignore for code work.
pnpm run fix-lint
```

- **`pnpm run build` + `npx tsc --noEmit` green = done.** There are no unit tests.
- **TypeScript is held at 6.0.x**: typescript-eslint (via `@raycast/eslint-config`) peers `typescript <6.1`; TS 7 crashes ESLint. Bump only when typescript-eslint supports it. `tsconfig` needs `"types": ["node"]` (TS 6+ no longer auto-includes `@types/*`).
- To sanity-check the AI call itself, run the underlying command in a terminal:
  `claude -p --no-session-persistence "rewrite as a slack message: hello there"`

## Architecture

- `src/lib/kopo.ts` — `Preset` type, LocalStorage CRUD (`getPresets`/`savePresets`/`newId`), `DEFAULT_PRESETS` seed, and `rephrase(preset, text)` — the core that spawns `claude`.
- `src/lib/slot.ts` — `runSlot(index)`: run the Nth preset on the selection, paste back.
- `src/kopo.tsx` — `kopo` **view** command: preset manager (list + run + create/edit/duplicate/delete/reorder).
- `src/preset-form.tsx` — create/edit form.
- `src/slot-1.ts` … `src/slot-5.ts` — **no-view** commands, each `runSlot(n)`; users bind global Raycast hotkeys to these.
- **Command name ↔ file:** each `commands[].name` in `package.json` must match a `src/<name>.{ts,tsx}` default export. Adding a command = manifest entry + matching file.

## How auth works (do NOT regress these)

Kopo runs on the user's **Claude subscription via the local `claude` CLI** — not the Anthropic API, not OAuth-in-app. `rephrase()` spawns the `claude` binary. The following were all discovered by debugging under Raycast and are load-bearing:

1. **Raycast spawns with a minimal env** — no shell profile (`~/.zshrc`), no parent auth. A login shell (`zsh -lc`) does **not** reliably restore the login. So:
   - Auth explicitly via `CLAUDE_CODE_OAUTH_TOKEN` (from the `oauthToken` preference; user generates it with `claude setup-token`).
   - Prepend the claude binary's own directory to `PATH` so its `#!/usr/bin/env node` shebang finds `node` (node lives next to `claude` in the nvm bin dir).
2. **`claude -p` blocks on stdin** even with the prompt as an arg → `spawn` with `stdio: ["ignore", ...]`.
3. **`--no-session-persistence`** is required so each rephrase doesn't spam Claude Code's resumable history.
4. **Pass instruction / system prompt / model / text as direct `spawn` args** (no shell) — that's the injection-safe boundary; never build a shell string from user text.

## Raycast gotchas

- **Manifest changes need a hard reload.** Editing `package.json` (commands/preferences) requires **stopping `ray develop`, fully quitting Raycast (⌘Q), reopening, and restarting dev**. `src/` edits hot-reload while dev runs; manifest edits do not.
- Extension-level preferences show in a command's **Configure Command** sheet (⌘K → Configure), not the Settings overview pane.
- `getSelectedText()` grabs the live frontmost-app highlight; it throws if nothing is selected.
- claude will refuse to process text containing secrets (e.g. `sk-ant-…`) — expected, not a bug.

## Known cleanup / caveats

- **`claudePath` default is a hardcoded machine-specific nvm path** (`/Users/ioseb.koplatadze/.nvm/...`). It's there because Raycast's PATH lacks nvm. **Blank it / make it portable before any publish**, and update it if the user's node version changes.
- **`author` is `"ioseb"`** — invalid for the Raycast Store (needs a real raycast.com username). `ray build` tolerates it; `ray lint`/publish do not.
- Publishing status: fine for personal use via Raycast **Import Extension**; public store would need the two items above plus screenshots/categories, and the spawn-CLI design may not pass review. See README "Notes".

## Conventions

- Keep it dependency-light (only `@raycast/api` + `@raycast/utils`). The 512×512 icon was generated dependency-free with Node `zlib` — no image libs available.
- Match existing style: `#`-free TS, `spawn` over shell, small files, one command per file.
