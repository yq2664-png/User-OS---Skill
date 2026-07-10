export function buildSimulatePrompt(name, type, functions, existingPersonas = [], count = 8, featureConstraints = [], timeConstraints = [], productStage = '', webLink = '', webContent = '') {
  const exclude = existingPersonas.length > 0
    ? `\nAvoid these already-used perspectives: ${existingPersonas.join(', ')}.`
    : '';

  const fcSection = featureConstraints.length > 0
    ? `\nFeature Module Constraints:\n${featureConstraints.map(f => `- ${f.module}: ${f.constraint}`).join('\n')}`
    : '';

  const tcSection = timeConstraints.length > 0
    ? `\nChange Timeline & Priority (in order):\n${timeConstraints.map((t, i) => `${i + 1}. [${t.timeline}] ${t.description}`).join('\n')}`
    : '';

  const stageLabel = productStage === 'unpublished' ? 'Pre-launch / Unpublished'
    : productStage === 'web' ? 'Live Web Product'
    : productStage === 'client' ? 'Client App (desktop/mobile)'
    : 'Not specified';

  const webSection = webContent
    ? `\nWebsite Content (scraped from ${webLink}):\n${webContent}`
    : '';

  return `You are a design researcher simulating authentic user perspectives for a product. Your goal is to reveal WHY users behave a certain way — their motivations, fears, mental models, and assumptions — not WHO they are demographically.

Product Name: ${name}
Product Stage: ${stageLabel}
Product Type: ${type || 'Not specified'}
Description / Requirements: ${functions || 'Not provided'}${webSection}${fcSection}${tcSection}

Generate exactly ${count} distinct behavioral perspective cards. Each card represents a different motivational state a user might bring to this product.${exclude}

Output ONLY the cards separated by ---CARD--- with no other text before, between, or after.

Each card must be valid standalone JSON with this exact structure:
{
  "perspective": "Looking for Simplicity",
  "name": "A realistic first name for this person, e.g. Marcus",
  "age": 34,
  "occupation": "Their job title, e.g. Product Manager",
  "driver": "What this user is trying to achieve in one sentence",
  "thought": "A sharp, first-person reaction revealing their mental model. MAXIMUM 20 words.",
  "highlight": "the most revealing 3-6 word phrase verbatim from thought",
  "worry": "What they're secretly afraid of or guarding against",
  "assumption": "The underlying belief driving their behavior"
}

Give each card a different, realistic name, age (20–60), and occupation that fits the perspective and product audience.

Perspective types to use (each once, rephrase naturally for this product):
- Looking for Simplicity
- Afraid of Commitment
- Seeking Control
- Risk-Aware
- Looking for Guidance
- Efficiency-Oriented
- Skeptical of Value
- Overwhelmed by Options

CRITICAL: "perspective" must be a motivation, never an occupation or demographic. "thought" must be under 20 words and specific to this product. "highlight" must be a verbatim substring of "thought".

NO MOOD-ONLY CARDS: every "thought" must reveal a decision, behavior, or mental model — not just an emotion. Reject "I'm excited!", "This feels overwhelming.", "I love it." Keep feelings only when tied to what the user would DO or BELIEVE (e.g. "This feels overwhelming, so I'd only turn on one feature and ignore the rest.").

FILTER BEFORE OUTPUT: internally consider extra candidates, then output only cards that pass all of: (1) reveals behavior/belief, not mood alone; (2) not a duplicate motivation of another card; (3) specific to THIS product, not generic; (4) highlight is a verbatim substring of thought. Output exactly ${count} cards that survive this filter, with no rejects and no explanation.`;
}
