# fangzhifan-cyberpunk
赛博朋克风格个人主页 - FANGZHIFAN

## 部署

- `main` 分支由 Cloudflare Pages 自动构建并发布网站静态文件。
- `worker-script.js` 由 Cloudflare Workers Builds 按 `wrangler.jsonc` 自动发布。
- Worker 使用 Cloudflare KV 保存留言；`RESEND_API_KEY` 仅配置为 Cloudflare Secret，不写入仓库。

## 对话口（/chat/）

`/chat/` 是站内助手页面，前端为纯静态（`chat/index.html`、`assets/chat.css`、`assets/chat.js`），
后端复用同一个 Worker：`/api/chat/session` 发放会话令牌，`/api/chat` 以 SSE 流式转发 DeepSeek 回复。

**上线前需要在 Worker 里补一个 Secret**（Workers → fangzhifan-guestbook → Settings → Variables and Secrets）：

| 名称 | 必需 | 说明 |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | 是 | DeepSeek API 密钥，只存 Secret，不写入仓库。未配置时页面进入“演示模式”，会回一段占位说明 |
| `CHAT_TOKEN_SECRET` | 否 | 会话令牌签名密钥；缺省时由 `DEEPSEEK_API_KEY` 派生 |
| `DEEPSEEK_MODEL` | 否 | 默认 `deepseek-chat` |

防滥用（全部在 Worker 端，阈值见 `worker-script.js` 中的 `CHAT`）：

- 只接受本站页面发起的浏览器请求（校验 `Origin` / `Sec-Fetch-Site` / `User-Agent`），curl 与跨站页面直接 403。
- 会话令牌：HMAC 签名、30 分钟有效、绑定访客 IP 指纹；前端到期自动续期。
- 限速（存于 `GUESTBOOK_KV`）：同一 IP 两次提问最短间隔 2.5 秒、每分钟 6 次、每小时 40 次；全站每天 400 次总量以保护账单。
- 单条消息最长 2000 字，单次最多携带 12 条历史；隐藏蜜罐字段被填写则静默丢弃。
- KV 计数为尽力而为（最终一致），用于遏制滥用而非精确计费。

本地调试：

```bash
npx wrangler dev --port 8787            # .dev.vars 中放 DEEPSEEK_API_KEY=...
python3 -m http.server 8788             # 另开终端，静态文件
```

静态站与 Worker 不同源时前端会被来源校验拦下，本地联调请用一个把 `/api/*` 反代到 8787 的小代理，或直接在 Cloudflare 预览环境验证。
