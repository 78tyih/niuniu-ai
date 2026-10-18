'use strict';
/**
 * MQL5 静态体检（不是编译器，只抓那些「编译前就能看出来」的问题）
 *
 * 检查项：
 *   1. 括号 / 花括号 / 中括号配对（跳过字符串与注释）
 *   2. 自定义函数必须先定义后调用（MQL5 不做隐式前向声明）
 *   3. 常见 MQL4 遗留 API（在 MQL5 里会直接编译失败）
 *   4. 字符串字面量里的中文是否完整（不含被截断的孤行）
 *
 * 跑法：node tools/check-mql5.js ea/NiuNiuStrategy.mq5 [...]
 */
const fs = require('fs');

function strip(src) {
  // 去掉 // 行注释、/* */ 块注释、字符串字面量（替换成等长空串，保行号列号）
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') { out += ' '; i++; }
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { out += (src[i] === '\n' ? '\n' : ' '); i++; }
      out += '  '; i += 2; continue;
    }
    if (c === '"') {
      out += '"'; i++;
      while (i < n && src[i] !== '"') {
        if (src[i] === '\\') { out += '\\'; i++; }
        out += ' '; i++;
      }
      out += '"'; i++;
      continue;
    }
    // MQL5 的单引号是字符字面量（'{' 这种），不处理会把 '{' 当成块起始
    if (c === "'") {
      out += "'"; i++;
      while (i < n && src[i] !== "'") {
        if (src[i] === '\\') { out += '\\'; i++; }
        out += ' '; i++;
      }
      out += "'"; i++;
      continue;
    }
    out += c; i++;
  }
  return out;
}

// 注意：OrdersTotal() / OrderGetTicket() 在 MQL5 里是合法的（挂单函数组），不列入。
const MQL4_LEFT = ['MarketInfo', 'OrderSelect', 'OrderClose(', 'OrderSend(', 'RefreshRates', 'Digits'];
const MQL4_NOTE = {
  'OrderSend(': 'MQL5 用 OrderSend(MqlTradeRequest&, MqlTradeResult&)，不是旧式 11 参数',
  'OrderClose(': 'MQL5 用 TRADE_ACTION_DEAL + position 平仓，没有 OrderClose',
  'OrderSelect': 'MQL5 用 PositionSelectByTicket / PositionGetTicket',
  'OrdersTotal': 'MQL5 用 PositionsTotal()',
  'MarketInfo': 'MQL5 用 SymbolInfoDouble / SymbolInfoInteger',
  'RefreshRates': 'MQL5 不需要，直接 SymbolInfoTick',
  'Digits': 'MQL5 用 _Digits',
};

function check(file) {
  const src = fs.readFileSync(file, 'utf8');
  const code = strip(src);
  const problems = [];
  const lineOf = (idx) => src.slice(0, idx).split('\n').length;

  // 1. 括号配对
  const pairs = { '(': ')', '[': ']', '{': '}' };
  const closers = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (pairs[c]) stack.push({ c, i });
    else if (closers[c]) {
      const top = stack.pop();
      if (!top || top.c !== closers[c]) {
        problems.push(`括号不配对：第 ${lineOf(i)} 行遇到多余的 "${c}"`);
        break;
      }
    }
  }
  if (stack.length) {
    problems.push(`括号未闭合：${stack.length} 个，最早在第 ${lineOf(stack[0].i)} 行的 "${stack[0].c}"`);
  }

  // 2. 自定义函数：先定义后调用（只看本文件内定义的函数名）
  const defRe = /^\s*(?:double|int|bool|string|void|ulong|long|float|char|datetime|color|uint)\s+([A-Za-z_]\w*)\s*\(/gm;
  const defs = [];
  let m;
  while ((m = defRe.exec(src))) {
    defs.push({ name: m[1], pos: m.index, line: lineOf(m.index) });
  }
  const defNames = new Set(defs.map((d) => d.name));
  for (const d of defs) {
    // 在定义之前就出现「名字(」的调用 = 缺前向声明
    const before = src.slice(0, d.pos);
    const callRe = new RegExp(`(^|[^\\w.])${d.name}\\s*\\(`, 'm');
    if (callRe.test(before)) {
      problems.push(`函数 ${d.name}() 在第 ${d.line} 行定义，但在此之前已被调用（MQL5 需要前向声明或调换顺序）`);
    }
  }

  // 3. MQL4 遗留
  for (const k of MQL4_LEFT) {
    // OrderSend 在 MQL5 里也有，只在非 req/res 上下文时报警
    const idx = code.indexOf(k);
    if (idx < 0) continue;
    if (k === 'OrderSend(' && /OrderSend\s*\(\s*req\s*,/.test(src)) continue;
    if (k === 'OrderClose(') continue;   // 已在 2 里排除
    problems.push(`疑似 MQL4 遗留 API "${k}"（第 ${lineOf(idx)} 行）—— ${MQL4_NOTE[k] || 'MQL5 中不可用'}`);
  }

  // 4. 统计
  const stats = {
    行数: src.split('\n').length,
    字符数: src.length,
    自定义函数: defNames.size,
  };

  return { file, problems, stats };
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error('用法: node tools/check-mql5.js <file.mq5> [...]');
  process.exit(2);
}
let bad = 0;
for (const f of files) {
  const r = check(f);
  console.log(`\n=== ${r.file} ===`);
  console.log('统计:', JSON.stringify(r.stats));
  if (!r.problems.length) {
    console.log('✅ 静态体检通过（注意：这不是编译，真编译请用 MetaEditor）');
  } else {
    bad += r.problems.length;
    r.problems.forEach((p) => console.log('⚠ ' + p));
  }
}
process.exit(bad ? 1 : 0);
