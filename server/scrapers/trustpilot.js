import { extractLdReviews } from './html.js';

// Trustpilot — public review pages keyed by domain.
export function trustpilot({ host, headers, addItem }) {
  return (async () => {
    const tpUrl = `https://www.trustpilot.com/review/${host}`;
    const r = await fetch(tpUrl, { headers, signal: AbortSignal.timeout(9000) });
    if (!r.ok) return;
    const html = await r.text();
    extractLdReviews(html).slice(0, 6).forEach(body => addItem('Trustpilot', tpUrl, body));
  })();
}
