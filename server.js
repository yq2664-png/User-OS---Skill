import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Simulate ──────────────────────────────────────────────────────────────────
app.post('/api/simulate', upload.fields([{ name: 'screenshots', maxCount: 5 }, { name: 'documents', maxCount: 5 }]), async (req, res) => {
  const { productName, productType, coreFunctions, featureConstraints, timeConstraints } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const existingPersonas = req.body.existingPersonas
    ? JSON.parse(req.body.existingPersonas)
    : [];
  const count = parseInt(req.body.count || '8', 10);

  const content = [];

  const screenshots = req.files?.screenshots || [];
  for (const file of screenshots.slice(0, 3)) {
    if (file.mimetype.startsWith('image/')) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: file.mimetype, data: file.buffer.toString('base64') }
      });
    }
  }

  const fc = featureConstraints ? JSON.parse(featureConstraints) : [];
  const tc = timeConstraints ? JSON.parse(timeConstraints) : [];
  content.push({ type: 'text', text: buildSimulatePrompt(productName, productType, coreFunctions, existingPersonas, count, fc, tc) });

  try {
    const stream = anthropic.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 4000,
      messages: [{ role: 'user', content }]
    });

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    });

    await stream.finalMessage();
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// ── Insights ──────────────────────────────────────────────────────────────────
app.post('/api/insights', async (req, res) => {
  const { cards, productName } = req.body;
  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 3000,
      messages: [{ role: 'user', content: buildInsightsPrompt(cards, productName) }]
    });
    const text = message.content[0].text;
    const match = text.match(/\{[\s\S]*\}/);
    if (match) res.json(JSON.parse(match[0]));
    else res.status(500).json({ error: 'Parse failed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PRD ───────────────────────────────────────────────────────────────────────
app.post('/api/prd', async (req, res) => {
  const { productName, insights } = req.body;
  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4000,
      messages: [{ role: 'user', content: buildPRDPrompt(productName, insights) }]
    });
    const text = message.content[0].text;
    const match = text.match(/\{[\s\S]*\}/);
    if (match) res.json(JSON.parse(match[0]));
    else res.status(500).json({ error: 'Parse failed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Prompt builders ───────────────────────────────────────────────────────────
function buildSimulatePrompt(name, type, functions, existingPersonas = [], count = 8, featureConstraints = [], timeConstraints = []) {
  const exclude = existingPersonas.length > 0
    ? `\nAvoid these already-used personas: ${existingPersonas.join(', ')}.`
    : '';

  const fcSection = featureConstraints.length > 0
    ? `\nFeature Module Constraints:\n${featureConstraints.map(f => `- ${f.module}: ${f.constraint}`).join('\n')}`
    : '';

  const tcSection = timeConstraints.length > 0
    ? `\nChange Timeline & Priority (in order):\n${timeConstraints.map((t, i) => `${i + 1}. [${t.timeline}] ${t.description}`).join('\n')}`
    : '';

  return `You are simulating authentic, unfiltered user perspectives for a product. Be honest and reveal real friction, confusion, excitement, and hesitation.

Product Name: ${name}
Product Type: ${type || 'Not specified'}
Core Functions: ${functions}${fcSection}${tcSection}

Generate exactly ${count} distinct user perspective cards. Each card represents a different user type encountering this product for the first time.${exclude}

Output ONLY the cards separated by ---CARD--- with no other text before, between, or after.

Each card must be valid standalone JSON with this exact structure:
{
  "persona": "Power User",
  "emotion": "Frustrated",
  "thought": "A short, punchy first-person reaction. MAXIMUM 20 words. No filler.",
  "highlight": "the most revealing 3-6 word phrase from the thought",
  "background": {
    "name": "A realistic full name",
    "age": 34,
    "job": "Specific job title and company type",
    "context": "One sentence about their relevant experience or situation"
  }
}

Persona types to use (each once): Early Adopter, Skeptic, Busy Professional, Power User, Casual User, Enterprise Buyer, Technical Expert, Non-Technical User

Emotion options: Excited, Confused, Frustrated, Curious, Skeptical, Overwhelmed, Delighted, Anxious

CRITICAL: Keep "thought" under 20 words. Make it sharp and specific, not generic. The "highlight" must be a verbatim substring of "thought".`;
}

function buildInsightsPrompt(cards, productName) {
  const summary = cards.map(c => `[${c.persona} — ${c.emotion}] ${c.thought}`).join('\n\n');
  return `You are a senior product researcher analyzing user interview data for ${productName}.

User perspectives collected:
${summary}

Extract structured insights with severity scoring. Return ONLY valid JSON with this exact structure:
{
  "frustrations": [
    {
      "rank": 1,
      "title": "Concise title (5 words max)",
      "description": "What frustrates users and why it matters — specific and concrete",
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

Scoring rules:
- score: float 1.0–10.0, one decimal place, based on frequency × severity × business impact
- impact: "Critical" (score 8–10), "High" (6–7.9), "Medium" (4–5.9), "Low" (1–3.9)
- Sort each array by score descending
- Each array: 3–4 items. Be concrete and specific, not generic.`;
}

function buildPRDPrompt(productName, insights) {
  return `You are a principal product manager writing a requirements document for ${productName} based on user research.

Research insights:
${JSON.stringify(insights, null, 2)}

Generate a focused PRD. Return ONLY valid JSON:
{
  "title": "${productName} — Product Requirements Document",
  "sections": [
    {
      "id": 1,
      "problem": "Specific, concrete problem statement derived from user research",
      "userStory": "As a [specific user type], I want [concrete capability] so that [real measurable outcome]",
      "requirement": "Clear, testable product requirement that addresses the problem",
      "successMetric": "Specific, measurable KPI or outcome that defines success"
    }
  ]
}

Generate 5-6 sections. Each must address a distinct need from the insights. No filler — every section must be actionable.`;
}

// Serve frontend in production
const distPath = join(__dirname, 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
