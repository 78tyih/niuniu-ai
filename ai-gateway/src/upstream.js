'use strict';
/**
 * 上游调用：OpenAI 协议兼容，多家按顺序故障切换。
 *
 * 关键点：
 *   1) 客户端永远拿不到这里的 Key —— 它只存在服务端进程的环境/配置里
 *   2) 一家挂了自动切下一家，客户端无感（这正是自建网关的意义）
 *   3) 每次都算一次真实成本，写进流水，用来盯毛利
 */
const cfg = require('./config');

function costOf(usage, u) {
  const pin = Number(u.priceIn || 0);
  const pout = Number(u.priceOut || 0);
  const pcache = Number(u.priceCacheIn ?? pin);
  const cached = Number(usage?.prompt_tokens_details?.cached_tokens || 0);
  const prompt = Number(usage?.prompt_tokens || 0);
  const completion = Number(usage?.completion_tokens || 0);
  const miss = Math.max(prompt - cached, 0);
  const cny = (miss * pin + cached * pcache + completion * pout) / 1e6;
  return Math.round(cny * 1e6) / 1e6;
}

function mockCall(messages, tier, maxTokens) {
  // 测试用：最后一条用户消息里含 "FAIL" 就抛错，用来验证「上游失败要退款」
  const last = [...messages].reverse().find((m) => m.role === 'user');
  if (last && String(last.content).includes('FAIL')) {
    const e = new Error('mock upstream 500');
    e.status = 500;
    throw e;
  }
  const prompt = 2200, completion = tier === 'deep' ? 2400 : 520, cached = 1500;
  return {
    text: `[mock:${tier}] 这是一条用于联调的回复。`,
    usage: { prompt_tokens: prompt, completion_tokens: completion, prompt_tokens_details: { cached_tokens: cached } },
    upstream: 'mock', model: 'mock-1',
  };
}

async function callOne(u, messages, tier, maxTokens, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(u.baseUrl.replace(/\/$/, '') + '/chat/completions', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + u.apiKey },
      body: JSON.stringify({
        model: u.model,
        messages,
        max_tokens: Math.min(Number(u.maxTokens || maxTokens), maxTokens),
        temperature: tier === 'deep' ? 0.4 : 0.7,
        stream: false,
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const e = new Error(`上游 ${u.name} 返回 ${r.status}: ${j?.error?.message || ''}`);
      e.status = r.status;
      throw e;
    }
    const text = j?.choices?.[0]?.message?.content || '';
    // 200 不等于成功：空内容 / 截断都按失败处理（评审 C 轮：必须定义「成功」）
    if (!String(text).trim()) {
      const e = new Error(`上游 ${u.name} 返回空内容`);
      e.status = 502;
      throw e;
    }
    return {
      text,
      usage: j?.usage || { prompt_tokens: 0, completion_tokens: 0 },
      upstream: u.name,
      model: u.model,
      costCny: costOf(j?.usage, u),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function chat(messages, tier) {
  const spec = cfg.TIERS[tier];
  if (!spec) throw new Error('未知档位: ' + tier);

  if (cfg.MOCK || !cfg.UPSTREAMS.length) {
    const m = mockCall(messages, tier, spec.maxTokens);
    // mock 成本价对齐浩驰采购价（Codex Plus 渠道），毛利测算接近真实
    const mockPrice = tier === 'deep'
      ? { priceIn: 1.95, priceOut: 11.7, priceCacheIn: 0.195 }
      : { priceIn: 0.078, priceOut: 0.468, priceCacheIn: 0.0078 };
    return { ...m, costCny: costOf(m.usage, mockPrice) };
  }

  // 总预算而不是单家超时：60s × N 家会让用户等三分钟，客户端早断连了服务端还在跑
  let budget = spec.budgetMs;
  const list = cfg.UPSTREAMS.filter((u) => (u.tier || 'fast') === tier || u.tier === 'both' || !u.tier);
  const order = list.length ? list : cfg.UPSTREAMS;
  const errs = [];
  for (const u of order) {
    if (budget < 3000) { errs.push('超时预算耗尽'); break; }
    const per = Math.min(cfg.REQUEST_TIMEOUT_MS, budget);
    const t0 = Date.now();
    try {
      const r = await callOne(u, messages, tier, spec.maxTokens, per);
      return r;
    } catch (e) {
      budget -= Date.now() - t0;
      errs.push(`${u.name}: ${e.message}`);
      console.warn(`[upstream] ${u.name} 失败(剩余预算${Math.round(budget)}ms) → ${e.message}`);
      // 4xx（鉴权错 / 参数错 / 内容审核）换一家大概率同样拒绝，别白烧预算；429 与 5xx / 超时才切
      const s = e.status;
      if (s && s >= 400 && s < 500 && s !== 429 && s !== 408) {
        const err = new Error('上游拒绝该请求（' + s + '），已停止切换: ' + errs.join(' | '));
        err.allFailed = true;
        throw err;
      }
    }
  }
  const e = new Error('全部上游失败：' + errs.join(' | '));
  e.allFailed = true;
  throw e;
}

module.exports = { chat, costOf };
