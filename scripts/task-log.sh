#!/bin/bash
# PostToolUse hook — append each tool use to task-log.md (local only, no git)

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // "unknown"' 2>/dev/null || echo "unknown")

case "$TOOL" in
  Write)   DETAIL=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""' 2>/dev/null) ;;
  Read)    DETAIL=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""' 2>/dev/null) ;;
  Edit)    DETAIL=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""' 2>/dev/null) ;;
  Bash)    DETAIL=$(echo "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null | head -c 80) ;;
  Grep)    DETAIL=$(echo "$INPUT" | jq -r '.tool_input.pattern // ""' 2>/dev/null) ;;
  Agent)   DETAIL=$(echo "$INPUT" | jq -r '.tool_input.prompt // ""' 2>/dev/null | head -c 60) ;;
  *)       DETAIL=$(echo "$INPUT" | jq -r '.tool_input | to_entries[0].value // ""' 2>/dev/null | head -c 60) ;;
esac

PROJECT=$(git rev-parse --show-toplevel 2>/dev/null | xargs basename 2>/dev/null || basename "$PWD")
LOG="$HOME/.claude/zzang-ctx/$PROJECT/task-log.md"

if [ ! -f "$LOG" ]; then
  mkdir -p "$(dirname "$LOG")"
  echo "## $(date '+%Y-%m-%dT%H:%M') | $PROJECT" > "$LOG"
fi

echo "[$(date '+%H:%M')] $(printf '%-10s' "$TOOL") $DETAIL" >> "$LOG"
