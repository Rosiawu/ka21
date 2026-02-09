// scripts/check-i18n-keys.ts
import * as fs from 'fs';
import * as path from 'path';

const messagesDir = path.resolve(__dirname, '../messages');
const locales = ['en', 'zh']; // 从 config.ts 导入会更好，但为了脚本独立性，这里硬编码

function getKeys(obj: any, prefix: string = ''): Set<string> {
  const keys = new Set<string>();
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        getKeys(obj[key], fullKey).forEach(k => keys.add(k));
      } else {
        keys.add(fullKey);
      }
    }
  }
  return keys;
}

function runCheck() {
  console.log('Checking i18n message keys consistency...');

  const allKeys: { [locale: string]: Set<string> } = {};
  let hasError = false;

  for (const locale of locales) {
    const filePath = path.join(messagesDir, `${locale}.json`);
    if (!fs.existsSync(filePath)) {
      console.error(`Error: Message file not found for locale "${locale}": ${filePath}`);
      hasError = true;
      continue;
    }
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const messages = JSON.parse(content);
      allKeys[locale] = getKeys(messages);
    } catch (error) {
      console.error(`Error parsing message file for locale "${locale}": ${filePath}`, error);
      hasError = true;
    }
  }

  if (hasError) {
    process.exit(1);
  }

  if (locales.length < 2) {
    console.warn('Warning: Only one locale found. Consistency check requires at least two locales.');
    process.exit(0);
  }

  const baseLocale = locales[0];
  const baseKeys = allKeys[baseLocale];

  for (let i = 1; i < locales.length; i++) {
    const currentLocale = locales[i];
    const currentKeys = allKeys[currentLocale];

    // Check for keys missing in currentLocale but present in baseLocale
    for (const key of baseKeys) {
      if (!currentKeys.has(key)) {
        console.error(`Error: Key "${key}" is missing in ${currentLocale}.json`);
        hasError = true;
      }
    }

    // Check for keys present in currentLocale but missing in baseLocale (optional, but good for strictness)
    for (const key of currentKeys) {
      if (!baseKeys.has(key)) {
        console.warn(`Warning: Key "${key}" is present in ${currentLocale}.json but missing in base locale ${baseLocale}.json`);
        // This is a warning, not an error, unless strictness requires it
      }
    }
  }

  if (hasError) {
    console.error('i18n message key consistency check FAILED.');
    process.exit(1);
  } else {
    console.log('i18n message key consistency check PASSED.');
    process.exit(0);
  }
}

runCheck();
