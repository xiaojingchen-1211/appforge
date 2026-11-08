import { buildGenerationMessages, extractHtml, RACE_VARIANTS } from "./prompt";
import { mockGenerate } from "./mock";

interface Provider {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export function resolveProvider(): Provider | null {
  if (process.env.DEEPSEEK_API_KEY) {
    return {
      name: "deepseek",
      baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      name: "openai",
      baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    };
  }
  return null;
}

export function hasProvider(): boolean {
  return resolveProvider() !== null;
}

async function chatOnce(
  provider: Provider,
  messages: { role: string; content: string }[],
  timeoutMs = 90_000,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${provider.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature: 0.7,
        max_tokens: 4096,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      const err = new Error(`模型接口 ${res.status}: ${body.slice(0, 200)}`);
      (err as Error & { status?: number }).status = res.status;
      throw err;
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("模型返回空内容");
    return content;
  } finally {
    clearTimeout(timer);
  }
}

export interface LaneResult {
  html: string;
  model: string;
  latencyMs: number;
  degraded: boolean;
  error?: string;
}

/**
 * 跑一条"跑道"：给定的设计方向下生成一个候选。
 * 任何失败（无 Key、超时、额度耗尽）都会降级到内置 mock，保证演示流程永远能走完。
 */
export async function generateLane(
  prompt: string,
  lane: number,
  parentHtml?: string,
): Promise<LaneResult> {
  const variant = RACE_VARIANTS[lane % RACE_VARIANTS.length];
  const started = Date.now();
  const provider = resolveProvider();

  if (!provider) {
    return {
      html: mockGenerate(prompt, variant.key),
      model: "mock · 内置模板",
      latencyMs: Date.now() - started,
      degraded: true,
      error: "未配置 API Key，已使用离线 mock 生成",
    };
  }

  const messages = buildGenerationMessages(prompt, variant, parentHtml);
  let lastError = "";

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await chatOnce(provider, messages);
      const html = extractHtml(raw);
      if (html.length < 400) throw new Error("生成内容过短，可能是模型截断");
      return {
        html,
        model: `${provider.name}:${provider.model}`,
        latencyMs: Date.now() - started,
        degraded: false,
      };
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      // 4xx（除 429）不重试，避免浪费调用
      const status = (e as Error & { status?: number }).status;
      if (status && status >= 400 && status < 500 && status !== 429) break;
    }
  }

  return {
    html: mockGenerate(prompt, variant.key),
    model: "mock · 降级兜底",
    latencyMs: Date.now() - started,
    degraded: true,
    error: lastError,
  };
}
