import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { AmapClient } from './amap-client';
import { createSearchTool, handleSearchCall } from './tools/search';
import { createGeocodeTool, handleGeocodeCall } from './tools/geocode';
import { createReverseGeocodeTool, handleReverseGeocodeCall } from './tools/reverse';
import { createNearbyTool, handleNearbyCall } from './tools/nearby';
import { createRouteTool, handleRouteCall } from './tools/route';

export interface Env {
  AMAP_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const amapClient = new AmapClient(env.AMAP_API_KEY);
    const server = new Server(
      { name: 'amap-mcp-server', version: '1.0.0' },
      { capabilities: { tools: {} } },
    );

    // 注册工具列表
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        createSearchTool(),
        createGeocodeTool(),
        createReverseGeocodeTool(),
        createNearbyTool(),
        createRouteTool(),
      ],
    }));

    // 注册工具调用处理
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'amap_search':
          return handleSearchCall(amapClient, args);
        case 'amap_geocode':
          return handleGeocodeCall(amapClient, args);
        case 'amap_reverse_geocode':
          return handleReverseGeocodeCall(amapClient, args);
        case 'amap_nearby':
          return handleNearbyCall(amapClient, args);
        case 'amap_route':
          return handleRouteCall(amapClient, args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    // SSE 传输适配
    const url = new URL(request.url);
    if (url.pathname === '/sse') {
      const transport = new SSEServerTransport('/message', request);
      await server.connect(transport);
      return transport.response;
    }

    // 处理 /message 端点（SSE 消息接收）
    if (url.pathname === '/message') {
      // 在 CF Workers 中，SSEServerTransport 会在连接时处理 /message
      return new Response('Not connected', { status: 400 });
    }

    return new Response('AMap MCP Server --- use /sse to connect', {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};
