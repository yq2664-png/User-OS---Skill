import dotenv from 'dotenv';
dotenv.config();

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_HEADERS = {
  Authorization: `Bearer ${OPENAI_KEY}`,
  'content-type': 'application/json',
};

export const MODELS = {
  simulate: process.env.OPENAI_MODEL_SIMULATE || 'gpt-4o',
  fast: process.env.OPENAI_MODEL_FAST || 'gpt-4o-mini',
  prd: process.env.OPENAI_MODEL_PRD || 'gpt-4o',
};

function toOpenAIContent(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return content;
  return content.map((part) => {
    if (part.type === 'text') return { type: 'text', text: part.text };
    if (part.type === 'image') {
      const { media_type, data } = part.source;
      return { type: 'image_url', image_url: { url: `data:${media_type};base64,${data}` } };
    }
    return part;
  });
}

function toOpenAIMessages(messages) {
  return messages.map((m) => ({
    role: m.role,
    content: toOpenAIContent(m.content),
  }));
}

export async function openaiCreate(model, max_tokens, messages) {
  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: OPENAI_HEADERS,
    body: JSON.stringify({ model, max_tokens, messages: toOpenAIMessages(messages) }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return { content: [{ text: data.choices[0].message.content ?? '' }] };
}

export async function openaiStream(model, max_tokens, messages, onText, onDone) {
  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: OPENAI_HEADERS,
    body: JSON.stringify({ model, max_tokens, messages: toOpenAIMessages(messages), stream: true }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI stream error ${res.status}: ${err}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') continue;
      try {
        const evt = JSON.parse(payload);
        const text = evt.choices?.[0]?.delta?.content;
        if (text) onText(text);
      } catch {}
    }
  }
  onDone();
}
