import { Buffer } from 'node:buffer';
import { log } from 'node:console';
import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://127.0.0.1:4173/login');
await page.getByRole('button', { name: /Administrator Alex/ }).waitFor();
await page.screenshot({ path: '/tmp/portal-login.png', fullPage: true });
await page.getByRole('button', { name: /Administrator Alex/ }).click();
await page.evaluate(async () => {
  await globalThis.navigator.serviceWorker.ready;
});
await page.goto('http://127.0.0.1:4173/properties/PROP-1001?tab=Listing');
await page.getByLabel('Choose property photos').setInputFiles({
  name: 'demo-property.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWl8AAAAASUVORK5CYII=',
    'base64',
  ),
});
await page.getByLabel('Photo caption').fill('Front elevation');
await page.reload();
await page.getByLabel('Photo caption').waitFor();
if ((await page.getByLabel('Photo caption').inputValue()) !== 'Front elevation')
  throw Error('Listing caption did not persist');
for (const width of [1440, 1024, 768, 390]) {
  await page.setViewportSize({ width, height: 960 });
  await page.goto('http://127.0.0.1:4173/properties');
  await page.getByRole('heading', { name: 'Properties', exact: true }).waitFor();
  if (
    !(await page.evaluate(
      () => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth,
    ))
  )
    throw Error('Property page overflow at ' + width);
}
await page.setViewportSize({ width: 1440, height: 960 });
await page.screenshot({ path: '/tmp/portal-properties.png', fullPage: true });
await context.setOffline(true);
await page.goto('http://127.0.0.1:4173/field/today');
await page
  .getByRole('heading', { name: 'My day', exact: true })
  .waitFor({ timeout: 10000 })
  .catch(async (e) => {
    await page.screenshot({ path: '/tmp/portal-offline.png' });
    log(await page.locator('body').innerText());
    log(errors);
    throw e;
  });
log(
  'Production QA passed: listing photo metadata, four responsive widths, offline navigation; runtime errors: ' +
    errors.length,
);
if (errors.length) throw Error(errors.join('\n'));
await browser.close();
