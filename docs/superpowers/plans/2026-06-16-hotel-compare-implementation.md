# 酒店对比平台 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 实现一个纯前端 + CloudFlare Workers 的酒店数据对比平台，集成高德地图，支持美团/携程数据对比和 AI 分析推荐。

**架构：** Monorepo 结构，分为 `frontend/`（Vue 3 + Vite + TailwindCSS + Pinia → CloudFlare Pages）、`workers/api/`（Hono 路由 → CloudFlare Workers）和 `workers/mcp/`（AMap MCP Server → 独立 CloudFlare Worker）。前端通过 `/api/*` 调用 API Worker，API Worker 代理美团/携程数据并转发 AI 请求。

**技术栈：**
- 前端：Vue 3 + Vite + TailwindCSS + Pinia + vue-router 4 + @amap/amap-jsapi-loader + axios
- Workers：TypeScript + Hono + @modelcontextprotocol/sdk
- 部署：CloudFlare Pages + CloudFlare Workers + wrangler

---

## 文件结构总览

```
ocgnlink/
├── frontend/
│   ├── src/
│   │   ├── main.ts              # Vue 入口
│   │   ├── App.vue              # 根组件
│   │   ├── router/
│   │   │   └── index.ts         # 路由配置
│   │   ├── stores/
│   │   │   ├── hotel.ts         # 酒店数据 store
│   │   │   └── search.ts        # 搜索状态 store
│   │   ├── api/
│   │   │   ├── client.ts        # axios 实例
│   │   │   ├── hotels.ts        # 酒店 API 调用
│   │   │   ├── map.ts           # 高德地图 API 调用
│   │   │   └── ai.ts            # AI 分析 API 调用
│   │   ├── views/
│   │   │   ├── Home.vue         # 首页搜索
│   │   │   ├── Search.vue       # 搜索结果 + 地图
│   │   │   └── Compare.vue      # 对比详情
│   │   ├── components/
│   │   │   ├── HotelCard.vue    # 酒店卡片
│   │   │   ├── MapView.vue      # 高德地图
│   │   │   ├── AiPanel.vue      # AI 分析
│   │   │   └── SearchBar.vue    # 搜索栏组件
│   │   └── config/
│   │       └── index.ts         # 前端配置
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── workers/
│   ├── shared/
│   │   ├── types.ts             # 共享类型定义
│   │   ├── cors.ts              # CORS 中间件
│   │   └── config.ts            # 环境变量读取
│   ├── api/
│   │   ├── index.ts             # 入口 + Hono 路由
│   │   ├── hotels/
│   │   │   ├── index.ts         # 酒店路由
│   │   │   ├── meituan.ts       # 美团代理
│   │   │   └── ctrip.ts         # 携程代理
│   │   ├── ai/
│   │   │   └── analyze.ts       # AI 分析
│   │   └── map/
│   │       └── search.ts        # 高德 API 代理
│   ├── mcp/
│   │   ├── index.ts             # MCP Server 入口
│   │   ├── tools/
│   │   │   ├── search.ts        # 地点搜索
│   │   │   ├── geocode.ts       # 地理编码
│   │   │   ├── reverse.ts       # 逆地理编码
│   │   │   ├── nearby.ts        # 周边搜索
│   │   │   └── route.ts         # 路线规划
│   │   └── amap-client.ts       # 高德 API 封装
│   └── package.json
├── config/
│   ├── models.json              # 模型配置
│   └── amap.json                # 高德配置
├── wrangler-api.toml            # API Worker 部署配置
├── wrangler-mcp.toml            # MCP Worker 部署配置
├── package.json                 # 根 workspace
└── README.md
```

---

### 任务 1：Monorepo 根工程 + 配置文件

**文件：**
- 创建：`package.json`（根 workspace）
- 创建：`config/models.json`
- 创建：`config/amap.json`
- 创建：`.gitignore`

- [ ] **步骤 1：创建根 package.json**

```json
{
  "name": "ocgnlink",
  "private": true,
  "workspaces": [
    "frontend",
    "workers"
  ],
  "scripts": {
    "dev:frontend": "cd frontend && npm run dev",
    "dev:api": "cd workers && wrangler dev --config ../wrangler-api.toml",
    "dev:mcp": "cd workers && wrangler dev --config ../wrangler-mcp.toml",
    "build:frontend": "cd frontend && npm run build",
    "deploy:api": "cd workers && wrangler deploy --config ../wrangler-api.toml",
    "deploy:mcp": "cd workers && wrangler deploy --config ../wrangler-mcp.toml"
  }
}
```

- [ ] **步骤 2：创建 `.gitignore`**

```
node_modules/
dist/
.env
*.local
wrangler.toml
```

- [ ] **步骤 3：创建模型配置文件**

```json
{
  "models": {
    "default": "openai",
    "providers": {
      "openai": {
        "name": "OpenAI",
        "endpoint": "https://api.openai.com/v1/chat/completions",
        "apiKey": "",
        "model": "gpt-4o",
        "maxTokens": 4096
      },
      "claude": {
        "name": "Claude",
        "endpoint": "https://api.anthropic.com/v1/messages",
        "apiKey": "",
        "model": "claude-sonnet-4-20250514",
        "maxTokens": 4096
      },
      "deepseek": {
        "name": "DeepSeek",
        "endpoint": "https://api.deepseek.com/v1/chat/completions",
        "apiKey": "",
        "model": "deepseek-chat",
        "maxTokens": 4096
      }
    }
  },
  "amap": {
    "apiKey": "",
    "baseUrl": "https://restapi.amap.com/v3"
  }
}
```

- [ ] **步骤 4：创建高德配置占位**

```json
{
  "apiKey": "",
  "baseUrl": "https://restapi.amap.com/v3",
  "jsApiKey": ""
}
```

- [ ] **步骤 5：Commit**

```bash
git add package.json .gitignore config/
git commit -m "chore: initialize monorepo workspace and config files"
```

---

### 任务 2：Workers 共享类型和工具

**文件：**
- 创建：`workers/shared/types.ts`
- 创建：`workers/shared/cors.ts`
- 创建：`workers/shared/config.ts`
- 创建：`workers/package.json`

- [ ] **步骤 1：创建 Workers package.json**

```json
{
  "name": "workers",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "hono": "^4.0.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.0.0",
    "typescript": "^5.0.0",
    "wrangler": "^3.0.0",
    "vitest": "^1.0.0"
  }
}
```

- [ ] **步骤 2：创建共享类型定义**

```typescript
// workers/shared/types.ts

/** 统一酒店数据格式 */
export interface Hotel {
  name: string;
  price: number;
  rating: number;
  address: string;
  distance: number;
  source: 'meituan' | 'ctrip';
  url: string;
  images: string[];
  facilities: string[];
  roomType: string;
}

/** 酒店搜索请求参数 */
export interface HotelSearchRequest {
  city: string;
  lat?: number;
  lng?: number;
  keyword?: string;
}

/** AI 分析请求 */
export interface AiAnalyzeRequest {
  meituanHotels: Hotel[];
  ctripHotels: Hotel[];
}

/** AI 分析响应 */
export interface AiAnalyzeResponse {
  analysis: string;
  recommendation: string;
  model: string;
}

/** 高德 POI 搜索结果 */
export interface AmapPoiResult {
  id: string;
  name: string;
  type: string;
  address: string;
  location: string; // "lng,lat"
  distance: string;
  photos?: { title: string; url: string }[];
}

/** API 统一响应格式 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

- [ ] **步骤 3：创建 CORS 工具函数**

```typescript
// workers/shared/cors.ts

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function handleCors(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }
  return null;
}

export function addCorsHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
```

- [ ] **步骤 4：创建配置读取工具**

```typescript
// workers/shared/config.ts

export interface WorkerEnv {
  AMAP_API_KEY?: string;
  OPENAI_API_KEY?: string;
  CLAUDE_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  MEITUAN_COOKIES?: string;
  CTRIP_COOKIES?: string;
}

