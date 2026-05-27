Compact the current conversation context and merge it into the project's cumulative CURRENT.ctx, then push to remote.

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

## Step 3 — Detect project info

```bash
PROJECT=$(basename "$PWD")
BRANCH=$(git branch --show-current 2>/dev/null || echo "N/A")
TIMESTAMP=$(date '+%Y-%m-%dT%H:%M')
mkdir -p ~/.claude/sessions/$PROJECT
```

## Step 4 — Read existing CURRENT.ctx (if any)

```bash
cat ~/.claude/sessions/$PROJECT/CURRENT.ctx 2>/dev/null
```

Use the existing content to understand accumulated history (prior CTX facts, DECIDED, OPEN items).

## Step 5 — Write this session's snapshot file

File: `~/.claude/sessions/$PROJECT/$(date '+%Y-%m-%dT%H-%M')`

Write the current session in ultra-compact format (keywords only, no prose):

```
SESSION {TIMESTAMP} | {/absolute/cwd} | {branch}
STACK: {lang/framework/db}
DONE: {item; item}
CHANGED: {file(reason); file(new); file(del)}
DECIDED: {decision(reason); decision(reason)}
TODO: {task | task | task}
OPEN: {question; question}
CTX: {non-obvious facts; semicolon-separated}
```

Use `—` for empty fields. Keep values as short keywords.

## Step 6 — Merge into CURRENT.ctx

Update `~/.claude/sessions/$PROJECT/CURRENT.ctx` by merging the new session into the accumulated state. **Apply these rules per field:**

| Field | Rule |
|-------|------|
| `SESSION` | Always update to latest timestamp |
| `STACK` | Union of all stacks seen (deduplicate) |
| `DONE` | **Replace** with this session's DONE only |
| `CHANGED` | **Replace** with this session's CHANGED only |
| `DECIDED` | **Accumulate** — append new decisions, keep all prior |
| `TODO` | Remove items that appear in DONE; add new items |
| `OPEN` | **Accumulate** — keep prior open questions; add new ones |
| `CTX` | **Accumulate** — union of all CTX facts (deduplicate) |

The resulting CURRENT.ctx must stay under ~200 tokens. If CTX or DECIDED grows too long, compress older entries to their essence (1-3 words each) while preserving meaning.

## Step 7 — Commit and push

```bash
git -C ~/.claude/sessions add $PROJECT/
git -C ~/.claude/sessions commit -m "session: $PROJECT $TIMESTAMP"
git -C ~/.claude/sessions push
```

## Step 8 — Report

```
✅ Saved → ~/.claude/sessions/{project}/{timestamp}
📋 CURRENT.ctx updated (accumulated)
📤 Pushed to remote.

Run `/session-load` at the start of your next session.
```
