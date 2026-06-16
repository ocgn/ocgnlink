import { Hono } from 'hono';
import { fetchHotelsFromAmap } from './amap';
import type { Hotel, HotelSearchRequest } from '../../shared/types';
import type { WorkerEnv } from '../../shared/config';

export const hotelRouter = new Hono<{ Bindings: WorkerEnv }>();

// POST /api/hotels/search — 搜索酒店
hotelRouter.post('/search', async (c) => {
  try {
    const body: HotelSearchRequest = await c.req.json();

    if (!body.city) {
      return c.json({ success: false, error: 'city is required' }, 400);
    }

    const amapApiKey = c.env.AMAP_API_KEY || '';

    let hotels: Hotel[] = [];
    let dataSource = '';

    // 用高德 POI 搜索酒店
    if (amapApiKey) {
      try {
        hotels = await fetchHotelsFromAmap(body, amapApiKey);
        if (hotels.length > 0) {
          dataSource = 'amap';
        }
      } catch (amapErr) {
        console.error('AMap fetch failed:', amapErr);
      }
    }

    return c.json({
      success: true,
      data: {
        hotels,
        source: dataSource || 'none',
        total: hotels.length,
      },
    });
  } catch (err) {
    console.error('Hotel search error:', err);
    return c.json({ success: false, error: 'Failed to search hotels' }, 500);
  }
});
