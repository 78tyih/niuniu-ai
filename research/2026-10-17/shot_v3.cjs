const { chromium } = require('playwright');
const { pathToFileURL } = require('url');
const path = '/Users/a1234/projects/WorkBuddy/2026-10-15-09-27-05/niuniu-ai/dist/牛牛AI-iOS应用端预览.html';
const outDir = '/Users/a1234/projects/WorkBuddy/2026-10-15-09-27-05/niuniu-ai/dist/';
(async()=>{
  const browser = await chromium.launch({ headless: true, executablePath: '/Users/a1234/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', args: ['--no-proxy-server'] });
  const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
  await page.goto(pathToFileURL(path).href);
  await page.waitForTimeout(700);
  async function shot(n, fn){ if(fn){await fn(); await page.waitForTimeout(350);} await page.screenshot({ path: outDir+'shot-v3-'+n+'.png' }); console.log('shot: '+n); }

  await shot('01-home');
  await shot('02-strategy', async()=>{ await page.click('[data-p="p-strategy"]'); });
  await shot('03-filter', async()=>{ await page.click('.filter-btn'); });
  await shot('04-ai-summary', async()=>{ await page.click('#filterSheet .btn-main'); await page.click('[data-p="p-ai"]'); });
  await shot('05-theme', async()=>{ await page.click('[data-p="p-me"]'); await page.evaluate(()=>openTheme()); });
  // 蓝色配色首页
  await shot('06-home-blue', async()=>{ await page.evaluate(()=>{closeTheme(); document.documentElement.setAttribute('data-accent','blue'); document.querySelectorAll('.accent-dot').forEach(d=>d.classList.toggle('on',d.dataset.a==='blue')); renderThemeAware();}); await page.click('[data-p="p-home"]'); });
  // 紫色配色首页
  await shot('07-home-purple', async()=>{ await page.evaluate(()=>{document.documentElement.setAttribute('data-accent','purple'); document.querySelectorAll('.accent-dot').forEach(d=>d.classList.toggle('on',d.dataset.a==='purple')); renderThemeAware();}); });

  await browser.close();
})().catch(e=>{ console.error('FATAL: '+e.message); process.exit(2); });
