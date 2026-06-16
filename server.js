import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Simulate ──────────────────────────────────────────────────────────────────
app.post('/api/simulate', upload.fields([{ name: 'screenshots', maxCount: 5 }, { name: 'documents', maxCount: 5 }]), async (req, res) => {
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
    const stream = anthropic.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 4000,
      messages: [{ role: 'user', content }]
    });

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    });

    await stream.finalMessage();
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// ── Real Perspectives ─────────────────────────────────────────────────────────
app.post('/api/real-perspectives', async (req, res) => {
  const { productName, webLink } = req.body;
  if (!productName) return res.status(400).json({ error: 'No product name provided' });

  const headers = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };
  const sections = [];

  function stripHtml(html) {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  await Promise.allSettled([

    // 1. App Store (US) — free public RSS, no auth needed
    (async () => {
      // First find the app ID
      const searchRes = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(productName)}&entity=software&limit=1`,
        { headers, signal: AbortSignal.timeout(8000) }
      );
      const searchData = await searchRes.json();
      const appId = searchData?.results?.[0]?.trackId;
      if (!appId) return;

      const reviewRes = await fetch(
        `https://itunes.apple.com/us/rss/customerreviews/id=${appId}/sortBy=mostRecent/json`,
        { headers, signal: AbortSignal.timeout(8000) }
      );
      const reviewData = await reviewRes.json();
      const entries = reviewData?.feed?.entry ?? [];
      const reviews = entries
        .filter(e => e?.content?.label?.length > 30)
        .slice(0, 8)
        .map(e => {
          const title = e?.title?.label ?? '';
          const body = e?.content?.label ?? '';
          const rating = e?.['im:rating']?.label ?? '';
          return `[App Store – ${rating}★ "${title}"]\n${body.slice(0, 400)}`;
        });
      if (reviews.length) sections.push('=== App Store Reviews ===\n' + reviews.join('\n---\n'));
    })(),

    // 2. App Store (China) — same API, different storefront
    (async () => {
      const searchRes = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(productName)}&entity=software&limit=1&country=cn`,
        { headers, signal: AbortSignal.timeout(8000) }
      );
      const searchData = await searchRes.json();
      const appId = searchData?.results?.[0]?.trackId;
      if (!appId) return;

      const reviewRes = await fetch(
        `https://itunes.apple.com/cn/rss/customerreviews/id=${appId}/sortBy=mostRecent/json`,
        { headers, signal: AbortSignal.timeout(8000) }
      );
      const reviewData = await reviewRes.json();
      const entries = reviewData?.feed?.entry ?? [];
      const reviews = entries
        .filter(e => e?.content?.label?.length > 20)
        .slice(0, 6)
        .map(e => {
          const title = e?.title?.label ?? '';
          const body = e?.content?.label ?? '';
          return `[中国 App Store – "${title}"]\n${body.slice(0, 300)}`;
        });
      if (reviews.length) sections.push('=== 中国 App Store 评价 ===\n' + reviews.join('\n---\n'));
    })(),

    // 3. HackerNews — search stories mentioning the product
    (async () => {
      const r = await fetch(
        `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(productName)}&tags=comment&hitsPerPage=20`,
        { headers, signal: AbortSignal.timeout(8000) }
      );
      const data = await r.json();
      const productLower = productName.toLowerCase();
      const comments = (data?.hits ?? [])
        .filter(h => {
          const text = (h.comment_text ?? '').toLowerCase();
          return text.includes(productLower) && text.length > 80;
        })
        .slice(0, 5)
        .map(h => `[HackerNews]\n${h.comment_text.replace(/<[^>]+>/g, '').slice(0, 400)}`);
      if (comments.length) sections.push('=== HackerNews ===\n' + comments.join('\n---\n'));
    })(),

    // 4. Product website — scrape for testimonials
    ...(webLink ? [(async () => {
      const r = await fetch(webLink, { headers, signal: AbortSignal.timeout(10000) });
      const html = await r.text();
      const text = stripHtml(html).slice(0, 4000);
      sections.push(`=== Product website ===\n${text}`);
    })()] : []),

  ]);

  if (!sections.length) {
    return res.status(422).json({ error: 'Could not find any real user content for this product online.' });
  }

  const rawContent = sections.join('\n\n').slice(0, 10000);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are extracting real user perspectives about "${productName}" from multiple web sources.

