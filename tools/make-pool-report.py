#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成《牛牛AI · 上游号池合作架构评审》单文件 HTML 报告。"""
import sys
sys.path.insert(0, "/Users/a1234/.workbuddy/skills/report-visual/scripts")
from _charts import *

OUT = "/Users/a1234/projects/WorkBuddy/2026-10-15-09-27-05/niuniu-ai/site/牛牛AI-上游号池方案.html"
W = 1020
P = []
A = P.append


def decouple():
    """需求解耦对照图：左=原设定串行链，右=重构后的三件独立事。"""
    h = 296
    o = [f'<svg viewBox="0 0 {W} {h}" class="chart" role="img">']
    o.append(f'<text x="0" y="24" class="gh">你原本的设定</text>')
    o.append(f'<text x="0" y="40" class="gs">三件事被绑成一条链，任一环都要伙伴配合</text>')
    o.append(f'<text x="{W/2+30:.0f}" y="24" class="gh">重构后的结构</text>')
    o.append(f'<text x="{W/2+30:.0f}" y="40" class="gs">三件事互不依赖，伙伴只参与最后一件</text>')
    o.append(f'<line x1="{W/2:.0f}" y1="10" x2="{W/2:.0f}" y2="{h-20}" stroke="{HAIR}" stroke-width="1"/>')

    bw, bh = W / 2 - 60, 52
    left = [
        ("客户在 niuniuai.app 注册", "身份由你创建", "#F4F4F5", GREY, MUTED),
        ("要求伙伴自动为该客户开上游 token", "每客户一套上游身份", "#FBF7F5", CORAL, "#8A4429"),
        ("客户充值 → 实时分账打给伙伴", "把采购做成逐笔资金流", "#FBF7F5", CORAL, "#8A4429"),
    ]
    right = [
        ("客户注册 → 你签发 nk1.* 令牌", "伙伴完全不知道", "#F4F9F6", GREEN, "#2F6647"),
        ("客户充值 → 你的账本加积分", "唯一计费层，与上游无关", "#F4F9F6", GREEN, "#2F6647"),
        ("你按周期向伙伴采购批发额度", "按净额补货，不逐笔转钱", "#F5F8FE", BLUE, "#3A72D6"),
    ]

    for col, rows in ((0, left), (1, right)):
        x = 0 if col == 0 else W / 2 + 30
        for i, (t, sub, bg, br, tx) in enumerate(rows):
            y = 62 + i * (bh + 24)
            o.append(f'<rect x="{x}" y="{y}" width="{bw:.0f}" height="{bh}" rx="6" fill="{bg}" stroke="{br}" stroke-width="1"/>')
            o.append(f'<rect x="{x}" y="{y}" width="4" height="{bh}" rx="2" fill="{br}"/>')
            o.append(f'<text x="{x+16}" y="{y+22}" class="nb" fill="{tx}">{t}</text>')
            o.append(f'<text x="{x+16}" y="{y+39}" class="nbv">{sub}</text>')
            if i < 2:
                ax = x + bw / 2
                o.append(f'<path d="M{ax:.0f} {y+bh+3} L{ax:.0f} {y+bh+18}" stroke="{br}" stroke-width="1.5" marker-end="url(#ar2)"/>')
    o.append('<defs><marker id="ar2" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">'
             f'<path d="M0 0 L7 3.5 L0 7 z" fill="{GREY}"/></marker></defs>')
    o.append("</svg>")
    return "\n".join(o)


