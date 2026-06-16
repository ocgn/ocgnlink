import { Hono } from 'hono';
import type { Hotel, AiAnalyzeResponse } from '../../shared/types';

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

export const aiRouter = new Hono();

// POST /api/ai/analyze
aiRouter.post('/analyze', async (c) => {
  try {
    const body = await c.req.json();
    const { meituanHotels, ctripHotels, provider = 'openai' } = body;

    if (!meituanHotels && !ctripHotels) {
      return c.json({ success: false, error: 'No hotel data provided' }, 400);
    }

    const apiKey = c.env[`${provider.toUpperCase()}_API_KEY` as keyof typeof c.env] as string | undefined;
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
  const formatHotels = (hotels: Hotel[], source: string) =>
    hotels.map((h, i) => `${i + 1}. ${h.name} - ¥${h.price}/晚 - 评分:${h.rating} - ${h.address}`).join('\n');

  return `你是一个酒店选择助手。以下是两个平台的酒店数据对比：

[美团数据]
${formatHotels(meituanHotels, '美团') || '（无数据）'}

[携程数据]
${formatHotels(ctripHotels, '携程') || '（无数据）'}

请从价格、评分、位置、设施等方面进行对比分析，给出推荐建议。`;
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
