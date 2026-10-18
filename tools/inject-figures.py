#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把真实界面截图 + 架构示意图注入 docs/操作步骤.html（幂等：跑两次不会重复插）。"""
import io, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOC = os.path.join(ROOT, 'docs', '操作步骤.html')

FIG_CSS = """
figure{margin:18px 0 22px}
figure img{width:100%;display:block;border:1px solid var(--line);border-radius:12px;
  box-shadow:var(--shadow);background:var(--card)}
figcaption{font-size:12px;color:var(--muted);margin-top:8px;padding-left:2px}
figure svg{width:100%;height:auto;display:block;border:1px solid var(--line);
  border-radius:12px;background:var(--card);box-shadow:var(--shadow)}
.fig2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:760px){.fig2{grid-template-columns:1fr}}
.keycard{background:var(--card);border:1px solid var(--accent);border-radius:14px;
  padding:18px 20px;margin:20px 0;box-shadow:var(--shadow)}
.keycard h3{margin:0 0 10px;font-size:13.5px}
.keybox{font-family:ui-monospace,Menlo,monospace;font-size:12px;line-height:1.75;
  word-break:break-all;background:var(--soft);border:1px dashed var(--line);
  border-radius:10px;padding:12px 14px;user-select:all}
.kv2{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px;font-size:12.5px}
.kv2 div{background:var(--soft);border-radius:9px;padding:9px 12px}
.kv2 b{display:block;font-size:10.5px;color:var(--muted);font-weight:600;margin-bottom:2px}
@media(max-width:760px){.kv2{grid-template-columns:1fr}}
@media print{header,.tg{display:none}body{background:#fff}}
"""

def img(src, cap):
    return ('\n<figure>\n  <img src="shots/%s" alt="%s">\n'
            '  <figcaption>%s</figcaption>\n</figure>\n' % (src, cap, cap))

