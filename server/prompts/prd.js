export function buildPRDPrompt(productName, insights) {
  return `You are a principal product strategist translating behavioral research into product decisions for ${productName}.

Research insights:
${JSON.stringify(insights, null, 2)}

Generate a focused set of product decisions grounded in the behavioral insights above. Return ONLY valid JSON:
{
  "title": "${productName} — Product Decision Framework",
  "sections": [
    {
      "id": 1,
      "name": "Short name for this decision (3-5 words max)",
      "priority": "Critical",
      "impact": "High",
      "confidence": 85,
      "effort": "Medium",
      "problem": "Specific behavioral problem statement derived from the insights",
      "userStory": "When a user is [behavioral state], they need [capability] so they can [outcome]",
      "requirement": "Clear, testable product requirement that addresses the behavioral problem",
      "successMetric": "Specific, measurable outcome that signals the behavior has changed"
    }
  ]
}

Generate 5-6 sections. Rules:
- priority: "Critical" | "High" | "Medium" | "Low" — based on impact severity
- impact: "High" | "Medium" | "Low" — business value if addressed
- confidence: 0–100 integer — how strongly the research supports this decision
- effort: "High" | "Medium" | "Low" — estimated implementation complexity
- userStory must reference a behavioral state, not a demographic role
- successMetric must describe a behavioral change, not just a feature metric
- Sort by priority descending (Critical first).`;
}
