#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { execSync } = require('child_process');

const SKILLS_DIR = path.join(os.homedir(), '.claude', 'commands');
const SOURCE_DIR = path.join(__dirname, '..', 'skills');
const SESSIONS_REMOTE_FILE = path.join(os.homedir(), '.claude', 'sessions-remote');

fs.mkdirSync(SKILLS_DIR, { recursive: true });

function ask(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function repoExistsOnGitHub(url) {
  // Extract owner/repo from URL
  // Supports: https://github.com/owner/repo.git or https://github.com/owner/repo
  const match = url.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(\.git)?$/);
  if (!match) return { ok: false, error: 'Could not parse GitHub URL.' };

  const slug = `${match[1]}/${match[2]}`;
  try {
    execSync(`gh repo view ${slug} --json name`, { stdio: 'pipe' });
    return { ok: true };
  } catch {
    return { ok: false, error: `Repo not found: github.com/${slug}` };
  }
}

async function promptRepoUrl(rl, label) {
  while (true) {
    const url = await ask(rl, `   ${label}: `);
    if (!url.trim()) return null;

    process.stdout.write('   Checking repo... ');
    const result = repoExistsOnGitHub(url.trim());
    if (result.ok) {
      console.log('✅ found');
      return url.trim();
    } else {
      console.log(`❌ ${result.error}`);
      const retry = await ask(rl, '   Try a different URL? (Y/n) ');
      if (retry.toLowerCase() === 'n') return null;
    }
  }
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

    process.stdout.write('   Checking repo... ');
    const result = repoExistsOnGitHub(url);
    if (result.ok) {
      console.log('✅ found');
      fs.writeFileSync(SESSIONS_REMOTE_FILE, url);
      console.log(`\n   ✅ Saved: ${url}`);
    } else {
      console.log(`❌ ${result.error}`);
      const fallback = await promptRepoUrl(rl, 'Paste the correct repo URL (or enter to skip)');
      if (fallback) {
        fs.writeFileSync(SESSIONS_REMOTE_FILE, fallback);
        console.log(`\n   ✅ Saved: ${fallback}`);
      } else {
        console.log('   Skipped. Run `npx zzang-claude-skills` again to configure.');
      }
    }
  } else {
    const url = await promptRepoUrl(rl, 'Paste your repo URL (or enter to skip)');
    if (url) {
      fs.writeFileSync(SESSIONS_REMOTE_FILE, url);
      console.log(`\n   ✅ Saved: ${url}`);
    } else {
      console.log('   Skipped. Run `npx zzang-claude-skills` again to configure.');
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
