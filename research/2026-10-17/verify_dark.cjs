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

  // 亮色校验
  const lightWidgets = await page.locator('.dash-widget').count();
  console.log((lightWidgets===4?'✅':'❌')+' 亮色 DIY 组件: '+lightWidgets);

  // 切换到深色
  await page.evaluate(()=>applyTheme('深色'));
  await page.waitForTimeout(400);

  const theme = await page.evaluate(()=>document.documentElement.getAttribute('data-theme'));
  console.log((theme==='dark'?'✅':'❌')+' data-theme = '+theme);

  const cardBg = await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim());
  console.log('深色 --card-bg = '+cardBg+' '+(cardBg==='#141D2B'?'✅':'⚠️'));
  const pageBg = await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--page-bg').trim());
  console.log('深色 --page-bg = '+pageBg+' '+(pageBg==='#0B1220'?'✅':'⚠️'));
  const up = await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--up').trim());
  console.log('深色 --up = '+up+' '+(up==='#FF7A66'?'✅':'⚠️'));

  // 检查策略卡片曲线颜色（深色应为 --chart-line #7CA9F8）
  await page.click('[data-p="p-strategy"]');
  await page.waitForTimeout(300);
  const lineColor = await page.evaluate(()=>{
    const svg = document.querySelector('.strat-card .s-chart svg polyline');
    return svg ? svg.getAttribute('stroke') : null;
  });
  console.log('深色策略曲线 stroke = '+lineColor+' '+(lineColor==='#7CA9F8'?'✅':'⚠️'));

  // 深色截图：策略、策略详情、我的、首页
  await page.screenshot({ path: outDir+'shot-dark-01-strategy.png' });
  await page.locator('.strat-card').first().click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: outDir+'shot-dark-02-strategy-detail.png' });
  await page.evaluate(()=>closeStrat());
  await page.click('[data-p="p-me"]');
  await page.waitForTimeout(250);
  await page.screenshot({ path: outDir+'shot-dark-03-me.png' });
  await page.click('[data-p="p-home"]');
  await page.waitForTimeout(250);
  await page.screenshot({ path: outDir+'shot-dark-04-home.png' });

  // 切回浅色验证
  await page.evaluate(()=>applyTheme('浅色'));
  const backBg = await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim());
  console.log((backBg==='#fff'?'✅':'❌')+' 切回浅色 --card-bg = '+backBg);

  console.log('--- JS 报错数: '+errors.length+' ---');
  errors.forEach(e=>console.log('  ERR: '+e));
  await browser.close();
  process.exit(errors.length?1:0);
})().catch(e=>{ console.error('FATAL: '+e.message); process.exit(2); });
