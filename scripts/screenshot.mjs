import { createRequire } from 'module';
import { writeFile, mkdir, readdir } from 'fs/promises';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/jbfok/AppData/Local/Temp/puppeteer-test/node_modules/puppeteer');

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SCREENSHOT_DIR = join(ROOT, 'temporary screenshots');

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

await mkdir(SCREENSHOT_DIR, { recursive: true });

// Find next available N
const existing = await readdir(SCREENSHOT_DIR).catch(() => []);
const nums = existing
  .map(f => f.match(/^screenshot-(\d+)/))
  .filter(Boolean)
  .map(m => parseInt(m[1], 10));
const next = nums.length ? Math.max(...nums) + 1 : 1;
const filename = label
  ? `screenshot-${next}-${label}.png`
  : `screenshot-${next}.png`;
const outPath = join(SCREENSHOT_DIR, filename);

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: undefined,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 1000));

// Scroll through page to trigger intersection observers
const pageHeight = await page.evaluate(() => document.body.scrollHeight);
const step = 600;
for (let y = 0; y <= pageHeight; y += step) {
  await page.evaluate(pos => window.scrollTo(0, pos), y);
  await new Promise(r => setTimeout(r, 80));
}
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 800));

await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Screenshot saved: ${outPath}`);
