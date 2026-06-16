import { useEffect, useRef, useState } from 'react';
import type { Card, FormData } from '../App';

const EMOTION_COLOR: Record<string, string> = {
  Excited: 'text-zinc-600',
  Confused: 'text-zinc-500',
  Frustrated: 'text-zinc-900',
  Curious: 'text-zinc-600',
  Skeptical: 'text-zinc-700',
  Overwhelmed: 'text-zinc-500',
  Delighted: 'text-zinc-600',
  Anxious: 'text-zinc-700',
};

const EMOTION_BORDER: Record<string, string> = {
  Frustrated:  'border-l-[3px] border-l-zinc-900',
  Anxious:     'border-l-[3px] border-l-zinc-700',
  Skeptical:   'border-l-2 border-l-zinc-500',
  Overwhelmed: 'border-l-2 border-l-zinc-400',
  Confused:    'border-l-2 border-l-zinc-300',
  Curious:     'border-l border-l-zinc-300',
  Excited:     'border-l border-l-zinc-300',
  Delighted:   'border-l border-l-zinc-200',
};

function HighlightedThought({ thought, highlight }: { thought: string; highlight?: string }) {
  if (!highlight) return <span className="text-zinc-700">{thought}</span>;
  const idx = thought.indexOf(highlight);
  if (idx === -1) return <span className="text-zinc-700">{thought}</span>;
  return (
    <>
      {idx > 0 && <span className="text-zinc-400">{thought.slice(0, idx)}</span>}
      <span className="text-zinc-900 font-medium">{highlight}</span>
      {idx + highlight.length < thought.length && (
        <span className="text-zinc-400">{thought.slice(idx + highlight.length)}</span>
      )}
    </>
  );
}

