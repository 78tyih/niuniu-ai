#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成《牛牛AI · 定价方案与施工报告》单文件 HTML。"""
import sys
sys.path.insert(0, "/Users/a1234/.workbuddy/skills/report-visual/scripts")
from _charts import *

OUT = "/Users/a1234/projects/WorkBuddy/2026-10-15-09-27-05/niuniu-ai/site/牛牛AI-定价方案与施工报告.html"
W = 1020
P = []
A = P.append


def price_ladder():
    """价格层级：官方 100% → 浩驰采购 5.74% → 我方售价 17.2%（×3）。"""
    h = 150
    o = [f'<svg viewBox="0 0 {W} {h}" class="chart" role="img">']
    rows = [
        ("官方价", 100.0, "Anthropic / OpenAI 标价（1 USD = ¥6.80）", NAVY),
        ("浩驰采购价", 5.74, "Codex Plus 渠道 · 官方价 5.74%", CORAL),
        ("我方售价", 17.2, "= 浩驰价 × 3 · 客户拿到官方价 1.7 折", GREEN),
    ]
    for i, (lb, v, sub, c) in enumerate(rows):
        y = 14 + i * 44
        bw = 520 * (v / 100)
        o.append(f'<text x="0" y="{y+14}" class="bl">{lb}</text>')
        o.append(f'<rect x="160" y="{y+3}" width="{max(bw,1):.1f}" height="20" rx="3" fill="{c}"/>')
        o.append(f'<text x="{160+max(bw,1)+10:.1f}" y="{y+18}" class="bv">{v:.2f}%</text>')
        o.append(f'<text x="{700}" y="{y+18}" class="ax">{sub}</text>')
    o.append("</svg>")
    return "\n".join(o)


def margin_cache():
    """毛利随缓存命中率变化（仅输入 token 部分；输出 token 毛利固定 66.7%）。"""
    h = 150
    o = [f'<svg viewBox="0 0 {W} {h}" class="chart" role="img">']
    rows = [("缓存命中 0%", 66.7, "名义毛利 = 1 − 1/3"),
            ("缓存命中 50%", 81.7, "一半输入走 0.1x 缓存读取价"),
            ("缓存命中 90%", 93.7, "长上下文高频缓存（交易助手典型）")]
    for i, (lb, v, sub) in enumerate(rows):
        y = 14 + i * 44
        bw = 520 * (v / 100)
        o.append(f'<text x="0" y="{y+14}" class="bl">{lb}</text>')
        o.append(f'<rect x="170" y="{y+3}" width="{max(bw,1):.1f}" height="20" rx="3" fill="{GREEN}"/>')
        o.append(f'<text x="{170+max(bw,1)+10:.1f}" y="{y+18}" class="bv">{v:.1f}%</text>')
        o.append(f'<text x="{700}" y="{y+18}" class="ax">{sub}</text>')
    o.append("</svg>")
    return "\n".join(o)


# ── 页面 ──
A("<!DOCTYPE html><html lang='zh-CN'><head><meta charset='utf-8'>")
A("<meta name='viewport' content='width=device-width,initial-scale=1'>")
A("<title>牛牛AI · 定价方案与施工报告</title>")
A(f"<style>{CSS}</style></head><body><div class='wrap'>")

A("<header>")
A("<p class='kicker'>NiuniuAI · 上游浩驰（Fomalhaut MaaS）接入</p>")
A("<h1>售价 = 浩驰采购价 × 3，按 token 计费</h1>")
A("<p class='sub'>上游适配层已施工完毕，充值闭环已跑通 · 2026-10-17</p>")
A("<div class='badges'><span class='badge b-ok'>冒烟 15/15 通过</span>"
  "<span class='badge b-ok'>充值闭环 9 步通过</span>"
  "<span class='badge b-info'>售价 = 官方价 17.2%</span>"
  "<span class='badge b-warn'>单价极低风险待拍板</span></div>")
