import { openaiCreate, MODELS } from '../llm/openai.js';
import { searchApps } from '../scrapers/index.js';

export default async function verifyProduct(req, res) {
  const { webLink, productName, productStage } = req.body;

  // Client app: search App Store for multiple results
  if (productStage === 'client' && productName) {
    try {
      const results = await searchApps(productName);
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
    const message = await openaiCreate(MODELS.fast, 500, [{
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
}
