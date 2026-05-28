Restore accumulated project context from CURRENT.ctx for the current project.

## Step 1 — Ensure sessions repo is set up

Check if ~/.zzang/ctx is already a git repo:

```bash
git -C ~/.zzang/ctx rev-parse --git-dir 2>/dev/null
```

**If it IS a git repo** → proceed to Step 2.

**If it is NOT a git repo**, check for a saved remote URL:

```bash
cat ~/.zzang/ctx-remote 2>/dev/null
```

- **URL found** → clone it:
  ```bash
  git clone {saved_url} ~/.zzang/ctx
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
  git clone {url} ~/.zzang/ctx
  echo "{url}" > ~/.zzang/ctx-remote
  ```

  If option 2: guide the user to run:
  ```bash
  gh repo create claude-sessions --private
  git clone https://github.com/{username}/claude-sessions.git ~/.zzang/ctx
  echo "https://github.com/{username}/claude-sessions.git" > ~/.zzang/ctx-remote
  ```
  Then proceed once done.

## Step 2 — Pull latest

```bash
git -C ~/.zzang/ctx pull --rebase 2>/dev/null || true
```

Note: pull fetches what was last pushed by `/session-save`. CURRENT.ctx will be up to date. task-log on GitHub may be behind — Step 4 reads the local file directly, which includes all unpushed commits from PostToolUse hooks and is always more current.

## Step 3 — Find CURRENT.ctx for this project

Detect project name from git root (more reliable than basename of cwd):

```bash
git rev-parse --show-toplevel 2>/dev/null | xargs basename
```

If NOT in a git repo, use `basename "$PWD"` and warn the user.

```bash
cat ~/.zzang/ctx/$PROJECT/CURRENT.ctx 2>/dev/null
```

If file does not exist:
```
No saved context found for project: {PROJECT}
Run /session-save at the end of a session to start accumulating context.
```
Stop here.

## Step 4 — Compare task-log to determine state

```bash
# Timestamp of last absorbed entry (stored in CURRENT.ctx)
SAVED_ID=$(grep "^TASK-LOG-ID:" ~/.zzang/ctx/$PROJECT/CURRENT.ctx | awk '{print $2}')

# Timestamp of last line in local task-log
LAST_LOG=$(tail -1 ~/.zzang/ctx/$PROJECT/task-log.md 2>/dev/null | grep -o '^\[[0-9:]*\]' | tr -d '[]')
```

**Case 1 — last line matches SAVED_ID**: nothing new since last save. No interrupted work. Proceed normally.

**Case 2 — last line is newer than SAVED_ID**: unsaved work exists. Extract lines after SAVED_ID — these are tool uses that happened after the last `/session-save` and were not absorbed into CURRENT.ctx.

Action:
- Show the unsaved entries clearly
- Treat them as the most recent work context (more recent than CURRENT.ctx DONE/CHANGED)
- Ask the user whether to resume from the interrupted point or start fresh:

```
⚠️  Unsaved work detected since last /session-save ({SAVED_ID} → {LAST_LOG}):

  [14:33] Write   src/user.py
  [14:35] Bash    npm test   ← last action before interruption

Resume from here, or describe what to do next.
```

**Case 3 — task-log header is newer than CURRENT.ctx SESSION timestamp**: a completely new task started and is in progress (not interrupted from the previous session). The previous session was already absorbed. Show the current task-log as ongoing work context.

**Case 4 — No local task-log**: different machine. Inform the user:

```
ℹ️  task-log not available on this machine (local only).
    Last absorbed entry: {SAVED_ID}
    Resuming from CURRENT.ctx — DONE and CHANGED reflect the last saved state.
```

## Step 5 — Acknowledge and orient

After reading CURRENT.ctx and task-log (if available), output a brief acknowledgment. Do NOT reprint raw files.

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

If task-log does not exist, append the ℹ️ note above instead.

Keep total output under 150 words.

## Step 6 — Optional: history

If the user passes `list` as an argument (e.g. `/session-load list`), show all saved snapshots instead of loading:

```bash
ls -lt ~/.zzang/ctx/$PROJECT/ | grep -v CURRENT
```

Output as a numbered list. The user can then ask to load a specific snapshot for a past context.