A("</header>")

# 00
A("<section><h2><span class='n'>00</span>一屏结论</h2>")
A("<p class='lead'>浩驰给的是「官方价 × 极低折扣」的按 token 采购价（最低渠道只要官方价 5.74%）。我方售价 = 采购价 × 3，毛利名义 66.7%，叠加缓存差价后更高。</p>")
A("<div class='grid4'>")
for v, l, d in [
    ("66.7%", "名义毛利", "= 1 − 1/3，纯加价"),
    ("17.2%", "我方售价 / 官方价", "客户仍拿到官方价 1.7 折"),
    ("93.7%", "缓存命中 90% 时毛利", "缓存差价是隐藏利润，Inferred"),
    ("9 步", "充值闭环全绿", "下单→ZPay→到账→调用扣费"),
]:
    A(f"<div class='kpi'><div class='v'>{v}</div><div class='l'>{l}</div><div class='d'>{d}</div></div>")
A("</div>")
A("<h3>目标数据流</h3>")
A(flow([("客户", "ZPay 充值", "只连你的网关"), ("你的网关", "按 token 计费", "售价 = 采购价×3"),
        ("上游适配层", "Fomalhaut 价格表", "已施工"), ("浩驰", "Codex Plus 渠道", "看不到客户名单"),
        ("模型", "GPT / Claude", "官方端点")], w=W))
A("<p class='cap'>客户充的钱进你的账本；调用按 token × 售价扣费；你按采购价 × 用量向浩驰结算。<b>客户付官方价 17.2%，你赚 66%+ 毛利。</b></p>")
A("</section>")

# 01
A("<section><h2><span class='n'>01</span>价格层级</h2>")
A("<p class='lead'>三级价差关系：官方 100% → 浩驰 5.74% → 我方 17.2%。×3 加价后仍远低于官方价，这是能卖得动的根本。</p>")
A(price_ladder())
A("<p class='cap'>数据来源：浩驰《Fomalhaut MaaS 渠道商参考报价单 2026.8.19》（Codex Plus 渠道，渠道系数 0.39，官方价 5.74%）。官方美元价按 1 USD = ¥6.80 折算。Observed。</p>")
A("</section>")

# 02
A("<section><h2><span class='n'>02</span>定价表（售价 = 采购价 × 3）</h2>")
A("<p class='lead'>单位：元 / 百万 tokens。采购价来自报价单最便宜渠道（GPT 走 Codex Plus、Claude 走 Kiro）。改 <code>MARKUP</code> 环境变量即可整体调价。</p>")
A("<table><thead><tr><th>模型</th><th>采购价 输入</th><th>采购价 输出</th><th>售价 输入（×3）</th><th>售价 输出（×3）</th></tr></thead><tbody>")
for m, pin, pout, sin, sout in [
    ("gpt-5.6-luna（快问）", 0.078, 0.468, 0.234, 1.404),
    ("gpt-5.6-terra", 0.78, 4.68, 2.34, 14.04),
    ("gpt-5.6-sol（深度）", 1.95, 11.7, 5.85, 35.1),
    ("claude-sonnet-5", 1.287, 6.435, 3.861, 19.305),
    ("claude-opus-5", 2.145, 10.725, 6.435, 32.175),
]:
    A(f"<tr><td><b>{m}</b></td><td class='n'>{pin}</td><td class='n'>{pout}</td><td class='n'><b>{sin}</b></td><td class='n'><b>{sout}</b></td></tr>")
A("</tbody></table>")
A("<p class='cap'>快问档默认 luna（最便宜）、深度档默认 sol，模型可经 <code>MODEL_FAST</code> / <code>MODEL_DEEP</code> 切换。</p>")
A("</section>")