ARCH = """
<figure>
<svg viewBox="0 0 1200 400" role="img" aria-label="牛牛 AI 与 MT5 的桥接架构">
  <defs>
    <marker id="ar" markerWidth="10" markerHeight="10" refX="8" refY="3.5" orient="auto">
      <path d="M0,0 L8,3.5 L0,7 z" fill="#6B7280"/>
    </marker>
  </defs>
  <rect width="1200" height="400" fill="#FFFFFF"/>
  <text x="40" y="42" font-size="15" font-weight="700" fill="#14161A"
        font-family="PingFang SC,Hiragino Sans GB,Microsoft YaHei,sans-serif">命令怎么从软件走到券商</text>

  <!-- box1 -->
  <rect x="40" y="90" width="210" height="120" rx="14" fill="#F2F4F7" stroke="#E4E7EC"/>
  <text x="145" y="135" font-size="16" font-weight="700" fill="#14161A" text-anchor="middle"
        font-family="PingFang SC,sans-serif">牛牛 AI 桌面端</text>
  <text x="145" y="162" font-size="12" fill="#6B7280" text-anchor="middle"
        font-family="PingFang SC,sans-serif">你在这里点下单</text>
  <text x="145" y="186" font-size="11.5" fill="#4F8CFF" text-anchor="middle"
        font-family="PingFang SC,sans-serif">HMAC-SHA256 签名</text>

  <!-- arrow -->
  <line x1="250" y1="150" x2="352" y2="150" stroke="#6B7280" stroke-width="1.6" marker-end="url(#ar)"/>
  <text x="301" y="138" font-size="11" fill="#6B7280" text-anchor="middle"
        font-family="PingFang SC,sans-serif">写文件</text>

  <!-- box2 -->
  <rect x="352" y="82" width="230" height="136" rx="14" fill="#F2F4F7" stroke="#E4E7EC"/>
  <text x="467" y="112" font-size="14" font-weight="700" fill="#14161A" text-anchor="middle"
        font-family="PingFang SC,sans-serif">MT5 沙箱 · Files</text>
  <text x="467" y="138" font-size="12" fill="#6B7280" text-anchor="middle"
        font-family="PingFang SC,sans-serif">niuniu/inbox/ 待执行</text>
  <text x="467" y="158" font-size="12" fill="#6B7280" text-anchor="middle"
        font-family="PingFang SC,sans-serif">niuniu/outbox/ 回执</text>
  <text x="467" y="178" font-size="12" fill="#6B7280" text-anchor="middle"
        font-family="PingFang SC,sans-serif">niuniu/archive/ 去重</text>
  <text x="467" y="200" font-size="11" fill="#D8624A" text-anchor="middle"
        font-family="PingFang SC,sans-serif">先写 .tmp 再改名（原子）</text>

  <line x1="582" y1="150" x2="684" y2="150" stroke="#6B7280" stroke-width="1.6" marker-end="url(#ar)"/>
  <text x="633" y="138" font-size="11" fill="#6B7280" text-anchor="middle"
        font-family="PingFang SC,sans-serif">250ms 轮询</text>

  <!-- box3 -->
  <rect x="684" y="82" width="230" height="136" rx="14" fill="#EAF2FF" stroke="#4F8CFF"/>
  <text x="799" y="112" font-size="14" font-weight="700" fill="#14161A" text-anchor="middle"
        font-family="PingFang SC,sans-serif">桥接 EA（自研）</text>
  <text x="799" y="140" font-size="12" fill="#6B7280" text-anchor="middle"
        font-family="PingFang SC,sans-serif">① 验签 ② 查重 ③ 校验</text>
  <text x="799" y="160" font-size="12" fill="#6B7280" text-anchor="middle"
        font-family="PingFang SC,sans-serif">④ 手数/止损规格</text>
  <text x="799" y="180" font-size="12" fill="#6B7280" text-anchor="middle"
        font-family="PingFang SC,sans-serif">⑤ 只接受模拟盘</text>
  <text x="799" y="200" font-size="11" fill="#D8624A" text-anchor="middle"
        font-family="PingFang SC,sans-serif">验签失败 = 直接拒绝</text>

  <line x1="914" y1="150" x2="1030" y2="150" stroke="#6B7280" stroke-width="1.6" marker-end="url(#ar)"/>
  <text x="972" y="138" font-size="11" fill="#6B7280" text-anchor="middle"
        font-family="PingFang SC,sans-serif">OrderSend</text>

  <!-- box4 -->
  <rect x="1030" y="104" width="130" height="92" rx="14" fill="#F2F4F7" stroke="#E4E7EC"/>
  <text x="1095" y="145" font-size="14" font-weight="700" fill="#14161A" text-anchor="middle"
        font-family="PingFang SC,sans-serif">券商</text>
  <text x="1095" y="168" font-size="11.5" fill="#6B7280" text-anchor="middle"
        font-family="PingFang SC,sans-serif">成交 / 拒单</text>

  <!-- back line -->
  <path d="M1095,214 L1095,252 L145,252 L145,222" fill="none" stroke="#3F9C7C"
        stroke-width="1.6" stroke-dasharray="5 4" marker-end="url(#ar)"/>
  <text x="620" y="272" font-size="11.5" fill="#3F9C7C" text-anchor="middle"
        font-family="PingFang SC,sans-serif">回执原路返回：已受理 → 已成交 / 已拒绝 / 待核对</text>

  <line x1="40" y1="310" x2="1160" y2="310" stroke="#E4E7EC"/>
  <text x="40" y="344" font-size="12.5" font-weight="700" fill="#14161A"
        font-family="PingFang SC,sans-serif">三条硬边界</text>
  <text x="40" y="368" font-size="12" fill="#6B7280" font-family="PingFang SC,sans-serif">
    1) 软件不直接连券商，只写文件 —— MT5 沙箱就是隔离带</text>
  <text x="620" y="368" font-size="12" fill="#6B7280" font-family="PingFang SC,sans-serif">
    2) 没密钥 = 拒绝一切改敞口的命令</text>
  <text x="40" y="388" font-size="12" fill="#6B7280" font-family="PingFang SC,sans-serif">
    3) 结果不明只给「待核对」，绝不自动重发</text>
</svg>
<figcaption>桥接架构：命令经签名文件单向进入 MT5 沙箱，EA 验签后才下单，回执原路返回。</figcaption>
</figure>
"""

