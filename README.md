# zzang-claude-skills

kimseungzzang의 Claude Code 커스텀 스킬 모음

## 설치

```bash
npx zzang-claude-skills
```

## 포함된 스킬

| 스킬 | 설명 |
|------|------|
| `/obsidian` | 오늘 대화를 요약해서 Obsidian vault에 저장 |
| `/github-summary` | GitHub URL을 받아 저장소 내용을 한국어로 요약 |
| `/codex-review-loop` | 개발 완료 후 Codex CLI로 코드 리뷰 → 이슈 수정 → 클린할 때까지 반복 (최대 3회) |

## 스킬 추가 방법

`skills/` 폴더에 `.md` 파일 추가 후 npm 배포하면 자동으로 설치됨.

```
skills/
├── obsidian.md
├── github-summary.md
├── codex-review-loop.md
└── 새스킬.md   ← 여기에 추가
```

## 개발

```bash
# 로컬에서 직접 실행 테스트
node bin/install.js
```