# 03
A("<section><h2><span class='n'>03</span>毛利结构：缓存差价是隐藏利润</h2>")
A("<p class='lead'>浩驰对缓存读取只收输入价的 0.1 倍，但客户仍按全价付。缓存命中越多，你的实际毛利越高 —— 这是纯加价之外的第二层利润。</p>")
A(margin_cache())
A("<div class='note'><b>交易助手天然吃缓存。</b>系统提示词、持仓摘要、历史对话每次都重复，缓存命中率大概率偏高。这条利润不用额外代码，现有成本核算（<code>costOf</code>）已经自动按缓存价算成本。Inferred，需上线后用真实账单校准。</div>")
A("</section>")

# 04
A("<section><h2><span class='n'>04</span>施工完成情况</h2>")
A("<p class='lead'>本轮完成「上游适配层 + 按 token 计费 + 充值闭环」，未动客户端。</p>")
A("<table><thead><tr><th>改动</th><th>内容</th><th>验证</th></tr></thead><tbody>")
for r in [
    ("src/pricing.js（新增）", "定价表加载 + 售价计算 + 预扣估算", "冒烟 15/15"),
    ("config/pricing.json（新增）", "7 个模型的采购价（元/百万 tokens）", "—"),
    ("src/config.js", "CREDIT_CNY→0.001、MARKUP=3、TIERS 改模型映射", "—"),
    ("src/server.js", "/v1/chat 按 token 结算；topup 加订单幂等", "闭环重放拦截"),
    ("src/billing.js", "结算流水记录 upstreamModel", "—"),
    ("src/store.js", "新增订单幂等 seenOrder", "闭环 ⑥"),
    ("src/upstream.js", "mock 成本对齐浩驰价", "—"),
    ("test/smoke.js", "按 token 计费断言", "15/15 通过"),
    ("test/recharge-loop.js（新增）", "充值闭环 9 步模拟", "9 步全绿"),
]:
    A(f"<tr><td><code>{r[0]}</code></td><td>{r[1]}</td><td class='n'>{r[2]}</td></tr>")
A("</tbody></table>")
A("</section>")

# 05
A("<section><h2><span class='n'>05</span>风险与待拍板</h2>")
A("<p class='lead'>三个必须你现在拍板的点，直接影响这套计费能不能赚钱。</p>")
A("<ul class='chk'>")
A("<li><b>单价极低 → 客单价上不去。</b>luna 一次调用只收 0.2 分钱，客户充 10 元能用几千次。这是「薄利多销」的代价：要么接受低客单价靠走量，要么把 MARKUP 从 3 提到 10（仍是官方价 57%，仍便宜）。</li>")
A("<li><b>预扣水位偏高。</b>深度档预扣 328 分但实际只花 98 分，客户余额要够预扣上限才能下单。已保证不超扣，但会劝退低余额用户。要不要改成按历史均值预估、不足再补扣？</li>")
A("<li><b>缓存差价让不让利？</b>当前缓存差价 100% 归你（客户按全价付）。如果浩驰的缓存读取价后续上调，毛利会被压缩，要盯紧。</li>")
A("</ul>")
A("<div class='note info'><b>下一步需要你给三样东西：</b>① 浩驰的 API Base URL + 测试 Key（填进 <code>config/upstreams.json</code> 就能真联调）；② 确认 MARKUP 用 3 还是更高；③ 把《给浩驰-接入需求清单》发过去。</div>")
A("</section>")

A("<div class='footer'>")
A("<p><b>数据来源</b>｜浩驰《Fomalhaut MaaS 服务渠道商参考报价单 2026.8.19》（Codex Plus / Kiro 渠道价，Observed）；官方价 1 USD = ¥6.80（报价单载明）。毛利与缓存命中率关系为 Inferred，需真实账单校准。</p>")
A("<p><b>产物清单</b>｜本报告 · ai-gateway/（适配层 + 定价 + 幂等 + 测试）· 给浩驰-接入需求清单.html · 给客户-充值说明.html</p>")
A("</div>")

A("</div></body></html>")
open(OUT, "w", encoding="utf-8").write("\n".join(P))
print("written:", OUT)
