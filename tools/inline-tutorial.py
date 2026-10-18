#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 docs/使用教程.html 变成「单文件离线版」：图片全部 base64 内嵌。

  python3 tools/inline-tutorial.py
产物：site/牛牛AI-使用教程.html   ← 直接转发给客户，双击就能看，不依赖任何外部文件
"""
import base64
import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'docs', '使用教程.html')
SHOTS = os.path.join(ROOT, 'docs', 'shots')
OUT = os.path.join(ROOT, 'site', '牛牛AI-使用教程.html')   # site/ 进仓库；dist/ 是打包产物、被 ignore

MIME = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml'}


def main():
    html = io.open(SRC, encoding='utf-8').read()

    def repl(m):
        rel = m.group(1)
        f = os.path.join(ROOT, 'docs', rel)
        if not os.path.exists(f):
            print('  !! 缺图: ' + rel)
            return m.group(0)
        ext = os.path.splitext(f)[1].lower()
        b64 = base64.b64encode(open(f, 'rb').read()).decode('ascii')
        print('  %-28s %6.0f KB' % (rel, len(b64) / 1024 * 0.75))
        return 'src="data:%s;base64,%s"' % (MIME.get(ext, 'image/png'), b64)

    print('内嵌图片:')
    html = re.sub(r'src="(shots/[^"]+)"', repl, html)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    io.open(OUT, 'w', encoding='utf-8').write(html)
    sz = os.path.getsize(OUT)
    print('\n完成 → %s  (%.1f MB)' % (OUT, sz / 1024 / 1024))
    left = re.findall(r'src="shots/', html)
    print('未内嵌引用: %d' % len(left))


if __name__ == '__main__':
    main()
