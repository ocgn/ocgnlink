# 酒店对比平台设计规格

**日期：** 2026-06-16
**状态：** 已批准

## 1. 项目概述

一个纯前端 + CloudFlare Workers 的酒店数据对比平台，集成高德地图 MCP Server，支持美团和携程酒店数据对比，内置 AI 分析推荐功能。全部通过 CloudFlare 连接 GitHub 仓库自动部署。

## 2. 架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────┐
│                   CloudFlare                      │
│                                                   │
│  ┌──────────────┐    ┌──────────────────────────┐ │
│  │  Pages (前端)  │    │    Workers (API 后端)     │ │
│  │  Vue 3 + Vite │───▶│                          │ │
│  │  静态文件托管   │    │  /api/hotels  → 酒店代理   │ │
│  └──────────────┘    │  /api/ai      → AI 分析    │ │
│                      │  /api/map     → 高德代理   │ │
│                      └──────────────────────────┘ │
│                                                   │
│  ┌──────────────────────────────────────────────┐ │
│  │    Workers (MCP Server)                       │ │
│  │    高德地图 MCP Server (SSE/HTTP)              │ │
│  └──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
    高德地图 API    美团/携程 API    AI 模型 API
   (REST API)    (代理+解析)    (OpenAI/Claude/...)
```

### 2.2 技术栈

| 层级 | 技术 | 部署目标 |
|------|------|----------|
| 前端 | Vue 3 + Vite + TailwindCSS + Pinia | CloudFlare Pages |
| API 后端 | CloudFlare Workers (TypeScript) | CloudFlare Workers |
| MCP Server | CloudFlare Workers (TypeScript) | CloudFlare Workers (独立) |
| 地图展示 | 高德地图 JS API | 前端直接加载 |
| AI 模型 | OpenAI / Claude / DeepSeek 等 | Workers 代理调用 |

### 2.3 Monorepo 结构

```
ocgnlink/
├── frontend/                # Vue 3 前端
│   ├── src/
│   │   ├── views/           # 页面组件
│   │   │   ├── Home.vue     # 首页搜索
│   │   │   ├── Search.vue   # 搜索结果 + 地图
│   │   │   └── Compare.vue  # 对比详情
│   │   ├── components/      # 通用组件
│   │   │   ├── HotelCard.vue
│   │   │   ├── MapView.vue
│   │   │   └── AiPanel.vue
│   │   ├── stores/          # Pinia 状态管理
│   │   ├── api/             # API 调用封装
│   │   ├── config/          # 前端配置
│   │   ├── router/          # Vue Router
│   │   ├── App.vue
│   │   └── main.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── workers/                 # CloudFlare Workers
│   ├── api/                 # API Worker
│   │   ├── index.ts         # 入口 + 路由
│   │   ├── hotels/          # 酒店数据代理
│   │   │   ├── meituan.ts   # 美团代理
│   │   │   └── ctrip.ts     # 携程代理
│   │   ├── ai/              # AI 模型调用
│   │   │   └── analyze.ts
│   │   └── map/             # 高德 API 代理
│   │       └── search.ts
│   ├── mcp/                 # MCP Server Worker
│   │   ├── index.ts         # MCP Server 入口
│   │   ├── tools/           # MCP 工具
│   │   │   ├── search.ts    # 地点搜索
│   │   │   ├── geocode.ts   # 地理编码
│   │   │   ├── nearby.ts    # 周边搜索
│   │   │   └── route.ts     # 路线规划
│   │   └── amap-client.ts   # 高德 API 封装
│   ├── shared/              # 共享工具
│   │   ├── cors.ts
│   │   ├── config.ts
│   │   └── types.ts
│   └── package.json
├── config/                  # 配置文件
│   ├── models.json          # 模型配置
│   └── amap.json            # 高德配置
├── docs/
├── wrangler.toml            # CloudFlare 部署配置
├── package.json             # 根 package.json (workspace)
└── README.md
```

## 3. 配置系统

### 3.1 模型配置 (`config/models.json`)

```json
{
  "models": {
    "default": "openai",
    "providers": {
      "openai": {
        "name": "OpenAI",
        "endpoint": "https://api.openai.com/v1/chat/completions",
        "apiKey": "sk-xxx",
        "model": "gpt-4o",
        "maxTokens": 4096
      },
      "claude": {
        "name": "Claude",
        "endpoint": "https://api.anthropic.com/v1/messages",
        "apiKey": "sk-ant-xxx",
        "model": "claude-sonnet-4-20250514",
        "maxTokens": 4096
      },
      "deepseek": {
        "name": "DeepSeek",
        "endpoint": "https://api.deepseek.com/v1/chat/completions",
        "apiKey": "sk-xxx",
        "model": "deepseek-chat",
        "maxTokens": 4096
      }
    }
  },
  "amap": {
    "apiKey": "your-amap-key",
    "baseUrl": "https://restapi.amap.com/v3"
  }
}
```

### 3.2 敏感信息管理

- API Key 通过 `wrangler secret` 注入，不提交到代码仓库
- `config/models.json` 中的 `apiKey` 字段仅作格式参考，实际运行时从环境变量读取
- 前端只读取模型名称列表等非敏感信息

## 4. 酒店数据模块

### 4.1 数据流

```
用户输入城市/地点
    ↓