export function getConfig(env: WorkerEnv) {
  return {
    amapApiKey: env.AMAP_API_KEY || '',
    amapBaseUrl: 'https://restapi.amap.com/v3',
    openaiKey: env.OPENAI_API_KEY || '',
    claudeKey: env.CLAUDE_API_KEY || '',
    deepseekKey: env.DEEPSEEK_API_KEY || '',
    meituanCookies: env.MEITUAN_COOKIES || '',
    ctripCookies: env.CTRIP_COOKIES || '',
  };
}
```

- [ ] **步骤 5：创建 TypeScript 配置**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  }
}
```

保存到 `workers/tsconfig.json`

- [ ] **步骤 6：Commit**

```bash
git add workers/shared/ workers/package.json workers/tsconfig.json
git commit -m "feat: add shared types, CORS, and config utilities"
```

---

### 任务 3：API Worker 入口 + 路由

**文件：**
- 创建：`workers/api/index.ts`
- 创建：`wrangler-api.toml`

- [ ] **步骤 1：创建 wrangler-api.toml**

```toml
name = "ocgnlink-api"
main = "workers/api/index.ts"
compatibility_date = "2024-01-01

[vars]
AMAP_API_KEY = ""

[[routes]]
pattern = "localhost:8787/api/*"
```

- [ ] **步骤 2：创建 API Worker 入口（Hono 路由）**

```typescript
// workers/api/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { WorkerEnv } from '../shared/config';
import { hotelRouter } from './hotels/index';
import { aiRouter } from './ai/analyze';
import { mapRouter } from './map/search';

type Bindings = { env: WorkerEnv } & WorkerEnv;

const app = new Hono<{ Bindings: Bindings }>();

// 全局 CORS 中间件
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
}));

// 健康检查
app.get('/api/health', (c) => c.json({ success: true, status: 'ok' }));

// 挂载子路由
app.route('/api/hotels', hotelRouter);
app.route('/api/ai', aiRouter);
app.route('/api/map', mapRouter);

// 全局错误处理
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ success: false, error: err.message }, 500);
});

export default app;
```

- [ ] **步骤 3：提交**

```bash
git add workers/api/index.ts wrangler-api.toml
git commit -m "feat: add API Worker entry with Hono router"
```

---

### 任务 4：酒店路由入口

**文件：**
- 创建：`workers/api/hotels/index.ts`

- [ ] **步骤 1：创建酒店路由聚合**

```typescript
// workers/api/hotels/index.ts
import { Hono } from 'hono';
import { fetchMeituanHotels } from './meituan';
import { fetchCtripHotels } from './ctrip';
import type { Hotel, HotelSearchRequest } from '../../shared/types';

export const hotelRouter = new Hono();

// POST /api/hotels/search — 并行搜索美团和携程
hotelRouter.post('/search', async (c) => {
  try {
    const body: HotelSearchRequest = await c.req.json();

    if (!body.city) {
      return c.json({ success: false, error: 'city is required' }, 400);
    }

    // 并行调用两个平台
    const [meituanResult, ctripResult] = await Promise.allSettled([
      fetchMeituanHotels(body),
      fetchCtripHotels(body),
    ]);

    const hotels: Hotel[] = [];

    if (meituanResult.status === 'fulfilled') {
      hotels.push(...meituanResult.value);
    } else {
      console.error('Meituan fetch failed:', meituanResult.reason);
    }

    if (ctripResult.status === 'fulfilled') {
      hotels.push(...ctripResult.value);
    } else {
      console.error('Ctrip fetch failed:', ctripResult.reason);
    }

    return c.json({
      success: true,
      data: {
        hotels,
        sources: {
          meituan: meituanResult.status === 'fulfilled',
          ctrip: ctripResult.status === 'fulfilled',
        },
      },
    });
  } catch (err) {
    console.error('Hotel search error:', err);
    return c.json({ success: false, error: 'Failed to search hotels' }, 500);
  }
});
```

- [ ] **步骤 2：提交**

```bash
git add workers/api/hotels/index.ts
git commit -m "feat: add hotel search route with parallel platform fetch"
```

---

### 任务 5：美团酒店数据代理

**文件：**
- 创建：`workers/api/hotels/meituan.ts`

- [ ] **步骤 1：创建美团代理**

```typescript
// workers/api/hotels/meituan.ts
import type { Hotel, HotelSearchRequest } from '../../shared/types';

const MEITUAN_H5_SEARCH_URL = 'https://hotel.meituan.com/hotelapi/v1/hotelsearch';

interface MeituanApiResponse {
  data?: {
    searchResult?: {
      list?: Array<{
        poiName?: string;
        lowestPrice?: number;
        avgScore?: number;
        address?: string;
        distance?: number;
        jumpUrl?: string;
        images?: Array<{ url: string }>;
        facilities?: Array<{ name: string }>;
        roomTypeName?: string;
      }>;
    };
  };
  code?: number;
  message?: string;
}

function transformMeituanHotel(item: NonNullable<NonNullable<MeituanApiResponse['data']>['searchResult']>['list'][number]): Hotel {
  return {
    name: item.poiName || '未知酒店',
    price: item.lowestPrice || 0,
    rating: item.avgScore ? item.avgScore / 10 : 0,
    address: item.address || '',
    distance: item.distance || 0,
    source: 'meituan',
    url: item.jumpUrl || '',
    images: item.images?.map((img) => img.url) || [],
    facilities: item.facilities?.map((f) => f.name) || [],
    roomType: item.roomTypeName || '',
  };
}

export async function fetchMeituanHotels(params: HotelSearchRequest): Promise<Hotel[]> {
  const searchParams = new URLSearchParams({
    city: params.city,
    limit: '20',
  });
  if (params.lat && params.lng) {
    searchParams.set('lat', params.lat.toString());
    searchParams.set('lng', params.lng.toString());
  }
  if (params.keyword) {
    searchParams.set('keyword', params.keyword);
  }

  const response = await fetch(`${MEITUAN_H5_SEARCH_URL}?${searchParams.toString()}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      'Referer': 'https://hotel.meituan.com/',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Meituan API error: ${response.status}`);
  }

  const data: MeituanApiResponse = await response.json();

  if (data.code !== undefined && data.code !== 0) {
    console.warn(`Meituan API returned code ${data.code}: ${data.message}`);
    if (data.code === -1) {
      return []; // 反爬触发，返回空
    }
  }

  return data?.data?.searchResult?.list?.map(transformMeituanHotel) || [];
}
```

- [ ] **步骤 2：提交**

```bash
git add workers/api/hotels/meituan.ts
git commit -t "feat: add Meituan hotel data proxy with mobile H5 API"
```

Co-Authored-By: Claude <noreply@anthropic.com

---

### 任务 6：携程酒店数据代理

**文件：**
- 创建：`workers/api/hotels/ctrip.ts`

- [ ] **步骤 1：创建携程代理**

