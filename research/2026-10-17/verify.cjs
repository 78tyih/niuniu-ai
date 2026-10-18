const { chromium } = require('playwright');
const { pathToFileURL } = require('url');
const path = '/Users/a1234/projects/WorkBuddy/2026-10-15-09-27-05/niuniu-ai/dist/牛牛AI-iOS应用端预览.html';
(async()=>{
  const browser = await chromium.launch({ headless: true, executablePath: '/Users/a1234/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', args: ['--no-proxy-server'] });
  const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
  const errors = [];
  page.on('console', m => { if(m.type()==='error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: '+e.message));
  await page.goto(pathToFileURL(path).href);
  await page.waitForTimeout(900);

  const checks = [
    ['.dash-widget', '首页 DIY 组件'],
    ['#summaryList .summary-card', 'AI 总结卡'],
    ['#strategyList .strat-card', '策略卡片'],
    ['#p-me .glist', '账户页分组列表'],
    ['.tabbar .tab', '底部 Tab'],
  ];
  for(const [sel, name] of checks){
    const n = await page.locator(sel).count();
    console.log((n>0?'✅':'❌')+' '+name+': '+n);
  }
  // 首页编辑模式
  await page.click('#editBtn');
  await page.waitForTimeout(300);
  console.log((await page.locator('.dw-tools').count()>0?'✅':'❌')+' 编辑模式工具手柄: '+await page.locator('.dw-tools').count());
  await page.click('#editBtn'); // 完成
  await page.waitForTimeout(200);

  // AI 页
  await page.click('[data-p="p-ai"]');
  await page.waitForTimeout(250);
  const aiSeg = await page.locator('#aiSeg button').count();
  console.log((aiSeg===2?'✅':'❌')+' AI 分段(总结/对话): '+aiSeg);
  await page.click('#aiSeg button[data-v="chat"]');
  await page.waitForTimeout(250);
  console.log((await page.locator('#chat .embed-card').count()>0?'✅':'❌')+' 对话内嵌行情卡: '+await page.locator('#chat .embed-card').count());

  // 策略页
  await page.click('[data-p="p-strategy"]');
  await page.waitForTimeout(250);
  console.log('策略卡字段(年化): '+await page.locator('.strat-card .s-annual').count());
  await page.locator('.strat-card').first().click();
  await page.waitForTimeout(300);
  console.log((await page.locator('#stratDetail .metric-grid').count()>0?'✅':'❌')+' 策略详情跟单弹层');
  await page.evaluate(()=>closeStrat());
  await page.waitForTimeout(200);

  // 我的页
  await page.click('[data-p="p-me"]');
  await page.waitForTimeout(250);
  const growCount = await page.locator('#p-me .grow').count();
  console.log((growCount===8?'✅':'❌')+' 账户页 8 项: '+growCount);

  await page.screenshot({ path: '/Users/a1234/projects/WorkBuddy/2026-10-15-09-27-05/niuniu-ai/dist/牛牛AI-iOS预览-首页.png' });
  console.log('--- JS 报错数: '+errors.length+' ---');
  errors.forEach(e=>console.log('  ERR: '+e));
  await browser.close();
  process.exit(errors.length?1:0);
})().catch(e=>{ console.error('FATAL: '+e.message); process.exit(2); });
