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

- 校验 `Origin` / `Sec-Fetch-Site` / `User-Agent`，拒绝不符合来源要求的请求；请求头可被脚本伪造，不应将此视为身份认证或完整的防机器人措施。
- 会话令牌：HMAC 签名、30 分钟有效、绑定访客 IP 指纹；前端到期自动续期。
- 限速（存于 `GUESTBOOK_KV`）：同一 IP 两次提问最短间隔 2.5 秒、每分钟 6 次、每小时 40 次；全站每天 400 次为软限制，并发下可能超出。
- 单条消息最长 2000 字，单次最多携带 12 条历史；隐藏蜜罐字段被填写则静默丢弃。
- KV 计数为尽力而为（最终一致），用于遏制滥用而非精确计费；读写失败时拒绝调用模型。正式运营应同时设置服务商预算或额度，严格全局限制需使用强一致计数服务。
- 请求正文上限 100 KB，模型请求总时限 60 秒；流式响应未正常结束时显示失败，可重试。
- 本站不主动持久化对话正文，但会转发给 DeepSeek；勿输入敏感信息。公开留言响应不含联系邮箱。

## 回归测试

使用 Node.js 20.19+，运行 `npm ci && npm test`。测试包含留言隐私、令牌刷新、断线重连、停止、流式中断、请求边界和限流故障，全部使用模拟数据，不调用真实模型或写入线上留言。

发布时分别确认 Pages 与 Worker 的成功记录和提交 SHA；Pages 成功不代表 Worker 已更新。最后检查两个域名的 `/api/health`、`/chat/` 与已有留言读取。审计修订版本为 `3.6.3`。

本地调试：

```bash
npx wrangler dev --port 8787            # .dev.vars 中放 DEEPSEEK_API_KEY=...
python3 -m http.server 8788             # 另开终端，静态文件
```

静态站与 Worker 不同源时前端会被来源校验拦下，本地联调请用一个把 `/api/*` 反代到 8787 的小代理，或直接在 Cloudflare 预览环境验证。
