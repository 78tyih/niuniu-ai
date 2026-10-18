'use strict';
/**
 * 配置：全部走环境变量 / 配置文件，绝不写死任何 Key。
 *
 * 必填：
 *   SERVER_SECRET    签发用户 token 用的服务端密钥（自己随机生成，不要外泄）
 *   ADMIN_SECRET     管理接口密钥（充值、签发 token）
 *   UPSTREAMS_JSON   上游配置（JSON 字符串，见 config/upstreams.example.json）
 *
 * 可选：
 *   PORT             默认 8787
 *   CREDIT_CNY       1 积分折合人民币，默认 0.001（1 元 = 1000 积分，因按 token 计费单价极低）
 *   MARKUP           售价 = 采购价 × MARKUP，默认 3（浩驰价 × 3）
 *   UPSTREAM_MOCK    1 = 不真调上游（测试用）
 *   NO_AUTH          1 = 跳过 token 校验（仅本地联调，线上必须关）
 *   DATA_DIR         账本目录，默认 ./data
 *   RECHARGE_URL     客户端「充值」按钮跳的地址
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function loadUpstreams() {
  const fromEnv = process.env.UPSTREAMS_JSON;
  if (fromEnv) return JSON.parse(fromEnv).upstreams || [];
  const f = path.join(ROOT, 'config', 'upstreams.json');
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8')).upstreams || [];
  return [];
}

// 档位：客户端只认 fast / deep，具体用哪个模型由服务端决定 —— 这样换上游不用发版
// 计费改为「按 token × 售价」，不再按次固定扣积分；maxInputChars 仍是输入硬边界
const TIERS = {
  fast: { model: process.env.MODEL_FAST || 'gpt-5.6-luna', maxTokens: Number(process.env.MAXTOK_FAST || 800),
          maxInputChars: Number(process.env.MAXIN_FAST || 8000),  budgetMs: Number(process.env.BUDGET_FAST || 45000) },
  deep: { model: process.env.MODEL_DEEP || 'gpt-5.6-sol',   maxTokens: Number(process.env.MAXTOK_DEEP || 4000),
          maxInputChars: Number(process.env.MAXIN_DEEP || 32000), budgetMs: Number(process.env.BUDGET_DEEP || 180000) },
};

module.exports = {
  ROOT,
  PORT: Number(process.env.PORT || 8787),
  SERVER_SECRET: process.env.SERVER_SECRET || '',
  ADMIN_SECRET: process.env.ADMIN_SECRET || '',
  DATA_DIR: process.env.DATA_DIR || path.join(ROOT, 'data'),
  CREDIT_CNY: Number(process.env.CREDIT_CNY || 0.001),
  MARKUP: Number(process.env.MARKUP || 3),
  TIERS,
  UPSTREAMS: loadUpstreams(),
  MOCK: process.env.UPSTREAM_MOCK === '1',
  NO_AUTH: process.env.NO_AUTH === '1',
  RECHARGE_URL: process.env.RECHARGE_URL || 'https://niuniuai.app/credits',
  // 防薅：单用户每分钟 / 每天调用上限、同时在途请求数
  RATE_PER_MIN: Number(process.env.RATE_PER_MIN || 20),
  RATE_PER_DAY: Number(process.env.RATE_PER_DAY || 300),
  MAX_INFLIGHT: Number(process.env.MAX_INFLIGHT || 2),
  // 预扣悬挂清扫：settle/refund 迟迟不来（崩溃/重启）就自动退款，别锁死用户积分
  HOLD_TTL_MS: Number(process.env.HOLD_TTL_MS || 5 * 60 * 1000),
  // 毛利告警线：单次成本超过「已收积分对应金额」的这个比例就记一条告警
  MARGIN_WARN: Number(process.env.MARGIN_WARN || 0.6),
  REQUEST_TIMEOUT_MS: Number(process.env.REQUEST_TIMEOUT_MS || 60000),
  SYSTEM_PROMPT: process.env.SYSTEM_PROMPT || [
    '你是牛牛 AI 的交易分析助手，运行在用户本机的 MT5 交易副驾驶里。',
    '规则：1) 只做行情与持仓的解读和信息整理，不给买卖指令、不承诺收益；',
    '2) 不确定就说不确定，不允许编造价格、成交或政策数据；',
    '3) 回答用中文，简洁，结论先行，能列点就列点；',
    '4) 涉及风险时必须提示止损与仓位。',
  ].join('\n'),
};