def two_tracks():
    """两条平行轨道：请求链路同步，资金链路异步。"""
    h = 246
    o = [f'<svg viewBox="0 0 {W} {h}" class="chart" role="img">']
    o.append(f'<text x="0" y="22" class="gh">请求链路 · 同步</text>')
    o.append(f'<text x="0" y="38" class="gs">每笔只有 1 次必须的上游 relay 调用，伙伴分账接口调用 0 次</text>')

    bx, bws, bhs = 0, 196, 50
    steps = ["客户提问", "预扣积分", "上游 relay", "结算多退", "记成本流水"]
    for i, s in enumerate(steps):
        x = i * (bws + 8)
        o.append(f'<rect x="{x}" y="52" width="{bws}" height="{bhs}" rx="4" fill="{NAVY}"/>')
        o.append(f'<text x="{x+bws/2}" y="82" text-anchor="middle" class="fl" fill="#fff">{s}</text>')
        if i < len(steps) - 1:
            o.append(f'<path d="M{x+bws+1} 77 L{x+bws+6} 77" stroke="{GREY}" stroke-width="1.5" marker-end="url(#ar3)"/>')

    o.append(f'<line x1="0" y1="124" x2="{W}" y2="124" stroke="{HAIR}" stroke-width="1" stroke-dasharray="4 4"/>')

    o.append(f'<text x="0" y="152" class="gh">资金链路 · 异步</text>')
    o.append(f'<text x="0" y="168" class="gs">对账与付款脱离请求路径，失败可重试、可人工介入</text>')

    y2 = 182
    money = [("日", "生成对账快照", "客户实扣 vs 伙伴用量", NAVY),
             ("周", "生成不可变账单", "锁定账期 + 批次号", "#3E5470"),
             ("按阈值", "向伙伴补货", "预付滚动 3–7 天用量", BLUE)]
    for i, (k, t, sub, c) in enumerate(money):
        wd = (W - 24) / 3
        x = i * (wd + 12)
        o.append(f'<rect x="{x:.0f}" y="{y2}" width="{wd:.0f}" height="52" rx="4" fill="#F4F4F5" stroke="{c}" stroke-width="1"/>')
        o.append(f'<rect x="{x:.0f}" y="{y2}" width="4" height="52" rx="2" fill="{c}"/>')
        o.append(f'<text x="{x+16:.0f}" y="{y2+21}" class="nb">{k} · {t}</text>')
        o.append(f'<text x="{x+16:.0f}" y="{y2+38}" class="nbv">{sub}</text>')
    o.append('<defs><marker id="ar3" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">'
             f'<path d="M0 0 L7 3.5 L0 7 z" fill="{GREY}"/></marker></defs>')
    o.append("</svg>")
    return "\n".join(o)


def legal_tiers():
    """合规三档分类图：绿 / 黄 / 红三列，列内竖排条目。"""
    cols = [
        (GREEN, "#2F6647", "#F4F9F6", "可直接接受", "官方端点 / 可核验一级代理", [
            ("官方 API 采购", "有合同、发票、采购凭证"),
            ("明确转售授权", "条款允许用于境内付费服务"),
            ("数据流向可核验", "端点、分包商、留存期清楚"),
        ]),
        (AMBER, "#8A6416", "#FDF8EE", "需先核验再定", "拿到材料前不签约、不预付", [
            ("「一级代理」自称", "要求出示厂商授权与凭证"),
            ("报价明显低于官方", "异常低价本身就是风险信号"),
        ]),
        (CORAL, "#8A4429", "#FBF7F5", "必须直接拒绝", "价格再便宜也不能抵消", [
            ("批量注册 / 借用身份", "含境外身份证件认证"),
            ("拆包月订阅为按量接口", "订阅转 API 零售"),
            ("盗号、骗退、规避封禁", "含故意触发封号退款"),
            ("拒绝披露来源与流向", "以「商业秘密」挡掉核验"),
        ]),
    ]
    cw, gap, ih, igap = 320, 30, 52, 10
    top = 62
    h = top + 4 * ih + 3 * igap + 18
    o = [f'<svg viewBox="0 0 {W} {h}" class="chart" role="img">']
    for ci, (stroke, txt, bg, title, sub, items) in enumerate(cols):
        x = ci * (cw + gap)
        o.append(f'<rect x="{x}" y="0" width="{cw}" height="4" rx="2" fill="{stroke}"/>')
        o.append(f'<text x="{x}" y="26" class="gh" fill="{txt}">{title}</text>')
        o.append(f'<text x="{x}" y="43" class="gs">{sub}</text>')
        for ii, (mt, sb) in enumerate(items):
            y = top + ii * (ih + igap)
            o.append(f'<rect x="{x}" y="{y}" width="{cw}" height="{ih}" rx="5" fill="{bg}" stroke="{stroke}" stroke-width="1"/>')
            o.append(f'<rect x="{x}" y="{y}" width="3.5" height="{ih}" rx="2" fill="{stroke}"/>')
            o.append(f'<text x="{x+16}" y="{y+22}" class="nb">{mt}</text>')
            o.append(f'<text x="{x+16}" y="{y+39}" class="nbv">{sb}</text>')
    o.append("</svg>")
    return "\n".join(o)


