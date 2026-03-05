#!/usr/bin/env node

const { accessSync, readFileSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { execFileSync } = require('node:child_process');

function parseEnv(content) {
  const out = {};
  const lines = content.split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function loadEnvFile(path) {
  try {
    const content = readFileSync(path, 'utf8');
    return parseEnv(content);
  } catch {
    return {};
  }
}

function openUrl(target) {
  try {
    if (process.platform === 'darwin') {
      execFileSync('open', [target], { stdio: 'ignore' });
      return true;
    }
    if (process.platform === 'win32') {
      execFileSync('cmd', ['/c', 'start', '', target], { stdio: 'ignore' });
      return true;
    }
    execFileSync('xdg-open', [target], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function hasFile(path) {
  try {
    accessSync(path);
    return true;
  } catch {
    return false;
  }
}

function isPlaceholder(value) {
  if (!value) return true;
  const normalized = value.toLowerCase();
  return normalized.includes('your-clarity-project-id');
}

function main() {
  const cwd = process.cwd();
  const env = {
    ...loadEnvFile(join(cwd, '.env')),
    ...loadEnvFile(join(cwd, '.env.local')),
    ...process.env
  };

  const localReport = resolve(cwd, 'analytics-reports/latest.html');
  if (hasFile(localReport)) {
    if (openUrl(localReport)) {
      console.log(`Opened local report: ${localReport}`);
    } else {
      console.log(`Open failed. Please open this file manually: ${localReport}`);
    }
    return;
  }

  const projectId = (env.CLARITY_PROJECT_ID || env.NEXT_PUBLIC_CLARITY_ID || '').trim();
  if (!isPlaceholder(projectId)) {
    const url = `https://clarity.microsoft.com/projects/view/${projectId}/dashboard`;
    if (openUrl(url)) {
      console.log(`Opened Clarity dashboard: ${url}`);
    } else {
      console.log(`Open failed. Please open this URL manually: ${url}`);
    }
    return;
  }

  const fallback = 'https://clarity.microsoft.com/';
  if (openUrl(fallback)) {
    console.log(`Opened Clarity home: ${fallback}`);
  } else {
    console.log(`Open failed. Please open this URL manually: ${fallback}`);
  }
  console.log('Tip: set NEXT_PUBLIC_CLARITY_ID in .env.local to jump directly to your project.');
}

main();
