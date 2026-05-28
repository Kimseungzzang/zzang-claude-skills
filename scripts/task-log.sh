#!/bin/bash
# PostToolUse hook — append each tool use to task-log.md (local only, no git)

INPUT=$(cat)

json_pick() {
  HOOK_INPUT="$INPUT" node -e '
const paths = process.argv.slice(1);
let data = {};
try { data = JSON.parse(process.env.HOOK_INPUT || "{}"); } catch {}
function pick(path) {
  return path.split(".").reduce((value, key) => {
    if (value && Object.prototype.hasOwnProperty.call(value, key)) return value[key];
    return undefined;
  }, data);
}
for (const path of paths) {
  const value = pick(path);
  if (value !== undefined && value !== null) {
    process.stdout.write(String(value));
    process.exit(0);
  }
}
' "$@" 2>/dev/null
}

TOOL=$(json_pick tool_name tool)
[ -n "$TOOL" ] || TOOL="unknown"

case "$TOOL" in
  Write)   DETAIL=$(json_pick tool_input.file_path input.file_path) ;;
  Read)    DETAIL=$(json_pick tool_input.file_path input.file_path) ;;
  Edit)    DETAIL=$(json_pick tool_input.file_path input.file_path) ;;
  Bash)    DETAIL=$(json_pick tool_input.command input.command | head -c 80) ;;
  Grep)    DETAIL=$(json_pick tool_input.pattern input.pattern) ;;
  Agent)   DETAIL=$(json_pick tool_input.prompt input.prompt | head -c 60) ;;
  *)       DETAIL=$(json_pick tool_input input | head -c 60) ;;
esac

PROJECT=$(git rev-parse --show-toplevel 2>/dev/null | xargs basename 2>/dev/null || basename "$PWD")
LOG="$HOME/.zzang/ctx/$PROJECT/task-log.md"

if [ ! -f "$LOG" ]; then
  mkdir -p "$(dirname "$LOG")" 2>/dev/null || exit 0
  echo "## $(date '+%Y-%m-%dT%H:%M') | $PROJECT" 2>/dev/null > "$LOG" || exit 0
fi

echo "[$(date '+%H:%M')] $(printf '%-10s' "$TOOL") $DETAIL" 2>/dev/null >> "$LOG" || exit 0