def gates():
    """实施闸门：8 步 + 2 道硬闸门。"""
    n = 8
    h = 168
    o = [f'<svg viewBox="0 0 {W} {h}" class="chart" role="img">']
    x0, x1 = 78, W - 78          # 两端留出半宽，避免首尾标签被裁
    step = (x1 - x0) / (n - 1)
    o.append(f'<line x1="{x0 - 40}" y1="72" x2="{x1 + 40}" y2="72" stroke="{HAIR}" stroke-width="2"/>')
    labels = [
        ("P0", "商务前置", "批发价/SLA/不绕客", 1),
        ("P1", "上游验收", "接口/限流/账单", 0),
        ("P2", "客户账本", "积分/用量/退款", 0),
        ("P3", "服务端转发", "密钥不出服务端", 0),
        ("P4", "支付闭环", "订单幂等/回调", 1),
        ("P5", "周期对账", "批次号/调整单", 0),
        ("P6", "故障保护", "熔断/备用上游", 0),
        ("P7", "小流量灰度", "限客户限额", 0),
    ]
    for i, (ph, name, sub, gate) in enumerate(labels):
        x = x0 + i * step
        c = CORAL if gate else NAVY
        o.append(f'<circle cx="{x:.0f}" cy="72" r="{10 if gate else 7}" fill="{c}"/>')
        up = i % 2 == 0
        o.append(f'<line x1="{x:.0f}" y1="{62 if up else 82}" x2="{x:.0f}" y2="{46 if up else 98}" stroke="{HAIR}"/>')
        ty = 34 if up else 116
        o.append(f'<text x="{x:.0f}" y="{ty}" text-anchor="middle" class="tp">{ph}</text>')
        o.append(f'<text x="{x:.0f}" y="{ty+15}" text-anchor="middle" class="tn">{name}</text>')
        o.append(f'<text x="{x:.0f}" y="{ty+29}" text-anchor="middle" class="td">{sub}</text>')
        if gate:
            o.append(f'<text x="{x:.0f}" y="{150}" text-anchor="middle" class="gs">硬闸门</text>')
    o.append("</svg>")
    return "\n".join(o)


# ────────────────────────── 页面 ──────────────────────────
A("<!DOCTYPE html><html lang='zh-CN'><head><meta charset='utf-8'>")
A("<meta name='viewport' content='width=device-width,initial-scale=1'>")
A("<title>牛牛AI · 上游号池合作架构评审</title>")
A(f"<style>{CSS}</style></head><body><div class='wrap'>")

A("<header>")
A("<p class='kicker'>NiuniuAI · 上游号池合作模式</p>")
A("<h1>不做号池自建，做批发代理 —— 客户永远只连你的网关</h1>")
A("<p class='sub'>三通道独立评审 × 两轮 = 6 份答案 · 架构结论 6/6 一致 · 2026-10-17</p>")
A("<div class='badges'><span class='badge b-ok'>架构方向已收敛</span>"
  "<span class='badge b-info'>上游接口可自动化 · Observed</span>"
  "<span class='badge b-warn'>合规红线待律师确认</span></div>")
A("</header>")

# 00
A("<section><h2><span class='n'>00</span>一屏结论</h2>")
A("<p class='lead'>你要的“每个客户一个上游 token”是把渠道模式想成了自建模式。客户注册、客户充值、上游采购是三件独立的事，不该逐一同步给伙伴。</p>")
A("<div class='grid4'>")
for v, l, d in [
    ("方案 B", "批发代理 · 6/6 一致", "客户只持你的 nk1.* 令牌"),
    ("0 次", "每笔额外的伙伴接口调用", "分账走周期净额，Inferred"),
    ("可行", "上游自动化接口", "Access Token · Observed"),
    ("红灯", "号池形态合规判定", "灰色来源须直接拒绝"),
]:
    A(f"<div class='kpi'><div class='v'>{v}</div><div class='l'>{l}</div><div class='d'>{d}</div></div>")
A("</div>")
A("<h3>目标数据流</h3>")
A(flow([("客户", "nk1.*", "只连你的网关"), ("你的网关", "积分 + 账本", "唯一计费层"),
        ("上游适配层", "provider adapter", "可切换 / 可熔断"), ("伙伴批发", "聚合额度", "看不到客户名单"),
        ("模型", "官方端点", "DeepSeek 等")], w=W))
A("<p class='cap'>伙伴在整条链上只看到一个<b>聚合批发账户</b>和<b>聚合用量</b>。客户名单、积分余额、每次调用内容全部留在你的服务端。</p>")
A("</section>")

