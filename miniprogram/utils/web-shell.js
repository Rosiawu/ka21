const BASE_URL = 'https://ka21.org';
const DEFAULT_LOCALE = 'zh';

function encode(value) {
  return encodeURIComponent(value || '');
}

function decode(value) {
  try {
    return decodeURIComponent(value || '');
  } catch (error) {
    return value || '';
  }
}

function normalizeLocale(value) {
  return value === 'en' ? 'en' : DEFAULT_LOCALE;
}

function withLocale(path, locale) {
  var safeLocale = normalizeLocale(locale);
  if (!path || path === '/') {
    return BASE_URL + '/' + safeLocale;
  }
  if (path.indexOf('/') !== 0) {
    path = '/' + path;
  }
  return BASE_URL + '/' + safeLocale + path;
}

function getHomeUrl(locale) {
  return withLocale('/', locale);
}

function getToolsUrl(locale) {
  return withLocale('#all-tools-categories', locale);
}

function getTutorialsUrl(locale) {
  return withLocale('/tutorials', locale);
}

function getAboutUrl(locale) {
  return withLocale('/about', locale);
}

function getDevlogUrl(locale) {
  return withLocale('/devlog', locale);
}

function getToolDetailUrl(id, locale) {
  return withLocale('/tools/' + encode(id), locale);
}

module.exports = {
  BASE_URL,
  encode,
  decode,
  getHomeUrl,
  getToolsUrl,
  getTutorialsUrl,
  getAboutUrl,
  getDevlogUrl,
  getToolDetailUrl,
};
