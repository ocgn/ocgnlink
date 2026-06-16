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
