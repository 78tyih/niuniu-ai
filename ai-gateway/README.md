# 牛牛 AI 网关 · AI 代理 + 积分计费

零依赖 Node 服务（只用内置 `http` + `fetch`），可直接部署到 Zeabur / 任意容器。

**它解决三件事：**
1. 客户端永远拿不到模型 Key —— Key 只存在服务端，Electron 包里一个都没有
2. 积分：预扣 → 结算 → 失败全额退，每次调用都记成本，毛利可查
3. 上游可热切换：一家挂了自动换下一家，客户端无感

---

## 5 分钟跑起来

```bash
cd ai-gateway

# 1) 生成两个密钥（自己保存，别进仓库）
export SERVER_SECRET=$(openssl rand -hex 24)
export ADMIN_SECRET=$(openssl rand -hex 24)

# 2) 先不接真实模型，用 mock 跑通流程
export UPSTREAM_MOCK=1

# 3) 起服务
node src/server.js          # → http://localhost:8787

# 4) 签发一个用户 token
node src/mint.js --user demo --days 30

# 5) 充点积分，问一句
curl -X POST localhost:8787/v1/admin/topup \
  -H 'content-type: application/json' -H "x-admin-secret: $ADMIN_SECRET" \
  -d '{"userId":"demo","credits":100}'

curl -X POST localhost:8787/v1/chat \
  -H 'content-type: application/json' -H "authorization: Bearer <上一步的token>" \
  -d '{"tier":"fast","messages":[{"role":"user","content":"我现在持仓怎么样"}]}'
# → {"ok":true,"reply":"...","charged":1,"balance":99,...}
```

## 接真实模型

```bash
cp config/upstreams.example.json config/upstreams.json
# 填入真实 Key（config/ 已 gitignore）
unset UPSTREAM_MOCK
node src/server.js
```

`upstreams.json` 里每家都是 OpenAI 协议，`tier` 为 `fast` 或 `deep`，同档按顺序故障切换。
价格字段（`priceIn`/`priceOut`/`priceCacheIn`，单位：元/百万 token）用来算真实成本与毛利，
**上线前请对照官方价格页再核一次**（DeepSeek 有峰谷价，8 月刚调过一轮）。

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/healthz` | 健康检查，返回档位价与充值地址 |
| GET | `/v1/credits` | 查余额（需用户 token） |
| POST | `/v1/chat` | 问答。`{tier:'fast'|'deep', messages:[...]}` |
| POST | `/v1/admin/topup` | 充值（需 `x-admin-secret`） |
| POST | `/v1/admin/token` | 签发用户 token |
| GET | `/v1/admin/ledger` | 流水 + 成本/收入汇总 |

## 计费规则

- **按档计价**：`fast` = 1 积分，`deep` = 6 积分（环境变量可改），预扣上限即封顶，客户好理解
- **失败全额退**：上游报错/超时 → 502，积分一分不扣，并留一条 `refund` 流水
- **悬挂预扣清扫**：进程崩溃/重启留下的未结算预扣，启动时自动退款（默认 5 分钟超时）
- **成本照样记**：每次记 `usage` 和 `costCny`，单次成本超过收入 60% 会打毛利告警
- **限流**：默认每用户 20 次/分钟、300 次/天、同时在途 ≤2

## 硬边界（评审后补的，别删）

| 边界 | 默认 | 防的是什么 |
|---|---|---|
| 输入长度 | fast ≤8000 字 / deep ≤32000 字 | 只封输出不封输入 = 单次成本上不封顶 |
| 输出 max_tokens | fast 800 / deep 4000 | 输出成本封顶 |
| 超时总预算 | fast 45s / deep 180s（不是每家 60s×N） | 用户等三分钟，客户端早断连服务端还在跑 |
| failover 选择 | 只对超时 / 5xx / 429 切换下一家 | 4xx 换家也是被拒，白烧预算 |
| 空回复按失败 | 200 但内容为空 → 走退款 | "200 不等于成功" |
| 在途并发 | 每用户 ≤2 | 脚本并发 / 一号多人共享 |

## 环境变量

| 变量 | 默认 | 说明 |
|---|---|---|
| `SERVER_SECRET` | — | 必填，签发用户 token |
| `ADMIN_SECRET` | — | 必填，管理接口 |
| `UPSTREAMS_JSON` | — | 上游配置（不落文件时用） |
| `PORT` | 8787 | |
| `CREDIT_CNY` | 0.1 | 1 积分折合人民币 |
| `PRICE_FAST` / `PRICE_DEEP` | 1 / 6 | 档位积分价 |
| `MAXIN_FAST` / `MAXIN_DEEP` | 8000 / 32000 | 输入字符上限 |
| `BUDGET_FAST` / `BUDGET_DEEP` | 45000 / 180000 | 超时总预算（ms） |
| `MAX_INFLIGHT` | 2 | 每用户同时在途请求 |
| `HOLD_TTL_MS` | 300000 | 悬挂预扣自动退款时限 |
| `RATE_PER_MIN` / `RATE_PER_DAY` | 20 / 300 | 限流 |
| `RECHARGE_URL` | https://niuniuai.app/credits | 客户端「充值」按钮跳转地址 |
| `UPSTREAM_MOCK` | — | 1 = 不真调上游 |
| `NO_AUTH` | — | 1 = 跳过鉴权，**仅本地联调，线上必须关** |

## 测试

```bash
node test/smoke.js      # 14 项断言，不联网
```

## 还没做的（P1 及以后）

- 接 Supabase 做真实用户体系（现在 token 是自签的 HMAC）
- 接 ZPay / Stripe 回调自动充值（现在走 `/v1/admin/topup`）
- 账本换 Postgres（现在单文件 JSON，量大了再换）
- Function Calling：读行情 / 持仓
