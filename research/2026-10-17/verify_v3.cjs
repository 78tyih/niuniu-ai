const { chromium } = require('playwright');
const { pathToFileURL } = require('url');
const path = '/Users/a1234/projects/WorkBuddy/2026-10-15-09-27-05/niuniu-ai/dist/牛牛AI-iOS应用端预览.html';
const outDir = '/Users/a1234/projects/WorkBuddy/2026-10-15-09-27-05/niuniu-ai/dist/';
(async()=>{
  const browser = await chromium.launch({ headless: true, executablePath: '/Users/a1234/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', args: ['--no-proxy-server'] });
  const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
  const errors = [];
  page.on('console', m => { if(m.type()==='error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: '+e.message));
  await page.goto(pathToFileURL(path).href);
  await page.waitForTimeout(800);

  // 1. 首页精简
  const widgets = await page.locator('.dash-widget').count();
  console.log((widgets===2?'✅':'❌')+' 首页默认 2 组件: '+widgets);
  console.log((await page.locator('.fixed-ai').count()>0?'✅':'❌')+' AI 副驾驶固定入口');

  // 2. 策略广场 filter sheet
  await page.click('[data-p="p-strategy"]');
  await page.waitForTimeout(250);
  console.log((await page.locator('.filter-btn').count()>0?'✅':'❌')+' 筛选按钮');
  await page.click('.filter-btn');
  await page.waitForTimeout(250);
  console.log((await page.locator('#filterSheet .sort-chip').count()>=8?'✅':'❌')+' 筛选弹层 chips: '+await page.locator('#filterSheet .sort-chip').count());
  // 选「年化」排序
  await page.click('#sortChips .sort-chip[data-s="年化"]');
  const summary = await page.locator('#filterSummary').textContent();
  console.log('筛选摘要 = '+summary+' '+(summary.includes('年化')?'✅':'⚠️'));
  await page.click('#filterSheet .btn-main');
  await page.waitForTimeout(200);

  // 3. AI 总结折叠
  await page.click('[data-p="p-ai"]');
  await page.waitForTimeout(250);
  console.log((await page.locator('.today-card').count()>0?'✅':'❌')+' 今日摘要卡');
  const histHidden = await page.evaluate(()=>document.getElementById('historyPane').style.display==='none');
  console.log((histHidden?'✅':'❌')+' 历史总结默认折叠');
  await page.click('.today-card');
  await page.waitForTimeout(200);
  console.log((await page.evaluate(()=>document.getElementById('historyPane').style.display!=='none')?'✅':'❌')+' 展开历史总结');

  // 4. 配色切换
  await page.evaluate(()=>{
    document.documentElement.setAttribute('data-accent','blue');
    document.querySelectorAll('.accent-dot').forEach(d=>d.classList.toggle('on',d.dataset.a==='blue'));
    renderThemeAware();
  });
  await page.waitForTimeout(200);
  const accent = await page.evaluate(()=>document.documentElement.getAttribute('data-accent'));
  const accentVal = await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
  console.log((accent==='blue'?'✅':'❌')+' 配色 data-accent='+accent+' --accent='+accentVal);

  // 5. 深色 + 蓝色配色组合
  await page.evaluate(()=>applyTheme('深色'));
  await page.waitForTimeout(200);
  const theme = await page.evaluate(()=>document.documentElement.getAttribute('data-theme'));
  const btnPrimary = await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--btn-primary').trim());
  console.log((theme==='dark'?'✅':'❌')+' 深色+蓝配色，--btn-primary='+btnPrimary);

  // 深色截图
  await page.evaluate(()=>closeTheme());
  await page.click('[data-p="p-home"]');
  await page.waitForTimeout(250);
  await page.screenshot({ path: outDir+'shot-v3-home-dark-blue.png' });
  await page.click('[data-p="p-strategy"]');
  await page.waitForTimeout(250);
  await page.screenshot({ path: outDir+'shot-v3-strategy-dark-blue.png' });

  console.log('--- JS 报错数: '+errors.length+' ---');
  errors.forEach(e=>console.log('  ERR: '+e));
  await browser.close();
  process.exit(errors.length?1:0);
})().catch(e=>{ console.error('FATAL: '+e.message); process.exit(2); });
