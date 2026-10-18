#!/bin/bash
# 打一个可以直接转发给测试人员的交付包
#
#   ./tools/make-package.sh
#
# 产出：dist/NiuNiuAI-v1-test-package.zip
#
# 设计取舍：压缩包内的目录/文件名一律用 ASCII —— 中文名的 zip 在 Windows 上解压
# 经常乱码（取决于系统区域设置和 zip 的 UTF-8 标志位）。中文全部放在文档内容里。
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
DIST="$ROOT/dist"
STAGE="$ROOT/.build/pkg"
VER="$(/Users/a1234/.workbuddy/binaries/node/versions/22.22.2-6/bin/node -e "process.stdout.write(require('$ROOT/package.json').version)")"
APP="NiuNiuAI-v1"

echo "==> 1/4 检查安装包"
INSTALLER="$DIST/NiuNiuAI-Setup-$VER.exe"
if [ ! -f "$INSTALLER" ]; then
  echo "    没找到 $INSTALLER"
  echo "    请先构建：npm run build:win"
  exit 1
fi
ls -lh "$INSTALLER" | awk '{print "    "$9" ("$5")"}'

echo "==> 2/4 组装目录"
rm -rf "$STAGE"; mkdir -p "$STAGE/$APP"/{01-Installer,02-EA,03-Manual,04-Source}

cp "$INSTALLER"                      "$STAGE/$APP/01-Installer/"
cp "$ROOT/ea/NiuNiuBridge.ex5"       "$STAGE/$APP/02-EA/"
cp "$ROOT/ea/NiuNiuBridge.mq5"       "$STAGE/$APP/02-EA/"
# 单文件离线教程（图片全部内嵌，转发即用）
cp "$ROOT/site/牛牛AI-使用教程.html"  "$STAGE/$APP/03-Manual/Tutorial-ZH.html" 2>/dev/null \
  || { echo "    !! 单文件教程还没生成，先跑 python3 tools/inline-tutorial.py"; cp "$ROOT/docs/使用教程.html" "$STAGE/$APP/03-Manual/Tutorial-ZH.html"; }
cp "$ROOT/README.md"                 "$STAGE/$APP/03-Manual/README-dev.md"

# 源码：给技术同事排查用，排除 node_modules / dist / 构建中间产物
( cd "$ROOT" && tar -cf - --exclude='./node_modules' --exclude='./dist' --exclude='./.build' \
    --exclude='./.git' src ea test tools package.json package-lock.json 2>/dev/null ) \
  | ( cd "$STAGE/$APP/04-Source" && tar -xf - )

cat > "$STAGE/$APP/README-FIRST.txt" <<'TXT'
牛牛 AI v1 · 交付包
================================================================

先看什么
--------
1) 双击  03-Manual/Tutorial-ZH.html   ← 单文件图文教程（含你的授权密钥），双击即开
   里面有安装、激活、挂 EA、下单、平仓、排错的完整步骤和真实界面截图。
2) 装软件  01-Installer/NiuNiuAI-Setup-1.0.0.exe
   （Windows 会提示"已保护你的电脑"，点"更多信息"→"仍要运行"，测试版没买签名证书。）
3) 打开软件，把教程页顶部「你的授权密钥」整串复制，粘到软件顶部授权框，点「激活」。

EA 文件在  02-EA/
   正常情况下你不需要手动装 —— 软件里点一下"安装桥接 EA"就会自动装好。
   这两个文件是给你手动兜底 / 审计用的：
     NiuNiuBridge.ex5  编译好的 EA（客户机不需要 MetaEditor）
     NiuNiuBridge.mq5  源码，可自行审阅
   手动安装位置：
     %APPDATA%\MetaQuotes\Terminal\<实例ID>\MQL5\Experts\

04-Source/ 是完整源码，给技术同事排查用，普通使用可以忽略。


三个最容易踩的坑（提前说，省你时间）
------------------------------------
1) 挂上 EA 之后，必须在 EA 属性 → 输入参数里把 InpAutoTrade 改成 true。
   默认是 false，不改的话能连上、能看行情，但一下单就被拒。

2) 必须先点软件里的"安装桥接 EA"，再去 MT5 里挂 EA。顺序反了 EA 拿不到密钥。
   如果顺序已经错了：把 EA 从图表移除，重新拖一次。

3) 只支持模拟账户（InpDemoOnly=true 是默认值）。用实盘下单会被拒，回执写"仅允许模拟盘"。
   测试阶段请不要用真实资金。


这个版本做了什么、没做什么
--------------------------
做了：找到本机 MT5 / 一键市价下单 / 一键平仓 / 实时账户与持仓 / 命令签名鉴权 /
      三层防重复执行 / 全局急停 / 日志导出

没做：AI 聊天与分析（界面上那块是占位说明，v1 不接模型）
      自动更新
      macOS 版本

关于"待核对"：下单结果不明时，软件会显示"待核对"而不是给你一个假的"已成交"。
这是刻意设计——此时请去 MT5 看真实持仓，不要重复下单。
TXT

# 授权密钥（由环境变量或默认签发记录写入）
KEY="${NN_KEY:-NN1-eyJ2IjoxLCJpIjoiTk4tMjAyNi0wMDAxIiwibiI6IuWwiui0teWuouaItyIsImUiOiIyMDI2LTEwLTMxIiwicyI6MX0.Hwr0BjqT11eks1dH_H0UEfYpOyNDAH_LF_bfCjN_3a27RljiUG60BBLC8M8u3ddP7B9GI3QcigGMj4FTJ1i3CQ}"
KID="${NN_KEY_ID:-NN-2026-0001}"
KEXP="${NN_KEY_EXP:-2026-10-31}"
cat > "$STAGE/$APP/LICENSE-KEY.txt" <<TXT
牛牛 AI 授权密钥
================================================================
授权号：$KID
到期日：$KEXP
席位数：1
有效期：15 天（体验授权）

密钥（复制下面整行，含开头的 NN1-，粘贴到软件顶部授权框，点「激活」）：

$KEY

说明：
- 离线验签（Ed25519），激活不需要联网，也不上传任何数据。
- 密钥与本机无关，换电脑也可以用；请勿公开转发。
- 到期后软件仍可看行情，但无法下单；续期会给新密钥。
TXT
echo "    已写入 LICENSE-KEY.txt ($KID)"

echo "==> 3/4 打包"
ZIP="$DIST/NiuNiuAI-v1-package.zip"
rm -f "$ZIP"
( cd "$STAGE" && zip -rq "$ZIP" "$APP" -x '*.DS_Store' )

echo "==> 4/4 完成"
echo
du -sh "$ZIP" | awk '{print "    压缩包: "$2"  ("$1")"}'
echo
echo "包内结构："
( cd "$STAGE" && find "$APP" -maxdepth 2 | sort | sed 's/^/    /' )
