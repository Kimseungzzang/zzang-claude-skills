Compact the current conversation context and save per-project filtered snapshots to the sessions repo.

## Step 1 — Ensure sessions repo is set up

Check if ~/.claude/zzang-ctx is already a git repo:

```bash
git -C ~/.claude/zzang-ctx rev-parse --git-dir 2>/dev/null
```

**If it IS a git repo** → proceed to Step 2.

**If it is NOT a git repo**, check for a saved remote URL:

```bash
cat ~/.claude/zzang-ctx-remote 2>/dev/null
```

- **URL found** → clone it:
  ```bash
  git clone {saved_url} ~/.claude/zzang-ctx
  ```

- **No URL found** → ask the user:
  ```
  No sessions repo configured. Choose an option:

  1. I have an existing repo URL → paste it and I'll clone it
  2. Create a new private repo now → I'll guide you through it

  Which option? (1 or 2)
  ```

  If option 1: clone the provided URL, then save it:
  ```bash
  git clone {url} ~/.claude/zzang-ctx
  echo "{url}" > ~/.claude/zzang-ctx-remote
  ```

  If option 2: guide the user to run:
  ```bash
  gh repo create claude-sessions --private
  git clone https://github.com/{username}/claude-sessions.git ~/.claude/zzang-ctx
  echo "https://github.com/{username}/claude-sessions.git" > ~/.claude/zzang-ctx-remote
  ```

## Step 2 — Pull latest

```bash
git -C ~/.claude/zzang-ctx pull --rebase 2>/dev/null || true
```

## Step 3 — Detect projects worked on this session

Get the current project from git root (more reliable than basename of cwd):

```bash
git rev-parse --show-toplevel 2>/dev/null | xargs basename
```

If NOT in a git repo, ask the user:
```
You're not inside a git repo. What should this session be saved under?
(e.g. "dotfiles", "general", "research")
```

Then review the full conversation and identify **all distinct projects** discussed or worked on — look for:
- Directory paths mentioned (`cd`, file paths, repo names)
- Different codebases, tools, or repos referenced
- Context switches between different projects

Present the detected list to the user and confirm:
```
Detected projects in this session:
  1. project-a  (/Users/kim/project-a)
  2. project-b  (/Users/kim/project-b)

Save context for all of them? (Y/n) or enter numbers to select (e.g. 1,2)
```

Proceed with the confirmed project list.

## Step 4 — For each project: read task-log and existing CURRENT.ctx

Read task-log first (local only — contains every tool use since last session start):

```bash
cat ~/.claude/zzang-ctx/{project}/task-log.md 2>/dev/null
```

Use task-log to accurately populate DONE and CHANGED fields in the snapshot. This ensures cross-machine accuracy — task-log is local only and will not exist on other machines, so its contents must be absorbed into CURRENT.ctx now.

Record the timestamp of the **last line** of task-log as `TASK-LOG-ID` in CURRENT.ctx. This marks exactly how far was absorbed, so /session-load can detect any new entries added after this save.

Then read existing CURRENT.ctx to load accumulated history:

```bash
cat ~/.claude/zzang-ctx/{project}/CURRENT.ctx 2>/dev/null
```

## Step 5 — For each project: write a filtered snapshot

File: `~/.claude/zzang-ctx/{project}/$(date '+%Y-%m-%dT%H-%M')`

**Critical rule**: each project's snapshot must contain ONLY information relevant to that project. Do not bleed context from other projects into this file.

Write in the following format. Fields marked **keyword-only** must stay terse. Fields marked **sentence-allowed** can use short sentences when keywords alone lose critical meaning.

```
SESSION {TIMESTAMP} | {/absolute/path/to/project} | {branch}
STACK: {lang/framework/db}
DONE: {items done on THIS project only}
CHANGED: {file(reason); file(new); file(del)}
TRIED: {what was attempted but failed — why it failed}
DECIDED: {decision — full reasoning if non-obvious, one sentence max per item}
TODO: {tasks for THIS project only}
OPEN: {open questions for THIS project only}
CTX: {non-obvious facts relevant to THIS project only}
```

Field formatting rules:
- `DONE`, `CHANGED`, `TODO`, `OPEN`, `STACK` — **keyword-only**, semicolon-separated
- `TRIED` — **sentence-allowed**: `{what}({why it failed})` e.g. `Redis pub/sub(race condition under load); JWT in cookie(CORS blocked by CDN)`
- `DECIDED` — **sentence-allowed**: `{decision}: {reason}` e.g. `use polling not websocket: mobile clients drop WS connections on background`
- Use `—` for empty fields.

## Step 6 — For each project: merge into CURRENT.ctx

Update `~/.claude/zzang-ctx/{project}/CURRENT.ctx` using these rules:

| Field | Rule |
|-------|------|
| `SESSION` | Always update to latest timestamp |
| `TASK-LOG-ID` | **Replace** with timestamp of the last line in task-log.md (e.g. `14:35`) |
| `STACK` | Union of all stacks seen (deduplicate) |
| `DONE` | **Replace** with this session's DONE (use task-log to populate accurately) |
| `CHANGED` | **Replace** with this session's CHANGED (use task-log to populate accurately) |
| `TRIED` | **Accumulate** — keep all prior failed attempts; they must never be repeated |
| `DECIDED` | **Accumulate** — append new decisions, keep all prior with reasoning |
| `TODO` | Remove items that appear in DONE; add new items |
| `OPEN` | **Accumulate** — keep prior, add new |
| `CTX` | **Accumulate** — union, deduplicate |

Keep CURRENT.ctx under ~300 tokens (raised from 200 to accommodate TRIED and DECIDED detail). If it grows beyond that, compress DONE/CHANGED history but never compress TRIED or DECIDED — those are the most valuable for continuity.

## Step 7 — Clear task-log

After absorbing task-log into CURRENT.ctx, delete it. Next task will start a fresh log.

```bash
rm ~/.claude/zzang-ctx/{project}/task-log.md 2>/dev/null || true
```

## Step 8 — Commit and push

```bash
git -C ~/.claude/zzang-ctx add .
git -C ~/.claude/zzang-ctx commit -m "session: {project-list} $(date '+%Y-%m-%dT%H:%M')"
git -C ~/.claude/zzang-ctx push
```

## Step 9 — Report

```
✅ Session saved for {N} project(s):

  • {project-a} → ~/.claude/zzang-ctx/project-a/{timestamp}
  • {project-b} → ~/.claude/zzang-ctx/project-b/{timestamp}

📋 CURRENT.ctx updated for each.
📤 Pushed to remote.

Run `/session-load` at the start of your next session.
```
