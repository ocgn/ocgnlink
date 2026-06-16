# 酒店对比平台

纯前端 + CloudFlare Workers 酒店数据对比平台。

## 功能

- 🔍 搜索酒店（支持城市和关键词）
- 📊 美团和携程数据并排对比
- 🗺️ 高德地图展示位置
- 🤖 AI 智能分析推荐

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + TailwindCSS + Pinia |
| API | CloudFlare Workers (Hono) |
| 地图 | 高德地图 JS API |
| AI | OpenAI / Claude / DeepSeek |
| 部署 | CloudFlare Pages + Workers |

## 本地开发

```bash
# 安装依赖
npm install
cd frontend && npm install
cd ../workers && npm install

# 启动前端（需要先启动 API Worker）
cd workers && wrangler dev --config ../wrangler-api.toml
cd frontend && npm run dev

# 启动 MCP Server
cd workers && wrangler dev --config ../wrangler-mcp.toml
```

## 环境变量

通过 `wrangler secret` 设置：

| 变量 | 说明 |
|------|------|
| `AMAP_API_KEY` | 高德地图 API Key |
| `OPENAI_API_KEY` | OpenAI API Key |
| `CLAUDE_API_KEY` | Claude API Key |
| `DEEPSEEK_API_KEY` | DeepSeek API Key |
| `MEITUAN_COOKIES` | 美团 Cookie（可选） |
| `CTRIP_COOKIES` | 携程 Cookie（可选） |

## 部署

推送 `main` 分支到 GitHub，CloudFlare 会自动构建部署：

- 前端 → CloudFlare Pages
- API Worker → `ocgnlink-api`
- MCP Worker → `ocgnlink-mcp`
