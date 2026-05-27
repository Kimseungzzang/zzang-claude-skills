Restore accumulated project context from CURRENT.ctx for the current project.

## Step 1 — Auto-setup sessions repo

Check if ~/.claude/sessions is already a git repo:

```bash
git -C ~/.claude/sessions rev-parse --git-dir 2>/dev/null
```

If it is NOT a git repo, auto-clone from the known remote:

```bash
git clone https://github.com/Kimseungzzang/claude-sessions.git ~/.claude/sessions
```

If clone fails, stop and report the error.

## Step 2 — Pull latest

```bash
git -C ~/.claude/sessions pull --rebase 2>/dev/null || true
```

## Step 2 — Find CURRENT.ctx for this project

```bash
PROJECT=$(basename "$PWD")
cat ~/.claude/sessions/$PROJECT/CURRENT.ctx 2>/dev/null
```

If file does not exist:
```
No saved context found for project: {PROJECT}
Run /session-save at the end of a session to start accumulating context.
```
Stop here.

## Step 3 — Acknowledge and orient

After reading CURRENT.ctx, output a brief acknowledgment. Do NOT reprint the raw file.

```
📂 Context loaded for {project} (last saved: {SESSION timestamp})

Continuing: {1-sentence summary of current state and what's in progress}

Key context:
• {CTX fact}
• {CTX fact}
…

Pending TODOs: {TODO items}
Open questions: {OPEN items, if any}

Ready. What would you like to work on?
```

Keep this under 120 words. Orient fast, don't repeat everything.

## Step 4 — Optional: history

If the user passes `list` as an argument (e.g. `/session-load list`), show all saved snapshots instead of loading:

```bash
ls -lt ~/.claude/sessions/$PROJECT/ | grep -v CURRENT
```

Output as a numbered list. The user can then ask to load a specific snapshot for a past context.
