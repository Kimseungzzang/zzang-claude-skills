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

Update the project note using the rules below. The goal is a single file that always reflects the **current state** of the project — not just a history of sessions.

---

### 프로젝트 구조 (Project Structure)

This section is the live reference for the project. Update it every session to match the current state of the codebase.

To gather current state, read key files from the project:
```bash
# File tree (top-level + one level deep, excluding build artifacts)
find {project_root} -maxdepth 2 -not -path '*/node_modules/*' -not -path '*/.git/*' \
  -not -path '*/build/*' -not -path '*/.gradle/*' -not -path '*/target/*' | sort

# Recent changes as a hint
git -C {project_root} diff HEAD --name-only 2>/dev/null
git -C {project_root} log --oneline -5 2>/dev/null
```

Include whichever of the following are relevant to this project (skip sections that don't apply):

- **개요** — 프로젝트 목적, 레포 URL
- **서비스 구조** — 서비스/모듈 목록, 포트, 기술 스택
- **브랜치 구조** — 브랜치별 역할
- **컴포넌트 상세** — 주요 클래스, API 엔드포인트, 설정값
- **데이터 구조** — DB 스키마, Redis 키, 주요 모델
- **주요 플로우** — 핵심 기능의 호출 흐름

**Update rules:**
- If the section already exists: compare with current codebase state. Update changed parts in-place. Mark updated lines with `*(updated YYYY-MM-DD)*` only when the change is non-obvious.
- If the section does not exist: create it from scratch based on what was discussed or implemented this session.
- Do not preserve stale information. This section should always reflect today's reality.

---

### Commits & Changes

- Add a new dated subsection for this session's commits and file changes.
- Do not modify or delete existing subsections.

---

### Implementation Summary

- Re-read the existing Mermaid diagram.
- If the architecture, data flow, or component relationships changed this session, update the diagram to reflect the current state.
- If nothing structural changed, leave the diagram as-is.

---

### Session Log

- Add a new subsection for this session (brief bullets — what was done and decided).
- Do not modify existing session log entries.
- If any fact in a previous entry is now outdated, add a note directly below it:
  ```
  > ~~이전 내용~~ → 변경됨: [새 내용] (YYYY-MM-DD)
  ```

---

### TODO

- Remove items completed this session.
- Add new TODO items discovered this session.

---

Use today's date for all timestamps. Write all content in Korean.
