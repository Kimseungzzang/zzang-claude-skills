# zzang-claude-skills

[English](README.md) · [한국어](README.ko.md)

A collection of custom Claude Code skills by kimseungzzang — including a full cross-session, cross-machine context persistence system.

## Install

```bash
npx zzang-claude-skills
```

The installer automatically:
- Installs all skills into `~/.claude/commands/`
- Installs shared hook scripts into `~/.zzang/scripts/`
- Registers the `PostToolUse` hook (task logging) in `~/.claude/settings.json`
- Registers the `Stop` hook (claude-dragon notification) in `~/.claude/settings.json`
- Guides you through setting up a private GitHub repo for session storage

**Restart Claude Code after install to activate hooks.**

## Skills

| Skill | Description |
|-------|-------------|
| `/session-save` | Compact the current session context and push to your sessions repo |
| `/session-load` | Pull the latest context for the **current project** (detected from git root) and resume where you left off |
| `/obsidian` | Summarize today's conversation and save it to your Obsidian vault |
| `/github-summary` | Fetch a GitHub repo URL and summarize it |
| `/codex-review-loop` | Run Codex CLI review, fix issues, repeat until clean (max 3 iterations) |

---

## Claude Dragon

A desktop companion that appears every time Claude finishes a response.

Built as a separate Electron app ([claude-dragon](https://github.com/Kimseungzzang/claude-dragon)) — a transparent, always-on-top overlay window. When Claude stops, the `Stop` hook writes the current working directory and context usage to the dragon trigger file, and a cute dragon flies in from the corner, breathes fire, shows a speech bubble with the project name, then flies away.

**Setup:**
1. Clone and run the companion app:
   ```bash
   git clone https://github.com/Kimseungzzang/claude-dragon.git
   cd claude-dragon && npm install && npm start
   ```
2. The `Stop` hook is automatically registered by the installer — no extra config needed.

The dragon runs in the background. As long as it's running, it will respond to every Claude session on your machine.

---

## Session Persistence System

`/session-save` and `/session-load` form a full cross-session, cross-machine memory system for Claude Code.

### How it works — overview

```
Every tool use  →  PostToolUse hook  →  task-log.md (local only)
                                              │
                                    /session-save
                                              │
                          ┌───────────────────┼───────────────────┐
                          ▼                   ▼                   ▼
                    reads task-log     writes snapshot      updates CURRENT.ctx
                    (absorbs it)       (timestamped)        (accumulated state)
                          │
                          └──── git commit & push ──→  GitHub (private repo)
                                                               │
                                                       /session-load
                                                               │
                                              git pull → reads CURRENT.ctx
                                                       + checks task-log
                                                               │
                                                       orients you to resume
```

---

### `/session-save` flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        /session-save                            │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
[1] Is ~/.zzang/ctx a git repo?
         │
    NO ──┤
         │   Is ~/.zzang/ctx-remote set?
         │         │
         │    YES  ▼
         │   git clone {url} ~/.zzang/ctx
         │         │
         │    NO   ▼
         │   Ask user: existing repo or create new?
         │         │
         └─────────┘
         │
    YES  ▼
[2] git pull --rebase (fetch latest from remote)
         │
         ▼
[3] Detect project(s) worked on this session
    - git rev-parse --show-toplevel | xargs basename
    - Scan conversation for other project paths
    - Show list, ask user to confirm
         │
         ▼
[4] For each project:
    │
    ├─► Read ~/.zzang/ctx/{project}/task-log.md  (local only)
    │       └── use it to accurately populate DONE/CHANGED
    │       └── record last line timestamp as TASK-LOG-ID
    │
    ├─► Read ~/.zzang/ctx/{project}/CURRENT.ctx  (accumulated history)
    │
    ▼
[5] Write timestamped snapshot
    ~/.zzang/ctx/{project}/YYYY-MM-DDTHH-MM
    ┌──────────────────────────────────────────────┐
    │ SESSION  timestamp | /path/to/project | branch│
    │ STACK:   lang/framework/db                    │
    │ DONE:    items done this session              │
    │ CHANGED: file(reason); file(new)              │
    │ TRIED:   what failed and why                  │
    │ DECIDED: decisions with reasoning             │
    │ TODO:    pending tasks                        │
    │ OPEN:    open questions                       │
    │ CTX:     non-obvious project facts            │
    └──────────────────────────────────────────────┘
         │
         ▼
[6] Merge into CURRENT.ctx
    ┌─────────────┬────────────────────────────────────────┐
    │ Field       │ Rule                                   │
    ├─────────────┼────────────────────────────────────────┤
    │ SESSION     │ Always update to latest timestamp      │
    │ TASK-LOG-ID │ Replace with last task-log line time   │
    │ STACK       │ Union (deduplicate)                    │
    │ DONE        │ Replace with this session only         │
    │ CHANGED     │ Replace with this session only         │
    │ TRIED       │ Accumulate — NEVER compress            │
    │ DECIDED     │ Accumulate — NEVER compress            │
    │ TODO        │ Remove completed; add new              │
    │ OPEN        │ Accumulate                             │
    │ CTX         │ Accumulate (union, deduplicate)        │
    └─────────────┴────────────────────────────────────────┘
         │
         ▼
[7] Delete task-log  (it's now absorbed into CURRENT.ctx)
    rm ~/.zzang/ctx/{project}/task-log.md
         │
         ▼
[8] git add . && git commit && git push
         │
         ▼
[9] Report: ✅ saved N projects, pushed to remote
```

---

### `/session-load` flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        /session-load                            │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
[1] Is ~/.zzang/ctx a git repo?  (same setup check as save)
         │
         ▼
[2] git pull --rebase
         │
         ▼
[3] Detect project name
    git rev-parse --show-toplevel | xargs basename
    └── if not in git repo → use basename $PWD + warn
         │
         ▼
[4] Read CURRENT.ctx
    cat ~/.zzang/ctx/{project}/CURRENT.ctx
         │
         └── not found? → "No context saved for this project. Run /session-save first."
         │
         ▼
[5] Compare task-log vs TASK-LOG-ID in CURRENT.ctx

    SAVED_ID = TASK-LOG-ID from CURRENT.ctx
    LAST_LOG = timestamp of last line in local task-log.md

         │
    ┌────┴─────────────────────────────────────────────────┐
    │                                                      │
    ▼                                                      ▼
Case 1: LAST_LOG == SAVED_ID             Case 4: No local task-log
→ Clean state, no interrupted work       → Different machine
→ Proceed normally                       → Inform user, use CURRENT.ctx only
    │                                                      │
    ▼                                                      │
Case 2: LAST_LOG > SAVED_ID             Case 3: task-log header > SESSION
→ Unsaved work after last /session-save  → New task in progress (not interrupted)
→ Show unsaved entries                   → Show task-log as current work context
→ Ask: resume from here?                          │
    │                                             │
    └──────────────────┬──────────────────────────┘
                       │
                       ▼
[6] Output brief orientation (≤150 words)
    ┌──────────────────────────────────────────────────────┐
    │ 📂 Context loaded for {project} (last: {timestamp}) │
    │                                                      │
    │ Continuing: {1-sentence summary}                     │
    │                                                      │
    │ Key context:                                         │
    │ • {CTX fact}                                         │
    │                                                      │
    │ Pending TODOs: {items}                               │
    │ Open questions: {items}                              │
    │                                                      │
    │ ⚠️  Last task interrupted at HH:MM:   (if Case 2)   │
    │    Last action: {tool} {detail}                      │
    └──────────────────────────────────────────────────────┘
```

---

### PostToolUse hook — `task-log.sh`

Runs automatically after every tool use. Appends one line to `task-log.md`:

```
~/.zzang/ctx/{project}/task-log.md

## 2026-05-28T14:00 | my-project       ← header (created on first entry)
[14:01] Write      src/api.py
[14:03] Bash       npm test
[14:05] Edit       src/api.py
```

- **Local only** — never pushed to GitHub directly
- **Absorbed by `/session-save`** — content is merged into CURRENT.ctx, then deleted
- **Read by `/session-load`** — compared against `TASK-LOG-ID` to detect interrupted work
- **Schema tolerant** — reads both Claude Code (`tool_name`, `tool_input`) and Codex-style (`tool`, `input`) hook payloads without requiring `jq`
- **Purpose** — captures exactly what happened even if Claude is force-killed (no Stop hook needed)

---

### Storage layout

```
~/
├── .claude/
│   ├── commands/
│   │   ├── session-save.md       ← skill definitions
│   │   └── session-load.md
│   └── settings.json             ← hook registration
└── .zzang/
    ├── scripts/
    │   ├── task-log.sh           ← PostToolUse hook script
    │   ├── dragon-notify.sh      ← Stop hook script
    │   └── pre-compact-backup.sh ← PreCompact hook script
    ├── ctx-remote                ← stores your GitHub repo URL
    └── ctx/                      ← git repo (cloned from GitHub)
        ├── .gitignore
        ├── my-project/
        │   ├── CURRENT.ctx       ← accumulated state (pushed)
        │   ├── task-log.md       ← live log (local only, not pushed)
        │   └── 2026-05-28T14-00  ← timestamped snapshots (pushed)
        └── other-project/
            └── CURRENT.ctx
```

---

### Multi-machine setup

```
Machine A                          Machine B
─────────                          ─────────
/session-save                      npx zzang-claude-skills
  → pushes to GitHub repo            → clones from zzang-ctx-remote
                                   /session-load
                                     → pulls CURRENT.ctx from GitHub
                                     → no task-log (Case 4 — expected)
                                     → resumes from saved state
```

---

## ⚠️ Cautions

**Keep your sessions repo private.**
CURRENT.ctx captures file paths, decisions, API key names, and internal architecture details. Never use a public repo.

**Don't delete `~/.zzang/ctx/` manually.**
`task-log.md` lives there and is local-only. If you wipe the folder before `/session-save`, unabsorbed entries are gone permanently.

**Don't edit CURRENT.ctx by hand.**
The merge logic expects a specific format. Manual edits can break field accumulation silently.

**If `/session-save` is interrupted mid-run**, re-run it. Snapshots are idempotent; re-saving overwrites cleanly.

**task-log is local only by design.**
It is never committed to GitHub. On a new machine, `/session-load` lands in Case 4 (no task-log) — that's expected, not an error.

---

## 💡 Recommendations

**Save at milestones, not just session end.**
`/session-save` mid-session (after finishing a feature, before starting the next) gives finer-grained recovery points and prevents losing hours of context to an unexpected crash.

**Run `/session-load` before doing anything else in a new session.**
If you start working before loading, Claude has no accumulated context and may repeat decisions or miss known constraints.

**Before switching machines, always `/session-save` first.**
The other machine pulls from GitHub — if you haven't pushed, it sees stale context.

**Use a dedicated repo just for sessions.**
Don't reuse an existing repo. The sessions repo accumulates CURRENT.ctx files per project over time; a dedicated repo keeps it clean and auditable.

---

## Adding a skill

Add a `.md` file to `skills/` and run `npm publish`:

```
skills/
├── session-save.md
├── session-load.md
├── obsidian.md
├── github-summary.md
├── codex-review-loop.md
└── your-skill.md   ← add here
```

## Development

```bash
node bin/install.js
```
