export interface WorkerEnv {
  AMAP_API_KEY?: string;
  OPENAI_API_KEY?: string;
  CLAUDE_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  MEITUAN_COOKIES?: string;
  CTRIP_COOKIES?: string;
}

export function getConfig(env: WorkerEnv) {
  return {
    amapApiKey: env.AMAP_API_KEY || '',
    amapBaseUrl: 'https://restapi.amap.com/v3',
    openaiKey: env.OPENAI_API_KEY || '',
    claudeKey: env.CLAUDE_API_KEY || '',
    deepseekKey: env.DEEPSEEK_API_KEY || '',
    meituanCookies: env.MEITUAN_COOKIES || '',
    ctripCookies: env.CTRIP_COOKIES || '',
  };
}
