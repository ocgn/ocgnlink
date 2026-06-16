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
