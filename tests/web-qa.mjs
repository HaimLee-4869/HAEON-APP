import { chromium } from 'playwright-core';

const baseURL = process.env.WEB_QA_BASE_URL ?? 'http://localhost:8081';
const executablePath = process.env.WEB_QA_BROWSER ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 430, height: 900 } });
const runtimeErrors = [];
page.on('pageerror', (error) => runtimeErrors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()); });

try {
  await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.getByLabel('실제 Kakao Map').waitFor({ state: 'visible', timeout: 30_000 });
  for (const layer of ['풍향·풍속', '수온', '유향·유속', '기온', '파고·파주기', '조석']) {
    await page.getByText(layer, { exact: true }).first().click();
    await page.waitForTimeout(250);
  }
  await page.goto(`${baseURL}/tide`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.getByText('제주', { exact: true }).click();
  await page.waitForURL('**/tide/jeju');
  await page.getByText('제주 물때', { exact: true }).waitFor();
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await page.getByText('서귀포', { exact: true }).click();
  await page.waitForURL('**/tide/seogwipo');
  await page.getByText('서귀포 물때', { exact: true }).waitFor();
  if (runtimeErrors.length) throw new Error(`browser runtime errors:\n${runtimeErrors.join('\n')}`);
  console.log('Web QA passed: real map, six environment layers, tide navigation/back/navigation.');
} finally {
  await browser.close();
}
