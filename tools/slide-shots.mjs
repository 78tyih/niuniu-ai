/**
 * 把 docs/教学幻灯片.html 的每一屏渲染成 PNG（2x 超采样，ffmpeg 再降到 1080p）。
 *
 *   node tools/slide-shots.mjs
 * 产物：docs/slides/01.png … 14.png
 */
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

const WS = '/Users/a1234/.workbuddy/binaries/node/workspace';
const require2 = createRequire(path.join(WS, 'package.json'));
const { chromium } = require2('playwright');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DOC = path.join(HERE, '..', 'docs', '教学幻灯片.html');
const OUT = path.join(HERE, '..', 'docs', 'slides');
fs.mkdirSync(OUT, { recursive: true });

const CANDIDATES = [
  '/Users/a1234/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const EXEC = CANDIDATES.find((p) => fs.existsSync(p));
if (!EXEC) { console.error('找不到 Chromium'); process.exit(1); }

const browser = await chromium.launch({ executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
await page.goto('file://' + DOC);
await page.waitForTimeout(2500); // 等图片解码

const n = await page.locator('.slide').count();
console.log('幻灯片数: ' + n);
for (let i = 0; i < n; i++) {
  const name = String(i + 1).padStart(2, '0') + '.png';
  const f = path.join(OUT, name);
  await page.locator('.slide').nth(i).screenshot({ path: f });
  const { size } = fs.statSync(f);
  console.log('  ' + name + '  (' + Math.round(size / 1024) + ' KB)');
}
await browser.close();
console.log('完成 → ' + OUT);
