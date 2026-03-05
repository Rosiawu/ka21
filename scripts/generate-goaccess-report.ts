import { execFile } from 'node:child_process';
import { once } from 'node:events';
import { createReadStream, createWriteStream } from 'node:fs';
import { access, copyFile, mkdir, mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DAYS = 30;

const MONTH_MAP: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11
};

interface CliOptions {
  days: number;
  outputDir: string;
  openAfter: boolean;
}

function parseEnvFile(content: string): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }
  return parsed;
}

async function loadEnvFile(path: string): Promise<Record<string, string>> {
  try {
    const content = await readFile(path, 'utf8');
    return parseEnvFile(content);
  } catch {
    return {};
  }
}

function parseArgs(argv: string[]): CliOptions {
  let days = DEFAULT_DAYS;
  let outputDir = 'analytics-reports';
  let openAfter = false;

  for (const arg of argv) {
    if (arg === '--open') {
      openAfter = true;
      continue;
    }
    if (arg.startsWith('--days=')) {
      const parsed = Number(arg.slice('--days='.length));
      if (Number.isFinite(parsed) && parsed > 0) {
        days = Math.round(parsed);
      }
      continue;
    }
    if (arg.startsWith('--output=')) {
      const value = arg.slice('--output='.length).trim();
      if (value) outputDir = value;
    }
  }

  return { days, outputDir, openAfter };
}

