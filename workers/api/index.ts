import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { hotelRouter } from './hotels/index';
import { aiRouter } from './ai/analyze';
import { mapRouter } from './map/search';

type Bindings = { env: WorkerEnv } & WorkerEnv;

const app = new Hono<{ Bindings: Bindings }>();

// 全局 CORS 中间件
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
}));

// 健康检查
app.get('/api/health', (c) => c.json({ success: true, status: 'ok' }));

// 挂载子路由
app.route('/api/hotels', hotelRouter);
app.route('/api/ai', aiRouter);
app.route('/api/map', mapRouter);

// 全局错误处理
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ success: false, error: err.message }, 500);
});

export default app;
