import { useEffect, useRef, useState } from 'react';
import type { Card, Insights, InsightItem, ImpactLevel } from '../App';

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

const IMPACT_CONFIG: Record<ImpactLevel, { marker: string; textColor: string; barColor: string; bg: string }> = {
  Critical: { marker: '■', textColor: 'text-zinc-900',  barColor: 'bg-zinc-900',  bg: 'bg-zinc-900'  },
  High:     { marker: '●', textColor: 'text-zinc-700',  barColor: 'bg-zinc-700',  bg: 'bg-zinc-700'  },
  Medium:   { marker: '○', textColor: 'text-zinc-500',  barColor: 'bg-zinc-400',  bg: 'bg-zinc-400'  },
  Low:      { marker: '–', textColor: 'text-zinc-400',  barColor: 'bg-zinc-200',  bg: 'bg-zinc-200'  },
};

const IMPACT_ORDER: ImpactLevel[] = ['Critical', 'High', 'Medium', 'Low'];

function itemKey(sectionKey: string, rank: number) {
  return `${sectionKey}-${rank}`;
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round((score / 10) * 100);
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-px bg-zinc-100">
        <div
          className="h-px bg-zinc-900 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-[10px] text-zinc-300 shrink-0 w-6 text-right">{pct}%</span>
    </div>
  );
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
  const cfg = IMPACT_CONFIG[impact] ?? IMPACT_CONFIG['Medium'];
  const rawScore = item.score ?? (item.rank ? Math.max(4, 10 - (item.rank - 1) * 1.5) : 5);
  const score = typeof rawScore === 'number' ? rawScore : parseFloat(String(rawScore));

  return (
    <div
      className={`card-enter border-b border-zinc-100 last:border-0 py-5 flex gap-4 transition-opacity duration-150 group ${selected ? 'opacity-100' : 'opacity-40'}`}
      style={{ animationDelay: `${animDelay}ms` }}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className="shrink-0 mt-0.5 w-4 h-4 border transition-colors duration-150 flex items-center justify-center"
        style={{ borderColor: selected ? '#18181b' : '#d4d4d8', background: selected ? '#18181b' : 'white' }}
        title={selected ? 'Deselect' : 'Select'}
      >
        {selected && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Score column */}
      <div className="shrink-0 w-14 pt-0.5">
        <div className="flex items-baseline gap-0.5">
          <span className="font-mono text-xl font-semibold text-zinc-900 leading-none">
            {score.toFixed(1)}
          </span>
          <span className="font-mono text-[9px] text-zinc-300">/10</span>
        </div>
        <ScoreBar score={score} />
      </div>

      {/* Content column */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <p className="text-sm font-medium text-zinc-900 leading-snug">{item.title}</p>
          <span className={`shrink-0 flex items-center gap-1 font-mono text-[9px] tracking-widest uppercase ${cfg.textColor}`}>
            <span>{cfg.marker}</span>
            {impact}
          </span>
        </div>
        <p className="text-sm text-zinc-500 font-light leading-relaxed mb-2">{item.description}</p>
        {item.valueNote && (
          <p className="text-xs text-zinc-400 font-mono border-l-2 border-zinc-100 pl-2 leading-relaxed">
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
  const cfg = IMPACT_CONFIG[level];
  return (
    <div className="mb-2">
      {/* Group label */}
      <div className="flex items-center gap-2 py-2 mb-1">
        <span className={`font-mono text-[9px] tracking-[0.2em] uppercase ${cfg.textColor}`}>
          {cfg.marker} {level}
        </span>
        <div className="flex-1 h-px bg-zinc-100" />
        <span className="font-mono text-[9px] text-zinc-300">{items.length}</span>
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
    setError('');
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
    const payload = btoa(JSON.stringify({ insights, productName }));
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
          const score = typeof item.score === 'number' ? item.score : parseFloat(String(item.score));
          write(`${score.toFixed(1)}  ${item.title}`, 10, 'bold', [20, 20, 20], 1);
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
  const avgScore = insights && totalInsights > 0
    ? (SECTIONS.reduce((sum, s) =>
        sum + (insights[s.key] ?? []).reduce((a, i) => a + (typeof i.score === 'number' ? i.score : parseFloat(String(i.score))), 0), 0
      ) / totalInsights).toFixed(1)
    : null;

  return (
    <main className="page-container py-20 sm:py-28">

      {/* Header */}
      <div className="mb-12">
        <p className="label-tag mb-6">{productName}</p>
        <div className="flex items-end gap-5">
          <h1 className="text-4xl sm:text-5xl font-light text-zinc-900 leading-tight tracking-tight">
            Research Insights
          </h1>
          {loading && (
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="thinking-dot" /><div className="thinking-dot" /><div className="thinking-dot" />
            </div>
          )}
        </div>
        {!loading && insights && (
          <p className="mt-3 text-sm text-zinc-400 font-light">
            Synthesized from {cards.length} perspectives · click any insight to include or exclude
          </p>
        )}
      </div>

      {/* Summary stats bar */}
      {insights && !loading && (
        <div className="grid grid-cols-3 border border-zinc-100 mb-12">
          {[
            { label: 'Insights', value: totalInsights },
            { label: 'Critical', value: criticalCount },
            { label: 'Avg score', value: avgScore ?? '—' },
          ].map(stat => (
            <div key={stat.label} className="px-6 py-4 border-r border-zinc-100 last:border-0">
              <p className="text-2xl font-light text-zinc-900 mb-0.5">{stat.value}</p>
              <p className="label-tag">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Impact legend */}
      {insights && !loading && (
        <div className="flex items-center gap-5 mb-10 pb-6 border-b border-zinc-100">
          <span className="label-tag">Impact</span>
          {IMPACT_ORDER.map(level => {
            const cfg = IMPACT_CONFIG[level];
            return (
              <span key={level} className={`flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase ${cfg.textColor}`}>
                {cfg.marker} {level}
              </span>
            );
          })}
          <div className="flex-1" />
          <button
            onClick={allSelected ? () => setSelected(new Set()) : selectAll}
            className="font-mono text-[9px] tracking-[0.12em] uppercase text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="border border-zinc-200 p-6 mb-12 max-w-lg">
          <p className="text-sm text-zinc-700 mb-4">{error}</p>
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
                <div key={i} className="py-5 border-b border-zinc-100 flex gap-5">
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
                {/* Section header */}
                <div className="mb-4 pb-4 border-b border-zinc-900 flex items-baseline justify-between">
                  <h2 className="text-sm font-medium tracking-wide text-zinc-900">{section.label}</h2>
                  <span className="text-xs text-zinc-400 font-light hidden sm:block">{section.description}</span>
                </div>
                {/* Grouped by impact */}
                {IMPACT_ORDER.map((level, li) => {
                  const group = allItems.filter(i => (i.impact ?? 'Medium') === level);
                  return (
                    <ImpactGroup
                      key={level}
                      level={level}
                      items={group}
                      sectionKey={section.key}
                      selected={selected}
                      onToggle={toggleItem}
                      baseDelay={si * 40 + li * 20}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {insights && (
        <div className="mt-16 pt-10 border-t border-zinc-100">
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
          <p className="text-xs text-zinc-300 mt-4">
            {selected.size === 0
              ? 'Select at least one insight to continue'
              : `${selected.size} of ${totalInsights} selected`}
          </p>
        </div>
      )}
    </main>
  );
}
