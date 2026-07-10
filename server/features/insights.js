import { openaiCreate, MODELS } from '../llm/openai.js';
import { buildInsightsPrompt } from '../prompts/insights.js';
import { extractJSON } from '../lib/json.js';

export default async function insights(req, res) {
  const { cards, productName } = req.body;
  if (!cards || cards.length === 0) {
    return res.status(400).json({ error: 'No perspective cards provided' });
  }
  try {
    const message = await openaiCreate(MODELS.fast, 5000, [{ role: 'user', content: buildInsightsPrompt(cards, productName) }]);
    const text = message.content[0].text;
    const parsed = extractJSON(text);
    if (parsed) res.json(parsed);
    else res.status(500).json({ error: 'Parse failed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
