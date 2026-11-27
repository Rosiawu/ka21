const token = process.env.CLOUDFLARE_API_TOKEN;
const mode = process.env.MODE || 'audit';
const api = 'https://api.cloudflare.com/client/v4';

if (!token || !['audit', 'apply'].includes(mode)) {
  throw new Error('CLOUDFLARE_API_TOKEN and MODE=audit|apply are required');
}

async function request(path, method = 'GET', body) {
  const response = await fetch(`${api}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    const detail = (data.errors || []).map((error) => `${error.code}: ${error.message}`).join('; ');
    throw new Error(`${method} ${path} failed (${response.status}): ${detail}`);
  }
  return data.result;
}

async function getRedirectRuleset(zoneId) {
  const path = `/zones/${zoneId}/rulesets/phases/http_request_dynamic_redirect/entrypoint`;
  const response = await fetch(`${api}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 404) return null;
  const data = await response.json();
  if (!response.ok || !data.success) {
    const detail = (data.errors || []).map((error) => `${error.code}: ${error.message}`).join('; ');
    throw new Error(`GET ${path} failed (${response.status}): ${detail}`);
  }
  return data.result;
}

const zones = await request('/zones?name=ka21.org&per_page=50');
const matchingZones = zones.filter((zone) => zone.name === 'ka21.org');
if (matchingZones.length !== 1) throw new Error(`Expected one ka21.org zone, found ${matchingZones.length}`);
const zoneId = matchingZones[0].id;
const settingPath = `/zones/${zoneId}/settings/always_use_https`;
const setting = await request(settingPath);
const ruleset = await getRedirectRuleset(zoneId);
const expression = '(http.host eq "www.ka21.org")';
const targetExpression = 'concat("https://ka21.org", http.request.uri.path)';
const desiredRule = {
  ref: 'ka21-www-to-apex',
  description: 'www to apex',
  expression,
  action: 'redirect',
  action_parameters: {
    from_value: {
      target_url: { expression: targetExpression },
      status_code: 301,
      preserve_query_string: true,
    },
  },
  enabled: true,
};
const matchingRules = (ruleset?.rules || []).filter(
  (rule) => rule.ref === desiredRule.ref || rule.expression === expression,
);
if (matchingRules.length > 1) throw new Error('Multiple www redirect rules exist; refusing to create another');
const existingRule = matchingRules[0];
const isDesiredRule = existingRule &&
  existingRule.enabled !== false &&
  existingRule.action === 'redirect' &&
  existingRule.expression === expression &&
  existingRule.action_parameters?.from_value?.target_url?.expression === targetExpression &&
  existingRule.action_parameters?.from_value?.status_code === 301 &&
  existingRule.action_parameters?.from_value?.preserve_query_string === true;

console.log(JSON.stringify({
  mode,
  zone: matchingZones[0].name,
  zoneStatus: matchingZones[0].status,
  alwaysUseHttps: setting.value,
  redirectRulesetPresent: Boolean(ruleset),
  matchingRedirectRules: matchingRules.length,
  redirectMatchesRequest: Boolean(isDesiredRule),
}, null, 2));

if (mode === 'apply') {
  if (setting.value !== 'on') await request(settingPath, 'PATCH', { value: 'on' });
  if (!isDesiredRule) {
    if (!ruleset) {
      await request(`/zones/${zoneId}/rulesets`, 'POST', {
        name: 'Canonical host redirects',
        kind: 'zone',
        phase: 'http_request_dynamic_redirect',
        rules: [desiredRule],
      });
    } else if (existingRule) {
      await request(`/zones/${zoneId}/rulesets/${ruleset.id}/rules/${existingRule.id}`, 'PATCH', desiredRule);
    } else {
      await request(`/zones/${zoneId}/rulesets/${ruleset.id}/rules`, 'POST', desiredRule);
    }
  }
  const checkedSetting = await request(settingPath);
  const checkedRuleset = await getRedirectRuleset(zoneId);
  const checkedRule = checkedRuleset?.rules?.find((rule) => rule.ref === desiredRule.ref || rule.expression === expression);
  if (checkedSetting.value !== 'on' ||
      checkedRule?.action_parameters?.from_value?.target_url?.expression !== targetExpression ||
      checkedRule?.action_parameters?.from_value?.status_code !== 301 ||
      checkedRule?.action_parameters?.from_value?.preserve_query_string !== true) {
    throw new Error('Cloudflare settings did not verify after update');
  }
  console.log('Verified Always Use HTTPS and www to apex redirect in Cloudflare API.');
}
