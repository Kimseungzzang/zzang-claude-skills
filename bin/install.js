#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILLS_DIR = path.join(os.homedir(), '.claude', 'commands');
const SOURCE_DIR = path.join(__dirname, '..', 'skills');
const SESSIONS_REMOTE_FILE = path.join(os.homedir(), '.claude', 'sessions-remote');

// Parse --sessions-repo flag
const args = process.argv.slice(2);
const repoFlagIndex = args.findIndex(a => a === '--sessions-repo');
const sessionsRepo = repoFlagIndex !== -1 ? args[repoFlagIndex + 1] : null;

// ~/.claude/commands 없으면 생성
fs.mkdirSync(SKILLS_DIR, { recursive: true });

// Save sessions repo URL if provided
if (sessionsRepo) {
  fs.writeFileSync(SESSIONS_REMOTE_FILE, sessionsRepo.trim());
  console.log(`\n📌 Sessions repo saved: ${sessionsRepo}`);
} else if (!fs.existsSync(SESSIONS_REMOTE_FILE)) {
  console.log(`\n💡 Tip: specify your sessions repo to enable /session-save and /session-load across machines:`);
  console.log(`   npx zzang-claude-skills --sessions-repo https://github.com/{you}/claude-sessions.git\n`);
}

const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.md'));

if (files.length === 0) {
  console.log('설치할 스킬이 없습니다.');
  process.exit(0);
}

console.log(`\n🚀 zzang-claude-skills 설치 시작\n`);

let installed = 0;

files.forEach(file => {
  const src = path.join(SOURCE_DIR, file);
  const dest = path.join(SKILLS_DIR, file);
  const skillName = file.replace('.md', '');

  if (fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
    console.log(`🔄 업데이트: /${skillName}`);
  } else {
    fs.copyFileSync(src, dest);
    console.log(`✅ 설치됨:  /${skillName}`);
  }
  installed++;
});

console.log(`\n총 ${installed}개 스킬 설치 완료 → ${SKILLS_DIR}\n`);
console.log('Claude Code를 재시작하면 스킬이 활성화됩니다.');