前端调用 /api/map/search → 高德 API 获取 POI 坐标
    ↓
前端并行调用：
  /api/hotels/meituan?city=xxx&lat=xx&lng=xx  → Workers 代理 → 美团 API
  /api/hotels/ctrip?city=xxx&lat=xx&lng=xx    → Workers 代理 → 携程 API
    ↓
Workers 解析返回数据，统一格式
    ↓
前端展示对比表格
    ↓
用户可选 → /api/ai/analyze → AI 分析推荐
```

### 4.2 统一酒店数据格式

```typescript
interface Hotel {
  name: string;           // 酒店名称
  price: number;          // 价格（元/晚）
  rating: number;         // 评分（0-5）
  address: string;        // 地址
  distance: number;       // 距搜索中心距离（米）
  source: 'meituan' | 'ctrip';  // 数据来源
  url: string;            // 原始链接
  images: string[];       // 图片列表
  facilities: string[];   // 设施列表
  roomType: string;       // 房型
}
```

### 4.3 反爬策略

- 使用移动端 H5 接口（反爬较 PC 端弱）
- 模拟移动端 User-Agent 和 Referer
- Workers 层做请求频率限制
- 响应数据缓存（KV 缓存，TTL 5 分钟）

## 5. 高德 MCP Server

### 5.1 工具列表

| 工具名 | 功能 | 参数 |
|--------|------|------|
| `amap_search` | 地点搜索 | keyword, city, type |
| `amap_geocode` | 地理编码 | address |
| `amap_reverse_geocode` | 逆地理编码 | lat, lng |
| `amap_nearby` | 周边搜索 | lat, lng, radius, keyword |
| `amap_route` | 路线规划 | origin, destination, mode |

### 5.2 传输方式

- HTTP + SSE（适配 CloudFlare Workers 环境）
- 端点：`/sse` 建立连接，`/message` 接收工具调用

### 5.3 MCP 配置示例

```json
{
  "mcpServers": {
    "amap": {
      "url": "https://your-worker.workers.dev/sse"
    }
  }
}
```

## 6. AI 分析模块

### 6.1 功能

- 输入：酒店对比数据（美团 vs 携程）
- 输出：AI 分析推荐，包括性价比分析、评分对比、位置优劣等

### 6.2 Prompt 模板

```
你是一个酒店选择助手。以下是两个平台的酒店数据对比：

[美团数据]
{meituan_hotels}

[携程数据]
{ctrip_hotels}

请从价格、评分、位置、设施等方面进行对比分析，给出推荐建议。
```

### 6.3 模型调用

Workers 代理统一处理不同模型的 API 格式差异：
- OpenAI / DeepSeek：`/v1/chat/completions` 格式
- Claude：`/v1/messages` 格式
- 自动适配请求/响应格式

## 7. 前端页面

### 7.1 页面路由

| 路径 | 页面 | 功能 |
|------|------|------|
| `/` | Home | 搜索入口，城市选择 |
| `/search` | Search | 搜索结果，地图 + 酒店列表 |
| `/compare` | Compare | 对比详情，并排展示 |

### 7.2 组件设计

- **MapView** — 高德地图 JS API 封装，展示 POI 标记
- **HotelCard** — 单个酒店信息卡片，含价格、评分、图片
- **AiPanel** — AI 分析面板，展示模型推荐结果

## 8. 部署

### 8.1 CloudFlare 配置

**wrangler.toml：**

```toml
name = "ocgnlink-api"
main = "workers/api/index.ts"
compatibility_date = "2024-01-01"

[vars]
AMAP_API_KEY = "your-amap-key"

# API Worker 路由
[[routes]]
pattern = "your-domain.com/api/*"
zone_name = "your-domain.com"
```

**MCP Worker (独立)：**

```toml
name = "ocgnlink-mcp"
main = "workers/mcp/index.ts"
compatibility_date = "2024-01-01"
```

### 8.2 CI/CD 流程

1. 推送代码到 GitHub `main` 分支
2. CloudFlare Pages 自动构建前端（`cd frontend && npm run build`）
3. CloudFlare Workers 自动部署（`wrangler deploy`）
4. 前端通过 `/api/*` 路径调用 Workers API

### 8.3 环境变量

通过 `wrangler secret` 管理：
- `OPENAI_API_KEY` / `CLAUDE_API_KEY` / `DEEPSEEK_API_KEY`
- `AMAP_API_KEY`
- `MEITUAN_COOKIES`（如需要）
- `CTrip_COOKIES`（如需要）

## 9. 依赖清单

### 前端

- vue@3
- vue-router@4
- pinia
- @amap/amap-jsapi-loader（高德地图加载器）
- tailwindcss
- axios

### Workers

- @modelcontextprotocol/sdk（MCP SDK）
- hono（轻量路由框架，可选）
- wrangler（CloudFlare 开发/部署工具）

## 10. 限制和风险

1. **反爬风险**：美团和携程可能随时更新反爬策略，需要维护接口适配
2. **Workers 限制**：CPU 时间 10ms（免费）/ 30s（付费），内存 128MB
3. **MCP 兼容性**：CloudFlare Workers 不支持 WebSocket，需用 SSE 传输
4. **API 成本**：AI 模型调用按 token 计费，需控制调用频率
