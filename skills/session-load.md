Restore accumulated project context from CURRENT.ctx for the current project.

## Step 1 — Ensure sessions repo is set up

Check if ~/.claude/sessions is already a git repo:

```bash
git -C ~/.claude/sessions rev-parse --git-dir 2>/dev/null
```

**If it IS a git repo** → proceed to Step 2.

**If it is NOT a git repo**, check for a saved remote URL:

```bash
cat ~/.claude/sessions-remote 2>/dev/null
```

- **URL found** → clone it:
  ```bash
  git clone {saved_url} ~/.claude/sessions
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
  git clone {url} ~/.claude/sessions
  echo "{url}" > ~/.claude/sessions-remote
  ```

  If option 2: guide the user to run:
  ```bash
  gh repo create claude-sessions --private
  git clone https://github.com/{username}/claude-sessions.git ~/.claude/sessions
  echo "https://github.com/{username}/claude-sessions.git" > ~/.claude/sessions-remote
  ```
  Then proceed once done.

## Step 2 — Pull latest

```bash
git -C ~/.claude/sessions pull --rebase 2>/dev/null || true
```

## Step 3 — Find CURRENT.ctx for this project

Detect project name from git root (more reliable than basename of cwd):

```bash
git rev-parse --show-toplevel 2>/dev/null | xargs basename
```

If NOT in a git repo, use `basename "$PWD"` and warn the user.

```bash
cat ~/.claude/sessions/$PROJECT/CURRENT.ctx 2>/dev/null
```

If file does not exist:
```
No saved context found for project: {PROJECT}
Run /session-save at the end of a session to start accumulating context.
```
Stop here.

## Step 4 — Acknowledge and orient

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

## Step 5 — Optional: history

If the user passes `list` as an argument (e.g. `/session-load list`), show all saved snapshots instead of loading:

```bash
ls -lt ~/.claude/sessions/$PROJECT/ | grep -v CURRENT
```

Output as a numbered list. The user can then ask to load a specific snapshot for a past context.