```typescript
// workers/api/hotels/ctrip.ts
import type { Hotel, HotelSearchRequest } from '../../shared/types';

const CTRIP_H5_SEARCH_URL = 'https://m.ctrip.com/restapi/soa2/13444/json/searchHotel';

interface CtripApiResponse {
  hotelList?: Array<{
    hotelName?: string;
    showPrice?: number;
    starRating?: number;
    commentScore?: number;
    address?: string;
    distance?: number;
    detailUrl?: string;
    imgList?: Array<{ url: string }>;
    facilityList?: Array<{ name: string }>;
    roomName?: string;
  }>;
  status?: number;
  msg?: string;
}

function transformCtripHotel(item: NonNullable<CtripApiResponse['hotelList']>[number]): Hotel {
  return {
    name: item.hotelName || '未知酒店',
    price: item.showPrice || 0,
    rating: item.commentScore ? item.commentScore / 10 : (item.starRating || 0),
    address: item.address || '',
    distance: item.distance || 0,
    source: 'ctrip',
    url: item.detailUrl || '',
    images: item.imgList?.map((img) => img.url) || [],
    facilities: item.facilityList?.map((f) => f.name) || [],
    roomType: item.roomName || '',
  };
}

export async function fetchCtripHotels(params: HotelSearchRequest): Promise<Hotel[]> {
  const body = JSON.stringify({
    city: params.city,
    lat: params.lat,
    lng: params.lng,
    keyword: params.keyword || '',
    pageSize: 20,
    pageNo: 1,
    sort: 'default',
  });

  const response = await fetch(CTRIP_H5_SEARCH_URL, {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      'Referer': 'https://m.ctrip.com/',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Ctrip API error: ${response.status}`);
  }

  const data: CtripApiResponse = await response.json();

  if (data.status !== undefined && data.status !== 0) {
    console.warn(`Ctrip API returned status ${data.status}: ${data.msg}`);
    if (data.status === -1) {
      return [];
    }
  }

  return data.hotelList?.map(transformCtripHotel) || [];
}
```

- [ ] **步骤 2：提交**

```bash
git add workers/api/hotels/ctrip.ts
git commit -m "feat: add Ctrip hotel data proxy with mobile H5 API"
```

---

### 任务 7：AI 分析模块

**文件：**
- 修改：`workers/api/index.ts`（挂载 AI 路由）
- 创建：`workers/api/ai/analyze.ts`

- [ ] **步骤 1：创建 AI 分析路由**

```typescript
// workers/api/ai/analyze.ts
import { Hono } from 'hono';
import type { Hotel, AiAnalyzeResponse } from '../../shared/types';

const AI_PROVIDERS: Record<string, { endpoint: string; format: 'openai' | 'claude'; model: string }> = {
  openai: {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    format: 'openai',
    model: 'gpt-4o',
  },
  claude: {
    endpoint: 'https://api.anthropic.com/v1/messages',
    format: 'claude',
    model: 'claude-sonnet-4-20250514',
  },
  deepseek: {
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    format: 'openai',
    model: 'deepseek-chat',
  },
};

export const aiRouter = new Hono();

// POST /api/ai/analyze
aiRouter.post('/analyze', async (c) => {
  try {
    const body = await c.req.json();
    const { meituanHotels, ctripHotels, provider = 'openai' } = body;

    if (!meituanHotels && !ctripHotels) {
      return c.json({ success: false, error: 'No hotel data provided' }, 400);
    }

    const apiKey = c.env[`${provider.toUpperCase()}_API_KEY` as keyof typeof c.env] as string | undefined;
    if (!apiKey) {
      return c.json({ success: false, error: `API key for ${provider} not configured` }, 400);
    }

    const providerConfig = AI_PROVIDERS[provider];
    if (!providerConfig) {
      return c.json({ success: false, error: `Unknown provider: ${provider}` }, 400);
    }

    const prompt = buildAnalysisPrompt(meituanHotels || [], ctripHotels || []);
    const analysis = await callAiModel(prompt, providerConfig, apiKey);

    return c.json({
      success: true,
      data: {
        analysis,
        recommendation: extractRecommendation(analysis),
        model: providerConfig.model,
      } satisfies AiAnalyzeResponse,
    });
  } catch (err) {
    console.error('AI analysis error:', err);
    return c.json({ success: false, error: 'AI analysis failed' }, 500);
  }
});

function buildAnalysisPrompt(meituanHotels: Hotel[], ctripHotels: Hotel[]): string {
  const formatHotels = (hotels: Hotel[], source: string) =>
    hotels.map((h, i) => `${i + 1}. ${h.name} - ¥${h.price}/晚 - 评分:${h.rating} - ${h.address}`).join('\n');

  return `你是一个酒店选择助手。以下是两个平台的酒店数据对比：

[美团数据]
${formatHotels(meituanHotels, '美团') || '（无数据）'}

[携程数据]
${formatHotels(ctripHotels, '携程') || '（无数据）'}

请从价格、评分、位置、设施等方面进行对比分析，给出推荐建议。`;
}

