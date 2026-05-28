# zzang-claude-skills

[English](README.md) · [한국어](README.ko.md)

kimseungzzang이 만든 Claude Code 커스텀 스킬 모음 — 세션/머신을 넘나드는 컨텍스트 영속성 시스템 포함.

## 설치

```bash
npx zzang-claude-skills
```

인스톨러가 자동으로:
- 모든 스킬을 `~/.claude/commands/`에 설치
- `task-log.sh`를 `~/.claude/scripts/`에 설치
- `PostToolUse` 훅(작업 로그)을 `~/.claude/settings.json`에 등록
- `Stop` 훅(claude-dragon 알림)을 `~/.claude/settings.json`에 등록
- 세션 저장용 private GitHub 레포 설정을 안내

**설치 후 Claude Code를 재시작해야 훅이 활성화됩니다.**

## 스킬 목록

| 스킬 | 설명 |
|------|------|
| `/session-save` | 현재 세션 컨텍스트를 압축해서 세션 레포에 push |
| `/session-load` | **현재 프로젝트**(git root 기준)의 최신 컨텍스트를 pull해서 이전 작업을 이어서 진행 |
| `/obsidian` | 오늘 대화를 요약해서 Obsidian vault에 저장 |
| `/github-summary` | GitHub 레포 URL을 가져와서 요약 |
| `/codex-review-loop` | Codex CLI 코드 리뷰 → 수정 → 클린할 때까지 반복 (최대 3회) |

---

## Claude Dragon

Claude가 응답을 완료할 때마다 나타나는 데스크탑 마스코트.

