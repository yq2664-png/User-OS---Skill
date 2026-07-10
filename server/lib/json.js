// Extract the first complete top-level JSON array, tolerating trailing prose,
// markdown fences, and brackets appearing inside string values.
export function parseFirstJsonArray(text) {
  const start = text.indexOf('[');
  if (start === -1) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(text.slice(start, i + 1)); } catch { return null; }
      }
    }
  }
  return null;
}

export function extractJSON(text) {
  // Try code fence first
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidates = fence ? [fence[1], text] : [text];
  for (const src of candidates) {
    const match = src.match(/\{[\s\S]*\}/);
    if (!match) continue;
    try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}
