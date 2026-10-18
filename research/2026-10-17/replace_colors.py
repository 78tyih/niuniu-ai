#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import io, sys

p = '/Users/a1234/projects/WorkBuddy/2026-10-15-09-27-05/niuniu-ai/dist/牛牛AI-iOS应用端预览.html'
s = io.open(p, encoding='utf-8').read()

# 先替换更长的模式（1.5px 在 1px 前）
rules = [
    ('border:1.5px solid #E4E6EA', 'border:1.5px solid var(--border)'),
    ('border:1px solid #E4E6EA', 'border:1px solid var(--border)'),
    ('border:1px dashed rgba(14,42,92,.22)', 'border:1px dashed var(--border-strong)'),
    ('border-bottom:1px solid #F0F1F4', 'border-bottom:1px solid var(--divider-strong)'),
    ('background:#E9EBEF', 'background:var(--shell-bg)'),
    ('background:#F5F6F8', 'background:var(--card-bg-elevated)'),
    ('background:#F7F8FA', 'background:var(--card-bg-elevated)'),
    ('background:#FFF1EB', 'background:var(--tint-orange)'),
    ('background:#FAFBFC', 'background:var(--input-bg)'),
    ('background:#E8EAEE', 'background:var(--seg-bg)'),
    ('background:#D9DDE3', 'background:var(--grab)'),
    ('background:#fff', 'background:var(--card-bg)'),
    # 橙底白字实心按钮 → 深色加深
    ('background:var(--brand-orange);color:#fff', 'background:var(--btn-primary);color:#fff'),
    ('background:var(--brand-orange-deep)', 'background:var(--btn-primary-active)'),
]

report = []
for old, new in rules:
    n = s.count(old)
    if n:
        s = s.replace(old, new)
        report.append(f'  {old}  ->  {new}  ({n} 处)')

io.open(p, 'w', encoding='utf-8').write(s)
print('\n'.join(report) if report else '无匹配')
print('--- 剩余硬编码 #fff(背景) 检查 ---')
import re
for m in re.finditer(r'background:#[0-9A-Fa-f]{3,8}', s):
    print('  残留:', m.group(0))
