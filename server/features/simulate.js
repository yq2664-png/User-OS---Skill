import { openaiStream, MODELS } from '../llm/openai.js';
import { buildSimulatePrompt } from '../prompts/simulate.js';

export default async function simulate(req, res) {
  const { productName, productType, coreFunctions, featureConstraints, timeConstraints, productStage, webLink, requirements } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const existingPersonas = req.body.existingPersonas
    ? JSON.parse(req.body.existingPersonas)
    : [];
  const count = parseInt(req.body.count || '8', 10);

  const content = [];

  const screenshots = req.files?.screenshots || [];
  for (const file of screenshots.slice(0, 3)) {
    if (file.mimetype.startsWith('image/')) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: file.mimetype, data: file.buffer.toString('base64') }
      });
    }
  }

  // Fetch web content if stage is 'web'
  let webContent = '';
  if (productStage === 'web' && webLink) {
    try {
      const resp = await fetch(webLink, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) });
      const html = await resp.text();
      // Strip tags, collapse whitespace, truncate
      webContent = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 6000);
    } catch (e) {
      webContent = '(Could not fetch web content — use product name and requirements as context)';
    }
  }

  const fc = featureConstraints ? JSON.parse(featureConstraints) : [];
  const tc = timeConstraints ? JSON.parse(timeConstraints) : [];
  const productDesc = requirements || coreFunctions || '';
  content.push({ type: 'text', text: buildSimulatePrompt(productName, productType, productDesc, existingPersonas, count, fc, tc, productStage, webLink, webContent) });

  try {
    await openaiStream(
      MODELS.simulate,
      4000,
      [{ role: 'user', content }],
      (text) => res.write(`data: ${JSON.stringify({ text })}\n\n`),
      () => { res.write('data: [DONE]\n\n'); res.end(); }
    );
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}