Sources collected:
${rawContent}

Extract 5–8 genuine user quotes or closely paraphrased perspectives. Each must reflect an authentic user experience — not marketing copy or brand statements. Cover a mix of sentiments if present.

Return ONLY valid JSON array:
[
  {
    "source": "App Store" | "HackerNews" | "Web",
    "persona": "Brief user type inferred from context (e.g. 'Developer', 'Small business owner', 'Student')",
    "quote": "Real or closely paraphrased first-person quote. 1–2 sentences.",
    "highlight": "the most revealing 3-6 word phrase verbatim from the quote",
    "sentiment": "positive" | "neutral" | "negative"
  }
]

If the content contains no real user voices (only marketing text), return [].`,
      }],
    });

    const text = message.content[0].text;
    const match = text.match(/\[[\s\S]*\]/);
    if (match) res.json({ cards: JSON.parse(match[0]) });
    else res.json({ cards: [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Verify Product ────────────────────────────────────────────────────────────
app.post('/api/verify-product', async (req, res) => {
  const { webLink } = req.body;
  if (!webLink) return res.status(400).json({ error: 'No URL provided' });

  let pageText = '';
  try {
    const resp = await fetch(webLink, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
    });
    const html = await resp.text();
    pageText = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 6000);
  } catch (e) {
    return res.status(422).json({ error: 'Could not fetch the URL. Please check it and try again.' });
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Based on the following web page content, extract key information about this product.

Web page content:
${pageText}

Return ONLY valid JSON with this exact structure:
{
  "name": "Product name as it appears on the site",
  "tagline": "One-sentence description of what it does",
  "audience": "Who it is for (one short phrase)",
  "features": ["Key feature 1", "Key feature 2", "Key feature 3"]
}

Be concise and accurate. Base everything strictly on what is on the page.`,
      }],
    });
    const match = message.content[0].text.match(/\{[\s\S]*\}/);
    if (match) res.json(JSON.parse(match[0]));
    else res.status(500).json({ error: 'Could not parse product info' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Insights ──────────────────────────────────────────────────────────────────
app.post('/api/insights', async (req, res) => {
  const { cards, productName } = req.body;
  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 3000,
      messages: [{ role: 'user', content: buildInsightsPrompt(cards, productName) }]
    });
    const text = message.content[0].text;
    const match = text.match(/\{[\s\S]*\}/);
    if (match) res.json(JSON.parse(match[0]));
    else res.status(500).json({ error: 'Parse failed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PRD ───────────────────────────────────────────────────────────────────────
app.post('/api/prd', async (req, res) => {
  const { productName, insights } = req.body;
  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4000,
      messages: [{ role: 'user', content: buildPRDPrompt(productName, insights) }]
    });
    const text = message.content[0].text;
    const match = text.match(/\{[\s\S]*\}/);
    if (match) res.json(JSON.parse(match[0]));
    else res.status(500).json({ error: 'Parse failed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Prompt builders ───────────────────────────────────────────────────────────
function buildSimulatePrompt(name, type, functions, existingPersonas = [], count = 8, featureConstraints = [], timeConstraints = [], productStage = '', webLink = '', webContent = '') {
  const exclude = existingPersonas.length > 0
    ? `\nAvoid these already-used personas: ${existingPersonas.join(', ')}.`
    : '';

  const fcSection = featureConstraints.length > 0
    ? `\nFeature Module Constraints:\n${featureConstraints.map(f => `- ${f.module}: ${f.constraint}`).join('\n')}`
    : '';

  const tcSection = timeConstraints.length > 0
    ? `\nChange Timeline & Priority (in order):\n${timeConstraints.map((t, i) => `${i + 1}. [${t.timeline}] ${t.description}`).join('\n')}`
    : '';

  const stageLabel = productStage === 'unpublished' ? 'Pre-launch / Unpublished'
    : productStage === 'web' ? 'Live Web Product'
    : productStage === 'client' ? 'Client App (desktop/mobile)'
    : 'Not specified';

  const webSection = webContent
    ? `\nWebsite Content (scraped from ${webLink}):\n${webContent}`
    : '';

  return `You are simulating authentic, unfiltered user perspectives for a product. Be honest and reveal real friction, confusion, excitement, and hesitation.

Product Name: ${name}
Product Stage: ${stageLabel}
Product Type: ${type || 'Not specified'}
Description / Requirements: ${functions || 'Not provided'}${webSection}${fcSection}${tcSection}

Generate exactly ${count} distinct user perspective cards. Each card represents a different user type encountering this product for the first time.${exclude}

Output ONLY the cards separated by ---CARD--- with no other text before, between, or after.

Each card must be valid standalone JSON with this exact structure:
{
  "persona": "Power User",
  "emotion": "Frustrated",
  "thought": "A short, punchy first-person reaction. MAXIMUM 20 words. No filler.",
  "highlight": "the most revealing 3-6 word phrase from the thought",
  "background": {
    "name": "A realistic full name",
    "age": 34,
    "job": "Specific job title and company type",
    "context": "One sentence about their relevant experience or situation"
  }
}

Persona types to use (each once): Early Adopter, Skeptic, Busy Professional, Power User, Casual User, Enterprise Buyer, Technical Expert, Non-Technical User

Emotion options: Excited, Confused, Frustrated, Curious, Skeptical, Overwhelmed, Delighted, Anxious

CRITICAL: Keep "thought" under 20 words. Make it sharp and specific, not generic. The "highlight" must be a verbatim substring of "thought".`;
}

function buildInsightsPrompt(cards, productName) {
  const summary = cards.map(c => `[${c.persona} — ${c.emotion}] ${c.thought}`).join('\n\n');
  return `You are a senior product researcher analyzing user interview data for ${productName}.

User perspectives collected:
${summary}

Extract structured insights with severity scoring. Return ONLY valid JSON with this exact structure:
{
  "frustrations": [
    {
      "rank": 1,
      "title": "Concise title (5 words max)",
      "description": "What frustrates users and why it matters — specific and concrete",
      "score": 8.5,
      "impact": "Critical",
      "valueNote": "One sentence: business or retention consequence if left unaddressed"
    }
  ],
  "hiddenNeeds": [...],
  "decisionBarriers": [...],
  "trustIssues": [...],
  "opportunities": [...]
}

Scoring rules:
- score: float 1.0–10.0, one decimal place, based on frequency × severity × business impact
- impact: "Critical" (score 8–10), "High" (6–7.9), "Medium" (4–5.9), "Low" (1–3.9)
- Sort each array by score descending
- Each array: 3–4 items. Be concrete and specific, not generic.`;
}

function buildPRDPrompt(productName, insights) {
  return `You are a principal product manager writing a requirements document for ${productName} based on user research.

Research insights:
${JSON.stringify(insights, null, 2)}

Generate a focused PRD. Return ONLY valid JSON:
{
  "title": "${productName} — Product Requirements Document",
  "sections": [
    {
      "id": 1,
      "name": "Short name for this requirement (3-5 words max)",
      "priority": "Critical",
      "problem": "Specific, concrete problem statement derived from user research",
      "userStory": "As a [specific user type], I want [concrete capability] so that [real measurable outcome]",
      "requirement": "Clear, testable product requirement that addresses the problem",
      "successMetric": "Specific, measurable KPI or outcome that defines success"
    }
  ]
}

Generate 5-6 sections. Each must address a distinct need from the insights. No filler — every section must be actionable.
priority must be one of: "Critical", "High", "Medium", "Low" — assign based on impact severity from the insights.
Sort sections by priority descending (Critical first).`;
}

// Serve frontend in production
const distPath = join(__dirname, 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

const PORT = process.env.SERVER_PORT || process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
