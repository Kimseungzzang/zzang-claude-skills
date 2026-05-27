Restore accumulated project context from CURRENT.ctx for the current project.

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
  Then proceed once done.

## Step 2 — Pull latest

```bash
git -C ~/.claude/zzang-ctx pull --rebase 2>/dev/null || true
```

Note: pull fetches what was last pushed by `/session-save`. CURRENT.ctx will be up to date. task-log on GitHub may be behind — Step 4 reads the local file directly, which includes all unpushed commits from PostToolUse hooks and is always more current.

## Step 3 — Find CURRENT.ctx for this project

Detect project name from git root (more reliable than basename of cwd):

```bash
git rev-parse --show-toplevel 2>/dev/null | xargs basename
```

If NOT in a git repo, use `basename "$PWD"` and warn the user.

```bash
cat ~/.claude/zzang-ctx/$PROJECT/CURRENT.ctx 2>/dev/null
```

If file does not exist:
```
No saved context found for project: {PROJECT}
Run /session-save at the end of a session to start accumulating context.
```
Stop here.

## Step 4 — Read task-log (if exists)

```bash
cat ~/.claude/zzang-ctx/$PROJECT/task-log.md 2>/dev/null
```

If task-log exists, it shows the exact sequence of tool uses from the last task — use this to determine where work was interrupted.

## Step 5 — Acknowledge and orient

After reading both CURRENT.ctx and task-log, output a brief acknowledgment. Do NOT reprint raw files.

```
📂 Context loaded for {project} (last saved: {SESSION timestamp})

Continuing: {1-sentence summary of current state}

Key context:
• {CTX fact}
• {CTX fact}

Pending TODOs: {TODO items}
Open questions: {OPEN items, if any}
```

If task-log exists and shows an interrupted task, append:

```
⚠️  Last task was interrupted at {HH:MM}:
  Last action: {tool} {detail}
  Resume from here? (or describe what to do next)
```

Keep total output under 150 words.

## Step 6 — Optional: history

If the user passes `list` as an argument (e.g. `/session-load list`), show all saved snapshots instead of loading:

```bash
ls -lt ~/.claude/zzang-ctx/$PROJECT/ | grep -v CURRENT
```

Output as a numbered list. The user can then ask to load a specific snapshot for a past context.
