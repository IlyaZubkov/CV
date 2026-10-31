import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const qa = path.join(root, 'tmp/qa');
await mkdir(qa, { recursive: true });
const assets = ['.nojekyll', 'index.html', 'professional-roadmap.html', 'styles.css', 'script.js', 'Ilya-Zubkov-CV.pdf'];
assert.deepEqual((await readdir(dist)).sort(), assets.sort(), 'Publish website assets only');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.pdf': 'application/pdf' };
const server = createServer(async (request, response) => {
  const name = request.url === '/' ? 'index.html' : request.url.slice(1);
  if (!assets.includes(name)) { response.writeHead(404).end(); return; }
  try {
    response.setHeader('Content-Type', types[path.extname(name)] || 'text/plain');
    response.end(await readFile(path.join(dist, name)));
  } catch { response.writeHead(500).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
});
const errors = [];
const createContext = async (options) => {
  const context = await browser.newContext(options);
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  await context.route('https://fonts.googleapis.com/**', route => route.abort());
  return context;
};
const visible = async (page, selector) => {
  await page.waitForFunction(selector => [...document.querySelectorAll(selector)].every(element =>
    getComputedStyle(element).opacity === '1'), selector);
};

try {
  for (const width of [1440, 390, 320]) {
    for (const theme of ['light', 'dark']) {
      const context = await createContext({ viewport: { width, height: 900 }, colorScheme: theme });
      const page = await context.newPage();
      for (const file of ['index.html', 'professional-roadmap.html']) {
        console.log(`Checking ${file}: ${theme}, ${width}px`);
        await page.goto(`${base}/${file}`);
        assert.equal(await page.locator('dialog').count(), 0, 'No first-visit popup');
        assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        const downloadEvent = page.waitForEvent('download');
        await page.getByRole('link', { name: 'Download CV (PDF)' }).click();
        const download = await downloadEvent;
        assert.equal(download.suggestedFilename(), 'Ilya-Zubkov-CV.pdf');
        assert.equal(await download.failure(), null);
        const downloaded = await readFile(await download.path());
        assert.equal(downloaded.subarray(0, 5).toString(), '%PDF-');

        // Scroll the full document, including the longest section, then return.
        const sections = page.locator('main section');
        for (let i = 0; i < await sections.count(); i++) {
          await sections.nth(i).scrollIntoViewIfNeeded();
          await visible(page, `main section:nth-child(${i + 1})`);
        }
        await page.evaluate(() => scrollTo(0, 0));
        await visible(page, 'main section');
        await page.screenshot({ path: path.join(qa, `${file}-${theme}-${width}.png`), animations: 'disabled' });
        await page.locator('.roadmap-button').click();
        assert(page.url().endsWith(file === 'index.html' ? 'professional-roadmap.html' : 'index.html'));
      }
      await context.close();
    }
  }

  const context = await createContext();
  const page = await context.newPage();
  await page.goto(base);
  const toggle = page.getByRole('button', { name: 'Animations', exact: true });
  assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
  await toggle.click();
  await visible(page, 'main section');
  await page.reload();
  assert.equal(await toggle.getAttribute('aria-pressed'), 'false');
  await toggle.click();
  await page.reload();
  assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.querySelector('#animation-toggle').disabled);
  await visible(page, 'main section');
  assert.equal(await page.locator('#experience').evaluate(e => getComputedStyle(e).transform), 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => !document.querySelector('#animation-toggle').disabled);
  assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.emulateMedia({ media: 'print' });
  await visible(page, 'main section');
  assert.equal(await page.locator('.download-button').isVisible(), false);
  await context.close();

  // Progressive enhancement and restricted browser environments must keep the CV readable.
  for (const mode of ['no-js', 'no-storage', 'no-observer', 'reduced-motion']) {
    const context = await createContext({
      javaScriptEnabled: mode !== 'no-js',
      reducedMotion: mode === 'reduced-motion' ? 'reduce' : 'no-preference',
    });
    if (mode === 'no-storage') await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked'); } });
    });
    if (mode === 'no-observer') await context.addInitScript(() => { delete window.IntersectionObserver; });
    const page = await context.newPage();
    await page.goto(base);
    if (mode === 'no-storage') await page.locator('#animation-toggle').click();
    await visible(page, 'main section');
    assert(await page.getByRole('link', { name: 'Download CV (PDF)' }).isVisible());
    await context.close();
  }
  const touchContext = await createContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const touchPage = await touchContext.newPage();
  await touchPage.goto(base);
  await touchPage.locator('#summary').tap();
  assert.equal(await touchPage.locator('#summary').evaluate(e => getComputedStyle(e).transform), 'none');
  await touchContext.close();
  assert.deepEqual(errors, [], 'No browser runtime errors');
  console.log('Passed desktop/mobile themes, PDF downloads, one-time reveals, preferences, reduced motion, touch, and no-JS checks.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}

