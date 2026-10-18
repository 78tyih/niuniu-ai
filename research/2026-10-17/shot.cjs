const { chromium } = require('playwright');
const { pathToFileURL } = require('url');
const path = '/Users/a1234/projects/WorkBuddy/2026-10-15-09-27-05/niuniu-ai/dist/牛牛AI-iOS应用端预览.html';
const outDir = '/Users/a1234/projects/WorkBuddy/2026-10-15-09-27-05/niuniu-ai/dist/';
(async()=>{
  const browser = await chromium.launch({ headless: true, executablePath: '/Users/a1234/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', args: ['--no-proxy-server'] });
  const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
  await page.goto(pathToFileURL(path).href);
  await page.waitForTimeout(700);

  async function shot(name, fn){ if(fn){ await fn(); await page.waitForTimeout(350);} await page.screenshot({ path: outDir+'shot-'+name+'.png' }); console.log('shot: '+name); }

  await shot('01-home');
  await shot('02-home-edit', async()=>{ await page.click('#editBtn'); });
  await shot('03-ai-summary', async()=>{ await page.click('[data-p="p-ai"]'); });
  await shot('04-ai-chat', async()=>{ await page.click('#aiSeg button[data-v="chat"]'); });
  await shot('05-strategy', async()=>{ await page.click('[data-p="p-strategy"]'); });
  await shot('06-strategy-follow', async()=>{ await page.locator('.strat-card').first().click(); });
  await shot('07-me', async()=>{ await page.evaluate(()=>closeStrat()); await page.click('[data-p="p-me"]'); });

  await browser.close();
})().catch(e=>{ console.error('FATAL: '+e.message); process.exit(2); });
