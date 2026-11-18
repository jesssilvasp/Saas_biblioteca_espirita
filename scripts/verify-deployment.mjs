import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const response = await page.goto('https://mistyrose-antelope-705522.hostingersite.com/', { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200);
  await page.getByRole('heading', { name: 'Biblioteca Espírita', exact: true }).waitFor();
  await page.getByRole('link', { name: 'Continuar no modo local' }).click();
  await page.locator('#screen-dashboard').waitFor();
  assert.equal(await page.locator('[data-bind="book-count"]').textContent(), '0');
  await page.screenshot({ path: 'artifacts/published-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'artifacts/published-mobile.png' });
  await page.goto('https://mistyrose-antelope-705522.hostingersite.com/#/scanner/resultado?isbn=9780140328721');
  await page.waitForFunction(() => document.querySelector('[data-field="title"]')?.value === 'Fantastic Mr Fox', undefined, { timeout: 20000 });
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: 200, dashboard: 'rendered', initialData: 'empty', liveIsbn: 'Fantastic Mr Fox', javascriptErrors: errors }));
} finally { await browser.close(); }
