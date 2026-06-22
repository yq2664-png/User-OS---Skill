import { useEffect, useRef, useState } from 'react';
import type { Card, Insights, InsightItem, ImpactLevel } from '../App';
import { encodeShare } from '../utils/shareLink';

interface Props {
  productName: string;
  cards: Card[];
  insights: Insights | null;
  setInsights: (i: Insights) => void;
  onNext: () => void;
}

const SECTIONS: { key: keyof Insights; label: string; description: string }[] = [
  { key: 'frustrations',     label: 'Top User Frustrations', description: 'What consistently breaks the experience'  },
  { key: 'hiddenNeeds',      label: 'Hidden Needs',          description: "What users want but haven't articulated"  },
  { key: 'decisionBarriers', label: 'Decision Barriers',     description: 'What prevents users from committing'      },
  { key: 'trustIssues',      label: 'Trust Issues',          description: 'What erodes confidence in the product'    },
  { key: 'opportunities',    label: 'Opportunity Areas',     description: 'Where investment creates the most value'  },
];

const IMPACT_STARS: Record<ImpactLevel, number> = {
  Critical: 4,
  High:     3,
  Medium:   2,
  Low:      1,
};

const IMPACT_COLOR: Record<ImpactLevel, string> = {
  Critical: '#ef4444',
  High:     '#f59e0b',
  Medium:   '#eab308',
  Low:      '#22c55e',
};

function Stars({ level }: { level: ImpactLevel }) {
  const count = IMPACT_STARS[level] ?? 2;
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4].map(i => (
        <span key={i} className={i <= count ? 'text-zinc-900' : 'text-zinc-200'}>★</span>
      ))}
    </span>
  );
}

const IMPACT_ORDER: ImpactLevel[] = ['Critical', 'High', 'Medium', 'Low'];

function itemKey(sectionKey: string, rank: number) {
  return `${sectionKey}-${rank}`;
}