별도 Electron 앱([claude-dragon](https://github.com/Kimseungzzang/claude-dragon))으로 구성 — 투명한 항상-최상단 오버레이 창. Claude가 멈추면 `Stop` 훅이 현재 작업 디렉토리를 HTTP로 전송하고, 귀여운 용이 화면 구석에서 날아들어 불을 뿜고 프로젝트 이름이 담긴 말풍선을 보여준 후 사라집니다.

**설정:**
1. 컴패니언 앱 클론 및 실행:
   ```bash
   git clone https://github.com/Kimseungzzang/claude-dragon.git
   cd claude-dragon && npm install && npm start
   ```
2. `Stop` 훅은 인스톨러가 자동 등록 — 별도 설정 불필요.

용은 백그라운드에서 실행됩니다. 실행 중인 동안 해당 머신의 모든 Claude 세션에 반응합니다.

---

## 세션 영속성 시스템

`/session-save`와 `/session-load`는 Claude Code의 완전한 크로스 세션/크로스 머신 메모리 시스템을 구성합니다.

### 전체 흐름

```
매 툴 사용  →  PostToolUse 훅  →  task-log.md (로컬 전용)
                                          │
                                 /session-save
                                          │
                      ┌───────────────────┼───────────────────┐
                      ▼                   ▼                   ▼
                task-log 읽기     스냅샷 작성            CURRENT.ctx 업데이트
                (흡수 후 삭제)    (타임스탬프)           (누적 상태)
                      │
                      └──── git commit & push ──→  GitHub (private 레포)
                                                           │
                                                   /session-load
                                                           │
                                          git pull → CURRENT.ctx 읽기
                                                   + task-log 확인
                                                           │
                                                   이어서 작업 안내
```

---

### `/session-save` 플로우

```
┌─────────────────────────────────────────────────────────────────┐
│                        /session-save                            │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
[1] ~/.claude/zzang-ctx가 git 레포인가?
         │
    NO ──┤
         │   ~/.claude/zzang-ctx-remote가 설정되어 있나?
         │         │
         │    YES  ▼
         │   git clone {url} ~/.claude/zzang-ctx
         │         │
         │    NO   ▼
         │   사용자에게 묻기: 기존 레포 사용 or 새로 생성?
         │         │
         └─────────┘
         │
    YES  ▼
[2] git pull --rebase (리모트에서 최신 pull)
         │
         ▼
[3] 이번 세션에서 작업한 프로젝트 감지
    - git rev-parse --show-toplevel | xargs basename
    - 대화에서 다른 프로젝트 경로 스캔
    - 목록 보여주고 사용자 확인
         │
         ▼
[4] 각 프로젝트별:
    │
    ├─► ~/.claude/zzang-ctx/{project}/task-log.md 읽기  (로컬 전용)
    │       └── DONE/CHANGED 정확히 채우기
    │       └── 마지막 라인 타임스탬프를 TASK-LOG-ID로 기록
    │
    ├─► ~/.claude/zzang-ctx/{project}/CURRENT.ctx 읽기  (누적 히스토리)
    │
    ▼
[5] 타임스탬프 스냅샷 작성
    ~/.claude/zzang-ctx/{project}/YYYY-MM-DDTHH-MM
    ┌──────────────────────────────────────────────┐
    │ SESSION  타임스탬프 | /프로젝트/경로 | 브랜치 │
    │ STACK:   언어/프레임워크/DB                   │
    │ DONE:    이번 세션에서 완료한 항목            │
    │ CHANGED: 수정된 파일(이유)                    │
    │ TRIED:   시도했지만 실패한 것과 이유          │
    │ DECIDED: 결정 사항과 근거                     │
    │ TODO:    남은 작업                            │
    │ OPEN:    미해결 질문                          │
    │ CTX:     프로젝트 관련 비자명한 사실          │
    └──────────────────────────────────────────────┘
         │
         ▼
[6] CURRENT.ctx에 병합
    ┌─────────────┬────────────────────────────────────────┐
    │ 필드        │ 규칙                                   │
    ├─────────────┼────────────────────────────────────────┤
    │ SESSION     │ 항상 최신 타임스탬프로 업데이트        │
    │ TASK-LOG-ID │ task-log 마지막 라인 시간으로 교체     │
    │ STACK       │ 합집합 (중복 제거)                     │
    │ DONE        │ 이번 세션 것으로 교체                  │
    │ CHANGED     │ 이번 세션 것으로 교체                  │
    │ TRIED       │ 누적 — 절대 압축하지 않음              │
    │ DECIDED     │ 누적 — 절대 압축하지 않음              │
    │ TODO        │ 완료된 항목 제거; 새 항목 추가         │
    │ OPEN        │ 누적                                   │
    │ CTX         │ 누적 (합집합, 중복 제거)               │
    └─────────────┴────────────────────────────────────────┘
         │
         ▼
[7] task-log 삭제  (CURRENT.ctx에 흡수 완료)
    rm ~/.claude/zzang-ctx/{project}/task-log.md
         │
         ▼
[8] git add . && git commit && git push
         │
         ▼
[9] 완료 보고: ✅ N개 프로젝트 저장, 리모트 push 완료
```

---

### `/session-load` 플로우

```
┌─────────────────────────────────────────────────────────────────┐
│                        /session-load                            │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
[1] ~/.claude/zzang-ctx가 git 레포인가?  (save와 동일한 설정 확인)
         │
         ▼
[2] git pull --rebase
         │
         ▼
[3] 프로젝트 이름 감지
    git rev-parse --show-toplevel | xargs basename
    └── git 레포가 아니면 → basename $PWD 사용 + 경고
         │
         ▼
[4] CURRENT.ctx 읽기
    cat ~/.claude/zzang-ctx/{project}/CURRENT.ctx
         │
         └── 파일 없으면 → "이 프로젝트의 저장된 컨텍스트 없음. /session-save를 먼저 실행하세요."
         │
         ▼
[5] task-log vs CURRENT.ctx의 TASK-LOG-ID 비교

    SAVED_ID = CURRENT.ctx의 TASK-LOG-ID
    LAST_LOG = 로컬 task-log.md 마지막 라인 타임스탬프

         │
    ┌────┴──────────────────────────────────────────────────────┐
    │                                                           │
    ▼                                                           ▼
Case 1: LAST_LOG == SAVED_ID            Case 4: task-log 없음
→ 정상 상태, 중단된 작업 없음          → 다른 머신
→ 정상적으로 진행                       → 사용자에게 알리고 CURRENT.ctx만 사용
    │                                                           │
    ▼                                                           │
Case 2: LAST_LOG > SAVED_ID            Case 3: task-log 헤더 > SESSION
→ 마지막 /session-save 이후 미저장     → 새 작업 진행 중 (중단 아님)
   작업 존재                            → task-log를 현재 작업 컨텍스트로 표시
→ 미저장 항목 보여주고 재개 여부 확인          │
    │                                          │
    └──────────────────┬───────────────────────┘
                       │
                       ▼
[6] 간략한 안내 출력 (150단어 이내)
    ┌──────────────────────────────────────────────────────────┐
    │ 📂 {project} 컨텍스트 로드됨 (마지막 저장: {timestamp}) │
    │                                                          │
    │ 이어서: {1문장 현재 상태 요약}                           │
    │                                                          │
    │ 주요 컨텍스트:                                           │
    │ • {CTX 사실}                                             │
    │                                                          │
    │ 남은 TODO: {항목들}                                      │
    │ 미해결 질문: {항목들}                                    │
    │                                                          │
    │ ⚠️  HH:MM에 작업 중단됨:   (Case 2일 때)                │
    │    마지막 액션: {tool} {detail}                          │
    └──────────────────────────────────────────────────────────┘
```

---

### PostToolUse 훅 — `task-log.sh`

매 툴 사용 후 자동 실행. `task-log.md`에 한 줄씩 추가:

```
~/.claude/zzang-ctx/{project}/task-log.md

## 2026-05-28T14:00 | my-project       ← 헤더 (세션 첫 항목에 생성)
[14:01] Write      src/api.py
[14:03] Bash       npm test
[14:05] Edit       src/api.py
```

- **로컬 전용** — GitHub에 직접 push되지 않음
- **`/session-save`가 흡수** — CURRENT.ctx에 병합 후 삭제
- **`/session-load`가 읽음** — TASK-LOG-ID와 비교해서 중단 지점 감지
- **목적** — Claude가 강제 종료되어도 (Stop 훅 불필요) 정확한 작업 기록 유지

---

### 저장소 레이아웃

```
~/.claude/
├── commands/
│   ├── session-save.md       ← 스킬 정의
│   └── session-load.md
├── scripts/
│   └── task-log.sh           ← PostToolUse 훅 스크립트
├── settings.json             ← 훅 등록
├── zzang-ctx-remote          ← GitHub 레포 URL 저장
└── zzang-ctx/                ← git 레포 (GitHub에서 clone)
    ├── .gitignore
    ├── my-project/
    │   ├── CURRENT.ctx       ← 누적 상태 (push됨)
    │   ├── task-log.md       ← 실시간 로그 (로컬 전용, push 안 됨)
    │   └── 2026-05-28T14-00  ← 타임스탬프 스냅샷 (push됨)
    └── other-project/
        └── CURRENT.ctx
```

---

### 멀티머신 설정

```
머신 A                             머신 B
──────                             ──────
/session-save                      npx zzang-claude-skills
  → GitHub 레포에 push               → zzang-ctx-remote에서 clone
                                   /session-load
                                     → GitHub에서 CURRENT.ctx pull
                                     → task-log 없음 (Case 4 — 정상)
                                     → 저장된 상태에서 재개
```

---

## ⚠️ 주의사항

**세션 레포는 반드시 private으로.**
CURRENT.ctx에는 파일 경로, 설계 결정, API 키 이름, 내부 아키텍처 세부사항이 담깁니다. 절대 public 레포를 사용하지 마세요.

**`~/.claude/zzang-ctx/`를 수동으로 삭제하지 마세요.**
`task-log.md`가 여기에 있으며 로컬 전용입니다. `/session-save` 전에 폴더를 지우면 흡수되지 않은 항목이 영구적으로 사라집니다.

**CURRENT.ctx를 직접 편집하지 마세요.**
병합 로직이 특정 형식을 기대합니다. 수동 편집 시 필드 누적이 조용히 깨질 수 있습니다.

**`/session-save` 도중 중단되면** 다시 실행하세요. 스냅샷은 멱등성이 있어 덮어써도 문제없습니다.

**task-log가 로컬 전용인 것은 의도적 설계입니다.**
GitHub에 커밋되지 않습니다. 다른 머신에서 `/session-load` 시 Case 4로 분류되는 건 에러가 아닌 정상 동작입니다.

---

## 💡 권장사항

**세션 끝뿐만 아니라 마일스톤마다 저장하세요.**
기능 완성 후, 다음 작업 시작 전에 중간 저장하면 복구 지점이 세밀해지고 예기치 않은 크래시로 인한 컨텍스트 손실을 방지할 수 있습니다.

**새 세션을 시작하면 제일 먼저 `/session-load`를 실행하세요.**
로드 전에 작업을 시작하면 Claude가 누적된 컨텍스트 없이 동작해서 동일한 결정을 반복하거나 알려진 제약사항을 놓칠 수 있습니다.

**머신을 바꾸기 전에 반드시 `/session-save`를 먼저 실행하세요.**
다른 머신은 GitHub에서 pull하므로 push하지 않으면 오래된 컨텍스트를 보게 됩니다.

**세션 전용 레포를 따로 만드세요.**
기존 레포를 재사용하지 마세요. 세션 레포는 프로젝트별 CURRENT.ctx가 시간이 지남에 따라 쌓이는 구조라 전용 레포가 관리하기 깔끔합니다.

---

## 스킬 추가하기

`skills/`에 `.md` 파일을 추가하고 `npm publish`:

```
skills/
├── session-save.md
├── session-load.md
├── obsidian.md
├── github-summary.md
├── codex-review-loop.md
└── your-skill.md   ← 여기에 추가
```

## 개발

```bash
node bin/install.js
```
