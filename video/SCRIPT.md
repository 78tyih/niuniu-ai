# 牛牛 AI · 终端上手演示（66.4s）

一句话主题：**牛牛 AI 是装在自己电脑上的 MT5 交易副驾驶**——视频用真实界面截图 + 光标高光 + 点击放大，跑通「连接 → 挂 EA → 自检 → 人工下单 → AI 一键下单 → 二次确认」。

## 交付要求自检
- 封面页 ✓（标题 + 一句话主题 + 路线条）
- 结论页 ✓（三条安全底线 + 下一步 CTA）
- 逐句字幕 ✓（15 句，与 Sera 克隆旁白严格对齐）
- 先横版 ✓（1920×1080）
- 鼠标点击高光 ✓（光标滑动 + 光圈扩散 + 区域放大 + 标注框）

## 时间轴表
| 幕 | 内容 | start | 时长 | VO |
|---|---|---|---|---|
| S0 | 封面 | 0.0s | 9.1s | 7.3s |
| S1 | 连接 MT5 | 9.1s | 6.84s | 5.14s |
| S2 | 挂 EA | 15.9s | 8.8s | 7.3s |
| S3 | 自检 | 24.7s | 5.76s | 3.76s |
| S4 | 人工下单 | 30.5s | 8.48s | 6.58s |
| S5 | AI 建议 | 39.0s | 7.64s | 5.94s |
| S6 | 二次确认 | 46.6s | 8.14s | 6.34s |
| S7 | 结论 | 54.8s | 11.66s | 8.66s |

## 字幕表（逐句）
| # | 时间 | 字幕 |
|---|---|---|
| 1 | 0.4-3.8s | 这是牛牛 AI，装在你自己电脑上的 MT5 交易副驾驶。 |
| 2 | 4.1-7.7s | 两分钟，带你跑通从连接到下单的完整流程。 |
| 3 | 9.5-11.5s | 第一步，点「终端与EA」。 |
| 4 | 11.8-14.6s | 再点「安装桥接EA」，密钥自动写进MT5。 |
| 5 | 16.3-20.3s | 最后一步要手动：把牛牛桥接EA，拖到任意一张图表上。 |
| 6 | 20.6-23.6s | 勾选允许算法交易，把InpAutoTrade改成true。 |
| 7 | 25.1-28.9s | 回到概览页，余额和行情都有数字，就说明连上了。 |
| 8 | 30.9-34.3s | 人工下单，点「交易」页，填好方向和手数。 |
| 9 | 34.6-37.5s | 点「确认下单」，回执显示已成交，才算数。 |
| 10 | 39.4-42.1s | 也可以让AI帮你，点「生成示例建议」。 |
| 11 | 42.4-45.3s | 方向、点位、止损，一张卡片看全。 |
| 12 | 47.0-50.1s | 点「一键下单」，二次确认后，命令才会交给EA。 |
| 13 | 50.5-53.4s | 手数由系统按风险计算，AI不碰数字。 |
| 14 | 55.2-59.6s | 记住三件事：止损必带，下单必二次确认，结果以MT5为准。 |
| 15 | 60.0-63.8s | 现在，去策略广场挑一个模板，跑起你的第一笔模拟单吧。 |

## 一条命令重出
```bash
# 1) 改文案：编辑 tools/vo_lines.json
# 2) 逐句克隆配音（SeraWin 后台 ~5min）
scp tools/vo_lines.json tools/sera_vo_lines.py tools/sera_vo_lines.ps1 serawin:"D:/AI/Voice/Qwen3-TTS/clone-test/"
# 用 UTF-16LE EncodedCommand 远程执行 sera_vo_lines.ps1（见 hyperframes-narrated-explainer 技能）
scp 'serawin:D:/AI/Voice/Qwen3-TTS/clone-test/nn-lines/*.wav' assets/vo/lines/
# 3) 拼装 + 编译 + BGM + 渲染
python3 tools/build_vo.py && python3 tools/timeline.py
python3 tools/make_bgm.py --duration <timeline 输出的 total>
npx --yes hyperframes@0.7.110 lint && npx --yes hyperframes@0.7.110 check
npx --yes hyperframes@0.7.110 render --quality high --video-bitrate 12M -o renders/master.mp4
ffmpeg -y -i renders/master.mp4 -c:v libx264 -crf 29 -preset medium -c:a aac -b:a 112k -movflags +faststart renders/tutorial-web.mp4
python3 tools/make-tutorial-html.py   # 在仓库根目录跑，重嵌教程 HTML
```

## 锚点机制
动画全部挂在「第几幕第几句」上（timeline.py 的 CUES 区），配音变快变慢整条时间轴自动重排：
- `glide` 光标滑动 · `ring` 点击光圈（repeat 扩散）· `zoom` 区域放大（transformOrigin=点击点）
- 放大后光标/光圈/标注框在缩放容器内部，随画面一起放大，永远钉在按钮上

## 本版踩坑记录
1. CSS 自然态 opacity:0 的元素（光标/标注框）不能用 tl.from 点亮——from 会动画到自然值 0，必须 fromTo 显式 0→1（timeline.py 的 show 模式）。
2. S4 放大原点贴字幕区会压住按钮，origin 下移到 y=1000 把按钮推离字幕带。
3. 目录 scrollspy 观察细 h2 不可靠，改为观察整章 section + scroll 判定线（scrollY+140）。
