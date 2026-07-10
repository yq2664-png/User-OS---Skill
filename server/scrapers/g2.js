import { extractLdReviews } from './html.js';

// G2 — best-effort; Cloudflare often blocks datacenter IPs. Guess the slug
// from the product name; allSettled swallows the frequent 403/404.
export function g2({ productName, headers, addItem }) {
  return (async () => {
    const slug = productName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!slug) return;
    const g2Url = `https://www.g2.com/products/${slug}/reviews`;
    const r = await fetch(g2Url, { headers, signal: AbortSignal.timeout(9000) });
    if (!r.ok) return;
    const html = await r.text();
    extractLdReviews(html).slice(0, 6).forEach(body => addItem('G2', g2Url, body));
  })();
}
