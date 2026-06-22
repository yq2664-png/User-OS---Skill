import { useEffect, useRef, useState } from 'react';
import type { Card, FormData, RealCard } from '../App';

function HighlightedThought({ thought, highlight }: { thought: string; highlight?: string }) {
  if (!highlight) return <span style={{ color: '#1D1D1F' }}>{thought}</span>;
  const idx = thought.indexOf(highlight);
  if (idx === -1) return <span style={{ color: '#1D1D1F' }}>{thought}</span>;
  return (
    <>
      {idx > 0 && <span style={{ color: '#6E6E73' }}>{thought.slice(0, idx)}</span>}
      <span style={{ color: '#1D1D1F', fontWeight: 600 }}>{highlight}</span>
      {idx + highlight.length < thought.length && (
        <span style={{ color: '#6E6E73' }}>{thought.slice(idx + highlight.length)}</span>
      )}
    </>
  );
}

function PersonaCard({ card, index, onRemove }: { card: Card; index: number; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="card-enter perspective-card relative group"
      style={{
        animationDelay: `${index * 80}ms`,
        background: 'white',
        borderRadius: '20px',
        outline: expanded ? '2px solid #1D1D1F' : '2px solid transparent',
        transition: 'outline 0.1s',
      }}
    >
      <button
        onClick={onRemove}
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10"
        style={{ color: '#D2D2D7' }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      <button className="w-full text-left p-8" onClick={() => setExpanded(e => !e)}>
        <p className="text-xs font-medium mb-4" style={{ color: '#0071E3' }}>{card.perspective}</p>
        <p className="text-lg sm:text-xl leading-relaxed mb-4">
          "<HighlightedThought thought={card.thought} highlight={card.highlight} />"
        </p>
        <p className="text-xs leading-snug" style={{ color: '#6E6E73' }}>{card.driver}</p>
      </button>

      {expanded && (card.worry || card.assumption) && (
        <div className="px-8 pb-8 space-y-3">
          <div style={{ borderTop: '1px solid #F5F5F7', paddingTop: '16px' }}>
            {card.worry && (
              <div className="mb-3">
                <p className="text-[9px] tracking-[0.18em] uppercase mb-1" style={{ color: '#D2D2D7' }}>Worry</p>
                <p className="text-xs leading-relaxed" style={{ color: '#6E6E73' }}>{card.worry}</p>
              </div>
            )}
            {card.assumption && (
              <div>
                <p className="text-[9px] tracking-[0.18em] uppercase mb-1" style={{ color: '#D2D2D7' }}>Assumption</p>
                <p className="text-xs leading-relaxed" style={{ color: '#6E6E73' }}>{card.assumption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RealCardItem({ card, index, onRemove }: { card: RealCard; index: number; onRemove: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="card-enter relative group"
      style={{
        animationDelay: `${index * 60}ms`,
        background: 'white',
        padding: '32px',
        borderRadius: '20px',
        outline: hovered ? '2px solid #1D1D1F' : '2px solid transparent',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'transform 0.24s cubic-bezier(0.4,0,0.6,1), outline 0.1s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onRemove}
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{ color: '#D2D2D7' }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      <div className="flex items-center justify-between mb-5">
        <span className="text-[10px] tracking-[0.18em] uppercase" style={{ color: '#6E6E73' }}>{card.persona}</span>
        {card.sourceUrl ? (
          <a href={card.sourceUrl} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-[10px] tracking-[0.12em] uppercase underline underline-offset-2"
            style={{ color: '#0071E3' }}>
            {card.source}
          </a>
        ) : (
          <span className="text-[10px] tracking-[0.12em] uppercase" style={{ color: '#6E6E73' }}>{card.source}</span>
        )}
      </div>
      <p className="text-lg sm:text-xl leading-relaxed">
        "<HighlightedThought thought={card.quote} highlight={card.highlight} />"
      </p>
    </div>
  );
}

interface Props {
  formData: FormData;
  cards: Card[];
  setCards: (c: Card[]) => void;
  onNext: () => void;
}

const SIM_STEPS = [
  'Analyzing your product',
  'Searching the web for context',
  'Building user personas',
  'Simulating reactions',
];

export default function SimulationPage({ formData, cards, setCards, onNext }: Props) {
  const [streaming, setStreaming] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [done, setDone] = useState(cards.length > 0);
  const [error, setError] = useState('');
  const [simStep, setSimStep] = useState(0);

  const [realCards, setRealCards] = useState<RealCard[]>([]);
  const [realLoading, setRealLoading] = useState(false);
  const [realError, setRealError] = useState('');

  const bufferRef = useRef('');
  const cardsRef = useRef<Card[]>(cards);
  const startedRef = useRef(false);
  const realStartedRef = useRef(false);
  const simStepTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const showReal = formData.productStage === 'web' || formData.productStage === 'client';

  useEffect(() => {
    if (startedRef.current || cards.length > 0) return;
    startedRef.current = true;
    runSimulation();
  }, []);

  useEffect(() => {
    if (!showReal || realStartedRef.current || realCards.length > 0) return;
    realStartedRef.current = true;
    fetchRealPerspectives();
  }, [showReal]);

  async function fetchRealPerspectives(searchMore = false) {
    setRealLoading(true);
    setRealError('');
    try {
      const res = await fetch('/api/real-perspectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: formData.productName,
          webLink: formData.webLink,
          productStage: formData.productStage,
        }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const newCards = data.cards ?? [];
      setRealCards(searchMore ? prev => [...prev, ...newCards] : newCards);
    } catch (e: any) {
      setRealError(e.message || 'Could not load real perspectives.');
    } finally {
      setRealLoading(false);
    }
  }

  async function runSimulation(more = false) {
    if (more) {
      setLoadingMore(true);
    } else {
      setStreaming(true);
      setSimStep(0);
      cardsRef.current = [];
      setCards([]);
      // Cycle through loading steps
      let step = 0;
      simStepTimer.current = setInterval(() => {
        step = Math.min(step + 1, SIM_STEPS.length - 1);
        setSimStep(step);
      }, 2500);
    }
    setError('');
    bufferRef.current = '';

    const body = new FormData();
    body.append('productName', formData.productName);
    body.append('productStage', formData.productStage);
    body.append('productType', formData.productType);
    body.append('coreFunctions', formData.coreFunctions);
    body.append('requirements', formData.requirements);
    body.append('webLink', formData.webLink);
    body.append('featureConstraints', JSON.stringify(formData.featureConstraints));
    body.append('timeConstraints', JSON.stringify(formData.timeConstraints));
    if (more) {
      body.append('count', '4');
      body.append('existingPersonas', JSON.stringify(cardsRef.current.map(c => c.perspective)));
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
            if (text) { bufferRef.current += text; parseCards(more); }
          } catch { /* buffering */ }
        }
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      if (simStepTimer.current) { clearInterval(simStepTimer.current); simStepTimer.current = null; }
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
          if (card.perspective && card.thought) newCards.push(card);
        } catch { /* incomplete */ }
      }
    }
    if (newCards.length > 0) {
      const result = append
        ? [...cardsRef.current, ...newCards.filter(n => !cardsRef.current.find(c => c.perspective === n.perspective))]
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

  const removeRealCard = (i: number) => setRealCards(prev => prev.filter((_, idx) => idx !== i));

  const isLoading = streaming || loadingMore;

  return (
    <main className="page-container py-20 sm:py-28">

      {/* Header */}
      <div className="mb-16">
        <p className="label-tag mb-6">{formData.productName}</p>
        <div className="flex items-end gap-6">
          <h1 className="font-semibold text-[#1D1D1F] leading-tight" style={{ fontSize: 'clamp(32px, 4vw, 48px)', letterSpacing: '-0.3px' }}>
            Behavioral Perspectives
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
          <p className="mt-3 text-sm" style={{ color: '#6E6E73' }}>
            {cards.length} behavioral perspectives · click a card to reveal worry & assumption · × to remove
          </p>
        )}

        {/* Inline loading step list */}
        {streaming && (
          <div className="mt-8 space-y-2">
            {SIM_STEPS.map((step, i) => (
              <div key={i} className={`flex items-center gap-3 transition-all duration-300 ${i <= simStep ? 'opacity-100' : 'opacity-20'}`}>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                  background: i < simStep ? '#6E6E73' : i === simStep ? '#0071E3' : '#D2D2D7',
                }} />
                <span className="text-[10px] tracking-[0.15em] uppercase" style={{
                  color: i === simStep ? '#0071E3' : '#6E6E73',
                }}>
                  {step}
                  {i === simStep && <span className="ml-1">…</span>}
                  {i < simStep && <span className="ml-1" style={{ color: '#D2D2D7' }}>✓</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-6 mb-12 max-w-lg rounded-2xl" style={{ background: '#F5F5F7' }}>
          <p className="text-sm mb-4" style={{ color: '#1D1D1F' }}>{error}</p>
          <button onClick={() => { startedRef.current = false; runSimulation(); }} className="btn-primary text-xs">Retry</button>
        </div>
      )}

      {/* Real User Voices */}
      {showReal && (realLoading || realCards.length > 0 || realError) && (
        <div className="mb-20">
          <div className="flex items-baseline gap-4 mb-3">
            <h2 className="text-2xl font-semibold" style={{ color: '#1D1D1F' }}>Real User Voices</h2>
            <span className="text-[9px] tracking-widest uppercase" style={{ color: '#6E6E73' }}>From the web</span>
          </div>
          <p className="text-sm mb-8" style={{ color: '#6E6E73' }}>
            Real feedback found online for {formData.productName}
          </p>

          {realLoading && realCards.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-8 rounded-2xl" style={{ background: '#F5F5F7' }}>
                  <div className="flex justify-between mb-4">
                    <div className="loading-bar h-2 w-20 rounded" />
                    <div className="loading-bar h-2 w-14 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="loading-bar h-2.5 w-full rounded" />
                    <div className="loading-bar h-2.5 w-5/6 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {realError && (
            <div className="flex items-start gap-4 p-6 rounded-2xl" style={{ background: '#F5F5F7' }}>
              <span className="mt-0.5 shrink-0" style={{ color: '#D2D2D7' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M7 4v3.5M7 10h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </span>
              <p className="text-xs leading-relaxed" style={{ color: '#6E6E73' }}>
                Could not load real perspectives — the backend server may not be running.
              </p>
            </div>
          )}

          {realCards.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {realCards.map((card, i) => (
                <RealCardItem key={i} card={card} index={i} onRemove={() => removeRealCard(i)} />
              ))}
              {realLoading && [1, 2].map(i => (
                <div key={`more-${i}`} className="p-8 rounded-2xl" style={{ background: '#F5F5F7' }}>
                  <div className="flex justify-between mb-4">
                    <div className="loading-bar h-2 w-20 rounded" />
                    <div className="loading-bar h-2 w-14 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="loading-bar h-2.5 w-full rounded" />
                    <div className="loading-bar h-2.5 w-5/6 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!realLoading && !realError && realCards.length === 0 && (
            <p className="text-sm p-6 rounded-2xl" style={{ color: '#6E6E73', background: '#F5F5F7' }}>
              No real user reviews found online for this product.
            </p>
          )}

          {!realLoading && realCards.length > 0 && (
            <button
              onClick={() => fetchRealPerspectives(true)}
              className="mt-3 w-full py-5 text-sm flex items-center justify-center gap-2 rounded-2xl transition-colors duration-150"
              style={{ border: '1.5px dashed #D2D2D7', color: '#6E6E73' }}
            >
              <span className="text-lg leading-none">+</span>
              Search more real voices
            </button>
          )}
        </div>
      )}

      {/* Simulated Perspectives section title */}
      {showReal && done && (cards.length > 0 || loadingMore) && (
        <div className="flex items-baseline gap-4 mb-3 card-enter" style={{ animationDelay: '0ms' }}>
          <h2 className="text-2xl font-semibold" style={{ color: '#1D1D1F' }}>Simulated Perspectives</h2>
          <span className="text-[9px] tracking-widest uppercase" style={{ color: '#6E6E73' }}>Behavioral simulation</span>
        </div>
      )}

      {(cards.length > 0 || streaming) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {cards.map((card, i) => (
            <PersonaCard key={`${card.persona}-${i}`} card={card} index={i} onRemove={() => removeCard(i)} />
          ))}
          {streaming && Array.from({ length: Math.max(0, 8 - cards.length) }).map((_, i) => (
            <div key={`ph-${i}`} className="p-8 rounded-2xl" style={{ background: '#F5F5F7' }}>
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
          {loadingMore && Array.from({ length: 4 }).map((_, i) => (
            <div key={`more-${i}`} className="p-8 rounded-2xl" style={{ background: '#F5F5F7' }}>
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
          {!loadingMore && (
            <button
              onClick={() => runSimulation(true)}
              className="w-full py-5 text-sm flex items-center justify-center gap-2 rounded-2xl transition-colors duration-150"
              style={{ border: '1.5px dashed #D2D2D7', color: '#6E6E73' }}
            >
              <span className="text-lg leading-none">+</span>
              Generate more perspectives
            </button>
          )}
          {cards.length > 0 && (
            <div className="mt-10 pt-8 flex items-center justify-between" style={{ borderTop: '1px solid #D2D2D7' }}>
              <p className="text-sm" style={{ color: '#6E6E73' }}>
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
