// HackerNews — search comments mentioning the product.
export function hackerNews({ productName, headers, addItem }) {
  return (async () => {
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
  })();
}