FLOW = """
<figure>
<svg viewBox="0 0 1200 250" role="img" aria-label="回执状态流转">
  <rect width="1200" height="250" fill="#FFFFFF"/>
  <defs>
    <marker id="ar2" markerWidth="10" markerHeight="10" refX="8" refY="3.5" orient="auto">
      <path d="M0,0 L8,3.5 L0,7 z" fill="#6B7280"/>
    </marker>
  </defs>
  <text x="40" y="40" font-size="15" font-weight="700" fill="#14161A"
        font-family="PingFang SC,sans-serif">一条命令的六种结局</text>

  <rect x="40" y="80" width="140" height="62" rx="12" fill="#EAF2FF" stroke="#4F8CFF"/>
  <text x="110" y="108" font-size="14" font-weight="700" fill="#14161A" text-anchor="middle"
        font-family="PingFang SC,sans-serif">已发出</text>
  <text x="110" y="128" font-size="11" fill="#6B7280" text-anchor="middle"
        font-family="PingFang SC,sans-serif">等你 EA 回话</text>

  <line x1="180" y1="111" x2="228" y2="111" stroke="#6B7280" stroke-width="1.5" marker-end="url(#ar2)"/>

  <rect x="228" y="80" width="140" height="62" rx="12" fill="#EAF2FF" stroke="#4F8CFF"/>
  <text x="298" y="108" font-size="14" font-weight="700" fill="#14161A" text-anchor="middle"
        font-family="PingFang SC,sans-serif">已受理</text>
  <text x="298" y="128" font-size="11" fill="#6B7280" text-anchor="middle"
        font-family="PingFang SC,sans-serif">校验通过，提交中</text>

  <line x1="368" y1="111" x2="416" y2="111" stroke="#6B7280" stroke-width="1.5" marker-end="url(#ar2)"/>

  <rect x="416" y="80" width="140" height="62" rx="12" fill="#E7F5EF" stroke="#3F9C7C"/>
  <text x="486" y="108" font-size="14" font-weight="700" fill="#14161A" text-anchor="middle"
        font-family="PingFang SC,sans-serif">已成交</text>
  <text x="486" y="128" font-size="11" fill="#3F9C7C" text-anchor="middle"
        font-family="PingFang SC,sans-serif">券商确认</text>

  <!-- rejected -->
  <path d="M298,142 L298,178 L150,178 L150,152" fill="none" stroke="#D8624A" stroke-width="1.5" marker-end="url(#ar2)"/>
  <rect x="76" y="184" width="148" height="50" rx="12" fill="#FBEEEB" stroke="#D8624A"/>
  <text x="150" y="206" font-size="13.5" font-weight="700" fill="#14161A" text-anchor="middle"
        font-family="PingFang SC,sans-serif">已拒绝</text>
  <text x="150" y="224" font-size="10.5" fill="#D8624A" text-anchor="middle"
        font-family="PingFang SC,sans-serif">回执写明原因</text>

  <!-- expired -->
  <path d="M298,142 L298,196 L416,196 L416,152" fill="none" stroke="#B98B22" stroke-width="1.5" marker-end="url(#ar2)"/>
  <rect x="342" y="196" width="148" height="38" rx="12" fill="#FBF4E5" stroke="#B98B22"/>
  <text x="416" y="220" font-size="13.5" font-weight="700" fill="#14161A" text-anchor="middle"
        font-family="PingFang SC,sans-serif">已过期</text>

  <!-- uncertain -->
  <rect x="630" y="80" width="168" height="62" rx="12" fill="#FBF4E5" stroke="#B98B22"/>
  <text x="714" y="108" font-size="14" font-weight="700" fill="#14161A" text-anchor="middle"
        font-family="PingFang SC,sans-serif">待核对</text>
  <text x="714" y="128" font-size="11" fill="#B98B22" text-anchor="middle"
        font-family="PingFang SC,sans-serif">结果不明，人工查 MT5</text>
  <line x1="556" y1="111" x2="630" y2="111" stroke="#B98B22" stroke-width="1.5"
        stroke-dasharray="5 4" marker-end="url(#ar2)"/>

  <rect x="838" y="72" width="322" height="78" rx="12" fill="#F2F4F7" stroke="#E4E7EC"/>
  <text x="856" y="98" font-size="12.5" font-weight="700" fill="#D8624A"
        font-family="PingFang SC,sans-serif">「待核对」是设计，不是故障</text>
  <text x="856" y="120" font-size="11.5" fill="#6B7280" font-family="PingFang SC,sans-serif">
    系统永不自动重发一条结果不明的交易命令 ——</text>
  <text x="856" y="138" font-size="11.5" fill="#6B7280" font-family="PingFang SC,sans-serif">
    那才是真的会重复成交。宁可给你「待核对」，</text>
  <text x="856" y="156" font-size="11.5" fill="#6B7280" font-family="PingFang SC,sans-serif">
    也不给你一个假的「已成交」。</text>
  <line x1="798" y1="111" x2="838" y2="111" stroke="#E4E7EC" stroke-width="1.5"/>

  <text x="40" y="192" font-size="12" fill="#6B7280" font-family="PingFang SC,sans-serif">
    只有「已成交」才算成。</text>
  <text x="40" y="214" font-size="12" fill="#6B7280" font-family="PingFang SC,sans-serif">
    「已拒绝 / 已过期」可以安全重发。</text>
  <text x="40" y="236" font-size="12" font-weight="600" fill="#D8624A" font-family="PingFang SC,sans-serif">
    「待核对」必须先看 MT5 真实持仓。</text>
</svg>
<figcaption>回执状态流转：成功只有一条路，失败与不确定各有明确出口。</figcaption>
</figure>
"""

