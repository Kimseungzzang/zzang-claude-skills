Summarize today's conversation and save it to Obsidian vault.

---

## Step 1 — Daily Note

Find the vault path:
```bash
find ~ -maxdepth 4 -type d -name "obsidian-vault" 2>/dev/null | head -1
```

Read today's existing daily note if it exists:
```bash
cat {vault}/Daily/YYYY-MM-DD.md 2>/dev/null
```

Append only **genuine questions** from the user. A genuine question is one where the user is asking for an explanation, opinion, or information. Skip simple commands or instructions (e.g., "커밋해줘", "파일 만들어줘", "스킬 추가해줘", "푸쉬해줘").

For each qualifying topic, append:

```
## [Topic Title]

**Q:** [User's question]

**A:** [Your answer, summarized concisely]
```

Do not duplicate topics already present in the file.

---

## Step 2 — Project Note

Identify the project name from the current working directory:
```bash
git rev-parse --show-toplevel 2>/dev/null | xargs basename
```

Read the existing project note:
```bash
cat {vault}/Projects/{ProjectName}.md 2>/dev/null
```

Update the project note with the following rules:

### Commits & Changes
- Add a new dated subsection for this session's commits and file changes.
- Do not modify or delete existing subsections.

### Implementation Summary
- Re-read the existing Mermaid diagram.
- If the architecture, data flow, or component relationships changed this session, update the diagram to reflect the current state.
- Mark changed nodes or edges with a comment like `%% updated` if helpful.
- If nothing structural changed, leave the diagram as-is.

### Session Log
- Add a new subsection for this session.
- Do not modify existing session log entries.
- If any fact recorded in a previous session log entry is now outdated (e.g., a path changed, a feature was replaced), add a note directly below the old entry in this format:
  ```
  > ~~이전 내용~~ → 변경됨: [새 내용] (YYYY-MM-DD)
  ```

### TODO
- Remove items that were completed this session.
- Add new TODO items discovered this session.

---

Use today's date for all timestamps. Write all content in Korean.
