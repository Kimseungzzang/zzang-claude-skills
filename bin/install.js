#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const SKILLS_DIR = path.join(os.homedir(), '.claude', 'commands');
const SOURCE_DIR = path.join(__dirname, '..', 'skills');
const SESSIONS_REMOTE_FILE = path.join(os.homedir(), '.claude', 'sessions-remote');

fs.mkdirSync(SKILLS_DIR, { recursive: true });

function ask(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function setupSessionsRepo(rl) {
  const existing = fs.existsSync(SESSIONS_REMOTE_FILE)
    ? fs.readFileSync(SESSIONS_REMOTE_FILE, 'utf8').trim()
    : null;

  if (existing) {
    console.log(`\n📌 Sessions repo already configured: ${existing}`);
    const change = await ask(rl, '   Change it? (y/N) ');
    if (change.toLowerCase() !== 'y') return;
  } else {
    console.log('\n📦 /session-save and /session-load need a private git repo to store context.');
    const setup = await ask(rl, '   Set it up now? (Y/n) ');
    if (setup.toLowerCase() === 'n') {
      console.log('   Skipped. Run `npx zzang-claude-skills` again anytime to set it up.');
      return;
    }
  }

  console.log('\n   Do you have an existing sessions repo?');
  console.log('   1) Yes — I have a repo URL');
  console.log('   2) No  — create one now with gh CLI');
  const choice = await ask(rl, '   Choice (1/2): ');

  if (choice.trim() === '2') {
    const repoName = await ask(rl, '   Repo name (default: claude-sessions): ');
    const name = repoName.trim() || 'claude-sessions';
    console.log(`\n   Run this, then come back:\n`);
    console.log(`     gh repo create ${name} --private\n`);
    await ask(rl, '   Press enter when done...');
    const username = await ask(rl, '   Your GitHub username: ');
    const url = `https://github.com/${username.trim()}/${name}.git`;
    fs.writeFileSync(SESSIONS_REMOTE_FILE, url);
    console.log(`\n   ✅ Saved: ${url}`);
  } else {
    const url = await ask(rl, '   Paste your repo URL: ');
    if (url.trim()) {
      fs.writeFileSync(SESSIONS_REMOTE_FILE, url.trim());
      console.log(`\n   ✅ Saved: ${url.trim()}`);
    } else {
      console.log('   No URL entered, skipped.');
    }
  }
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  // Install skills
  const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.md'));

  if (files.length === 0) {
    console.log('No skills to install.');
    rl.close();
    return;
  }

  console.log('\n🚀 zzang-claude-skills installing...\n');

  files.forEach(file => {
    const src = path.join(SOURCE_DIR, file);
    const dest = path.join(SKILLS_DIR, file);
    const skillName = file.replace('.md', '');
    const isUpdate = fs.existsSync(dest);
    fs.copyFileSync(src, dest);
    console.log(`${isUpdate ? '🔄 updated' : '✅ installed'}: /${skillName}`);
  });

  console.log(`\n${files.length} skills installed → ${SKILLS_DIR}`);

  // Session repo setup
  await setupSessionsRepo(rl);

  rl.close();
  console.log('\nRestart Claude Code to activate skills.\n');
}

main();
