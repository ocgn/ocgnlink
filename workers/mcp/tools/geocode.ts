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
