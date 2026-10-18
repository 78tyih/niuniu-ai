'use strict';
/**
 * 定价：售价 = 上游采购价 × MARKUP。
 *
 * 为什么售价表和上游配置分开：
 *   售价是对客户的承诺，不能随上游切换 / 故障转移而变。上游换一家，
 *   客户付的钱不变 —— 变得只是我的采购成本（毛利）。
 *
 * 计费单位：积分。1 积分 = CREDIT_CNY 元（默认 0.001，即 1 元 = 1000 积分）。
 *   浩驰按 token 计价后单价极低（如 Luna 输入 ¥0.078/百万），
 *   用「厘」做积分单位才能让一次调用的扣费落成整数积分，否则会被舍入成 0。
 */
const fs = require('fs');
const path = require('path');
const cfg = require('./config');

function load() {
  const f = path.join(cfg.ROOT, 'config', 'pricing.json');
  try {
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    const out = {};
    for (const [k, v] of Object.entries(j)) {
      if (!k.startsWith('_')) out[k] = v;
    }
    return out;
  } catch (e) {
    console.warn('[pricing] 未读到 pricing.json，售价表为空：' + e.message);
    return {};
  }
}

const TABLE = load();

// 售价（元/百万 tokens）= 采购价 × MARKUP
function sellPrice(model) {
  const p = TABLE[model];
  if (!p) return null;
  return { in: p.in * cfg.MARKUP, out: p.out * cfg.MARKUP };
}

// 一次调用应收的积分：token 用量 × 售价 → 元 → 积分。
// 向上取整到整数积分（1 积分 = 1 厘）：保证最少收 1 分、永不倒贴。
function creditsFor(model, inTokens, outTokens) {
  const p = sellPrice(model);
  if (!p) return null;
  const cny = (Number(inTokens || 0) * p.in + Number(outTokens || 0) * p.out) / 1e6;
  return Math.ceil(cny / cfg.CREDIT_CNY);
}

// 预扣用的保守上限：按「输入字符上限 ≈ token 上限 + 输出上限」估一个最大值，
// 保证预估 ≥ 实际，结算时多退（不会少补）。
function estimateCredits(tier) {
  const spec = cfg.TIERS[tier];
  return creditsFor(spec.model, spec.maxInputChars, spec.maxTokens);
}

module.exports = { sellPrice, creditsFor, estimateCredits, table: TABLE };
