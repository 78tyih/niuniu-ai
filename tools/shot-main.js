'use strict';
/**
 * 实拍桌面客户端截图（真 Electron + 真 preload + 真 app.js，只有桥是桩）。
 * 跑法：env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron tools/shot-main.js
 * 产物：site/shots/*.png
 */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const stub = require('./stub-ipc');

app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');
app.disableHardwareAcceleration();

const ROOT = path.join(__dirname, '..');
const UI = path.join(ROOT, 'src', 'ui', 'index.html');
const PRELOAD = path.join(ROOT, 'src', 'preload.js');
const OUT = path.join(ROOT, 'site', 'shots');   // site/ 进仓库；dist/ 是打包产物、被 ignore

(async () => {
  await app.whenReady();
  const ipcMain = require('electron').ipcMain;
  const { reset } = stub.register(ipcMain, app.getPath('userData'));
  reset();
  fs.mkdirSync(OUT, { recursive: true });

  const win = new BrowserWindow({
    width: 1280, height: 860, show: false,
    webPreferences: { preload: PRELOAD, nodeIntegration: false, contextIsolation: true, sandbox: true },
  });
  await win.loadFile(UI);
  await new Promise((r) => setTimeout(r, 700));
  win.show();                                   // 隐藏窗口截出来是空白，必须显示
  await new Promise((r) => setTimeout(r, 400));

  const ev = (js) => win.webContents.executeJavaScript(js);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function shot(name) {
    await wait(260);
    const img = await win.webContents.capturePage();
    const f = path.join(OUT, name + '.png');
    fs.writeFileSync(f, img.toPNG());
    const kb = (fs.statSync(f).size / 1024).toFixed(0);
    console.log(`√ ${name}.png  ${img.getSize().width}x${img.getSize().height}  ${kb}KB`);
  }
  const nav = (p) => ev(`go('${p}')`);
  const click = (sel) => ev(`document.querySelector('${sel}').click()`);

  // ---- 浅色 + 品牌橙 ----
  await nav('p-overview');  await shot('01-概览-浅色');
  await nav('p-terminal');  await shot('02-终端与EA-浅色');
  await nav('p-trade');     await shot('03-交易-浅色');
  await nav('p-ai');        await shot('04-AI副驾驶-浅色');
  await nav('p-strategy');  await shot('05-策略广场-浅色');
  await nav('p-settings');  await shot('06-设置-浅色');

  // ---- 深色 + 品牌橙 ----
  await click('#themeSeg button[data-m="深色"]');
  await nav('p-overview');  await shot('07-概览-深色');
  await nav('p-trade');     await shot('08-交易-深色');
  await nav('p-settings');  await shot('09-设置-深色');

  // ---- 深色 + 深海蓝（配色与主题正交）----
  await nav('p-settings');
  await click('#accentRow .accent-dot[data-a="blue"]');
  await nav('p-overview');  await shot('10-概览-深色-深海蓝');

  console.log(`\n全部截图已输出到 ${path.relative(ROOT, OUT)}`);
  app.quit(0);
})();
