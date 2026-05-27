# zzang-claude-skills

A collection of custom Claude Code skills by kimseungzzang.

## Install

```bash
npx zzang-claude-skills
```

The installer will set up all skills and interactively configure a sessions repo for `/session-save` and `/session-load`.

## Skills

| Skill | Description |
|-------|-------------|
| `/obsidian` | Summarize today's conversation and save it to your Obsidian vault |
| `/github-summary` | Fetch a GitHub repo URL and summarize it in Korean |
| `/codex-review-loop` | Run a Codex CLI code review after finishing a task, fix issues, and repeat until clean (max 3 iterations) |
| `/session-save` | Compact the current session context into an ultra-dense format and push to your sessions repo (accumulated per project) |
| `/session-load` | Pull the latest context from your sessions repo and resume where you left off |

## Session persistence

`/session-save` and `/session-load` require a private git repo to store context across sessions and machines.

The installer will walk you through it. If you skip it during install, run again anytime:

```bash
npx zzang-claude-skills
```

On a new machine, just install the skills — `/session-load` will automatically clone your sessions repo.

## Adding a skill

Add a `.md` file to `skills/` and publish to npm — it gets installed automatically.

```
skills/
├── obsidian.md
├── github-summary.md
├── codex-review-loop.md
├── session-save.md
├── session-load.md
└── your-skill.md   ← add here
```

## Development

```bash
node bin/install.js
```