function InsightRow({
  item,
  sectionKey,
  selected,
  onToggle,
  animDelay,
}: {
  item: InsightItem;
  sectionKey: string;
  selected: boolean;
  onToggle: () => void;
  animDelay: number;
}) {
  const impact: ImpactLevel = item.impact ?? 'Medium';

  const color = IMPACT_COLOR[impact];

  return (
    <div
      className={`card-enter py-5 flex gap-0 transition-opacity duration-150 ${selected ? 'opacity-100' : 'opacity-40'}`}
      style={{ animationDelay: `${animDelay}ms`, borderBottom: '1px solid #F5F5F7' }}
    >
      {/* Priority color bar */}
      <div className="w-[3px] shrink-0 mr-5 rounded-full self-stretch" style={{ background: color }} />

      {/* Checkbox */}
      <button
        onClick={onToggle}
        className="shrink-0 mt-0.5 w-4 h-4 transition-colors duration-150 flex items-center justify-center mr-4 rounded"
        style={{ border: `1px solid ${selected ? '#1D1D1F' : '#D2D2D7'}`, background: selected ? '#1D1D1F' : 'white' }}
        title={selected ? 'Deselect' : 'Select'}
      >
        {selected && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <p className="text-sm font-semibold leading-snug" style={{ color: '#1D1D1F' }}>{item.title}</p>
          <span className="text-[9px] tracking-widest uppercase shrink-0" style={{ color }}>{impact}</span>
        </div>
        <p className="text-sm leading-relaxed mb-2" style={{ color: '#6E6E73' }}>{item.description}</p>
        {item.valueNote && (
          <p className="text-xs leading-relaxed pl-2" style={{ color: '#6E6E73', borderLeft: '2px solid #D2D2D7' }}>
            {item.valueNote}
          </p>
        )}
      </div>
    </div>
  );
}

function ImpactGroup({
  level,
  items,
  sectionKey,
  selected,
  onToggle,
  baseDelay,
}: {
  level: ImpactLevel;
  items: InsightItem[];
  sectionKey: string;
  selected: Set<string>;
  onToggle: (key: string) => void;
  baseDelay: number;
}) {
  if (!items.length) return null;
  return (
    <div className="mb-2">
      {/* Group label */}
      <div className="flex items-center gap-2 py-2 mb-1">
        <Stars level={level} />
        <span className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6E6E73' }}>{level}</span>
        <div className="flex-1 h-px" style={{ background: '#F5F5F7' }} />
        <span className="text-[9px]" style={{ color: '#D2D2D7' }}>{items.length}</span>
      </div>
      {items.map((item, i) => (
        <InsightRow
          key={item.rank}
          item={item}
          sectionKey={sectionKey}
          selected={selected.has(itemKey(sectionKey, item.rank))}
          onToggle={() => onToggle(itemKey(sectionKey, item.rank))}
          animDelay={baseDelay + i * 50}
        />
      ))}
    </div>
  );
}

export default function InsightPage({ productName, cards, insights, setInsights, onNext }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const startedRef = useRef(false);

  useEffect(() => {
    if (!insights) return;
    const all = new Set<string>();
    for (const section of SECTIONS)
      for (const item of insights[section.key] ?? [])
        all.add(itemKey(section.key, item.rank));
    setSelected(all);
  }, [insights]);

  useEffect(() => {
    if (startedRef.current || insights) return;
    startedRef.current = true;
    fetchInsights();
  }, []);

  async function fetchInsights() {
    setLoading(true);
    setInsightStep(0);
    setError('');
    let step = 0;
    insightStepTimer.current = setInterval(() => {
      step = Math.min(step + 1, INSIGHT_STEPS.length - 1);
      setInsightStep(step);
    }, 2800);
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards, productName }),
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInsights(data);
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      if (insightStepTimer.current) { clearInterval(insightStepTimer.current); insightStepTimer.current = null; }
      setLoading(false);
    }
  }

  function toggleItem(key: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function selectAll() {
    if (!insights) return;
    const all = new Set<string>();
    for (const section of SECTIONS)
      for (const item of insights[section.key] ?? [])
        all.add(itemKey(section.key, item.rank));
    setSelected(all);
  }

  function copyShareLink() {
    if (!insights) return;
    const payload = encodeShare({ insights, productName });
    const url = `${window.location.origin}/#insights=${payload}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function getSelectedInsights(): Insights {
    if (!insights) return {} as Insights;
    const result: Partial<Insights> = {};
    for (const section of SECTIONS)
      result[section.key] = (insights[section.key] ?? []).filter(
        item => selected.has(itemKey(section.key, item.rank))
      );
    return result as Insights;
  }

  async function exportPDF() {
    if (!insights) return;
    setExporting(true);
    const filtered = getSelectedInsights();
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const margin = 20;
    const pageW = 210;
    const contentW = pageW - margin * 2;
    let y = margin;

    const write = (text: string, size: number, style: 'normal' | 'bold', color: [number, number, number], gap = 4) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', style);
      doc.setTextColor(...color);
      for (const line of doc.splitTextToSize(text, contentW)) {
        if (y > 272) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += size * 0.45;
      }
      y += gap;
    };

    write(`${productName} — Research Insights`, 16, 'bold', [10, 10, 10]);
    write(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 9, 'normal', [160, 160, 160], 10);
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    for (const section of SECTIONS) {
      const items = filtered[section.key];
      if (!items?.length) continue;
      write(section.label.toUpperCase(), 8, 'bold', [170, 170, 170]);
      for (const level of IMPACT_ORDER) {
        const group = items.filter(i => i.impact === level);
        if (!group.length) continue;
        write(level.toUpperCase(), 7, 'bold', [200, 200, 200], 2);
        for (const item of group) {
          if (y > 260) { doc.addPage(); y = margin; }
          const stars = '★'.repeat(IMPACT_STARS[item.impact ?? 'Medium'] ?? 2) + '☆'.repeat(4 - (IMPACT_STARS[item.impact ?? 'Medium'] ?? 2));
          write(`${stars}  ${item.title}`, 10, 'bold', [20, 20, 20], 1);
          write(item.description, 9, 'normal', [90, 90, 90], 1);
          if (item.valueNote) write(item.valueNote, 8, 'normal', [150, 150, 150], 4);
          else y += 2;
        }
      }
      y += 4;
      doc.line(margin, y, pageW - margin, y);
      y += 8;
    }

    doc.save(`${productName.replace(/\s+/g, '-').toLowerCase()}-insights.pdf`);
    setExporting(false);
  }

  const totalInsights = insights
    ? SECTIONS.reduce((sum, s) => sum + (insights[s.key]?.length ?? 0), 0)
    : 0;
  const allSelected = selected.size === totalInsights && totalInsights > 0;

  // Aggregate stats
  const criticalCount = insights
    ? SECTIONS.reduce((sum, s) => sum + (insights[s.key] ?? []).filter(i => (i.impact ?? 'Medium') === 'Critical').length, 0)
    : 0;

  const INSIGHT_STEPS = [
    'Reading user perspectives',
    'Identifying patterns',
    'Scoring by business impact',
    'Surfacing opportunities',
  ];
  const [insightStep, setInsightStep] = useState(0);
  const insightStepTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  return (
    <main className="page-container py-20 sm:py-28">

      {/* Header */}
      <div className="mb-12">
        <p className="label-tag mb-6">{productName}</p>
        <div className="flex items-end gap-5">
          <h1 className="font-semibold text-[#1D1D1F] leading-tight" style={{ fontSize: 'clamp(32px, 4vw, 48px)', letterSpacing: '-0.3px' }}>
            Research Insights
          </h1>
          {loading && (
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="thinking-dot" /><div className="thinking-dot" /><div className="thinking-dot" />
            </div>
          )}
        </div>
        {!loading && insights && (
          <p className="mt-3 text-sm" style={{ color: '#6E6E73' }}>
            Synthesized from {cards.length} perspectives · click any insight to include or exclude
          </p>
        )}

        {/* Inline loading steps */}
        {loading && (
          <div className="mt-8 space-y-2">
            {INSIGHT_STEPS.map((step, i) => (
              <div key={i} className={`flex items-center gap-3 transition-all duration-300 ${i <= insightStep ? 'opacity-100' : 'opacity-20'}`}>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                  background: i < insightStep ? '#6E6E73' : i === insightStep ? '#0071E3' : '#D2D2D7',
                }} />
                <span className="text-[10px] tracking-[0.15em] uppercase" style={{ color: i === insightStep ? '#0071E3' : '#6E6E73' }}>
                  {step}
                  {i === insightStep && <span className="ml-1">…</span>}
                  {i < insightStep && <span className="ml-1" style={{ color: '#D2D2D7' }}>✓</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary stats */}
      {insights && !loading && (
        <div className="flex items-center gap-6 mb-10 pb-6" style={{ borderBottom: '1px solid #D2D2D7' }}>
          <div className="flex items-center gap-5">
            <span className="text-[9px] tracking-widest uppercase" style={{ color: '#D2D2D7' }}>{totalInsights} insights</span>
            {criticalCount > 0 && (
              <span className="flex items-center gap-1 text-[9px] tracking-widest uppercase" style={{ color: '#6E6E73' }}>
                <Stars level="Critical" /> {criticalCount} critical
              </span>
            )}
          </div>
          <div className="flex-1" />
          <button
            onClick={allSelected ? () => setSelected(new Set()) : selectAll}
            className="text-[9px] tracking-[0.12em] uppercase transition-colors"
            style={{ color: '#6E6E73' }}
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-6 mb-12 max-w-lg rounded-2xl" style={{ background: '#F5F5F7' }}>
          <p className="text-sm mb-4" style={{ color: '#1D1D1F' }}>{error}</p>
          <button onClick={() => { startedRef.current = false; fetchInsights(); }} className="btn-primary text-xs">Retry</button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-14">
          {SECTIONS.map(s => (
            <div key={s.key}>
              <div className="loading-bar h-3 w-40 rounded mb-6" />
              {[1, 2, 3].map(i => (
                <div key={i} className="py-5 flex gap-5" style={{ borderBottom: '1px solid #F5F5F7' }}>
                  <div className="shrink-0 w-16 space-y-2">
                    <div className="loading-bar h-5 w-12 rounded" />
                    <div className="loading-bar h-px w-full" />
                  </div>
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="loading-bar h-2.5 w-40 rounded" />
                    <div className="loading-bar h-2 w-full rounded" />
                    <div className="loading-bar h-2 w-3/4 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Insights */}
      {insights && (
        <div className="space-y-14">
          {SECTIONS.map((section, si) => {
            const allItems = insights[section.key] ?? [];
            if (!allItems.length) return null;
            return (
              <div key={section.key}>
                <div className="mb-4 pb-4 flex items-baseline justify-between" style={{ borderBottom: '2px solid #1D1D1F' }}>
                  <h2 className="text-sm font-semibold tracking-wide" style={{ color: '#1D1D1F' }}>{section.label}</h2>
                  <span className="text-xs hidden sm:block" style={{ color: '#6E6E73' }}>{section.description}</span>
                </div>
                {[...allItems]
                  .sort((a, b) => IMPACT_ORDER.indexOf(a.impact ?? 'Medium') - IMPACT_ORDER.indexOf(b.impact ?? 'Medium'))
                  .map((item, i) => (
                    <InsightRow
                      key={item.rank}
                      item={item}
                      sectionKey={section.key}
                      selected={selected.has(itemKey(section.key, item.rank))}
                      onToggle={() => toggleItem(itemKey(section.key, item.rank))}
                      animDelay={si * 40 + i * 40}
                    />
                  ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {insights && (
        <div className="mt-16 pt-10" style={{ borderTop: '1px solid #D2D2D7' }}>
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={copyShareLink} className="btn-secondary">
                {copied
                  ? <><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1 6.5l4 4 7-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>Link copied</>
                  : <><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 7.5a3 3 0 004.24 0l2-2a3 3 0 00-4.24-4.24l-1 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><path d="M8 5.5a3 3 0 00-4.24 0l-2 2a3 3 0 004.24 4.24l1-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>Copy link to share</>
                }
              </button>
              <button
                onClick={exportPDF}
                disabled={exporting || selected.size === 0}
                className={`btn-secondary ${selected.size === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                {exporting ? 'Exporting…' : (
                  <><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v8M3 6.5l3.5 3.5 3.5-3.5M1 11h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Export {selected.size > 0 ? `${selected.size} ` : ''}insights PDF</>
                )}
              </button>
            </div>
            <button
              onClick={onNext}
              disabled={selected.size === 0}
              className={`btn-primary ${selected.size === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              Generate PRD
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <p className="text-xs mt-4" style={{ color: '#D2D2D7' }}>
            {selected.size === 0
              ? 'Select at least one insight to continue'
              : `${selected.size} of ${totalInsights} selected`}
          </p>
        </div>
      )}
    </main>
  );
}