function PersonaCard({
  card,
  index,
  onRemove,
}: {
  card: Card;
  index: number;
  onRemove: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`card-enter perspective-card bg-white p-8 lg:p-9 relative group ${EMOTION_BORDER[card.emotion] ?? 'border-l border-l-zinc-200'}`}
      style={{ animationDelay: `${index * 80}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-zinc-300 hover:text-zinc-700"
        title="Remove"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Meta row */}
      <div className="flex items-center justify-between mb-5">
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-zinc-400">
          {card.persona}
        </span>
        <span className={`font-mono text-[10px] tracking-[0.12em] uppercase ${EMOTION_COLOR[card.emotion] ?? 'text-zinc-500'}`}>
          {card.emotion}
        </span>
      </div>

      {/* Thought with highlight */}
      <p className="text-lg sm:text-xl leading-relaxed font-light">
        "<HighlightedThought thought={card.thought} highlight={card.highlight} />"
      </p>

      {/* Background hover tooltip */}
      {card.background && hovered && (
        <div className="absolute bottom-full left-0 mb-2 z-20 w-full bg-zinc-900 text-white p-5 shadow-lg pointer-events-none card-enter"
          style={{ animationDelay: '0ms' }}>
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-sm font-medium">{card.background.name}</span>
            <span className="font-mono text-[10px] text-zinc-400 ml-2">{card.background.age}</span>
          </div>
          <p className="font-mono text-[10px] tracking-wide text-zinc-400 uppercase mb-2">
            {card.background.job}
          </p>
          <p className="text-xs text-zinc-400 font-light leading-relaxed">
            {card.background.context}
          </p>
        </div>
      )}
    </div>
  );
}

interface Props {
  formData: FormData;
  cards: Card[];
  setCards: (c: Card[]) => void;
  onNext: () => void;
}

export default function SimulationPage({ formData, cards, setCards, onNext }: Props) {
  const [streaming, setStreaming] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [done, setDone] = useState(cards.length > 0);
  const [error, setError] = useState('');
  const bufferRef = useRef('');
  const cardsRef = useRef<Card[]>(cards);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || cards.length > 0) return;
    startedRef.current = true;
    runSimulation();
  }, []);

  async function runSimulation(more = false) {
    if (more) {
      setLoadingMore(true);
    } else {
      setStreaming(true);
      cardsRef.current = [];
      setCards([]);
    }
    setError('');
    bufferRef.current = '';

    const body = new FormData();
    body.append('productName', formData.productName);
    body.append('productType', formData.productType);
    body.append('coreFunctions', formData.coreFunctions);
    body.append('featureConstraints', JSON.stringify(formData.featureConstraints));
    body.append('timeConstraints', JSON.stringify(formData.timeConstraints));
    if (more) {
      body.append('count', '4');
      body.append('existingPersonas', JSON.stringify(cardsRef.current.map(c => c.persona)));
    }
    for (const file of formData.screenshots) body.append('screenshots', file);
    for (const file of formData.documents) body.append('documents', file);

    try {
      const res = await fetch('/api/simulate', { method: 'POST', body });
      if (!res.ok) throw new Error('Server error');
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;
          try {
            const { text, error: err } = JSON.parse(payload);
            if (err) throw new Error(err);
            if (text) {
              bufferRef.current += text;
              parseCards(more);
            }
          } catch { /* buffering */ }
        }
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setStreaming(false);
      setLoadingMore(false);
      setDone(true);
    }
  }

  function parseCards(append = false) {
    const parts = bufferRef.current.split('---CARD---');
    const newCards: Card[] = [];
    for (const part of parts) {
      const match = part.trim().match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const card = JSON.parse(match[0]);
          if (card.persona && card.emotion && card.thought) newCards.push(card);
        } catch { /* incomplete */ }
      }
    }
    if (newCards.length > 0) {
      const combined = append
        ? [...cardsRef.current.filter(c => !newCards.find(n => n.persona === c.persona)), ...cardsRef.current.filter(c => newCards.find(n => n.persona === c.persona)), ...newCards.filter(n => !cardsRef.current.find(c => c.persona === n.persona))]
        : newCards;
      // simpler: append just adds new ones
      const result = append
        ? [...cardsRef.current, ...newCards.filter(n => !cardsRef.current.find(c => c.persona === n.persona))]
        : newCards;
      if (result.length > cardsRef.current.length || (!append && newCards.length > 0)) {
        cardsRef.current = result;
        setCards([...result]);
      }
    }
  }

  const removeCard = (i: number) => {
    const updated = cards.filter((_, idx) => idx !== i);
    cardsRef.current = updated;
    setCards(updated);
  };

  const isLoading = streaming || loadingMore;

  return (
    <main className="page-container py-20 sm:py-28">

      {/* Header */}
      <div className="mb-16">
        <p className="label-tag mb-6">{formData.productName}</p>
        <div className="flex items-end gap-6">
          <h1 className="text-4xl sm:text-5xl font-light text-zinc-900 leading-tight tracking-tight">
            {streaming ? 'Simulating perspectives' : 'User Perspectives'}
          </h1>
          {isLoading && (
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="thinking-dot" />
              <div className="thinking-dot" />
              <div className="thinking-dot" />
            </div>
          )}
        </div>
        {done && cards.length > 0 && (
          <p className="mt-3 text-sm text-zinc-400 font-light">
            {cards.length} perspectives · hover a card to see persona details · click × to remove
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="border border-zinc-200 p-6 mb-12 max-w-lg">
          <p className="text-sm text-zinc-700 mb-4">{error}</p>
          <button
            onClick={() => { startedRef.current = false; runSimulation(); }}
            className="btn-primary text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Cards grid */}
      {(cards.length > 0 || streaming) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px border border-zinc-100">
          {cards.map((card, i) => (
            <PersonaCard
              key={`${card.persona}-${i}`}
              card={card}
              index={i}
              onRemove={() => removeCard(i)}
            />
          ))}

          {/* Placeholders while streaming */}
          {streaming && Array.from({ length: Math.max(0, 8 - cards.length) }).map((_, i) => (
            <div key={`ph-${i}`} className="bg-white p-8 lg:p-9">
              <div className="flex items-center justify-between mb-5">
                <div className="loading-bar h-2 w-24 rounded" />
                <div className="loading-bar h-2 w-16 rounded" />
              </div>
              <div className="space-y-2">
                <div className="loading-bar h-2.5 w-full rounded" />
                <div className="loading-bar h-2.5 w-4/5 rounded" />
              </div>
            </div>
          ))}

          {/* Placeholders while loading more */}
          {loadingMore && Array.from({ length: 4 }).map((_, i) => (
            <div key={`more-${i}`} className="bg-white p-8 lg:p-9">
              <div className="flex items-center justify-between mb-5">
                <div className="loading-bar h-2 w-24 rounded" />
                <div className="loading-bar h-2 w-16 rounded" />
              </div>
              <div className="space-y-2">
                <div className="loading-bar h-2.5 w-full rounded" />
                <div className="loading-bar h-2.5 w-4/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer actions */}
      {done && (
        <div className="mt-12">
          {/* Generate more */}
          {!loadingMore && (
            <button
              onClick={() => runSimulation(true)}
              className="w-full border border-dashed border-zinc-200 py-5 text-sm text-zinc-400 hover:border-zinc-400 hover:text-zinc-700 transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <span className="text-lg leading-none">+</span>
              Generate more perspectives
            </button>
          )}

          {/* Proceed */}
          {cards.length > 0 && (
            <div className="mt-10 pt-8 border-t border-zinc-100 flex items-center justify-between">
              <p className="text-sm text-zinc-400 font-light">
                {cards.length} perspective{cards.length !== 1 ? 's' : ''} selected
              </p>
              <button onClick={onNext} className="btn-primary">
                Analyze Insights
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
