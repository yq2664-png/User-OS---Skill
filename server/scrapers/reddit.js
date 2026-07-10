// Reddit — real user discussion across the web.
//
// Reddit blocks the unauthenticated search.json endpoint (it returns an HTML
// challenge page), so we use the official OAuth "application-only" flow when
// REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET are configured. Without credentials
// we still attempt the public endpoint, but parse defensively and never throw —
// so a blocked Reddit degrades gracefully instead of killing the request.

const UA = process.env.REDDIT_USER_AGENT || 'UserResearchOS/1.0 (real user voice research)';

let tokenCache = { token: '', exp: 0 };

async function getToken() {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) return '';
  const now = Date.now();
  if (tokenCache.token && now < tokenCache.exp) return tokenCache.token;
  try {
    const res = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': UA,
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return '';
    const data = await res.json().catch(() => null);
    if (!data?.access_token) return '';
    tokenCache = { token: data.access_token, exp: now + (data.expires_in ?? 3600) * 1000 - 60000 };
    return tokenCache.token;
  } catch {
    return '';
  }
}

function collect(data, productName, addItem) {
  const productLower = productName.toLowerCase();
  (data?.data?.children ?? [])
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
}

export function reddit({ productName, headers, addItem }) {
  return (async () => {
    try {
      const token = await getToken();
      if (token) {
        const res = await fetch(
          `https://oauth.reddit.com/search?q=${encodeURIComponent(productName)}&sort=relevance&limit=25&type=link`,
          { headers: { Authorization: `Bearer ${token}`, 'User-Agent': UA }, signal: AbortSignal.timeout(8000) }
        );
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (data) collect(data, productName, addItem);
        return;
      }

      // No credentials — try the public endpoint but bail out quietly if Reddit
      // returns its HTML block page instead of JSON.
      const res = await fetch(
        `https://www.reddit.com/search.json?q=${encodeURIComponent(productName)}&sort=relevance&limit=25`,
        { headers: { ...headers, Accept: 'application/json' }, signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) return;
      if (!(res.headers.get('content-type') || '').includes('json')) return;
      const data = await res.json().catch(() => null);
      if (data) collect(data, productName, addItem);
    } catch {
      /* Reddit unavailable — skip quietly. */
    }
  })();
}
