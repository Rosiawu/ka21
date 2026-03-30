const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function fail(message) {
  console.error(message);
  process.exit(1);
}

function getArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] || null;
}

function runAppleScript(lines) {
  const result = spawnSync('osascript', lines.flatMap((line) => ['-e', line]), {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const details = result.stderr.trim() || result.stdout.trim() || 'AppleScript execution failed';
    fail(details);
  }

  return result.stdout.trim();
}

function chromeEval(jsCode) {
  const encoded = Buffer.from(jsCode, 'utf8').toString('base64');
  const wrapped = `eval(atob("${encoded}"))`;

  return runAppleScript([
    'with timeout of 600 seconds',
    'tell application "Google Chrome"',
    `return execute active tab of front window javascript "${wrapped.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`,
    'end tell',
    'end timeout',
  ]);
}

const apiPath = getArg('--api');
const outFile = getArg('--out');

if (!apiPath) {
  fail('Usage: node scripts/fetch-feishu-records-from-chrome.js --api <api-path> [--out <file>]');
}

const pageJs = `
  (() => {
    try {
      const request = new XMLHttpRequest();
      request.open('GET', ${JSON.stringify(apiPath)}, false);
      request.setRequestHeader('accept', 'application/json, text/plain, */*');
      request.send(null);

      if (request.status < 200 || request.status >= 300) {
        return JSON.stringify({
          __error: 'HTTP ' + request.status,
          __body: request.responseText.slice(0, 500)
        }, null, 2);
      }

      return request.responseText;
    } catch (error) {
      return JSON.stringify({
        __error: String(error && error.message ? error.message : error)
      }, null, 2);
    }
  })();
`;

const output = chromeEval(pageJs);

if (!output) {
  fail('Chrome returned empty output');
}

let parsed;
try {
  parsed = JSON.parse(output);
} catch (error) {
  fail(`Failed to parse Chrome output as JSON: ${error.message}\n${output.slice(0, 500)}`);
}

if (parsed && parsed.__error) {
  fail(`Feishu fetch failed: ${parsed.__error}`);
}

if (outFile) {
  const resolvedOutFile = path.resolve(outFile);
  fs.writeFileSync(resolvedOutFile, JSON.stringify(parsed, null, 2));
  console.log(`Saved ${resolvedOutFile}`);
  process.exit(0);
}

console.log(JSON.stringify(parsed, null, 2));