MT5 = """
<figure>
<svg viewBox="0 0 1200 300" role="img" aria-label="MT5 挂 EA 的四个检查点">
  <rect width="1200" height="300" fill="#FFFFFF"/>
  <text x="40" y="40" font-size="15" font-weight="700" fill="#14161A"
        font-family="PingFang SC,sans-serif">第 4 节：把 EA 挂到图表上 —— 挂完必须确认这四件事</text>

  <g font-family="PingFang SC,sans-serif">
    <rect x="40" y="70" width="264" height="90" rx="12" fill="#F2F4F7" stroke="#E4E7EC"/>
    <text x="60" y="100" font-size="13" font-weight="700" fill="#14161A">① Ctrl+N 打开导航器</text>
    <text x="60" y="124" font-size="11.5" fill="#6B7280">展开「EA 交易」</text>
    <text x="60" y="144" font-size="11.5" fill="#6B7280">找到 NiuNiuBridge</text>

    <rect x="324" y="70" width="264" height="90" rx="12" fill="#F2F4F7" stroke="#E4E7EC"/>
    <text x="344" y="100" font-size="13" font-weight="700" fill="#14161A">② 拖到任意图表</text>
    <text x="344" y="124" font-size="11.5" fill="#6B7280">松手弹出「EA 属性」</text>
    <text x="344" y="144" font-size="11.5" fill="#6B7280">标签页：「常用」</text>

    <rect x="608" y="70" width="264" height="90" rx="12" fill="#FBEEEB" stroke="#D8624A"/>
    <text x="628" y="100" font-size="13" font-weight="700" fill="#14161A">③ 勾「允许算法交易」</text>
    <text x="628" y="124" font-size="11.5" fill="#D8624A">不勾 = 一下单就被拒</text>
    <text x="628" y="144" font-size="11.5" fill="#6B7280">切到「输入参数」</text>

    <rect x="892" y="70" width="268" height="90" rx="12" fill="#FBEEEB" stroke="#D8624A"/>
    <text x="912" y="100" font-size="13" font-weight="700" fill="#14161A">④ InpAutoTrade = true</text>
    <text x="912" y="124" font-size="11.5" fill="#D8624A">默认 false，必须改</text>
    <text x="912" y="144" font-size="11.5" fill="#6B7280">InpDemoOnly 保持 true</text>
  </g>

  <line x1="40" y1="182" x2="1160" y2="182" stroke="#E4E7EC"/>
  <text x="40" y="214" font-size="13" font-weight="700" fill="#14161A"
        font-family="PingFang SC,sans-serif">挂完看三处</text>

  <g font-family="PingFang SC,sans-serif">
    <rect x="40" y="228" width="360" height="52" rx="10" fill="#E7F5EF"/>
    <text x="60" y="250" font-size="12.5" font-weight="700" fill="#14161A">工具栏「自动交易」是绿色</text>
    <text x="60" y="269" font-size="11" fill="#3F9C7C">没绿就点一下</text>

    <rect x="420" y="228" width="360" height="52" rx="10" fill="#E7F5EF"/>
    <text x="440" y="250" font-size="12.5" font-weight="700" fill="#14161A">图表右上角是笑脸 😊</text>
    <text x="440" y="269" font-size="11" fill="#3F9C7C">✕ / 😴 说明没挂好</text>

    <rect x="800" y="228" width="360" height="52" rx="10" fill="#E7F5EF"/>
    <text x="820" y="250" font-size="12.5" font-weight="700" fill="#14161A">工具箱 → EA 交易 有启动日志</text>
    <text x="820" y="269" font-size="11" fill="#3F9C7C">[NN] ═══ 桥接 EA 已启动 ═══</text>
  </g>
</svg>
<figcaption>MT5 侧的四步与三处确认 —— 这一步漏一项，后面全部动作都会失败。</figcaption>
</figure>
"""