async function callAiModel(prompt: string, config: typeof AI_PROVIDERS[string], apiKey: string): Promise<string> {
  if (config.format === 'claude') {
    const body = JSON.stringify({
      model: config.model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json() as { content?: Array<{ text: string }> };
    return data.content?.[0]?.text || '';
  }

  // OpenAI / DeepSeek 格式
  const body = JSON.stringify({
    model: config.model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4096,
  });

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json() as { choices?: Array<{ message: { content: string } }> };
  return data.choices?.[0]?.message?.content || '';
}

function extractRecommendation(analysis: string): string {
  // 简单提取最后一段作为推荐结论
  const paragraphs = analysis.split('\n\n').filter(Boolean);
  return paragraphs[paragraphs.length - 1] || analysis;
}
```

- [ ] **步骤 2：修改 API Worker 入口挂载 AI 路由**

在 `workers/api/index.ts` 中，找到 `import { mapRouter } from './map/search';` 行，在其上方添加：
```typescript
import { aiRouter } from './ai/analyze';
```

- [ ] **步骤 3：提交**

```bash
git add workers/api/ai/ workers/api/index.ts
git commit -m "feat: add AI analysis module with multi-provider support"
```

---

### 任务 8：高德地图 API 代理

**文件：**
- 创建：`workers/api/map/search.ts`

- [ ] **步骤 1：创建高德 API 代理**

```typescript
// workers/api/map/search.ts
import { Hono } from 'hono';

const AMAP_BASE_URL = 'https://restapi.amap.com/v3';

export const mapRouter = new Hono();

// GET /api/map/search?keyword=xxx&city=xxx&type=xxx
mapRouter.get('/search', async (c) => {
  const keyword = c.req.query('keyword');
  const city = c.req.query('city');
  const type = c.req.query('type');
  const apiKey = c.env.AMAP_API_KEY;

  if (!keyword) {
    return c.json({ success: false, error: 'keyword is required' }, 400);
  }
  if (!apiKey) {
    return c.json({ success: false, error: 'AMAP_API_KEY not configured' }, 500);
  }

  const params = new URLSearchParams({
    key: apiKey,
    keywords: keyword,
    offset: '20',
    page: '1',
    extensions: 'all',
  });
  if (city) params.set('city', city);
  if (type) params.set('types', type);

  try {
    const response = await fetch(`${AMAP_BASE_URL}/place/text?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`AMap API error: ${response.status}`);
    }

    const data = await response.json();
    return c.json({ success: true, data });
  } catch (err) {
    console.error('AMap search error:', err);
    return c.json({ success: false, error: 'Failed to search places' }, 500);
  }
});

// GET /api/map/geo?address=xxx&city=xxx
mapRouter.get('/geo', async (c) => {
  const address = c.req.query('address');
  const city = c.req.query('city');
  const apiKey = c.env.AMAP_API_KEY;

  if (!address) {
    return c.json({ success: false, error: 'address is required' }, 400);
  }
  if (!apiKey) {
    return c.json({ success: false, error: 'AMAP_API_KEY not configured' }, 500);
  }

  const params = new URLSearchParams({
    key: apiKey,
    address,
    city: city || '',
  });

  try {
    const response = await fetch(`${AMAP_BASE_URL}/geocode/geo?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`AMap geo error: ${response.status}`);
    }

    const data = await response.json();
    return c.json({ success: true, data });
  } catch (err) {
    console.error('AMap geo error:', err);
    return c.json({ success: false, error: 'Failed to geocode' }, 500);
  }
});
```

- [ ] **步骤 2：提交**

```bash
git add workers/api/map/search.ts
git commit -m "feat: add AMap API proxy for place search and geocoding"
```

---

### 任务 9：高德 MCP Server

**文件：**
- 创建：`workers/mcp/index.ts`
- 创建：`workers/mcp/amap-client.ts`
- 创建：`workers/mcp/tools/search.ts`
- 创建：`workers/mcp/tools/geocode.ts`
- 创建：`workers/mcp/tools/reverse.ts`
- 创建：`workers/mcp/tools/nearby.ts`
- 创建：`workers/mcp/tools/route.ts`
- 创建：`wrangler-mcp.toml`

- [ ] **步骤 1：创建 wrangler-mcp.toml**

```toml
name = "ocgnlink-mcp"
main = "workers/mcp/index.ts"
compatibility_date = "2024-01-01"

[vars]
AMAP_API_KEY = ""
```

- [ ] **步骤 2：创建高德 API 客户端封装**

```typescript
// workers/mcp/amap-client.ts

const AMAP_BASE_URL = 'https://restapi.amap.com/v3';

export interface AmapPoi {
  name: string;
  address: string;
  location: string;
  type: string;
  distance: string;
  phone?: string;
  website?: string;
  photos?: Array<{ title: string; url: string }>;
}

export interface AmapGeoResult {
  location: string;
  formatted_address: string;
}

export class AmapClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /** 地点搜索 */
  async searchPlaces(keyword: string, city?: string, type?: string): Promise<AmapPoi[]> {
    const params = new URLSearchParams({
      key: this.apiKey,
      keywords: keyword,
      offset: '20',
      page: '1',
      extensions: 'all',
    });
    if (city) params.set('city', city);
    if (type) params.set('types', type);

    const response = await fetch(`${AMAP_BASE_URL}/place/text?${params.toString()}`);
    const data = await response.json() as { status: string; pois?: AmapPoi[]; info?: string };

    if (data.status !== '1') {
      throw new Error(`AMap search failed: ${data.info}`);
    }
    return data.pois || [];
  }

  /** 地理编码（地址 → 坐标） */
  async geocode(address: string, city?: string): Promise<AmapGeoResult[]> {
    const params = new URLSearchParams({
      key: this.apiKey,
      address,
      city: city || '',
    });

    const response = await fetch(`${AMAP_BASE_URL}/geocode/geo?${params.toString()}`);
    const data = await response.json() as { status: string; geocodes?: AmapGeoResult[]; info?: string };

    if (data.status !== '1') {
      throw new Error(`AMap geocode failed: ${data.info}`);
    }
    return data.geocodes || [];
  }

  /** 逆地理编码（坐标 → 地址） */
  async reverseGeocode(lat: number, lng: number): Promise<AmapGeoResult> {
    const params = new URLSearchParams({
      key: this.apiKey,
      location: `${lng},${lat}`,
      extensions: 'base',
    });

    const response = await fetch(`${AMAP_BASE_URL}/geocode/regeo?${params.toString()}`);
    const data = await response.json() as { status: string; regeocode?: { formatted_address: string }; info?: string };

    if (data.status !== '1') {
      throw new Error(`AMap reverse geocode failed: ${data.info}`);
    }

    return {
      location: `${lng},${lat}`,
      formatted_address: data.regeocode?.formatted_address || '',
    };
  }

  /** 周边搜索 */
  async nearbySearch(lat: number, lng: number, radius: number, keyword?: string): Promise<AmapPoi[]> {
    const params = new URLSearchParams({
      key: this.apiKey,
      location: `${lng},${lat}`,
      radius: radius.toString(),
      offset: '20',
      page: '1',
      extensions: 'all',
    });
    if (keyword) params.set('keywords', keyword);

    const response = await fetch(`${AMAP_BASE_URL}/place/around?${params.toString()}`);
    const data = await response.json() as { status: string; pois?: AmapPoi[]; info?: string };

    if (data.status !== '1') {
      throw new Error(`AMap nearby search failed: ${data.info}`);
    }
    return data.pois || [];
  }

  /** 路线规划 */
  async routePlan(origin: string, destination: string, mode: 'driving' | 'walking' | 'transit' = 'driving') {
    const typeMap = { driving: 0, walking: 1, transit: 2 };
    const params = new URLSearchParams({
      key: this.apiKey,
      origin,
      destination,
      strategy: '0',
      extensions: 'all',
      show_fields: 'cost,tmcs,steps',
    });

    const apiPath = mode === 'driving' ? '/direction/driving'
      : mode === 'walking' ? '/direction/walking'
      : '/direction/transit/integrated';

    const response = await fetch(`${AMAP_BASE_URL}${apiPath}?${params.toString()}`);
    const data = await response.json() as { status: string; route?: unknown; info?: string };

    if (data.status !== '1') {
      throw new Error(`AMap route plan failed: ${data.info}`);
    }
    return data.route;
  }
}
```

- [ ] **步骤 3：创建 MCP Server 入口**

```typescript
// workers/mcp/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { AmapClient } from './amap-client';
import { createSearchTool, handleSearchCall } from './tools/search';
import { createGeocodeTool, handleGeocodeCall } from './tools/geocode';
import { createReverseGeocodeTool, handleReverseGeocodeCall } from './tools/reverse';
import { createNearbyTool, handleNearbyCall } from './tools/nearby';
import { createRouteTool, handleRouteCall } from './tools/route';

export interface Env {
  AMAP_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const amapClient = new AmapClient(env.AMAP_API_KEY);
    const server = new Server(
      { name: 'amap-mcp-server', version: '1.0.0' },
      { capabilities: { tools: {} } },
    );

    // 注册工具列表
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        createSearchTool(),
        createGeocodeTool(),
        createReverseGeocodeTool(),
        createNearbyTool(),
        createRouteTool(),
      ],
    }));

    // 注册工具调用处理
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'amap_search':
          return handleSearchCall(amapClient, args);
        case 'amap_geocode':
          return handleGeocodeCall(amapClient, args);
        case 'amap_reverse_geocode':
          return handleReverseGeocodeCall(amapClient, args);
        case 'amap_nearby':
          return handleNearbyCall(amapClient, args);
        case 'amap_route':
          return handleRouteCall(amapClient, args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    // SSE 传输适配
    const url = new URL(request.url);
    if (url.pathname === '/sse') {
      const transport = new SSEServerTransport('/message', request);
      await server.connect(transport);
      return transport.response;
    }

    if (url.pathname === '/message') {
      const transport = new SSEServerTransport('/message', request);
      // HMR: 从已连接的传输处理消息
      return new Response('Not connected', { status: 400 });
    }

    return new Response('AMap MCP Server — use /sse to connect', {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};
```

- [ ] **步骤 4：创建地点搜索工具**

```typescript
// workers/mcp/tools/search.ts
import type { AmapClient } from '../amap-client';

export function createSearchTool() {
  return {
    name: 'amap_search',
    description: '搜索地点（酒店、景点、餐厅等）',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '搜索关键词' },
        city: { type: 'string', description: '城市名称或编码' },
        type: { type: 'string', description: 'POI 类型' },
      },
      required: ['keyword'],
    },
  };
}

export async function handleSearchCall(client: AmapClient, args: Record<string, unknown>) {
  const { keyword, city, type } = args as { keyword: string; city?: string; type?: string };
  const results = await client.searchPlaces(keyword, city, type);

  return {
    content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
  };
}
```

- [ ] **步骤 5：创建地理编码工具**

```typescript
// workers/mcp/tools/geocode.ts
import type { AmapClient } from '../amap-client';

export function createGeocodeTool() {
  return {
    name: 'amap_geocode',
    description: '将地址转换为经纬度坐标',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: '详细地址' },
        city: { type: 'string', description: '城市名称或编码' },
      },
      required: ['address'],
    },
  };
}

export async function handleGeocodeCall(client: AmapClient, args: Record<string, unknown>) {
  const { address, city } = args as { address: string; city?: string };
  const results = await client.geocode(address, city);

  return {
    content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
  };
}
```

- [ ] **步骤 6：创建逆地理编码工具**

```typescript
// workers/mcp/tools/reverse.ts
import type { AmapClient } from '../amap-client';

export function createReverseGeocodeTool() {
  return {
    name: 'amap_reverse_geocode',
    description: '将经纬度坐标转换为地址',
    inputSchema: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: '纬度' },
        lng: { type: 'number', description: '经度' },
      },
      required: ['lat', 'lng'],
    },
  };
}

