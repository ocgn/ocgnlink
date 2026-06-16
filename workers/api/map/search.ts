import {Hono} from 'hono';
import type {WorkerEnv} from '../../shared/config';

export const AMAP_BASE_URL = 'https://restapi.amap.com/v3';

export const mapRouter = new Hono<{Bindings: WorkerEnv}>();

// GET /api/map/static?lng=xxx&lat=xxx&name=xxx
mapRouter.get('/static', async (c) => {
    const lng = c.req.query('lng');
    const lat = c.req.query('lat');
    const name = c.req.query('name') || '';
    const apiKey = c.env.AMAP_API_KEY;
    const securityKey = c.env.AMAP_SECURITY_KEY || '';

    if (!lng || !lat) {
        return c.json({success: false, error: 'lng and lat are required'}, 400);
    }
    if (!apiKey) {
        return c.json({success: false, error: 'AMAP_API_KEY not configured'}, 500);
    }

    const size = c.req.query('size') || '400*200';
    const zoom = c.req.query('zoom') || '15';

    // 参照官方示例格式：zoom&size&key（key放最后）
    // markers 红色标记点（label 只能单字母，空着）
    // labels 显示酒店名称: name,font,bold,fontSize,fontColor,bgColor:lng,lat
    const loc = `${lng},${lat}`;
    const markers = `markers=mid,,:${loc}`;
    const encName = name ? encodeURIComponent(name) : '';
    const labels = encName ? `&labels=${encName},2,0,12,0xFFFFFF,0x0288D1:${loc}` : '';
    const url = `${AMAP_BASE_URL}/staticmap?zoom=${zoom}&size=${size}&${markers}${labels}&key=${apiKey}`;

    try {
        const response = await fetch(url);
        const contentType = response.headers.get('Content-Type') || '';

        // AMap 返回 JSON 说明出错
        if (contentType.includes('json')) {
            const errData = await response.json();
            console.error('AMap static map denied:', errData);
            // 返回美观的 SVG 地图占位
            const label = name ? name.replace(/</g, '') : '位置';
            const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 160" width="400" height="160">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e8f4f8"/>
      <stop offset="100%" stop-color="#d4e8f0"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.15"/>
    </filter>
  </defs>
  <rect width="400" height="160" rx="8" fill="url(#sky)"/>
  <line x1="80" y1="0" x2="80" y2="160" stroke="#fff" stroke-opacity="0.3" stroke-width="0.5"/>
  <line x1="160" y1="0" x2="160" y2="160" stroke="#fff" stroke-opacity="0.3" stroke-width="0.5"/>
  <line x1="240" y1="0" x2="240" y2="160" stroke="#fff" stroke-opacity="0.3" stroke-width="0.5"/>
  <line x1="320" y1="0" x2="320" y2="160" stroke="#fff" stroke-opacity="0.3" stroke-width="0.5"/>
  <line x1="0" y1="40" x2="400" y2="40" stroke="#fff" stroke-opacity="0.3" stroke-width="0.5"/>
  <line x1="0" y1="80" x2="400" y2="80" stroke="#fff" stroke-opacity="0.3" stroke-width="0.5"/>
  <line x1="0" y1="120" x2="400" y2="120" stroke="#fff" stroke-opacity="0.3" stroke-width="0.5"/>
  <circle cx="200" cy="80" r="12" fill="#ef4444" filter="url(#shadow)"/>
  <circle cx="200" cy="80" r="4" fill="#fff"/>
  <text x="200" y="148" text-anchor="middle" font-size="12" fill="#64748b" font-family="sans-serif">${label}</text>
  <text x="390" y="12" text-anchor="end" font-size="8" fill="#94a3b8" font-family="sans-serif">${lng},${lat}</text>
</svg>`;
            return new Response(fallbackSvg, {
                headers: {
                    'Content-Type': 'image/svg+xml',
                    'Cache-Control': 'no-cache',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }

        return new Response(response.body, {
            status: response.status,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (err) {
        console.error('AMap static map error:', err);
        return c.json({success: false, error: 'Failed to fetch static map'}, 500);
    }
});

// GET /api/map/search?keyword=xxx&city=xxx&type=xxx
mapRouter.get('/search', async (c) => {
    const keyword = c.req.query('keyword');
    const city = c.req.query('city');
    const type = c.req.query('type');
    const apiKey = c.env.AMAP_API_KEY;

    if (!keyword) {
        return c.json({success: false, error: 'keyword is required'}, 400);
    }
    if (!apiKey) {
        return c.json({success: false, error: 'AMAP_API_KEY not configured'}, 500);
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
            headers: {'Accept': 'application/json'},
        });

        if (!response.ok) {
            throw new Error(`AMap API error: ${response.status}`);
        }

        const data = await response.json();
        return c.json({success: true, data});
    } catch (err) {
        console.error('AMap search error:', err);
        return c.json({success: false, error: 'Failed to search places'}, 500);
    }
});

