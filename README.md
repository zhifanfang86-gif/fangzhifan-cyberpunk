# fangzhifan-cyberpunk
赛博朋克风格个人主页 - FANGZHIFAN

## 部署

- `main` 分支由 Cloudflare Pages 自动发布网站静态文件。
- `worker-script.js` 由 Cloudflare Workers Builds 按 `wrangler.jsonc` 自动发布。
- Worker 使用 Cloudflare KV 保存留言；`RESEND_API_KEY` 仅配置为 Cloudflare Secret，不写入仓库。
