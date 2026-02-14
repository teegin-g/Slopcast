#!/usr/bin/env node
import { execFile } from 'node:child_process';
import process from 'node:process';

const VALID_MODES = new Set(['cinematic', 'max', 'clear']);

function parseArgs(argv) {
  let mode = 'cinematic';
  let base = process.env.SLOPCAST_BASE_URL || process.env.UI_BASE_URL || 'http://localhost:3000';
  let shouldOpen = false;

  for (const arg of argv) {
    if (arg === '--open') {
      shouldOpen = true;
      continue;
    }

    if (arg.startsWith('--base=')) {
      const raw = arg.slice('--base='.length).trim();
      if (raw) base = raw;
      continue;
    }

    if (VALID_MODES.has(arg)) {
      mode = arg;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { mode, base, shouldOpen };
}

function buildUrl(base, mode) {
  const cleanBase = base.replace(/\/+$/, '');
  if (mode === 'clear') return `${cleanBase}/slopcast?fx=clear`;
  return `${cleanBase}/slopcast?fx=${mode}`;
}

function openUrl(url) {
  return new Promise((resolve, reject) => {
    let command;
    let args;

    if (process.platform === 'darwin') {
      command = 'open';
      args = [url];
    } else if (process.platform === 'win32') {
      command = 'cmd';
      args = ['/c', 'start', '', url];
    } else {
      command = 'xdg-open';
      args = [url];
    }

    execFile(command, args, (err) => {
      if (err) return reject(err);
      return resolve();
    });
  });
}

async function main() {
  const { mode, base, shouldOpen } = parseArgs(process.argv.slice(2));
  const url = buildUrl(base, mode);

  process.stdout.write(`FX mode: ${mode}\n`);
  process.stdout.write(`URL: ${url}\n`);
  process.stdout.write('Open this URL while the target theme is active to persist that mode.\n');

  if (!shouldOpen) return;

  try {
    await openUrl(url);
    process.stdout.write('Opened URL in default browser.\n');
  } catch (err) {
    process.stderr.write(`Failed to open browser automatically: ${String(err)}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  process.stderr.write((err && err.stack) ? `${err.stack}\n` : `${String(err)}\n`);
  process.exit(1);
});
