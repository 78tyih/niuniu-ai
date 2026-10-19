kimi version 2.1.1
• The user wants a tutorial written as `answer-tutorial.md`. This is a documentation writing task based on the brief. Let me look at existing docs to align facts (docs/操作步骤.md, site/牛牛AI-使用教程.html) so I don't contradict real UI. Let me quickly check existing docs to ground facts.

  I could delegate exploration, but I should at least glance at key files to confirm UI labels, page names, receipt statuses. Let me read docs/操作步骤.md and maybe src/ui to verify page names and button labels.

• 我先核对现有文档与客户端真实界面文案，避免教程与实现脱节。ai-gateway/src:
auth.js
billing.js
config.js
mint.js
pricing.js
server.js
store.js
upstream.js

ea:
NiuNiuBridge.ex5
NiuNiuBridge.mq5
NiuNiuStrategy.mq5

src/bridge:
index.js
protocol.js

src/ui:
app.js
index.html

strategies:
NN-T01-trend-pullback.json
NN-T02-range-breakout.json
NN-T03-bounded-mean-reversion.json
README.md
index.json


• I need to check the new 6-page UI to get real labels. Read src/ui/index.html (or app.js) and strategies README/index.json, and maybe NiuNiuStrategy.mq5 params. Let me read index.html and strategies/README.md, and grep NiuNiuStrategy.mq5 for input params.    451 src/ui/index.html
    507 src/ui/app.js
     49 strategies/README.md
     33 strategies/index.json
    556 ea/NiuNiuStrategy.mq5
   1596 total
Interesting — the actual UI differs slightly from the brief: 策略广场 page shows "规划中" placeholder (not a list with subscribe), and AI 副驾驶 page is placeholder. The brief says 策略广场 lists three templates with subscribe, but the actual UI says "策略广场规划中". The brief says "不编造：界面里没有的按钮不要写". The brief's section 4 says "策略广场怎么用（三个模板是啥 / 订阅 / 风险预算）". There's tension: brief describes 策略广场 with 订阅, but actual UI is a placeholder. I should follow the real UI: write that 策略广场 v1 is 规划中 (placeholder), and explain the three templates exist as files/EA and how to use them manually via 策略 EA (section 5). That respects "不编造". Also settings page lacks 教程/客服 entries in real UI — brief mentions 教程/客服. Real settings only has 主题/配色. I should not invent 教程/客服 buttons; I can note them as planned or just describe actual. Better: describe actual UI, note discrepancies briefly. Also topbar halt button: "运行中 · 点击停用" / "⛔ 已停用". 授权状态 bar exists (license). The brief didn't mention license but real UI has 授权状态 bar with NN1- key activation. Include it.

  Let me also quickly check app.js for 重新绑定 behavior and license behavior, and NiuNiuStrategy.mq5 input params for accurate parameter table. Let me grep inputs.I have enough grounding. Now write `answer-tutorial.md`. Key facts to respect:

  - 6 pages per brief: 概览 / 终端与 EA / 交易 / 策略广场 / AI 副驾驶 / 设置. Real UI: 策略广场 = 规划中 placeholder; AI 副驾驶 = v1 未开放 placeholder. Brief says "不编造" — so write 策略广场 as "规划中" in the page tour, and in section 4 （策略广场怎么用） explain honestly: 页面入口暂未开放（规划中），三个模板已经以策略 EA 形式可用，走第 5 章手动跑。订阅功能未开放。That's the honest approach.
  - Settings page real: only 主题/配色. Brief mentioned 教程/客服 — real UI doesn't have them; don't invent. I'll describe what's there and note nothing else exists.
  - 授权状态 bar (license NN1-…) exists globally — include it (activation needed before trading). Brief didn't mention but it's real UI; including is fine and helpful.
  - Topbar halt: 「运行中 · 点击停用」→「⛔ 已停用」.
  - Bridge EA params: InpAutoTrade=true must, InpDemoOnly=true testing.
  - Strategy EA params table with real values, Magic per template, risk budget guidance (0.5–0.7 for 2-3, 0.3–0.5 for 4-6, total ≤2.5%).
  - Receipts states.
  - point ≠ pip.
  - 待核对 rules.
  - 一键停用： real gate in main process, commands already sent still complete.
  - Netting vs hedging, InpCloseOnStop default false.
  - File locations for manual fallback.
  - Risk disclaimer, feedback checklist.

  Write the full tutorial now. Aim for practical 30-min quickstart. Keep tables heavy. Output file: answer-tutorial.md in working directory.

• 事实已核对完毕（界面真实文案、两个 EA 的真实参数、策略模板表）。开始写教程。

• Done. Summarize key decisions, especially where I deviated from the brief to stay truthful (策略广场订阅/设置页的教程客服 in brief vs actual UI).

• 已完成，教程写入 `answer-tutorial.md`（10 章全覆盖，可直接转 HTML）。

  写作前我核对了仓库里的真实实现，教程内容以代码为准，有 3 处与简报描述做了对齐修正（遵循「不编造」原则）：

  1. **策略广场**：简报说页面有「模板列表 / 订阅」，但 `src/ui/index.html:367-377` 实际只挂了「规划中」占位卡。教程里第 3.4、4.2 节明确写「订阅入口尚未开放，三个模板走策略 EA 手动跑」，没有虚构订阅按钮。
  2. **设置页**：简报提到「教程 / 客服」，实际页面只有主题和配色（`src/ui/index.html:393-415`），教程只写真实存在的两项。
  3. **补充了授权条**：界面顶部有全局「授权状态」条（`NN1-…` 密钥激活），简报未提但真实存在且未授权不能交易，已写进 2.2 安装步骤。

  其余关键机制均按真实参数落笔：
  - 桥接 EA 参数（`InpAutoTrade`/`InpDemoOnly` 等）取自 `ea/NiuNiuBridge.mq5:27-35`
  - 策略 EA 参数表（Magic 810001/2/3、风险预算 2.5% 上限、Netting/Hedging、`InpCloseOnStop` 默认不平仓）取自 `ea/NiuNiuStrategy.mq5` 与 `strategies/README.md`
  - 回执六状态、密钥「先安装后挂 EA」、待核对禁止重发、一键停用为真闸门等，与旧版 `docs/操作步骤.md` 的机制描述一致

  结构上：结论先行 + 步骤编号 + 大量表格（状态对照、故障排查、字段说明、参数表），并给出「手动兜底」文件路径，新手可按 2.1–2.5 的自检表确认四步闭环是否跑通。

To resume this session: kimi -r session_c5923188-fe50-4787-b0fb-98758ed320d6
