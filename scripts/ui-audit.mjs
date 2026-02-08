#!/usr/bin/env node
import { execSync } from 'node:child_process';

const patterns = [
  { re: /\bsc-titlebar--brown\b/, msg: 'Use sc-titlebar--neutral (or red/yellow/blue) instead.' },
  { re: /\brounded-2xl\b/, msg: 'Use rounded-panel for outer containers.' },
  { re: /\brounded-xl\b/, msg: 'Use rounded-panel for outer containers.' },
  { re: /\bshadow-xl\b/, msg: 'Use shadow-card for primary cards.' },
  { re: /\banimate-in\b/, msg: 'This project does not define animate-in; remove or implement it.' },
  { re: /\bfade-in\b/, msg: 'This project does not define fade-in; remove or implement it.' },
  { re: /\bzoom-in-95\b/, msg: 'This project does not define zoom-in-95; remove or implement it.' },
  { re: /\bslide-in-from-left-6\b/, msg: 'This project does not define slide-in-from-left-6; remove or implement it.' },
];

function listFiles() {
  // Keep this lightweight and stable: audit only places where classnames are authored.
  // (We allow back-compat definitions in CSS, e.g. .sc-titlebar--brown in theme.css.)
  const cmd = "rg --files App.tsx components index.html 2>/dev/null || true";
  const out = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  return out ? out.split('\n') : [];
}

function readFile(path) {
  try {
    return execSync(`cat ${JSON.stringify(path)}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

const files = listFiles();
const findings = [];

for (const file of files) {
  const content = readFile(file);
  if (content == null) continue;

  for (const { re, msg } of patterns) {
    if (re.test(content)) {
      findings.push({ file, msg, token: re.source });
    }
  }
}

if (findings.length) {
  process.stderr.write('UI audit failed. Found forbidden patterns:\n');
  for (const f of findings) {
    process.stderr.write(`- ${f.file}: ${f.msg}\n`);
  }
  process.exit(1);
}

process.stdout.write('UI audit passed.\n');
