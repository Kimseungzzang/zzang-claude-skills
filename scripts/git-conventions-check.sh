#!/bin/bash
# PreToolUse hook — enforce Conventional Commits on git commit -m

INPUT=$(cat)
COMMAND=$(node -e "
let d='';
process.stdin.on('data',c=>d+=c);
process.stdin.on('end',()=>{
  try { process.stdout.write(JSON.parse(d).tool_input?.command || ''); } catch {}
});
" <<< "$INPUT" 2>/dev/null)

# Only check git commit commands with -m flag
echo "$COMMAND" | grep -qE 'git commit.*-m' || exit 0

# Extract message from -m "..." or -m '...'
MSG=$(echo "$COMMAND" | grep -oE '\-m\s+"[^"]+"|\-m\s+'"'"'[^'"'"']+'"'" | head -1 | sed "s/^-m[[:space:]]*[\"']//;s/[\"']$//")
[ -z "$MSG" ] && exit 0

# Validate Conventional Commits: type(scope)?: subject
if echo "$MSG" | grep -qE '^(feat|fix|refactor|test|docs|chore|style|perf|ci|build|revert)(\(.+\))?: .+'; then
  exit 0
fi

echo "⛔ Conventional Commits 형식이 아닙니다."
echo ""
echo "형식: <type>(<scope>): <subject>"
echo ""
echo "타입: feat | fix | refactor | test | docs | chore | style | perf | ci | build | revert"
echo ""
echo "예시:"
echo "  feat(auth): 소셜 로그인 추가"
echo "  fix(api): null 응답 처리"
echo "  refactor: Store 타입 시스템 단순화"
echo ""
echo "현재 메시지: \"$MSG\""
echo ""
echo "커밋 메시지를 수정한 후 다시 시도해주세요."
exit 2
