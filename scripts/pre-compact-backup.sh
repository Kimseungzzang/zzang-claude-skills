#!/bin/bash
# PreCompact hook — task-log를 CURRENT.ctx에 흡수하고 git commit (push 없음)
# 컴팩션 전에 실행되어 TRIED/DECIDED 등 중요 컨텍스트 유실 방지

cat > /tmp/pre-compact-input.json

python3 - /tmp/pre-compact-input.json << 'EOF'
import json, os, subprocess, datetime, sys

input_path = sys.argv[1]
try:
    with open(input_path) as f:
        data = json.load(f)
except:
    data = {}

cwd = data.get('cwd', os.getcwd())

# 프로젝트명 추출
try:
    result = subprocess.run(
        ['git', 'rev-parse', '--show-toplevel'],
        cwd=cwd, capture_output=True, text=True
    )
    project = os.path.basename(result.stdout.strip()) if result.returncode == 0 else os.path.basename(cwd)
except:
    project = os.path.basename(cwd)

ctx_dir = os.path.expanduser(f'~/.claude/zzang-ctx/{project}')
task_log_path = os.path.join(ctx_dir, 'task-log.md')
current_ctx_path = os.path.join(ctx_dir, 'CURRENT.ctx')

if not os.path.isfile(task_log_path):
    print(f'[pre-compact] task-log 없음 ({project}), 스킵')
    sys.exit(0)

with open(task_log_path) as f:
    task_log = f.read().strip()

if not task_log:
    print(f'[pre-compact] task-log 비어있음 ({project}), 스킵')
    sys.exit(0)

# CURRENT.ctx 읽기
current_ctx = ''
if os.path.isfile(current_ctx_path):
    with open(current_ctx_path) as f:
        current_ctx = f.read()

# TASK-LOG-ID 업데이트
last_line = [l for l in task_log.splitlines() if l.strip()][-1]
last_id = ''
import re
m = re.match(r'\[(\d{2}:\d{2})\]', last_line)
if m:
    last_id = m.group(1)

if last_id:
    if 'TASK-LOG-ID:' in current_ctx:
        current_ctx = re.sub(r'TASK-LOG-ID: .*', f'TASK-LOG-ID: {last_id}', current_ctx)
    else:
        current_ctx = current_ctx.rstrip() + f'\nTASK-LOG-ID: {last_id}\n'

# PRE-COMPACT 메모 추가 (기존 항목 교체)
now = datetime.datetime.now().strftime('%Y-%m-%dT%H:%M')
compact_note = f'PRE-COMPACT: {now} | task-log 흡수 완료 ({last_id})'

if 'PRE-COMPACT:' in current_ctx:
    current_ctx = re.sub(r'PRE-COMPACT:.*', compact_note, current_ctx)
else:
    current_ctx = current_ctx.rstrip() + f'\n{compact_note}\n'

os.makedirs(ctx_dir, exist_ok=True)
with open(current_ctx_path, 'w') as f:
    f.write(current_ctx)

# git commit (push 없음 — 속도 우선)
zzang_ctx = os.path.expanduser('~/.claude/zzang-ctx')
subprocess.run(['git', '-C', zzang_ctx, 'add', current_ctx_path], capture_output=True)
subprocess.run([
    'git', '-C', zzang_ctx, 'commit', '-m',
    f'pre-compact: {project} {now}'
], capture_output=True)

print(f'[pre-compact] CURRENT.ctx 백업 완료 ({project}, {last_id})')
EOF
