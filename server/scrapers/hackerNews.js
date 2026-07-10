// HackerNews — search comments mentioning the product.

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function hackerNews({ productName, headers, addItem }) {
  return (async () => {
    try {
      const r = await fetch(
        `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(productName)}&tags=comment&hitsPerPage=30`,
        { headers, signal: AbortSignal.timeout(8000) }
      );
      if (!r.ok) return;
      const data = await r.json().catch(() => null);
      if (!data) return;

      // Case-sensitive, word-boundary match on the product name as a proper noun.
      // This filters out common-word usage (e.g. "the notion that ...") that
      // otherwise floods results for products whose name is also an English word.
      const re = new RegExp(`\\b${escapeRegex(productName)}\\b`);

      (data.hits ?? [])
        .map(h => ({ h, plain: (h.comment_text ?? '').replace(/<[^>]+>/g, '') }))
        .filter(({ plain }) => plain.length > 80 && re.test(plain))
        .slice(0, 5)
        .forEach(({ h, plain }) => {
          // Algolia's objectID for a comment IS the HN item id; item?id=<it> is valid.
          const hnUrl = h.objectID ? `https://news.ycombinator.com/item?id=${h.objectID}` : 'https://news.ycombinator.com';
          addItem('HackerNews', hnUrl, plain.slice(0, 400));
        });
    } catch {
      /* HackerNews unavailable — skip quietly. */
    }
  })();
}
