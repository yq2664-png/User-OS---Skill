// Reddit — real user discussion across the web.
export function reddit({ productName, headers, addItem }) {
  return (async () => {
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
  })();
}
