const fs = require('fs');
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

const jsFile = getArg('--file');
const inlineJs = getArg('--js');

if (!jsFile && !inlineJs) {
  fail('Usage: node scripts/chrome-active-tab-eval.js --file <js-file> | --js <javascript>');
}

const jsCode = jsFile ? fs.readFileSync(jsFile, 'utf8') : inlineJs;
const encoded = Buffer.from(jsCode, 'utf8').toString('base64');
const wrapped = `eval(atob("${encoded}"))`;

const output = runAppleScript([
  'with timeout of 600 seconds',
  'tell application "Google Chrome"',
  `return execute active tab of front window javascript "${wrapped.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`,
  'end tell',
  'end timeout',
]);

if (output) {
  console.log(output);
}