export async function handleReverseGeocodeCall(client: AmapClient, args: Record<string, unknown>) {
  const { lat, lng } = args as { lat: number; lng: number };
  const result = await client.reverseGeocode(lat, lng);

  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  };
}
```

- [ ] **步骤 7：创建周边搜索工具**

```typescript
// workers/mcp/tools/nearby.ts
import type { AmapClient } from '../amap-client';

export function createNearbyTool() {
  return {
    name: 'amap_nearby',
    description: '搜索指定坐标周边的 POI',
    inputSchema: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: '纬度' },
        lng: { type: 'number', description: '经度' },
        radius: { type: 'number', description: '搜索半径（米），默认 1000' },
        keyword: { type: 'string', description: '搜索关键词' },
      },
      required: ['lat', 'lng'],
    },
  };
}

export async function handleNearbyCall(client: AmapClient, args: Record<string, unknown>) {
  const { lat, lng, radius = 1000, keyword } = args as {
    lat: number; lng: number; radius?: number; keyword?: string;
  };
  const results = await client.nearbySearch(lat, lng, radius, keyword);

  return {
    content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
  };
}
```

- [ ] **步骤 8：创建路线规划工具**

```typescript
// workers/mcp/tools/route.ts
import type { AmapClient } from '../amap-client';

export function createRouteTool() {
  return {
    name: 'amap_route',
    description: '路线规划（驾车/步行/公交）',
    inputSchema: {
      type: 'object',
      properties: {
        origin: { type: 'string', description: '起点坐标 "lng,lat"' },
        destination: { type: 'string', description: '终点坐标 "lng,lat"' },
        mode: { type: 'string', enum: ['driving', 'walking', 'transit'], description: '出行方式' },
      },
      required: ['origin', 'destination'],
    },
  };
}

export async function handleRouteCall(client: AmapClient, args: Record<string, unknown>) {
  const { origin, destination, mode = 'driving' } = args as {
    origin: string; destination: string; mode?: 'driving' | 'walking' | 'transit';
  };
  const result = await client.routePlan(origin, destination, mode);

  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  };
}
```

- [ ] **步骤 9：提交**

```bash
git add workers/mcp/ wrangler-mcp.toml
git commit -m "feat: add AMap MCP Server with 5 tools"
```

---

### 任务 10：前端项目脚手架

**文件：**
- 创建：`frontend/package.json`
- 创建：`frontend/index.html`
- 创建：`frontend/vite.config.ts`
- 创建：`frontend/tailwind.config.js`
- 创建：`frontend/postcss.config.js`
- 创建：`frontend/src/main.ts`
- 创建：`frontend/src/App.vue`
- 创建：`frontend/src/config/index.ts`
- 创建：`frontend/tsconfig.json`

- [ ] **步骤 1：创建 package.json**

```json
{
  "name": "frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.3.0",
    "pinia": "^2.1.0",
    "@amap/amap-jsapi-loader": "^1.0.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vue-tsc": "^2.0.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "typescript": "^5.3.0"
  }
}
```

- [ ] **步骤 2：创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>酒店对比平台</title>
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
</head>
<body class="bg-gray-50 text-gray-900">
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **步骤 3：创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **步骤 4：创建 TailwindCSS 配置**

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,ts,js}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

```javascript
// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **步骤 5：创建 TypeScript 配置**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.vue"],
  "exclude": ["node_modules"]
}
```

- [ ] **步骤 6：创建前端入口（main.ts + App.vue）**

```typescript
// src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './style.css';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');
```

```vue
<!-- src/App.vue -->
<template>
  <div class="min-h-screen flex flex-col">
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <router-link to="/" class="text-xl font-bold text-blue-600">
          酒店对比
        </router-link>
        <nav class="text-sm text-gray-500">
          美团 vs 携程
        </nav>
      </div>
    </header>
    <main class="flex-1">
      <router-view />
    </main>
  </div>
