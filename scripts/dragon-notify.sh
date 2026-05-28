#!/bin/bash
# Stop hook — write trigger file for claude-dragon with context usage

cat > /tmp/claude-dragon-input.json

python3 - /tmp/claude-dragon-input.json /tmp/claude-dragon-trigger << 'EOF'
import json, os, sys

input_path, output_path = sys.argv[1], sys.argv[2]

try:
    with open(input_path) as f:
        data = json.load(f)
except:
    data = {}

cwd = data.get('cwd', '')
transcript = data.get('transcript_path', '')
context_pct = 0

if transcript and os.path.isfile(transcript):
    try:
        with open(transcript) as f:
            lines = f.readlines()
        for line in reversed(lines):
            try:
                d = json.loads(line)
                u = d.get('message', {}).get('usage', {})
                if u:
                    total = (u.get('input_tokens', 0)
                           + u.get('cache_read_input_tokens', 0)
                           + u.get('cache_creation_input_tokens', 0))
                    context_pct = round(total * 100 / 200000)
                    break
            except:
                pass
    except:
        pass

with open(output_path, 'w') as f:
    json.dump({'cwd': cwd, 'context_pct': context_pct}, f)
EOF
