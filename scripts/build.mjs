import { chromium } from 'playwright';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const pdfOutput = path.join(root, 'output/pdf');
await mkdir(dist, { recursive: true });
await mkdir(pdfOutput, { recursive: true });
for (const asset of ['index.html', 'professional-roadmap.html', 'styles.css', 'script.js']) {
  await copyFile(path.join(root, asset), path.join(dist, asset));
}
await writeFile(path.join(dist, '.nojekyll'), '');

const browser = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
});
try {
  const page = await browser.newPage({ reducedMotion: 'reduce', colorScheme: 'light' });
  // Export uses a system font and never depends on Google Fonts.
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await page.goto(pathToFileURL(path.join(dist, 'index.html')).href);
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => document.fonts.ready);
  const pdfPath = path.join(pdfOutput, 'Ilya-Zubkov-CV.pdf');
  await page.pdf({ path: pdfPath, format: 'A4', preferCSSPageSize: true, printBackground: true, tagged: true });
  const pdf = await readFile(pdfPath);
  if (pdf.subarray(0, 5).toString() !== '%PDF-' || pdf.length < 1000) {
    throw new Error('PDF generation did not produce a valid file');
  }
  await copyFile(pdfPath, path.join(dist, 'Ilya-Zubkov-CV.pdf'));
  console.log('Built website in dist/ and CV in output/pdf/Ilya-Zubkov-CV.pdf');
} finally {
  await browser.close();
}
