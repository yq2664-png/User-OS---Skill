export function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Parse review bodies out of a page's JSON-LD (schema.org Review objects).
// Trustpilot and G2 both embed reviews this way, so one parser covers both.
export function extractLdReviews(html) {
  const out = [];
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const b of blocks) {
    let data; try { data = JSON.parse(b[1].trim()); } catch { continue; }
    const nodes = Array.isArray(data) ? data : (data['@graph'] || [data]);
    for (const node of nodes) {
      let reviews = node?.review ?? node?.reviews ?? [];
      if (!Array.isArray(reviews)) reviews = [reviews];
      for (const rv of reviews) {
        const body = rv?.reviewBody || rv?.description;
        const rating = rv?.reviewRating?.ratingValue;
        if (body && body.length > 40) out.push(`${rating ? rating + '★ ' : ''}${body.replace(/\s+/g, ' ').slice(0, 400)}`);
      }
    }
  }
  return out;
}
