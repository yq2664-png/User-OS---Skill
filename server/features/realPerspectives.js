import { openaiCreate, MODELS } from '../llm/openai.js';
import { parseFirstJsonArray } from '../lib/json.js';
import { appStoreUS, appStoreCN, trustpilot, g2, reddit, hackerNews, productWebsite } from '../scrapers/index.js';

export default async function realPerspectives(req, res) {
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

  const appStoreSources = isWeb ? [] : [
    appStoreUS({ productName, headers, addItem }),
    appStoreCN({ productName, headers, addItem }),
  ];

  let host = '';
  try { host = new URL(webLink || '').hostname.replace(/^www\./, ''); } catch {}

  const webSources = [
    ...(host ? [trustpilot({ host, headers, addItem })] : []),
    g2({ productName, headers, addItem }),
    reddit({ productName, headers, addItem }),
    hackerNews({ productName, headers, addItem }),
    ...(webLink ? [productWebsite({ webLink, headers, addItem })] : []),
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
    const message = await openaiCreate(MODELS.fast, 2000, [{
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
}