# 01
A("<section><h2><span class='n'>01</span>需求重构：把三件事拆开</h2>")
A("<p class='lead'>原设定把三件事串成一条链，导致任一环都要求伙伴配合。拆开后，伙伴只参与最后一件。</p>")
A(decouple())
A("<p class='cap'>拆开之后，<b>“全自动”的依赖面从“伙伴改源码”降为“伙伴给一把可撤销的批发凭证”</b>。</p>")
A("</section>")

# 02
A("<section><h2><span class='n'>02</span>三个方案对照</h2>")
A("<p class='lead'>三通道两轮独立作答，全部选 B。A 的致命处不是技术，是客户拿得到伙伴地址。</p>")
A("<table><thead><tr><th>维度</th><th>A · 客户直连伙伴</th><th>B · 批发代理</th><th>C · 混合</th></tr></thead><tbody>")
for r in [
    ("客户拿到什么", "伙伴签发的 token", "你自己的 nk1.* 令牌", "两者都拿"),
    ("伙伴看到什么", "完整客户名单与流水", "只有聚合用量", "每客户用量与节奏"),
    ("换上游的代价", "要改客户端 baseURL", "服务端换 adapter", "双重吊销 + 双重对账"),
    ("你的护城河", "只剩客户端与 EA", "定价权 / 计费权 / 客户关系", "中，但复杂度最高"),
    ("三通道评价", "只适合短期验证市场", "首选，一期就做", "一期不做，按需再评估"),
]:
    A(f"<tr><td><b>{r[0]}</b></td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td></tr>")
A("</tbody></table>")
A("<p class='cap'>两个通道额外提出<b>第四方案</b>：<b>预付批发额度池</b>。你向客户零售、向伙伴批发，两个独立交易 —— 这样也避开了代收代付与“二清”的合规歧义。</p>")
A("</section>")

# 03
A("<section><h2><span class='n'>03</span>上游接口能力（实测更正）</h2>")
A("<p class='lead'>我第一轮 brief 里写过“New API 管理接口只有 Session 鉴权”，<b>这句是错的</b>。官方文档明确支持 Access Token，自动化不需要改源码。</p>")
api_rows = [
    ("POST /api/user/login", "账号密码登录，换取 Session", "Public"),
    ("Authorization: Bearer", "系统访问令牌，官方文档标注 Recommended", "—"),
    ("New-Api-User: {id}", "部分管理接口需附带的用户 ID 头", "—"),
    ("POST /api/user/", "创建用户，可指定 quota", "Admin"),
    ("PUT /api/user/", "直接修改任意用户的额度", "Admin"),
    ("POST /api/user/manage", "封禁 / 解禁 / 升降权", "Admin"),
    ("POST /api/token/", "创建令牌，一次性返回完整 key", "User"),
    ("POST /api/redemption/", "批量生成充值码（单次 ≤100 个）", "Admin"),
    ("POST /api/user/topup", "用户侧兑换充值码 —— 不是直接加余额", "User"),
]
A("<table><thead><tr><th>接口 / 请求头</th><th>作用</th><th>权限</th></tr></thead><tbody>")
for a_, b_, c_ in api_rows:
    A(f"<tr><td><code>{a_}</code></td><td>{b_}</td><td class='n'>{c_}</td></tr>")
A("</tbody></table>")
A("<div class='note info'><b>但这不是让你去接裸 Admin 令牌。</b>Public / User / Admin / Root 是角色分级，不等于接口级权限控制 —— 一把 Admin 令牌能改任意用户额度、读其他客户、动系统配置。三个通道一致建议：优先要伙伴提供<b>受限经销商接口或独立租户</b>；只能给 Admin 令牌时，必须专用账号 + 出口 IP 白名单 + 单项与累计限额 + 操作审计 + 可即时撤销。</div>")
A("</section>")

# 04
A("<section><h2><span class='n'>04</span>分账：请求同步，资金异步</h2>")
A("<p class='lead'>不要在请求链路里实时分账。上游延迟、重复扣款、跨系统不一致会直接传导给客户。</p>")
A(two_tracks())
A("<div class='note'><b>最大的“自动化幻觉”：充值码 ≠ 资金结算。</b>New API 的充值码只是平台内记账动作，它不能证明钱已经付给伙伴。企业间付款要么伙伴给你授信（后付费），要么走对公转账按周批量 —— <b>后者按定义就不可能是全自动的</b>。三通道都把这个断点单独拎了出来。</div>")
A("</section>")

