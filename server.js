import express from 'express';
import cors from 'cors';
import multer from 'multer';
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

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_HEADERS = {
  'x-api-key': ANTHROPIC_KEY,
  'anthropic-version': '2023-06-01',
  'content-type': 'application/json',
};

async function claudeCreate(model, max_tokens, messages) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: ANTHROPIC_HEADERS,
    body: JSON.stringify({ model, max_tokens, messages }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }
  return res.json();
}

async function claudeStream(model, max_tokens, messages, onText, onDone) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: ANTHROPIC_HEADERS,
    body: JSON.stringify({ model, max_tokens, messages, stream: true }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic stream error ${res.status}: ${err}`);
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
        if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
          onText(evt.delta.text);
        }
      } catch {}
    }
  }
  onDone();
}

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
    await claudeStream(
      'claude-opus-4-8',
      4000,
      [{ role: 'user', content }],
      (text) => res.write(`data: ${JSON.stringify({ text })}\n\n`),
      () => { res.write('data: [DONE]\n\n'); res.end(); }
    );
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// ── Real Perspectives ─────────────────────────────────────────────────────────
app.post('/api/real-perspectives', async (req, res) => {
  const { productName, webLink, productStage } = req.body;
  if (!productName) return res.status(400).json({ error: 'No product name provided' });

  const headers = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

  // Each source item gets a stable server-side ref + real URL. The AI returns the
  // ref (not the URL) so it can never fabricate/mangle a link. ref → url is mapped
  // back here after extraction.
  const items = [];
  const urlByRef = new Map();
  const addItem = (source, url, text) => {
    const ref = items.length + 1;
    urlByRef.set(ref, url);
    items.push({ ref, source, url, text });
  };

  // Web products live on the web — pull web voices (Reddit, HN, the site itself).
  // Only client apps get App Store reviews.
  const isWeb = productStage === 'web';

  function stripHtml(html) {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const appStoreSources = isWeb ? [] : [

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
      const appUrl = `https://apps.apple.com/us/app/id${appId}`;
      entries
        .filter(e => e?.content?.label?.length > 30)
        .slice(0, 8)
        .forEach(e => {
          const title = e?.title?.label ?? '';
          const body = e?.content?.label ?? '';
          const rating = e?.['im:rating']?.label ?? '';
          addItem('App Store', appUrl, `${rating}★ "${title}" — ${body.slice(0, 400)}`);
        });
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
      const cnAppUrl = `https://apps.apple.com/cn/app/id${appId}`;
      entries
        .filter(e => e?.content?.label?.length > 20)
        .slice(0, 6)
        .forEach(e => {
          const title = e?.title?.label ?? '';
          const body = e?.content?.label ?? '';
          addItem('App Store', cnAppUrl, `"${title}" — ${body.slice(0, 300)}`);
        });
    })(),
  ];

  // Parse review bodies out of a page's JSON-LD (schema.org Review objects).
  // Trustpilot and G2 both embed reviews this way, so one parser covers both.
  function extractLdReviews(html) {
    const out = [];
    const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    for (const b of blocks) {
      let data; try { data = JSON.parse(b[1].trim()); } catch { continue; }
      const nodes = Array.isArray(data) ? data : (data['@graph'] || [data]);
      for (const node of nodes) {
        let reviews = node?.review ?? node?.reviews ?? [];
        if (!Array.isArray(reviews)) reviews = [reviews];
        for (const rv of reviews) {
          const body = rv?.reviewBody || rv?.description;
          const rating = rv?.reviewRating?.ratingValue;
          if (body && body.length > 40) out.push(`${rating ? rating + '★ ' : ''}${body.replace(/\s+/g, ' ').slice(0, 400)}`);
        }
      }
    }
    return out;
  }

  let host = '';
  try { host = new URL(webLink || '').hostname.replace(/^www\./, ''); } catch {}

  const webSources = [

    // Trustpilot — public review pages keyed by domain
    ...(host ? [(async () => {
      const tpUrl = `https://www.trustpilot.com/review/${host}`;
      const r = await fetch(tpUrl, { headers, signal: AbortSignal.timeout(9000) });
      if (!r.ok) return;
      const html = await r.text();
      extractLdReviews(html).slice(0, 6).forEach(body => addItem('Trustpilot', tpUrl, body));
    })()] : []),

    // G2 — best-effort; Cloudflare often blocks datacenter IPs. Guess the slug
    // from the product name; allSettled swallows the frequent 403/404.
    (async () => {
      const slug = productName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (!slug) return;
      const g2Url = `https://www.g2.com/products/${slug}/reviews`;
      const r = await fetch(g2Url, { headers, signal: AbortSignal.timeout(9000) });
      if (!r.ok) return;
      const html = await r.text();
      extractLdReviews(html).slice(0, 6).forEach(body => addItem('G2', g2Url, body));
    })(),

    // Reddit — real user discussion across the web
    (async () => {
      const r = await fetch(
        `https://www.reddit.com/search.json?q=${encodeURIComponent(productName)}&sort=relevance&limit=25`,
        { headers, signal: AbortSignal.timeout(8000) }
      );
      const data = await r.json();
      const productLower = productName.toLowerCase();
      const posts = (data?.data?.children ?? [])
        .map(c => c.data)
        .filter(p => {
          const text = `${p.title ?? ''} ${p.selftext ?? ''}`.toLowerCase();
          return text.includes(productLower) && (p.selftext?.length > 60 || p.title?.length > 40);
        })
        .slice(0, 6)
        .forEach(p => {
          const url = `https://www.reddit.com${p.permalink}`;
          const body = (p.selftext || p.title || '').replace(/\s+/g, ' ').slice(0, 400);
          addItem('Reddit', url, `r/${p.subreddit}: ${body}`);
        });
    })(),

    // HackerNews — search comments mentioning the product
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
        .forEach(h => {
          // Algolia's objectID for a comment IS the HN item id; item?id=<it> is valid.
          const hnUrl = h.objectID ? `https://news.ycombinator.com/item?id=${h.objectID}` : 'https://news.ycombinator.com';
          addItem('HackerNews', hnUrl, h.comment_text.replace(/<[^>]+>/g, '').slice(0, 400));
        });
    })(),

    // Product website — scrape for testimonials
    ...(webLink ? [(async () => {
      const r = await fetch(webLink, { headers, signal: AbortSignal.timeout(10000) });
      const html = await r.text();
      const text = stripHtml(html).slice(0, 4000);
      addItem('Web', webLink, text);
    })()] : []),

  ];

  await Promise.allSettled([...appStoreSources, ...webSources]);

  if (!items.length) {
    return res.status(422).json({ error: 'Could not find any real user content for this product online.' });
  }

  // Build the reference list the AI reads. It returns `ref`, never a URL.
  const rawContent = items
    .map(it => `[ref:${it.ref}] (${it.source})\n${it.text}`)
    .join('\n\n')
    .slice(0, 10000);

  try {
    const message = await claudeCreate('claude-haiku-4-5-20251001', 2000, [{
        role: 'user',
        content: `You are extracting real user perspectives about "${productName}" from multiple web sources.

Sources collected:
${rawContent}

Each source snippet is prefixed with [ref:N] and its (Source). Extract 5–8 genuine user quotes or closely paraphrased perspectives. Each must reflect an authentic user experience — not marketing copy or brand statements. Cover a mix of sentiments if present.

Return ONLY valid JSON array:
[
  {
    "ref": N,
    "source": "App Store" | "Reddit" | "HackerNews" | "Trustpilot" | "G2" | "Web",
    "persona": "Brief user type inferred from context (e.g. 'Developer', 'Small business owner', 'Student')",
    "quote": "Real or closely paraphrased first-person quote. 1–2 sentences.",
    "highlight": "the most revealing 3-6 word phrase verbatim from the quote",
    "sentiment": "positive" | "neutral" | "negative"
  }
]

CRITICAL: "ref" must be the exact integer from the [ref:N] tag of the snippet this quote came from. Never invent a ref. If the content contains no real user voices (only marketing text), return [].`,
      }]);

    const text = message.content[0].text;
    // Balanced-bracket scan: grab the FIRST complete top-level [ ... ] array,
    // ignoring any prose the model adds after it (it sometimes writes [ref:N]
    // in a trailing note, which broke a greedy regex).
    const parsed = parseFirstJsonArray(text);
    if (!parsed) return res.json({ cards: [] });
    // Map each ref back to its real, server-verified URL. Drop the sourceUrl if
    // the ref is missing/invalid so the client never renders a broken link.
    const cards = parsed.map(c => {
      const { ref, ...rest } = c;
      const sourceUrl = urlByRef.get(ref);
      return sourceUrl ? { ...rest, sourceUrl } : rest;
    });
    res.json({ cards });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Verify Product ────────────────────────────────────────────────────────────
app.post('/api/verify-product', async (req, res) => {
  const { webLink, productName, productStage } = req.body;

  // Client app: search App Store for multiple results
  if (productStage === 'client' && productName) {
    try {
      const r = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(productName)}&entity=software&limit=5`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) }
      );
      const data = await r.json();
      const results = (data?.results ?? []).map(app => ({
        name: app.trackName,
        tagline: app.description?.slice(0, 120) ?? '',
        audience: app.primaryGenreName ?? '',
        features: [],
        logo: app.artworkUrl100 ?? app.artworkUrl60 ?? '',
        appId: app.trackId,
      }));
      if (results.length) return res.json({ multiple: results });
      return res.status(404).json({ error: 'No apps found. Please check the product name.' });
    } catch (e) {
      return res.status(422).json({ error: 'Could not search the App Store.' });
    }
  }

  if (!webLink) return res.status(400).json({ error: 'No URL provided' });

  // Derive domain for logo
  let domain = '';
  try { domain = new URL(webLink).hostname; } catch {}
  const logo = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : '';

  // Screenshots via Microlink's free tier were unreliable — many sites block its
  // headless browser and it captured error pages ("This page isn't working").
  // Dropped in favour of the logo + extracted info, which are dependable.
  const screenshot = '';

  // Try to fetch the page. Some sites block datacenter/bot IPs (common on
  // Railway and other hosts) even when the URL is perfectly valid — so a fetch
  // failure must NOT dead-end the user.
  let pageText = '';
  const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  };
  for (let attempt = 0; attempt < 2 && !pageText; attempt++) {
    try {
      const resp = await fetch(webLink, { headers: browserHeaders, redirect: 'follow', signal: AbortSignal.timeout(10000) });
      const html = await resp.text();
      pageText = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 6000);
    } catch { /* retry once, then fall through to graceful degrade */ }
  }

  // Graceful fallback: the site blocked us or timed out. Return a minimal,
  // domain-derived result flagged as unverified so the user can still proceed.
  if (!pageText) {
    const guessedName = domain
      .replace(/^www\./, '')
      .split('.')[0]
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    return res.json({
      name: guessedName || 'This product',
      tagline: "We couldn't read this site automatically (it may block bots) — details below are inferred.",
      audience: '',
      features: [],
      logo,
      screenshot: '',
      unverified: true,
    });
  }

  try {
    const message = await claudeCreate('claude-haiku-4-5-20251001', 500, [{
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
      }]);
    const match = message.content[0].text.match(/\{[\s\S]*\}/);
    if (match) res.json({ ...JSON.parse(match[0]), logo, screenshot });
    else res.status(500).json({ error: 'Could not parse product info' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Insights ──────────────────────────────────────────────────────────────────
app.post('/api/insights', async (req, res) => {
  const { cards, productName } = req.body;
  if (!cards || cards.length === 0) {
    return res.status(400).json({ error: 'No perspective cards provided' });
  }
  try {
    const message = await claudeCreate('claude-opus-4-8', 6000, [{ role: 'user', content: buildInsightsPrompt(cards, productName) }]);
    const text = message.content[0].text;
    const parsed = extractJSON(text);
    if (parsed) res.json(parsed);
    else res.status(500).json({ error: 'Parse failed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PRD ───────────────────────────────────────────────────────────────────────
app.post('/api/prd', async (req, res) => {
  const { productName, insights } = req.body;
  try {
    const message = await claudeCreate('claude-opus-4-8', 5000, [{ role: 'user', content: buildPRDPrompt(productName, insights) }]);
    const text = message.content[0].text;
    const parsed = extractJSON(text);
    if (parsed) res.json(parsed);
    else res.status(500).json({ error: 'Parse failed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Extract the first complete top-level JSON array, tolerating trailing prose,
// markdown fences, and brackets appearing inside string values.
function parseFirstJsonArray(text) {
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

function extractJSON(text) {
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

// ── Prompt builders ───────────────────────────────────────────────────────────
function buildSimulatePrompt(name, type, functions, existingPersonas = [], count = 8, featureConstraints = [], timeConstraints = [], productStage = '', webLink = '', webContent = '') {
  const exclude = existingPersonas.length > 0
    ? `\nAvoid these already-used perspectives: ${existingPersonas.join(', ')}.`
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

  return `You are a design researcher simulating authentic user perspectives for a product. Your goal is to reveal WHY users behave a certain way — their motivations, fears, mental models, and assumptions — not WHO they are demographically.

Product Name: ${name}
Product Stage: ${stageLabel}
Product Type: ${type || 'Not specified'}
Description / Requirements: ${functions || 'Not provided'}${webSection}${fcSection}${tcSection}

Generate exactly ${count} distinct behavioral perspective cards. Each card represents a different motivational state a user might bring to this product.${exclude}

Output ONLY the cards separated by ---CARD--- with no other text before, between, or after.

Each card must be valid standalone JSON with this exact structure:
{
  "perspective": "Looking for Simplicity",
  "name": "A realistic first name for this person, e.g. Marcus",
  "age": 34,
  "occupation": "Their job title, e.g. Product Manager",
  "driver": "What this user is trying to achieve in one sentence",
  "thought": "A sharp, first-person reaction revealing their mental model. MAXIMUM 20 words.",
  "highlight": "the most revealing 3-6 word phrase verbatim from thought",
  "worry": "What they're secretly afraid of or guarding against",
  "assumption": "The underlying belief driving their behavior"
}

Give each card a different, realistic name, age (20–60), and occupation that fits the perspective and product audience.

Perspective types to use (each once, rephrase naturally for this product):
- Looking for Simplicity
- Afraid of Commitment
- Seeking Control
- Risk-Aware
- Looking for Guidance
- Efficiency-Oriented
- Skeptical of Value
- Overwhelmed by Options

CRITICAL: "perspective" must be a motivation, never an occupation or demographic. "thought" must be under 20 words and specific to this product. "highlight" must be a verbatim substring of "thought".

NO MOOD-ONLY CARDS: every "thought" must reveal a decision, behavior, or mental model — not just an emotion. Reject "I'm excited!", "This feels overwhelming.", "I love it." Keep feelings only when tied to what the user would DO or BELIEVE (e.g. "This feels overwhelming, so I'd only turn on one feature and ignore the rest.").

FILTER BEFORE OUTPUT: internally consider extra candidates, then output only cards that pass all of: (1) reveals behavior/belief, not mood alone; (2) not a duplicate motivation of another card; (3) specific to THIS product, not generic; (4) highlight is a verbatim substring of thought. Output exactly ${count} cards that survive this filter, with no rejects and no explanation.`;
}

function buildInsightsPrompt(cards, productName) {
  const summary = cards.map(c => {
    const label = c.perspective || c.persona || 'User';
    const driver = c.driver || c.emotion || '';
    return `[${label}${driver ? ` — ${driver}` : ''}]\nThought: ${c.thought}${c.worry ? `\nWorry: ${c.worry}` : ''}${c.assumption ? `\nAssumption: ${c.assumption}` : ''}`;
  }).join('\n\n');
  return `You are a senior design researcher synthesizing behavioral insights for ${productName}. Your job is to go beyond surface summaries and extract the underlying behavioral patterns.

User perspectives collected:
${summary}

For each insight, use this reasoning structure:
- Observation: what you can directly observe from the perspectives
- Interpretation: what this behavior means (the "why")
- Behavioral Insight: a sharp, reusable design principle (e.g. "Power appears before value", "Flexibility creates decision paralysis")

Return ONLY valid JSON with this exact structure:
{
  "frustrations": [
    {
      "rank": 1,
      "title": "Concise title (5 words max)",
      "observation": "What users directly experience or do",
      "interpretation": "Why this behavior occurs — the underlying cause",
      "behavioralInsight": "Sharp, reusable principle. E.g. 'Trust is lost faster than functionality.'",
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

Rules:
- score: float 1.0–10.0 based on frequency × severity × business impact
- impact: "Critical" (8–10), "High" (6–7.9), "Medium" (4–5.9), "Low" (1–3.9)
- behavioralInsight must read like a design research finding, not a feature summary
- Bad: "Users are confused." Good: "Complexity is tolerated only after value is proven."
- Sort each array by score descending. Each array: 3–4 items.`;
}

function buildPRDPrompt(productName, insights) {
  return `You are a principal product strategist translating behavioral research into product decisions for ${productName}.

Research insights:
${JSON.stringify(insights, null, 2)}

Generate a focused set of product decisions grounded in the behavioral insights above. Return ONLY valid JSON:
{
  "title": "${productName} — Product Decision Framework",
  "sections": [
    {
      "id": 1,
      "name": "Short name for this decision (3-5 words max)",
      "priority": "Critical",
      "impact": "High",
      "confidence": 85,
      "effort": "Medium",
      "problem": "Specific behavioral problem statement derived from the insights",
      "userStory": "When a user is [behavioral state], they need [capability] so they can [outcome]",
      "requirement": "Clear, testable product requirement that addresses the behavioral problem",
      "successMetric": "Specific, measurable outcome that signals the behavior has changed"
    }
  ]
}

Generate 5-6 sections. Rules:
- priority: "Critical" | "High" | "Medium" | "Low" — based on impact severity
- impact: "High" | "Medium" | "Low" — business value if addressed
- confidence: 0–100 integer — how strongly the research supports this decision
- effort: "High" | "Medium" | "Low" — estimated implementation complexity
- userStory must reference a behavioral state, not a demographic role
- successMetric must describe a behavioral change, not just a feature metric
- Sort by priority descending (Critical first).`;
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