function parseApacheTimestamp(line: string): number | null {
  const match = line.match(/\[(\d{2})\/([A-Za-z]{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) ([+-]\d{4})\]/);
  if (!match) return null;

  const [, dayStr, monthStr, yearStr, hourStr, minuteStr, secondStr, offsetStr] = match;
  const month = MONTH_MAP[monthStr];
  if (month === undefined) return null;

  const day = Number(dayStr);
  const year = Number(yearStr);
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  const second = Number(secondStr);
  if ([day, year, hour, minute, second].some((num) => Number.isNaN(num))) return null;

  const sign = offsetStr.startsWith('-') ? -1 : 1;
  const offsetHours = Number(offsetStr.slice(1, 3));
  const offsetMinutes = Number(offsetStr.slice(3, 5));
  const offsetTotalMinutes = sign * (offsetHours * 60 + offsetMinutes);

  const localUtcMillis = Date.UTC(year, month, day, hour, minute, second);
  return localUtcMillis - offsetTotalMinutes * 60 * 1000;
}

async function findExistingLogs(paths: string[]): Promise<string[]> {
  const existing: string[] = [];
  for (const path of paths) {
    const abs = resolve(path);
    try {
      await access(abs);
      existing.push(abs);
    } catch {
      // ignore missing paths
    }
  }
  return existing;
}

function buildRange(days: number): { startAt: number; endAt: number } {
  const now = new Date();
  const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const endAt = todayStart + DAY_MS - 1;
  const startAt = todayStart - (days - 1) * DAY_MS;
  return { startAt, endAt };
}

async function filterLogs(
  inputPaths: string[],
  outputPath: string,
  startAt: number,
  endAt: number
): Promise<number> {
  let keptLines = 0;
  const writer = createWriteStream(outputPath, { encoding: 'utf8', flags: 'w' });

  try {
    for (const inputPath of inputPaths) {
      const stream = createReadStream(inputPath, { encoding: 'utf8' });
      const reader = createInterface({ input: stream, crlfDelay: Infinity });

      for await (const line of reader) {
        const timestamp = parseApacheTimestamp(line);
        if (timestamp === null) continue;
        if (timestamp < startAt || timestamp > endAt) continue;
        if (!writer.write(`${line}\n`)) {
          await once(writer, 'drain');
        }
        keptLines += 1;
      }
    }

    writer.end();
    await once(writer, 'finish');
  } finally {
    writer.destroy();
  }

  return keptLines;
}

function nowStamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}-${hh}${mm}${ss}`;
}

async function ensureExecutable(pathOrCmd: string): Promise<boolean> {
  if (pathOrCmd.includes('/')) {
    try {
      await access(pathOrCmd);
      return true;
    } catch {
      return false;
    }
  }

  try {
    await execFileAsync('which', [pathOrCmd]);
    return true;
  } catch {
    return false;
  }
}

async function runGoAccess(
  goAccessBin: string,
  filteredLogPath: string,
  htmlPath: string,
  jsonPath: string,
  format: string,
  dateFormat: string,
  timeFormat: string
): Promise<void> {
  const baseArgs = [
    filteredLogPath,
    '--no-global-config',
    `--log-format=${format}`,
    `--date-format=${dateFormat}`,
    `--time-format=${timeFormat}`
  ];

  await execFileAsync(goAccessBin, [...baseArgs, '--json-pretty-print', '-o', jsonPath], {
    maxBuffer: 1024 * 1024 * 20
  });
  await execFileAsync(goAccessBin, [...baseArgs, '-o', htmlPath], {
    maxBuffer: 1024 * 1024 * 20
  });
}

function printUsage() {
  console.log('Usage: npm run analytics:report -- [--days=30] [--output=analytics-reports] [--open]');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();

  const envLocal = await loadEnvFile(join(cwd, '.env.local'));
  const env = await loadEnvFile(join(cwd, '.env'));
  const merged = { ...env, ...envLocal, ...process.env } as Record<string, string | undefined>;

  const rawLogPath = (merged.GOACCESS_LOG_PATH || '').trim();
  const goAccessBin = (merged.GOACCESS_BIN || 'goaccess').trim();
  const logFormat = (merged.GOACCESS_LOG_FORMAT || 'COMBINED').trim();
  const dateFormat = (merged.GOACCESS_DATE_FORMAT || '%d/%b/%Y').trim();
  const timeFormat = (merged.GOACCESS_TIME_FORMAT || '%T').trim();

  if (!rawLogPath) {
    console.error('Missing GOACCESS_LOG_PATH. Please set it in .env.local.');
    printUsage();
    process.exit(1);
  }

  const exists = await ensureExecutable(goAccessBin);
  if (!exists) {
    console.error(`GoAccess binary not found: ${goAccessBin}`);
    process.exit(1);
  }

  const logPaths = rawLogPath.split(',').map((item) => item.trim()).filter(Boolean);
  const existingLogs = await findExistingLogs(logPaths);
  if (existingLogs.length === 0) {
    console.error(`No log files found from GOACCESS_LOG_PATH: ${rawLogPath}`);
    process.exit(1);
  }

  const outputDir = resolve(cwd, options.outputDir);
  await mkdir(outputDir, { recursive: true });

  const stamp = nowStamp();
  const htmlPath = join(outputDir, `report-${stamp}.html`);
  const jsonPath = join(outputDir, `report-${stamp}.json`);
  const latestHtml = join(outputDir, 'latest.html');
  const latestJson = join(outputDir, 'latest.json');

  const tempDir = await mkdtemp(join(tmpdir(), 'goaccess-report-'));
  const filteredLogPath = join(tempDir, 'filtered.log');

  try {
    const { startAt, endAt } = buildRange(options.days);
    const keptLines = await filterLogs(existingLogs, filteredLogPath, startAt, endAt);
    if (keptLines === 0) {
      console.error(`No log lines found in last ${options.days} day(s).`);
      process.exit(1);
    }

    await runGoAccess(
      goAccessBin,
      filteredLogPath,
      htmlPath,
      jsonPath,
      logFormat,
      dateFormat,
      timeFormat
    );

    await copyFile(htmlPath, latestHtml);
    await copyFile(jsonPath, latestJson);

    const htmlStat = await stat(htmlPath);
    console.log(`Report generated: ${htmlPath}`);
    console.log(`JSON generated: ${jsonPath}`);
    console.log(`Latest report: ${latestHtml}`);
    console.log(`Processed lines: ${keptLines}`);
    console.log(`HTML size: ${htmlStat.size} bytes`);

    if (options.openAfter && process.platform === 'darwin') {
      await execFileAsync('open', [latestHtml]);
      console.log(`Opened in browser: ${latestHtml}`);
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to generate report: ${message}`);
  process.exit(1);
});
