export function buildInsightsPrompt(cards, productName) {
  const summary = cards.map(c => {
    const label = c.perspective || c.persona || 'User';
    const driver = c.driver || c.emotion || '';
    return `[${label}${driver ? ` — ${driver}` : ''}]\nThought: ${c.thought}${c.worry ? `\nWorry: ${c.worry}` : ''}${c.assumption ? `\nAssumption: ${c.assumption}` : ''}`;
  }).join('\n\n');
  return `You are a senior design researcher synthesizing behavioral insights for ${productName}. Your job is to go beyond surface summaries and extract the underlying behavioral patterns.

User perspectives collected:
${summary}

For each insight, use this reasoning structure:
- Observation: what you can directly observe from the perspectives
- Interpretation: what this behavior means (the "why")
- Behavioral Insight: a sharp, reusable design principle (e.g. "Power appears before value", "Flexibility creates decision paralysis")

Return ONLY valid JSON with this exact structure:
{
  "frustrations": [
    {
      "rank": 1,
      "title": "Concise title (5 words max)",
      "observation": "What users directly experience or do",
      "interpretation": "Why this behavior occurs — the underlying cause",
      "behavioralInsight": "Sharp, reusable principle. E.g. 'Trust is lost faster than functionality.'",
      "score": 8.5,
      "impact": "Critical",
      "valueNote": "One sentence: business or retention consequence if left unaddressed"
    }
  ],
  "hiddenNeeds": [...],
  "decisionBarriers": [...],
  "trustIssues": [...],
  "opportunities": [...]
}

Rules:
- score: float 1.0–10.0 based on frequency × severity × business impact
- impact: "Critical" (8–10), "High" (6–7.9), "Medium" (4–5.9), "Low" (1–3.9)
- behavioralInsight must read like a design research finding, not a feature summary
- Bad: "Users are confused." Good: "Complexity is tolerated only after value is proven."
- Sort each array by score descending. Each array: 3–4 items.`;
}
