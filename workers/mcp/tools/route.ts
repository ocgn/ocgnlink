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
