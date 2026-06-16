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
