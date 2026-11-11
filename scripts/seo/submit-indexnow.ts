import sitemap from '../../src/app/sitemap';

const host = 'ka21.org';
const key = '2a2595d3b8060fe2ec1ee49b4c35807f';
const keyLocation = `https://${host}/${key}.txt`;
const urlList = sitemap().map((entry) => entry.url);

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function submit() {
  return fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation, urlList }),
  });
}

async function main() {
  if (process.argv.includes('--dry-run')) {
    console.log(JSON.stringify({ host, keyLocation, urlCount: urlList.length, urlList }, null, 2));
    return;
  }

  let response = await submit();
  for (let attempt = 1; attempt < 4 && response.status === 403; attempt += 1) {
    const detail = await response.clone().text();
    if (!detail.includes('SiteVerificationNotCompleted')) break;
    console.log(`IndexNow key verification is still propagating; retrying (${attempt}/3).`);
    await wait(15_000);
    response = await submit();
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`IndexNow rejected the submission: ${response.status} ${detail}`.trim());
  }

  console.log(`IndexNow accepted ${urlList.length} canonical URLs (${response.status}).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