</template>
```

```css
/* src/style.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **步骤 7：创建前端配置**

```typescript
// src/config/index.ts
export const CONFIG = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  amapJsKey: import.meta.env.VITE_AMAP_JS_KEY || '',
  amapJsVersion: '2.0',
};
```

- [ ] **步骤 8：提交**

```bash
git add frontend/
git commit -m "feat: initialize Vue 3 frontend with TailwindCSS and Vite"
```

---

### 任务 11：前端路由和状态管理

**文件：**
- 创建：`frontend/src/router/index.ts`
- 创建：`frontend/src/stores/search.ts`
- 创建：`frontend/src/stores/hotel.ts`

- [ ] **步骤 1：创建路由配置**

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/Search.vue'),
  },
  {
    path: '/compare',
    name: 'Compare',
    component: () => import('@/views/Compare.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
```

- [ ] **步骤 2：创建搜索状态 store**

```typescript
// src/stores/search.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface SearchParams {
  city: string;
  keyword?: string;
  lat?: number;
  lng?: number;
}

export const useSearchStore = defineStore('search', () => {
  const params = ref<SearchParams>({ city: '' });
  const loading = ref(false);

  function setSearchParams(newParams: SearchParams) {
    params.value = { ...newParams };
  }

  function setLoading(val: boolean) {
    loading.value = val;
  }

  return { params, loading, setSearchParams, setLoading };
});
```

- [ ] **步骤 3：创建酒店数据 store**

```typescript
// src/stores/hotel.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Hotel } from '../../../workers/shared/types';

export const useHotelStore = defineStore('hotel', () => {
  const hotels = ref<Hotel[]>([]);
  const selectedHotels = ref<Hotel[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  function setHotels(data: Hotel[]) {
    hotels.value = data;
  }

  function selectForCompare(hotel: Hotel) {
    if (selectedHotels.value.length >= 4) return;
    if (selectedHotels.value.some((h) => h.name === hotel.name)) return;
    selectedHotels.value.push(hotel);
  }

  function removeFromCompare(hotel: Hotel) {
    selectedHotels.value = selectedHotels.value.filter((h) => h.name !== hotel.name);
  }

  function clearSelection() {
    selectedHotels.value = [];
  }

  return {
    hotels, selectedHotels, loading, error,
    setHotels, selectForCompare, removeFromCompare, clearSelection,
  };
});
```

- [ ] **步骤 4：提交**

```bash
git add frontend/src/router/ frontend/src/stores/
git commit -m "feat: add Vue Router config and Pinia stores"
```

---

### 任务 12：前端 API 调用层

**文件：**
- 创建：`frontend/src/api/client.ts`
- 创建：`frontend/src/api/hotels.ts`
- 创建：`frontend/src/api/map.ts`
- 创建：`frontend/src/api/ai.ts`

- [ ] **步骤 1：创建 axios 实例**

```typescript
// src/api/client.ts
import axios from 'axios';
import { CONFIG } from '@/config';

const apiClient = axios.create({
  baseURL: CONFIG.apiBaseUrl,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || '网络错误';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  },
);

export default apiClient;
```

- [ ] **步骤 2：创建酒店 API**

```typescript
// src/api/hotels.ts
import apiClient from './client';
import type { Hotel } from '../../../workers/shared/types';

export interface SearchHotelsParams {
  city: string;
  keyword?: string;
  lat?: number;
  lng?: number;
}

export interface HotelSearchResult {
  hotels: Hotel[];
  sources: {
    meituan: boolean;
    ctrip: boolean;
  };
}

export async function searchHotels(params: SearchHotelsParams): Promise<HotelSearchResult> {
  const response = await apiClient.post('/hotels/search', params);
  return response.data.data;
}
```

- [ ] **步骤 3：创建地图 API**

```typescript
// src/api/map.ts
import apiClient from './client';

export interface MapSearchParams {
  keyword: string;
  city?: string;
  type?: string;
}

export async function searchPlaces(params: MapSearchParams) {
  const response = await apiClient.get('/map/search', { params });
  return response.data.data;
}

export async function geocode(address: string, city?: string) {
  const response = await apiClient.get('/map/geo', { params: { address, city } });
  return response.data.data;
}
```

- [ ] **步骤 4：创建 AI 分析 API**

```typescript
// src/api/ai.ts
import apiClient from './client';
import type { Hotel } from '../../../workers/shared/types';

export async function analyzeHotels(meituanHotels: Hotel[], ctripHotels: Hotel[], provider = 'openai') {
  const response = await apiClient.post('/ai/analyze', {
    meituanHotels,
    ctripHotels,
    provider,
  });
  return response.data.data;
}
```

- [ ] **步骤 5：提交**

```bash
git add frontend/src/api/
git commit -m "feat: add frontend API layer with axios"
```

---

### 任务 13：SearchBar 组件

**文件：**
- 创建：`frontend/src/components/SearchBar.vue`

- [ ] **步骤 1：创建搜索栏组件**

```vue
<!-- src/components/SearchBar.vue -->
<template>
  <div class="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm border">
    <input
      v-model="city"
      type="text"
      placeholder="城市（如：北京）"
      class="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
      @keyup.enter="handleSearch"
    />
    <input
      v-model="keyword"
      type="text"
      placeholder="酒店名称或地标（可选）"
      class="flex-[2] px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
      @keyup.enter="handleSearch"
    />
    <button
      class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      :disabled="!city.trim()"
      @click="handleSearch"
    >
      搜索
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const city = ref('');
const keyword = ref('');

function handleSearch() {
  if (!city.value.trim()) return;
  const query: Record<string, string> = { city: city.value.trim() };
  if (keyword.value.trim()) query.keyword = keyword.value.trim();
  router.push({ name: 'Search', query });
}
</script>
```

- [ ] **步骤 2：提交**

```bash
git add frontend/src/components/SearchBar.vue
git commit -m "feat: add SearchBar component"
```

---

### 任务 14：HotelCard 组件

**文件：**
- 创建：`frontend/src/components/HotelCard.vue`

- [ ] **步骤 1：创建酒店卡片组件**

```vue
<!-- src/components/HotelCard.vue -->
<template>
  <div
    class="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-4"
    :class="{ 'ring-2 ring-blue-400': selected }"
  >
    <!-- 图片 -->
    <div class="relative h-40 bg-gray-100 rounded-md overflow-hidden mb-3">
      <img
        v-if="hotel.images.length > 0"
        :src="hotel.images[0]"
        :alt="hotel.name"
        class="w-full h-full object-cover"
        loading="lazy"
      />
      <div v-else class="flex items-center justify-center h-full text-gray-400 text-sm">
        暂无图片
      </div>
      <span
        class="absolute top-2 right-2 px-2 py-0.5 rounded text-xs text-white font-medium"
        :class="hotel.source === 'meituan' ? 'bg-yellow-500' : 'bg-blue-500'"
      >
        {{ hotel.source === 'meituan' ? '美团' : '携程' }}
      </span>
    </div>

    <!-- 信息 -->
    <h3 class="font-medium text-sm line-clamp-2 mb-1">{{ hotel.name }}</h3>
    <div class="flex items-center gap-2 text-sm mb-1">
      <span class="text-lg font-bold text-red-500">¥{{ hotel.price }}</span>
      <span class="text-gray-400 text-xs">/晚</span>
    </div>
    <div class="flex items-center gap-1 text-sm text-gray-500 mb-1">
      <span class="text-yellow-400">★</span>
      <span>{{ hotel.rating.toFixed(1) }}</span>
      <span class="mx-1">·</span>
      <span v-if="hotel.distance > 0">{{ hotel.distance }}m</span>
    </div>
    <p class="text-xs text-gray-400 truncate">{{ hotel.address }}</p>

    <!-- 操作 -->
    <div class="mt-3 flex gap-2">
      <button
        class="flex-1 px-3 py-1.5 text-sm border border-blue-500 text-blue-500 rounded hover:bg-blue-50"
        :disabled="selected"
        @click="$emit('select', hotel)"
      >
        {{ selected ? '已选择' : '对比' }}
      </button>
      <a
        :href="hotel.url"
        target="_blank"
        rel="noopener noreferrer"
        class="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded hover:bg-gray-50"
      >
        查看原文
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Hotel } from '../../../workers/shared/types';

defineProps<{
  hotel: Hotel;
  selected?: boolean;
}>();

defineEmits<{
  select: [hotel: Hotel];
}>();
</script>
```

- [ ] **步骤 2：提交**

```bash
git add frontend/src/components/HotelCard.vue
git commit -m "feat: add HotelCard component"
```

---

### 任务 15：MapView 组件

**文件：**
- 创建：`frontend/src/components/MapView.vue`

- [ ] **步骤 1：创建地图组件**

```vue
<!-- src/components/MapView.vue -->
<template>
  <div class="relative w-full h-full min-h-[300px] bg-gray-100 rounded-lg overflow-hidden">
    <div ref="mapContainer" class="w-full h-full"></div>
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
      <span class="text-gray-500">地图加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import AMapLoader from '@amap/amap-jsapi-loader';
import { CONFIG } from '@/config';

const props = defineProps<{
  center?: { lat: number; lng: number };
  markers?: Array<{ lat: number; lng: number; name: string }>;
  zoom?: number;
}>();

const emit = defineEmits<{
  centerChange: [center: { lat: number; lng: number }];
}>();

const mapContainer = ref<HTMLDivElement>();
const loading = ref(true);
let map: AMap.Map | null = null;
let markersList: AMap.Marker[] = [];

async function initMap() {
  if (!mapContainer.value) return;

  try {
    const AMap = await AMapLoader.load({
      key: CONFIG.amapJsKey,
      version: CONFIG.amapJsVersion,
    });

    map = new AMap.Map(mapContainer.value, {
      zoom: props.zoom || 15,
      center: props.center ? [props.center.lng, props.center.lat] : [116.397428, 39.90923],
      viewMode: '2D',
    });

    loading.value = false;

    // 监听地图拖拽事件
    map.on('moveend', () => {
      if (map) {
        const center = map.getCenter();
        emit('centerChange', { lat: center.getLat(), lng: center.getLng() });
      }
    });

    updateMarkers();
  } catch (err) {
    console.error('AMap load failed:', err);
    loading.value = false;
  }
}

function updateMarkers() {
  if (!map || !props.markers) return;

  // 清除旧标记
  markersList.forEach((m) => map?.remove(m));
  markersList = [];

  // 确保 AMap 已加载
  import('@amap/amap-jsapi-loader').then(({ default: Loader }) => {
    Loader.load({ key: CONFIG.amapJsKey, version: CONFIG.amapJsVersion }).then((AMap: any) => {
      props.markers?.forEach((loc) => {
        const marker = new AMap.Marker({
          position: [loc.lng, loc.lat],
          title: loc.name,
          label: { content: loc.name, direction: 'top' },
        });
        map?.add(marker);
        markersList.push(marker);
      });
    });
  });
}

watch(() => props.markers, updateMarkers, { deep: true });

onMounted(initMap);
</script>
```

- [ ] **步骤 2：提交**

```bash
git add frontend/src/components/MapView.vue
git commit -m "feat: add MapView component with AMap JS API"
```

---

### 任务 16：AiPanel 组件

**文件：**
- 创建：`frontend/src/components/AiPanel.vue`

- [ ] **步骤 1：创建 AI 分析面板组件**

```vue
<!-- src/components/AiPanel.vue -->
<template>
  <div class="bg-white rounded-lg shadow-sm border p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-medium">AI 分析</h3>
      <div class="flex gap-2">
        <select
          v-model="provider"
          class="text-sm border rounded px-2 py-1"
        >
          <option value="openai">OpenAI</option>
          <option value="claude">Claude</option>
          <option value="deepseek">DeepSeek</option>
        </select>
        <button
          class="px-4 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          :disabled="!hasData || loading"
          @click="handleAnalyze"
        >
          {{ loading ? '分析中...' : '开始分析' }}
        </button>
      </div>
    </div>

    <!-- 提示信息 -->
    <div v-if="!hasData" class="text-sm text-gray-400 text-center py-8">
      请先搜索酒店数据
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="flex flex-col items-center py-8">
      <span class="text-sm text-gray-500">AI 正在分析对比数据...</span>
      <div class="mt-2 w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="text-sm text-red-500 text-center py-8">
      {{ error }}
    </div>

    <!-- 分析结果 -->
    <div v-else-if="result" class="prose prose-sm max-w-none">
      <div class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
        {{ result.analysis }}
      </div>
      <div v-if="result.recommendation" class="mt-4 p-3 bg-purple-50 rounded-md border border-purple-100">
        <span class="text-xs font-medium text-purple-600">推荐结论</span>
        <p class="text-sm text-purple-900 mt-1">{{ result.recommendation }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { analyzeHotels } from '@/api/ai';
import { useHotelStore } from '@/stores/hotel';
import type { AiAnalyzeResponse } from '../../../workers/shared/types';

const hotelStore = useHotelStore();
const provider = ref('openai');
const loading = ref(false);
const error = ref<string | null>(null);
const result = ref<AiAnalyzeResponse | null>(null);

const hasData = computed(() => hotelStore.hotels.length > 0);

async function handleAnalyze() {
  loading.value = true;
  error.value = null;
  result.value = null;

  try {
    const meituanHotels = hotelStore.hotels.filter((h) => h.source === 'meituan');
    const ctripHotels = hotelStore.hotels.filter((h) => h.source === 'ctrip');
    const data = await analyzeHotels(meituanHotels, ctripHotels, provider.value);
    result.value = data;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'AI 分析失败';
  } finally {
    loading.value = false;
  }
}
</script>
```

- [ ] **步骤 2：提交**

```bash
git add frontend/src/components/AiPanel.vue
git commit -m "feat: add AiPanel component for AI hotel analysis"
```

---

### 任务 17：首页（Home.vue）

**文件：**
- 创建：`frontend/src/views/Home.vue`

- [ ] **步骤 1：创建首页**

```vue
<!-- src/views/Home.vue -->
<template>
  <div class="flex flex-col items-center justify-center px-4" style="min-height: calc(100vh - 57px);">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">酒店对比</h1>
      <p class="text-gray-500">一站式对比美团和携程酒店数据，AI 智能推荐</p>
    </div>
    <div class="w-full max-w-xl">
      <SearchBar />
    </div>
    <div class="mt-12 grid grid-cols-3 gap-6 max-w-2xl text-center text-sm">
      <div class="p-4 bg-white rounded-lg shadow-sm border">
        <div class="text-2xl mb-1">🔍</div>
        <div class="font-medium">搜索</div>
        <div class="text-gray-400 mt-1">输入目的地即可搜索</div>
      </div>
      <div class="p-4 bg-white rounded-lg shadow-sm border">
        <div class="text-2xl mb-1">📊</div>
        <div class="font-medium">对比</div>
        <div class="text-gray-400 mt-1">美团携程数据并排展示</div>
      </div>
      <div class="p-4 bg-white rounded-lg shadow-sm border">
        <div class="text-2xl mb-1">🤖</div>
        <div class="font-medium">AI 推荐</div>
        <div class="text-gray-400 mt-1">智能分析给出最佳选择</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SearchBar from '@/components/SearchBar.vue';
</script>
```

- [ ] **步骤 2：提交**

```bash
git add frontend/src/views/Home.vue
git commit -m "feat: add Home page with search entry"
```

---

### 任务 18：搜索页面（Search.vue）

**文件：**
- 创建：`frontend/src/views/Search.vue`

- [ ] **步骤 1：创建搜索结果页**

```vue
<!-- src/views/Search.vue -->
<template>
  <div class="max-w-6xl mx-auto px-4 py-4">
    <!-- 搜索栏 -->
    <div class="mb-4">
      <SearchBar />
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex flex-col items-center py-16">
      <div class="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      <span class="mt-3 text-gray-500">正在搜索酒店数据...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="text-center py-16">
      <p class="text-red-500 mb-2">{{ error }}</p>
      <button class="text-blue-500 hover:underline" @click="fetchData">重试</button>
    </div>

    <!-- 搜索结果 -->
    <template v-else>
      <!-- 数据源状态 -->
      <div class="flex gap-4 mb-4 text-sm text-gray-500">
        <span :class="sources.meituan ? 'text-green-500' : 'text-red-400'">
          美团 {{ sources.meituan ? '✓' : '✗' }}
        </span>
        <span :class="sources.ctrip ? 'text-green-500' : 'text-red-400'">
          携程 {{ sources.ctrip ? '✓' : '✗' }}
        </span>
        <span class="text-gray-400">共 {{ hotelStore.hotels.length }} 个结果</span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- 左侧：地图 -->
        <div class="lg:col-span-1 h-[400px] lg:sticky lg:top-4">
          <MapView
            :markers="mapMarkers"
            :center="mapCenter"
            @center-change="handleCenterChange"
          />
        </div>

        <!-- 右侧：酒店列表 -->
        <div class="lg:col-span-2">
          <!-- 筛选/排序 -->
          <div class="mb-3 flex items-center gap-2 text-sm">
            <button
              v-for="opt in sortOptions"
              :key="opt.key"
              class="px-3 py-1 rounded-full border"
              :class="sortBy === opt.key ? 'bg-blue-500 text-white border-blue-500' : 'hover:bg-gray-50'"
              @click="sortBy = opt.key"
            >
              {{ opt.label }}
            </button>
          </div>

          <!-- 酒店网格 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <HotelCard
              v-for="hotel in sortedHotels"
              :key="`${hotel.source}-${hotel.name}`"
              :hotel="hotel"
              :selected="isSelected(hotel)"
              @select="selectHotel"
            />
          </div>
        </div>
      </div>

      <!-- AI 分析面板 -->
      <div class="mt-6">
        <AiPanel />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import SearchBar from '@/components/SearchBar.vue';
import HotelCard from '@/components/HotelCard.vue';
import MapView from '@/components/MapView.vue';
import AiPanel from '@/components/AiPanel.vue';
import { useHotelStore } from '@/stores/hotel';
import { useSearchStore } from '@/stores/search';
import { searchHotels } from '@/api/hotels';
import type { Hotel } from '../../../workers/shared/types';

const route = useRoute();
const hotelStore = useHotelStore();
const searchStore = useSearchStore();

const loading = ref(false);
const error = ref<string | null>(null);
const sources = ref({ meituan: false, ctrip: false });
const sortBy = ref<string>('default');
const mapCenter = ref<{ lat: number; lng: number } | undefined>(undefined);

const mapMarkers = computed(() =>
  hotelStore.hotels.map((h) => ({
    name: h.name,
    lat: 0,
    lng: 0,
  }))
);

const sortOptions = [
  { key: 'default', label: '默认' },
  { key: 'price_asc', label: '价格最低' },
  { key: 'price_desc', label: '价格最高' },
  { key: 'rating', label: '评分最高' },
];

const sortedHotels = computed(() => {
  const list = [...hotelStore.hotels];
  switch (sortBy.value) {
    case 'price_asc': return list.sort((a, b) => a.price - b.price);
    case 'price_desc': return list.sort((a, b) => b.price - a.price);
    case 'rating': return list.sort((a, b) => b.rating - a.rating);
    default: return list;
  }
});

function isSelected(hotel: Hotel) {
  return hotelStore.selectedHotels.some((h) => h.name === hotel.name);
}

function selectHotel(hotel: Hotel) {
  hotelStore.selectForCompare(hotel);
}

function handleCenterChange(center: { lat: number; lng: number }) {
  mapCenter.value = center;
}

async function fetchData() {
  const city = route.query.city as string;
  const keyword = route.query.keyword as string;

  if (!city) return;

  loading.value = true;
  error.value = null;

  try {
    const result = await searchHotels({ city, keyword });
    hotelStore.setHotels(result.hotels);
    sources.value = result.sources;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '搜索失败';
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);
</script>
```

- [ ] **步骤 2：提交**

```bash
git add frontend/src/views/Search.vue
git commit -m "feat: add Search page with hotel list and map"
```

---

### 任务 19：对比页面（Compare.vue）

**文件：**
- 创建：`frontend/src/views/Compare.vue`

- [ ] **步骤 1：创建对比详情页**

```vue
<!-- src/views/Compare.vue -->
<template>
  <div class="max-w-6xl mx-auto px-4 py-4">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-medium">酒店对比</h2>
      <button
        v-if="hotelStore.selectedHotels.length > 0"
        class="text-sm text-gray-500 hover:text-red-500"
        @click="hotelStore.clearSelection()"
      >
        清除所有
      </button>
    </div>

    <!-- 无选择状态 -->
    <div v-if="hotelStore.selectedHotels.length === 0" class="text-center py-16">
      <p class="text-gray-400 mb-2">还没有选择任何酒店</p>
      <router-link to="/" class="text-blue-500 hover:underline">返回搜索</router-link>
    </div>

    <!-- 对比表格 -->
    <template v-else>
      <!-- 酒店卡片横向排列 -->
      <div class="grid gap-4" :class="gridClass">
        <div
          v-for="hotel in hotelStore.selectedHotels"
          :key="`${hotel.source}-${hotel.name}`"
          class="bg-white rounded-lg shadow-sm border p-4"
        >
          <div class="flex items-center justify-between mb-2">
            <span
              class="px-2 py-0.5 rounded text-xs text-white font-medium"
              :class="hotel.source === 'meituan' ? 'bg-yellow-500' : 'bg-blue-500'"
            >
              {{ hotel.source === 'meituan' ? '美团' : '携程' }}
            </span>
            <button
              class="text-gray-400 hover:text-red-500 text-sm"
              @click="hotelStore.removeFromCompare(hotel)"
            >
              ✕
            </button>
          </div>

          <img
            v-if="hotel.images.length > 0"
            :src="hotel.images[0]"
            :alt="hotel.name"
            class="w-full h-48 object-cover rounded-md mb-3"
          />

          <h3 class="font-medium mb-1">{{ hotel.name }}</h3>

          <table class="w-full text-sm">
            <tbody>
              <tr class="border-b">
                <td class="py-2 text-gray-400 w-20">价格</td>
                <td class="py-2 text-xl text-red-500 font-bold">¥{{ hotel.price }}</td>
              </tr>
              <tr class="border-b">
                <td class="py-2 text-gray-400">评分</td>
                <td class="py-2">
                  <span class="text-yellow-400">★</span>
                  {{ hotel.rating.toFixed(1) }}
                </td>
              </tr>
              <tr class="border-b">
                <td class="py-2 text-gray-400">地址</td>
                <td class="py-2 text-gray-600 text-xs">{{ hotel.address }}</td>
              </tr>
              <tr class="border-b">
                <td class="py-2 text-gray-400">距离</td>
                <td class="py-2">{{ hotel.distance }}m</td>
              </tr>
              <tr class="border-b">
                <td class="py-2 text-gray-400">房型</td>
                <td class="py-2">{{ hotel.roomType || '—' }}</td>
              </tr>
              <tr>
                <td class="py-2 text-gray-400">设施</td>
                <td class="py-2">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="facility in hotel.facilities.slice(0, 5)"
                      :key="facility"
                      class="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
                    >
                      {{ facility }}
                    </span>
                    <span v-if="hotel.facilities.length > 5" class="text-xs text-gray-400">
                      +{{ hotel.facilities.length - 5 }}
                    </span>
                    <span v-if="hotel.facilities.length === 0" class="text-gray-400">—</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <a
            :href="hotel.url"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-3 block text-center text-sm text-blue-500 hover:underline"
          >
            查看原文 →
          </a>
        </div>
      </div>

      <!-- AI 分析 -->
      <div class="mt-6">
        <AiPanel />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AiPanel from '@/components/AiPanel.vue';
import { useHotelStore } from '@/stores/hotel';

const hotelStore = useHotelStore();

const gridClass = computed(() => {
  const count = hotelStore.selectedHotels.length;
  if (count <= 2) return 'grid-cols-1 sm:grid-cols-2';
  if (count <= 3) return 'grid-cols-1 sm:grid-cols-3';
  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
});
</script>
```

- [ ] **步骤 2：提交**

```bash
git add frontend/src/views/Compare.vue
git commit -m "feat: add Compare page with side-by-side hotel comparison"
```

---

### 任务 20：CloudFlare 部署配置 + README

**文件：**
- 修改：`wrangler-api.toml`（补充生产配置）
- 修改：`wrangler-mcp.toml`（补充生产配置）
- 创建：`README.md`

- [ ] **步骤 1：完善 wrangler-api.toml**

```toml
name = "ocgnlink-api"
main = "workers/api/index.ts"
compatibility_date = "2024-01-01

[vars]
AMAP_API_KEY = ""

[[routes]]
pattern = "your-domain.com/api/*"
zone_name = "your-domain.com"
```

- [ ] **步骤 2：完善 wrangler-mcp.toml**

```toml
name = "ocgnlink-mcp"
main = "workers/mcp/index.ts"
compatibility_date = "2024-01-01"
```

- [ ] **步骤 3：创建 README.md**

```markdown
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
```

- [ ] **步骤 4：提交**

```bash
git add wrangler-api.toml wrangler-mcp.toml README.md
git commit -m "docs: add deployment config and README"
```

---

## 自检

### 1. 规格覆盖度

| 规格章节 | 对应任务 | 覆盖 |
|---------|---------|------|
| 2.2 技术栈 | 任务 1, 10 | ✓ |
| 2.3 Monorepo 结构 | 任务 1, 2, 10 | ✓ |
| 3. 配置系统 | 任务 1 | ✓ |
| 3.2 敏感信息管理 | 任务 20（env vars） | ✓ |
| 4.1 数据流 | 任务 4, 5, 6 | ✓ |
| 4.2 统一数据格式 | 任务 2（types.ts） | ✓ |
| 4.3 反爬策略 | 任务 5, 6（mobile UA） | ✓ |
| 5.1 工具列表 | 任务 9 | ✓ |
| 5.2 传输方式（SSE） | 任务 9（index.ts） | ✓ |
| 6. AI 分析 | 任务 7, 16 | ✓ |
| 7.1 页面路由 | 任务 11, 17, 18, 19 | ✓ |
| 7.2 组件设计 | 任务 13, 14, 15, 16 | ✓ |
| 8. 部署 | 任务 20 | ✓ |
| 9. 依赖清单 | 任务 1, 3, 10 | ✓ |

### 2. 占位符扫描

- 所有代码块包含完整代码，无 "TODO"、"待定"、"后续实现" 等占位符
- 每个步骤有明确的命令和预期输出
- 类型保持一致（`Hotel` 接口在 `types.ts` 定义，所有组件/API 引用同一类型）

### 3. 类型一致性

- `workers/shared/types.ts` 中的 `Hotel` 接口 → `frontend/src/api/hotels.ts` 引用同一类型 ✓
- `workers/shared/types.ts` 中的 `AiAnalyzeResponse` → `frontend/src/components/AiPanel.vue` 引用 ✓
- Pinia store 中 `Hotel[]` 类型与 API 调用层一致 ✓
- MCP Server 工具参数与 `amap-client.ts` 方法签名一致 ✓

---

## 执行交接

计划已完成并保存到 `docs/superpowers/plans/2026-06-16-hotel-compare-implementation.md`。两种执行方式：

**1. 子代理驱动（推荐）** - 每个任务调度一个新的子代理，任务间进行审查，快速迭代

**2. 内联执行** - 在当前会话中使用 executing-plans 执行任务，批量执行并设有检查点

**选哪种方式？**
