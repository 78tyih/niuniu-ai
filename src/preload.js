'use strict';
/**
 * preload：只通过 contextBridge 暴露白名单业务方法。
 * 不暴露 ipcRenderer 本身、不暴露任意文件路径、不暴露任意 shell 命令。
 * 密钥不进入渲染进程。
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nn', {
  licenseStatus:   () => ipcRenderer.invoke('bridge:licenseStatus'),
  licenseActivate: (key) => ipcRenderer.invoke('bridge:licenseActivate', { key }),
  discover:      () => ipcRenderer.invoke('bridge:discover'),
  installEA:     (terminalPath) => ipcRenderer.invoke('bridge:installEA', { terminalPath }),
  rebind:        (terminalPath) => ipcRenderer.invoke('bridge:rebind', { terminalPath }),
  // 全局停用闸门在主进程，这里只是发意图；返回值以主进程为准
  setHalt:       (halted) => ipcRenderer.invoke('bridge:setHalt', { halted }),
  haltStatus:    () => ipcRenderer.invoke('bridge:haltStatus'),
  snapshot:      (terminalPath) => ipcRenderer.invoke('bridge:snapshot', { terminalPath }),
  sendCommand:   (p) => ipcRenderer.invoke('bridge:sendCommand', p),
  commandStatus: (commandId) => ipcRenderer.invoke('bridge:commandStatus', { commandId }),
  aiStatus:      () => ipcRenderer.invoke('bridge:aiStatus'),
  aiConnect:     (token) => ipcRenderer.invoke('bridge:aiConnect', { token }),
  aiDisconnect:  () => ipcRenderer.invoke('bridge:aiDisconnect'),
  version:       () => ipcRenderer.invoke('app:version'),
  getPrefs:      () => ipcRenderer.invoke('app:getPrefs'),
  setPrefs:      (p) => ipcRenderer.invoke('app:setPrefs', p),
  // 同步读一次偏好（仅首帧配色用），失败时返回 null 由渲染层回落默认
  getPrefsSync:  () => { try { return ipcRenderer.sendSync('app:getPrefsSync'); } catch { return null; } },
  openExternal:  (url) => ipcRenderer.invoke('app:openExternal', url),
  saveLog:       (text) => ipcRenderer.invoke('app:saveLog', text),
  onEvent:       (cb) => {
    const h = (_e, msg) => cb(msg);
    ipcRenderer.on('bridge:event', h);
    return () => ipcRenderer.removeListener('bridge:event', h);
  },
});
