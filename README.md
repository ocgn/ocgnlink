# Hotel comparison

A hotel comparison platform built with Vue 3 + CloudFlare Workers, powered by AMap POI data and DeepSeek AI analysis.

## Features

- 🔍 **Hotel search** — Search by city and keyword with autocomplete
- 🗺️ **AMap static maps** — Each hotel shows its location on a real map thumbnail
- 📊 **Compare hotels** — Side-by-side comparison of prices, ratings, facilities
- 🤖 **AI analysis** — DeepSeek-powered intelligent hotel recommendations
- 📍 **Popular landmarks** — City-specific landmark suggestions for quick search

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 + Vite + TailwindCSS + Pinia |
| API | CloudFlare Workers (Hono) |
| Maps | AMap (高德地图) POI + Static Maps |
| AI | DeepSeek |
| Deploy | CloudFlare Pages + Workers |

## Project Structure

```
ocgnlink/
├── frontend/              # Vue 3 frontend
│   └── src/
│       ├── views/         # Home, Search, Compare
│       ├── components/    # HotelCard, SearchBar, AiPanel
│       ├── stores/        # Pinia stores
│       └── api/           # API client layer
├── workers/               # CloudFlare Workers
│   ├── api/               # API Worker (Hono router)
│   │   ├── hotels/        # AMap hotel search
│   │   ├── map/           # Map proxy + static map
│   │   └── ai/            # DeepSeek analysis
│   ├── mcp/               # MCP Server (AMap tools)
│   └── shared/            # Shared types & config
├── config/                # Model & AMap config
├── wrangler-api.toml      # API Worker deploy config
└── wrangler-mcp.toml      # MCP Worker deploy config
```

## Local Development

```bash
# Install dependencies (root workspace)
npm install

# Start API Worker (terminal 1)
cd workers && npx wrangler dev --config ../wrangler-api.toml --port 8787

# Start frontend (terminal 2)
cd frontend && npx vite --port 5173

# Open http://localhost:5173
```

The frontend dev server proxies `/api/*` requests to `localhost:8787`.

## Environment Variables

Configure in `wrangler-api.toml` `[vars]` or use `wrangler secret` for production:

| Variable | Description | Required |
|----------|-------------|----------|
| `AMAP_API_KEY` | AMap Web Service API Key | Yes |
| `DEEPSEEK_API_KEY` | DeepSeek API Key | For AI analysis |
| `AMAP_SECURITY_KEY` | AMap security key (if required) | Optional |

## Data Sources

- **Hotel data**: AMap (高德地图) POI search — real hotel names, addresses, coordinates, photos
- **Prices**: Estimated based on hotel type (luxury/business/budget)
- **Maps**: AMap Static Map API for location thumbnails
- **AI**: DeepSeek model for hotel analysis and recommendations

## Deployment

Push to GitHub `main` branch — CloudFlare auto-deploys:

- Frontend → CloudFlare Pages
- API Worker → `ocgnlink-api`
- MCP Worker → `ocgnlink-mcp`
