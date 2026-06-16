import { Hono } from 'hono';
import type { Hotel, AiAnalyzeResponse } from '../../shared/types';
import type { WorkerEnv } from '../../shared/config';

const AI_PROVIDERS: Record<string, { endpoint: string; format: 'openai' | 'claude'; model: string }> = {
  openai: {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    format: 'openai',
    model: 'gpt-4o',
  },
  claude: {
    endpoint: 'https://api.anthropic.com/v1/messages',
    format: 'claude',
    model: 'claude-sonnet-4-20250514',
  },
  deepseek: {
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    format: 'openai',
    model: 'deepseek-chat',
  },
};

export const aiRouter = new Hono<{ Bindings: WorkerEnv }>();

// POST /api/ai/analyze
aiRouter.post('/analyze', async (c) => {
  try {
    const body = await c.req.json();
    const { meituanHotels, ctripHotels, provider = 'openai' } = body;

    if (!meituanHotels && !ctripHotels) {
      return c.json({ success: false, error: 'No hotel data provided' }, 400);
    }

    const keyName = `${provider.toUpperCase()}_API_KEY` as keyof WorkerEnv;
    const apiKey = c.env[keyName] as string | undefined;
    if (!apiKey) {
      return c.json({ success: false, error: `API key for ${provider} not configured` }, 400);
    }

    const providerConfig = AI_PROVIDERS[provider];
    if (!providerConfig) {
      return c.json({ success: false, error: `Unknown provider: ${provider}` }, 400);
    }

    const prompt = buildAnalysisPrompt(meituanHotels || [], ctripHotels || []);
    const analysis = await callAiModel(prompt, providerConfig, apiKey);

    return c.json({
      success: true,
      data: {
        analysis,
        recommendation: extractRecommendation(analysis),
        model: providerConfig.model,
      } satisfies AiAnalyzeResponse,
    });
  } catch (err) {
    console.error('AI analysis error:', err);
    return c.json({ success: false, error: 'AI analysis failed' }, 500);
  }
});

function buildAnalysisPrompt(meituanHotels: Hotel[], ctripHotels: Hotel[]): string {
  const formatHotels = (hotels: Hotel[]) =>
    hotels.map((h, i) =>
      `${i + 1}. ${h.name}
   - 价格: ¥${h.price}/晚
   - 评分: ${h.rating}/5
   - 地址: ${h.address}
   - 房型: ${h.roomType || '未知'}
   - 设施: ${h.facilities.join('、') || '未知'}`
    ).join('\n\n');

  const hotelList = [...meituanHotels, ...ctripHotels].filter(Boolean);

  return `你是一个资深的酒店评测专家。以下是搜索到的酒店列表：

${formatHotels(hotelList)}

请充分发挥你对这些酒店的了解，从以下几个方面进行深入分析：

1. **价格与性价比** — 对比各酒店的价格水平，哪些物超所值
2. **口碑与评价** — 根据你的知识，这些酒店在住客中的口碑如何，网上的常见评价（服务、卫生、位置等）
3. **位置便利性** — 各酒店的地理位置优劣，周边交通、餐饮、景点情况
4. **设施与服务** — 对比各酒店的设施配置和服务水平
5. **适用人群推荐** — 分别适合商务出行、家庭旅游、情侣度假等

最后给出一个明确的**综合推荐排名**，说明首选和备选方案。`;
}

async function callAiModel(prompt: string, config: typeof AI_PROVIDERS[string], apiKey: string): Promise<string> {
  if (config.format === 'claude') {
    const body = JSON.stringify({
      model: config.model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json() as { content?: Array<{ text: string }> };
    return data.content?.[0]?.text || '';
  }

  // OpenAI / DeepSeek 格式
  const body = JSON.stringify({
    model: config.model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4096,
  });

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json() as { choices?: Array<{ message: { content: string } }> };
  return data.choices?.[0]?.message?.content || '';
}

function extractRecommendation(analysis: string): string {
  // 简单提取最后一段作为推荐结论
  const paragraphs = analysis.split('\n\n').filter(Boolean);
  return paragraphs[paragraphs.length - 1] || analysis;
}
