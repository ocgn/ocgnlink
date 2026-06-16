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
