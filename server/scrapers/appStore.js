// App Store (US) — free public RSS, no auth needed.
export function appStoreUS({ productName, headers, addItem }) {
  return (async () => {
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
  })();
}

// App Store (China) — same API, different storefront.
export function appStoreCN({ productName, headers, addItem }) {
  return (async () => {
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
  })();
}

// Search the App Store for multiple client-app results (used by verify-product).
// Throws on network error; the caller owns the response/error formatting.
export async function searchApps(productName) {
  const r = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(productName)}&entity=software&limit=5`,
    { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) }
  );
  const data = await r.json();
  return (data?.results ?? []).map(app => ({
    name: app.trackName,
    tagline: app.description?.slice(0, 120) ?? '',
    audience: app.primaryGenreName ?? '',
    features: [],
    logo: app.artworkUrl100 ?? app.artworkUrl60 ?? '',
    appId: app.trackId,
  }));
}
