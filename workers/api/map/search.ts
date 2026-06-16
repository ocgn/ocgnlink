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