# 05
A("<section><h2><span class='n'>05</span>合规红线</h2>")
A("<p class='lead'>我补做了行业调研后加的维度 —— 也是六份答案里最一致的部分。<b>“号池”这个词本身就是红灯。</b></p>")
A(legal_tiers())
A("<div class='note'><b>“我不知道上游怎么拿的货”不是有效抗辩。</b>异常低价、批量账号、拒绝提供来源，都可能被认定为“明知或应知”。反过来，报道里的刑事个案也不能推出“所有分销都违法” —— 具体责任取决于来源、授权、主观明知和参与程度。<b>这一节需要中国律师给意见，不是我能替你下结论的地方。</b></div>")
A("</section>")

# 06
A("<section><h2><span class='n'>06</span>实施闸门</h2>")
A("<p class='lead'>两处红色是硬闸门 —— 卡在这里就不要往下写代码。</p>")
A(gates())
A("<ul class='chk'>")
A("<li><b>P0 商务前置</b>：批发价与调价通知期、SLA、不绕客条款、预付上限、未用额度退款期、数据用途与留存。谈不拢就不做伙伴专用集成。</li>")
A("<li><b>P4 支付闭环</b>：ZPay / Stripe 回调验签 + 订单幂等 + 到账自动加积分。重放、乱序、延迟回调都不能重复入账。</li>")
A("<li><b>律师意见前</b>：不应面向境内公众正式收费上线。内部合成数据原型可以先做。</li>")
A("<li><b>会计意见前</b>：不应启动充值余额、长期预付套餐或代收代付模式。</li>")
A("</ul>")
A("</section>")

# 07
A("<section><h2><span class='n'>07</span>评审记录与披露</h2>")
A("<p class='lead'>按你的要求，同一份 brief 送多个互不可见的通道，并记录实际作答的模型。</p>")
A("<table><thead><tr><th>轮次</th><th>通道（实际模型）</th><th>耗时</th><th>结论</th></tr></thead><tbody>")
for r in [
    ("第一轮", "kimi-k3（kimi-code/k3）", "275s", "选 B；采信了我的错误前提"),
    ("第一轮", "gpt-6-astra", "105s", "选 B；未采信，称“现有清单不足以证明”"),
    ("第一轮", "codex-auto-review", "35s", "选 B；采信了错误前提"),
    ("第二轮", "kimi-k3（更正版）", "230s", "仍选 B；补出权限收口清单"),
    ("第二轮", "gpt-6-astra（更正版）", "93s", "仍选 B；补出合规材料清单"),
    ("第二轮", "codex-auto-review（更正版）", "31s", "仍选 B；补出红线清单"),
]:
    A(f"<tr><td>{r[0]}</td><td>{r[1]}</td><td class='n'>{r[2]}</td><td>{r[3]}</td></tr>")
A("</tbody></table>")
A("<div class='note'><b>需要如实说明的两件事。</b>① 我第一轮 brief 写错了一个事实（声称 New API 没有管理 API Token），导致 kimi 与 codex 的答案在“自动化开户可行性”这一节建立在错误前提上；gpt 保持了谨慎但也没有指出。我发现后立即发了更正版重跑。② 更正后<b>两个通道的架构结论都没有改变</b>，仍全部选 B —— 因为 B 恰恰不需要上游管理接口。原始 brief 与全部 6 份答案已归档至 <code>deliverables/niuniuai/2026-10-17/pool-review{,-round2}/</code>。</div>")
A("</section>")

# Footer
A("<div class='footer'>")
A("<p><b>数据来源</b>｜New API 官方文档 docs.newapi.pro（认证方式、倍率体系、Token 管理）；GitHub songquanpeng/one-api 与 QuantumNous/new-api 项目说明；Token 中转站行业报道（澎湃新闻、证券时报、央广网、鼎の工坊）。接口能力与行业形态为 Observed；分账频率与毛利结构为 Inferred；监管判定与备案义务为 Unknown，需律师意见。</p>")
A("<p><b>方法限制</b>｜未在我方环境部署 New API 实测管理接口，接口清单来自官方文档与代码结构分析，存在版本差异风险，落地前须以伙伴实际部署版本实测。合规一节为信息整理，不构成法律意见。</p>")
A("<p><b>产物清单</b>｜本报告 · pool-brief.txt · pool-brief-correction.txt · pool-review/（3 份答案 + manifest）· pool-review-round2/（3 份答案 + manifest）· ai-gateway/（已建成网关）</p>")
A("</div>")

A("</div></body></html>")

open(OUT, "w", encoding="utf-8").write("\n".join(P))
print("written:", OUT)
