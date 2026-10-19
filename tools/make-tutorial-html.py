#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 K3 写的教程 Markdown（research/2026-10-19/answer-K3-tutorial.md）
转成单文件 HTML（site/牛牛AI-使用教程-v2.html）。

设计：中文优先 + 日/夜切换 + 左侧 sticky 目录 + 步骤/表格/提示块。
EN 版为精简版（章节标题 + 要点），通过顶部语言切换器切换。

跑法：python3 tools/make-tutorial-html.py
"""
import html
import re
import io
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'research', '2026-10-19', 'answer-K3-tutorial.md')
OUT = os.path.join(ROOT, 'site', '牛牛AI-使用教程-v2.html')

md = io.open(SRC, encoding='utf-8').read()


def esc(s):
    return html.escape(s, quote=False)


# ---------- 极简 Markdown 渲染 ----------
def render_md(text):
    """渲染教程用的 Markdown 子集：标题/表格/列表/引用/代码/加粗。"""
    lines = text.split('\n')
    out = []
    i = 0
    in_code = False
    in_table = False
    in_quote = False
    table_buf = []

    def flush_table():
        nonlocal table_buf, in_table
        if not table_buf:
            return
        rows = table_buf
        thead = ''
        tbody = ''
        for ri, row in enumerate(rows):
            cells = [c.strip() for c in row.strip().strip('|').split('|')]
            if ri == 0:
                thead = '<tr>' + ''.join(f'<th>{inline(c)}</th>' for c in cells) + '</tr>'
            elif all(re.fullmatch(r':?-{3,}:?', c) for c in cells):
                continue  # 分隔行
            else:
                tbody += '<tr>' + ''.join(f'<td>{inline(c)}</td>' for c in cells) + '</tr>'
        out.append(f'<div class="tbl"><table><thead>{thead}</thead><tbody>{tbody}</tbody></table></div>')
        table_buf = []
        in_table = False

    while i < len(lines):
        line = lines[i]
        # 代码块
        if line.strip().startswith('```'):
            if in_code:
                out.append('</code></pre>')
                in_code = False
            else:
                out.append('<pre class="code"><code>')
                in_code = True
            i += 1
            continue
        if in_code:
            out.append(esc(line))
            i += 1
            continue
        # 引用块
        if line.strip().startswith('>'):
            if not in_quote:
                out.append('<div class="callout">')
                in_quote = True
            content = line.strip().lstrip('>').strip()
            out.append(f'<p>{inline(content)}</p>')
            i += 1
            # 连续引用
            while i < len(lines) and lines[i].strip().startswith('>'):
                c = lines[i].strip().lstrip('>').strip()
                out.append(f'<p>{inline(c)}</p>')
                i += 1
            out.append('</div>')
            in_quote = False
            continue
        # 表格
        if '|' in line and line.strip().startswith('|'):
            if not in_table:
                in_table = True
                table_buf = []
            table_buf.append(line)
            i += 1
            continue
        elif in_table:
            flush_table()
        # 标题
        m = re.match(r'^(#{1,4})\s+(.*)$', line)
        if m:
            level = len(m.group(1))
            out.append(f'<h{level} id="{slugify(m.group(2))}">{inline(m.group(2))}</h{level}>')
            i += 1
            continue
        # 列表
        m = re.match(r'^(\s*)([-*]|\d+\.)\s+(.*)$', line)
        if m:
            ordered = m.group(2)[0].isdigit()
            tag = 'ol' if ordered else 'ul'
            out.append(f'<{tag}>')
            while i < len(lines):
                mm = re.match(r'^(\s*)([-*]|\d+\.)\s+(.*)$', lines[i])
                if not mm:
                    break
                out.append(f'<li>{inline(mm.group(3))}</li>')
                i += 1
            out.append(f'</{tag}>')
            continue
        # 分隔线
        if line.strip() == '---':
            out.append('<hr>')
            i += 1
            continue
        # 空行
        if not line.strip():
            i += 1
            continue
        # 普通段落
        out.append(f'<p>{inline(line)}</p>')
        i += 1
    if in_table:
        flush_table()
    if in_quote:
        out.append('</div>')
    if in_code:
        out.append('</code></pre>')
    return '\n'.join(out)


def inline(s):
    s = esc(s)
    s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
    s = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', s)
    return s


def slugify(s):
    s = re.sub(r'[^\w\u4e00-\u9fff]+', '-', s).strip('-')
    return s or 'sec'


# 按章节切分
chapters = re.split(r'\n(?=## \d+)', md)
# 第一段是标题 + 引言
header = chapters[0]

# 构建目录
toc = []
for ch in chapters[1:]:
    title = re.match(r'##\s+(.*)', ch).group(1).strip()
    toc.append((slugify(title), title))

# 渲染每章
# 章节配图：真实界面截图（docs/shots-v2/），base64 内嵌，避免外链。
import base64

SHOTS_DIR = os.path.join(ROOT, 'docs', 'shots-v2')

# 视频教程：dist/video/牛牛AI-上手教程.mp4 → base64 内嵌（单文件交付）
VIDEO_FILE = os.path.join(ROOT, 'dist', 'video', '牛牛AI-上手教程.mp4')
VIDEO_SECTION = ''
if os.path.exists(VIDEO_FILE):
    v64 = base64.b64encode(open(VIDEO_FILE, 'rb').read()).decode('ascii')
    VIDEO_SECTION = '''
    <section class="video-sec">
      <h2 id="video"><span class="no">▶</span>视频教程 · 22 秒看完整流程</h2>
      <p class="vd-s">概览 → 终端与 EA → 交易 → 策略广场 → AI 一键下单 → 回执，一镜到底。</p>
      <video controls preload="metadata" playsinline src="data:video/mp4;base64,__VIDEO_B64__"></video>
    </section>'''.replace('__VIDEO_B64__', v64)
SHOTS = {
    1: [('01-overview.png', '概览页：账户与行情、持仓一目了然')],
    2: [('02-terminal.png', '终端与 EA 页：扫描 MT5、一键安装桥接 EA、绑定密钥'),
        ('01-overview.png', '装完自检：签名已启用、行情已通')],
    3: [('01-overview.png', '概览'), ('02-terminal.png', '终端与 EA'),
        ('03-trade.png', '交易'), ('04-strategy.png', '策略广场'),
        ('05-ai.png', 'AI 副驾驶'), ('06-settings.png', '设置')],
    4: [('04-strategy.png', '策略广场：候选资产库 + 上架四道门槛')],
    6: [('03-trade.png', '交易页：人工下单票据'),
        ('07-suggestion.png', 'AI 建议卡：方向 / 止损 / 止盈 / 手数（系统算）'),
        ('08-confirm.png', '二次确认弹窗：完整参数核对后下单')],
    7: [('02-terminal.png', '终端与 EA 页：重新绑定（换账户）')],
}


def shot_figure(fname, caption):
    p = os.path.join(SHOTS_DIR, fname)
    if not os.path.exists(p):
        return ''
    b64 = base64.b64encode(open(p, 'rb').read()).decode('ascii')
    return (f'<figure class="shot"><img src="data:image/png;base64,{b64}" alt="{esc(caption)}" loading="lazy">'
            f'<figcaption>{esc(caption)}</figcaption></figure>')


body = []
for idx, ch in enumerate(chapters[1:], start=1):
    rendered = render_md(ch)
    figs = [shot_figure(f, c) for f, c in SHOTS.get(idx, [])]
    figs = [x for x in figs if x]
    if figs:
        block = ('<div class="shots-grid">' + ''.join(figs) + '</div>') if len(figs) > 2 else ''.join(figs)
        # 插到该章 <h2> 标题之后
        rendered = re.sub(r'(<h2[^>]*>.*?</h2>)', lambda m: m.group(1) + block, rendered, count=1)
    # 章节标题编号抽出来做徽章：「1. 这是什么」→ [1] 这是什么
    rendered = re.sub(r'<h2([^>]*)>(\d+)[\.．、]?\s*',
                      lambda m: '<h2%s><span class="no">%s</span>' % (m.group(1), m.group(2)),
                      rendered, count=1)
    body.append('<section>' + rendered + '</section>')

# EN 精简版（章节标题 + 一句话要点）
EN = {
    '1': ('What this is', 'NiuNiu AI is an on-device MT5 trading copilot. It never trades by itself; commands go through a signed bridge EA.'),
    '2': ('Install: 4-step loop', 'Install MT5 → install NiuNiu AI → install bridge EA → drag EA onto a chart (must set InpAutoTrade=true).'),
    '3': ('Six pages', 'Overview, Terminal & EA, Trade, Strategy Plaza (catalog live, all backtest-pending), AI Copilot (demo order chain), Settings.'),
    '4': ('Strategy Plaza', '15 candidate / 4 deferred / 4 excluded assets. Candidates are "pending review", not "approved"; no backtest = not tradeable.'),
    '5': ('Run a strategy EA', 'Compile NiuNiuStrategy.mq5 once (MetaEditor F7), drag onto a chart, set InpStrategy / InpMagic / InpRiskPct.'),
    '6': ('Order & close', 'Fill the ticket, confirm, then track receipts. "待核对 / RECONCILING" means check MT5 manually — never resubmit.'),
    '7': ('Kill switch & rebind', 'One-click halt is a real main-process gate. Rebind after switching accounts.'),
    '8': ('Troubleshooting', 'Symptom → cause → fix table covering the most common blockers.'),
    '9': ('Risk notice', 'Execution tool, not advice. Use a demo account during testing.'),
    '10': ('Feedback checklist', 'Send version / broker / EA install log / receipt text / screenshots.'),
}

html = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>牛牛 AI · 使用教程（新手版）</title>
<style>
:root{
  --accent:#FF6A1A; --accent-deep:#C74E00; --accent-light:#FF7A33;
  --up:#E23B2E; --down:#17995B; --ok:#4CAF88; --amber:#D9A441; --danger:#E23B2E;
  --bg:#F5F6F8; --panel:#FFFFFF; --soft:#FAFBFC; --line:#E4E6EA; --line-strong:#F0F1F4;
  --ink:#17233B; --muted:#667085; --faint:#98A2B3;
  --tint:color-mix(in srgb,#FF6A1A 8%,#fff);
  --shadow:0 1px 2px rgba(14,42,92,.05);
  --ease:cubic-bezier(.22,1,.36,1);
}
[data-theme="dark"]{
  --bg:#0B1220; --panel:#141D2B; --soft:#101827; --line:#2A3648; --line-strong:#263247;
  --ink:#F3F6FB; --muted:#AAB4C3; --faint:#7F8A9B;
  --up:#FF7A66; --down:#3DDC97; --ok:#3DDC97; --amber:#F6C453; --danger:#FF4D6D;
  --tint:color-mix(in srgb,#FF7A33 20%,#141D2B);
  --shadow:0 8px 24px rgba(0,0,0,.45);
}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--ink);font-size:15px;line-height:1.75;
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei","Inter",sans-serif;
  -webkit-font-smoothing:antialiased}
a{color:var(--accent-deep);text-decoration:none}

/* 顶栏 */
.topbar{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:14px;
  padding:14px 28px;background:color-mix(in srgb,var(--panel) 88%,transparent);
  backdrop-filter:blur(12px);border-bottom:1px solid var(--line-strong)}
.topbar .logo{width:32px;height:32px;border-radius:8px;background:linear-gradient(150deg,var(--accent-light),var(--accent-deep));
  display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;flex:0 0 32px}
.topbar .tt{font-size:15px;font-weight:660;letter-spacing:-.01em}
.topbar .tt span{font-size:11.5px;color:var(--muted);font-weight:500;display:block;margin-top:-2px}
.topbar .sp{flex:1}
.topbar .ctl{display:flex;gap:8px}
.topbar .ctl button{border:1px solid var(--line);background:var(--panel);color:var(--muted);
  border-radius:8px;padding:6px 13px;font-size:12.5px;font-weight:560;cursor:pointer;font-family:inherit;transition:.15s}
.topbar .ctl button.on{background:var(--tint);border-color:var(--accent);color:var(--accent)}

/* 主体布局 */
.wrap{display:flex;max-width:1180px;margin:0 auto}
.toc{position:sticky;top:68px;align-self:flex-start;width:230px;flex:0 0 230px;
  padding:26px 16px 40px;max-height:calc(100vh - 68px);overflow-y:auto}
.toc a{display:block;padding:7px 12px;font-size:13px;color:var(--muted);border-radius:8px;
  border-left:2px solid transparent;transition:.15s}
.toc a:hover{color:var(--ink);background:var(--soft)}
.toc a.on{color:var(--accent);background:var(--tint);border-left-color:var(--accent);font-weight:600}
.toc .toc-h{font-size:10.5px;letter-spacing:.08em;color:var(--faint);padding:0 12px 8px;font-weight:700}

.content{flex:1;min-width:0;padding:28px 40px 80px}
.hero{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:28px 30px;margin-bottom:24px;box-shadow:var(--shadow)}
.hero h1{font-size:23px;font-weight:680;letter-spacing:-.02em;margin-bottom:6px}
.hero .sub{font-size:13px;color:var(--muted);line-height:1.7}
.hero .meta{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
.hero .meta span{font-size:11px;padding:4px 11px;border-radius:999px;background:var(--soft);border:1px solid var(--line);color:var(--muted)}

section{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:26px 30px;margin-bottom:20px;box-shadow:var(--shadow)}
section h2{font-size:18px;font-weight:660;letter-spacing:-.01em;margin-bottom:4px;display:flex;align-items:center;gap:10px}
section h2 .no{font-size:12px;color:var(--accent);font-weight:700;background:var(--tint);
  border-radius:8px;padding:2px 9px;flex:0 0 auto}
section h3{font-size:14.5px;font-weight:640;margin:22px 0 10px;color:var(--ink)}
section h3::before{content:'';display:inline-block;width:8px;height:8px;border-radius:2px;
  background:var(--accent);margin-right:8px;vertical-align:1px}
section h4{font-size:13px;font-weight:620;margin:16px 0 8px}
section p{margin:10px 0}
section ul,section ol{margin:10px 0 10px 22px}
section li{margin:4px 0}
section code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px;
  background:var(--soft);border:1px solid var(--line);border-radius:5px;padding:1px 6px;color:var(--accent-deep)}
hr{border:none;border-top:1px solid var(--line-strong);margin:20px 0}

/* 表格 */
.tbl{overflow-x:auto;margin:14px 0;border:1px solid var(--line);border-radius:11px}
.tbl table{width:100%;border-collapse:collapse;font-size:13px}
.tbl th{text-align:left;font-size:11px;letter-spacing:.05em;color:var(--muted);
  padding:9px 13px;border-bottom:1px solid var(--line);background:var(--soft);font-weight:600;white-space:nowrap}
.tbl td{padding:9px 13px;border-bottom:1px solid var(--line-strong);vertical-align:top}
.tbl tr:last-child td{border-bottom:none}
.tbl td strong,.tbl td code{white-space:nowrap}

/* 引用 / 提示块 */
.callout{border-left:3px solid var(--amber);background:color-mix(in srgb,var(--amber) 8%,var(--panel));
  border-radius:0 10px 10px 0;padding:12px 16px;margin:14px 0}
.callout p{margin:4px 0;font-size:13.5px}
.callout.warn{border-left-color:var(--danger);background:color-mix(in srgb,var(--danger) 7%,var(--panel))}
.callout.ok{border-left-color:var(--ok);background:color-mix(in srgb,var(--ok) 8%,var(--panel))}

.code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;line-height:1.7;
  background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:14px 16px;overflow-x:auto;margin:12px 0;color:var(--muted)}

.video-sec video{width:100%;border-radius:12px;display:block;background:#000;box-shadow:var(--shadow)}
.vd-s{font-size:13px;color:var(--muted);margin-bottom:14px}

/* 图文配图 */
.shot{margin:18px 0;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--soft)}
.shot img{width:100%;height:auto;display:block}
.shot figcaption{font-size:12px;color:var(--muted);padding:10px 14px;border-top:1px solid var(--line-strong);background:var(--panel)}
.shots-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
.shots-grid .shot{margin:0}


/* 四步流程 */
.flow{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}
.flow .stp{background:var(--soft);border:1px solid var(--line);border-radius:12px;padding:14px 15px;position:relative}
.flow .stp .n{font-size:11px;font-weight:700;color:var(--accent);background:var(--tint);
  width:22px;height:22px;border-radius:7px;display:flex;align-items:center;justify-content:center;margin-bottom:9px}
.flow .stp b{font-size:13px;display:block;margin-bottom:4px}
.flow .stp span{font-size:11.5px;color:var(--muted);line-height:1.6}
.flow .stp::after{content:'';position:absolute;right:-11px;top:50%;width:8px;height:8px;
  border-top:2px solid var(--faint);border-right:2px solid var(--faint);transform:translateY(-50%) rotate(45deg)}
.flow .stp:last-child::after{display:none}

footer{padding:30px 40px 60px;text-align:center;color:var(--faint);font-size:12px}

[data-lang="en"] .zh{display:none}
[data-lang="zh"] .en{display:none}

@media(max-width:860px){
  .toc{display:none}
  .content{padding:20px 16px 60px}
  .flow{grid-template-columns:1fr 1fr}
  .flow .stp::after{display:none}
}
</style>
</head>
<body data-theme="light" data-lang="zh">
<div class="topbar">
  <div class="logo">牛</div>
  <div class="tt">牛牛 AI 使用教程<span>新手版 · 30 分钟跑通「安装 → 连接 → 下单 → 平仓」</span></div>
  <div class="sp"></div>
  <div class="ctl">
    <button id="langZh" class="on" onclick="setLang('zh')">中文</button>
    <button id="langEn" onclick="setLang('en')">EN</button>
    <button id="themeBtn" onclick="toggleTheme()">日/夜</button>
  </div>
</div>
<div class="wrap">
  <nav class="toc">
    <div class="toc-h">目录</div>
    <div class="zh">''' + ''.join(f'<a href="#{sid}" data-toc="{sid}">{esc(t)}</a>' for sid, t in toc) + '''</div>
    <div class="en" style="display:none">''' + ''.join(f'<a href="#{sid}" data-toc="{sid}">{esc(EN[k][0])}</a>' for k, (sid, t) in zip([str(n) for n in range(1, 11)], toc)) + '''</div>
  </nav>
  <main class="content">
    <div class="hero zh">
      <h1>牛牛 AI 客户端使用教程（新手版）</h1>
      <div class="sub">适用版本 v1.0 · 仅 Windows 64 位 · <strong style="color:var(--danger)">测试阶段请只用模拟账户</strong>。<br>
      目标：照着做，30 分钟内在模拟盘跑通全流程。第 1 章搞懂是什么 → 第 2 章装好（四步闭环）→ 第 3~7 章按页面用 → 出问题查第 8 章。</div>
      <div class="meta"><span>v1.0</span><span>Windows x64</span><span>模拟盘优先</span><span>协议 v1</span></div>
    </div>
    <div class="hero en" style="display:none">
      <h1>NiuNiu AI · User Guide (Beginner)</h1>
      <div class="sub">v1.0 · Windows x64 · <strong style="color:var(--danger)">Demo accounts only during testing</strong>. A condensed English reference; the full guide is in Chinese.</div>
      <div class="meta"><span>v1.0</span><span>Windows x64</span><span>Demo-first</span></div>
    </div>
__VIDEO_SECTION__
''' + '\n'.join(body) + '''
  </main>
</div>
<footer>牛牛 AI · 执行工具，不构成投资建议 · 测试阶段仅限模拟账户</footer>
<script>
function setLang(l){document.body.setAttribute('data-lang',l);
  document.getElementById('langZh').classList.toggle('on',l==='zh');
  document.getElementById('langEn').classList.toggle('on',l==='en');
  var enToc=document.querySelector('.toc .en');
  if(enToc)enToc.style.display=l==='en'?'block':'none';
  var zhToc=document.querySelector('.toc .zh');
  if(zhToc)zhToc.style.display=l==='zh'?'block':'none';
}
function toggleTheme(){var b=document.body;var n=b.getAttribute('data-theme')==='dark'?'light':'dark';
  b.setAttribute('data-theme',n);try{localStorage.setItem('nn-tut-theme',n);}catch(e){}}
try{var t=localStorage.getItem('nn-tut-theme');if(t)document.body.setAttribute('data-theme',t);}catch(e){}
var tocLinks=document.querySelectorAll('.toc a');
var secs=[].map.call(tocLinks,function(a){return document.querySelector(a.getAttribute('href'));});
var observer=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){
  tocLinks.forEach(function(a){a.classList.toggle('on',a.getAttribute('data-toc')===e.target.id);});}});},
  {rootMargin:'-15% 0px -70% 0px'});
secs.forEach(function(s){if(s)observer.observe(s);});
</script>
</body>
</html>
'''

html = html.replace('__VIDEO_SECTION__', VIDEO_SECTION)
io.open(OUT, 'w', encoding='utf-8').write(html)
print('已生成', os.path.relpath(OUT, ROOT), f'({len(html)/1024:.1f} KB)')
