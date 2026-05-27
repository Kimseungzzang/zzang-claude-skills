Summarize a GitHub repository. Usage: /github-summary <GitHub URL>

## Step 1 — Parse the URL

Extract `{owner}` and `{repo}` from the GitHub URL provided in the args.

Examples:
- `https://github.com/facebook/react` → owner=`facebook`, repo=`react`
- `https://github.com/vercel/next.js` → owner=`vercel`, repo=`next.js`

## Step 2 — Fetch Repository Data

Use WebFetch to retrieve the following in parallel:

1. **README**: `https://raw.githubusercontent.com/{owner}/{repo}/main/README.md`
   - If it fails (404), try: `https://raw.githubusercontent.com/{owner}/{repo}/master/README.md`

2. **Repo metadata** (stars, description, language, topics):
   `https://api.github.com/repos/{owner}/{repo}`

3. **File tree** (top-level structure):
   `https://api.github.com/repos/{owner}/{repo}/contents/`

## Step 3 — Summarize

Present the summary in the following format (write in Korean):

---

# 📦 {owner}/{repo}

## 🔍 한 줄 요약
> [프로젝트를 한 문장으로 설명]

## 📊 기본 정보
| 항목 | 내용 |
|------|------|
| ⭐ Stars | [star count] |
| 🌐 주요 언어 | [language] |
| 📅 최근 업데이트 | [updated_at] |
| 📄 라이선스 | [license] |

## 🎯 프로젝트 목적
[README와 description을 바탕으로 이 프로젝트가 무엇을 해결하는지 2~3문장으로 설명]

## 🏗️ 주요 구조
[최상위 폴더/파일 구조를 보고 아키텍처나 구성 방식 설명]

```
[주요 파일/폴더 트리 표시]
```

## ✨ 핵심 기능
[README에서 주요 기능 3~5가지를 bullet point로 추출]

## 🛠️ 기술 스택
[사용된 언어, 프레임워크, 라이브러리 목록]

## 🚀 시작하는 법
[README의 설치/실행 방법을 간략히 요약]

## 💡 이런 분께 추천
[어떤 개발자나 팀에게 유용한 프로젝트인지 설명]

---

만약 GitHub URL이 주어지지 않았다면, 사용법을 안내하세요:
> 💡 사용법: `/github-summary https://github.com/owner/repo`
