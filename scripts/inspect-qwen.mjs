import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('reference/qwen', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const responses = [];
  page.on('response', response => { if (/deploy|share|artifact/.test(response.url())) responses.push({ url: response.url(), status: response.status() }); });
  await page.goto('https://chat.qwen.ai/s/deploy/t_0aeb803d-9c06-4dfc-8d6d-1a1e963a36cb', { waitUntil: 'networkidle', timeout: 60000 }).catch(e => console.log(e.message));
  await page.screenshot({ path: 'reference/qwen/page.png', fullPage: true });
  for (const [index, frame] of page.frames().entries()) {
    await writeFile(`reference/qwen/frame-${index}.html`, await frame.content(), 'utf8');
    console.log(JSON.stringify({ index, url: frame.url(), text: (await frame.locator('body').innerText().catch(() => '')).slice(0, 18000) }));
  }
  console.log(JSON.stringify(responses));
} finally { await browser.close(); }
