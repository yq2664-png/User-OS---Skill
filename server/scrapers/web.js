import { stripHtml } from './html.js';

// Product website — scrape for testimonials.
export function productWebsite({ webLink, headers, addItem }) {
  return (async () => {
    const r = await fetch(webLink, { headers, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const text = stripHtml(html).slice(0, 4000);
    addItem('Web', webLink, text);
  })();
}