# 在哪些 <h2> 之前插入（按文件中出现顺序）
INS = [
    ('<h2><span class="n">1</span>', ARCH + img('03-完整界面.png', '主界面全貌：授权条 + 三步流程 + 终端 / 账户 / 持仓 / 下单 / 回执五大卡片')),
    ('<h2><span class="n">2</span>', img('01-未授权.png', '首次启动：授权条为红色，显示「未授权 · 请先激活」')),
    ('<h2><span class="n">3</span>', img('06-终端卡片.png', '① 选择终端：点中列表项高亮后，再点「安装桥接 EA」')),
    ('<h2><span class="n">4</span>', img('04-授权栏-未激活.png', '未激活时的授权条：粘贴密钥后点「激活」')),
    ('<h2><span class="n">5</span>', MT5),
    ('<h2><span class="n">6</span>', img('07-账户与行情.png', '确认状态：余额 / 净值 / 报价有数字，且显示「签名校验已启用」')),
    ('<h2><span class="n">7</span>', img('09-下单卡片.png', '下单卡片：填方向与手数，先看「下单前确认」小票，再点确认')),
    ('<h2><span class="n">8</span>', FLOW + img('10-回执日志.png', '事件与回执：命令已发出 → 已受理 → 已成交')),
    ('<h2><span class="n">9</span>', img('08-持仓卡片.png', '持仓列表：右侧「平仓」按钮，会弹确认框')),
]


def main():
    key = sys.argv[1] if len(sys.argv) > 1 else ''
    html = io.open(DOC, encoding='utf-8').read()

    if 'figure img{width:100%' in html:
        print('已经注入过，跳过（如需重来请先还原 操作步骤.html）')
        return

    html = html.replace('</style>', FIG_CSS + '</style>', 1)

    # 密钥卡（插到副标题之后、第 0 节之前）
    if key:
        kc = ('\n<div class="keycard">\n  <h3>你的授权密钥</h3>\n'
              '  <div class="keybox">%s</div>\n'
              '  <div class="kv2">\n'
              '    <div><b>授权号</b>%s</div>\n'
              '    <div><b>到期日</b>%s</div>\n'
              '  </div>\n'
              '  <p style="font-size:12px;color:var(--muted);margin:10px 0 0">'
              '复制整串密钥（含开头的 <code>NN1-</code>）粘贴到软件顶部授权框，点「激活」即可。离线验签，不需要联网。</p>\n'
              '</div>\n') % (key, sys.argv[2] if len(sys.argv) > 2 else '—',
                             sys.argv[3] if len(sys.argv) > 3 else '—')
        html = html.replace('<h2><span class="n">0</span>', kc + '<h2><span class="n">0</span>', 1)

    for anchor, block in INS:
        if anchor not in html:
            print('!! 找不到锚点: ' + anchor)
            continue
        html = html.replace(anchor, block + '\n' + anchor, 1)

    io.open(DOC, 'w', encoding='utf-8').write(html)
    print('已注入 → ' + DOC)


if __name__ == '__main__':
    main()
