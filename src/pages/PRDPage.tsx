import { useEffect, useRef, useState } from 'react';
import { encodeShare } from '../utils/shareLink';
import type { Insights, PRDData, PRDSection } from '../App';

interface Props {
  productName: string;
  insights: Insights;
  prdData: PRDData | null;
  setPrdData: (d: PRDData) => void;
  onGoLanding: () => void;
  onNewProduct: () => void;
}

const COL_HEADERS = ['Problem', 'User Story', 'Recommendation', 'Success Metric'];

const PRIORITY_ORDER = ['Critical', 'High', 'Medium', 'Low'] as const;
const PRIORITY_COLOR: Record<string, string> = {
  Critical: '#ef4444',
  High:     '#f59e0b',
  Medium:   '#eab308',
  Low:      '#22c55e',
};

const PRD_STEPS = [
  'Reading research insights',
  'Defining problem statements',
  'Writing recommendations',
  'Setting success metrics',
];

function PRDRow({ section, index }: { section: PRDSection; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const cells = [section.problem, section.userStory, section.requirement, section.successMetric];
  const color = PRIORITY_COLOR[section.priority] ?? '#D2D2D7';

  return (
    <div
      className="card-enter flex"
      style={{ animationDelay: `${index * 80}ms`, borderBottom: '1px solid #F5F5F7' }}
    >
      {/* Priority color bar */}
      <div className="w-[3px] shrink-0" style={{ background: color }} />

      <div className="flex-1 min-w-0">
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left transition-colors"
          style={{ background: expanded ? '#F5F5F7' : 'white' }}
        >
          <span className="text-sm font-semibold truncate" style={{ color: '#1D1D1F' }}>
            {section.name || `Recommendation ${section.id}`}
          </span>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[9px] tracking-widest uppercase" style={{ color }}>
              {section.priority}
            </span>
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none"
              className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              style={{ color: '#D2D2D7' }}
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </button>

        {expanded && (
          <div className="grid grid-cols-1 lg:grid-cols-4" style={{ borderTop: '1px solid #D2D2D7' }}>
            {cells.map((cell, ci) => (
              <div
                key={ci}
                className="p-6"
                style={{
                  borderRight: ci < cells.length - 1 ? '1px solid #D2D2D7' : 'none',
                  borderTop: ci > 0 ? '1px solid #D2D2D7' : 'none',
                }}
              >
                <p className="label-tag mb-2">{COL_HEADERS[ci]}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#1D1D1F' }}>{cell}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PRDPage({ productName, insights, prdData, setPrdData, onGoLanding, onNewProduct }: Props) {
  const [loading, setLoading] = useState(false);
  const [prdStep, setPrdStep] = useState(0);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const startedRef = useRef(false);
  const prdStepTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  function copyShareLink() {
    if (!prdData) return;
    const payload = encodeShare({ prdData, productName });
    const url = `${window.location.origin}/#prd=${payload}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  useEffect(() => {
    if (startedRef.current || prdData) return;
    startedRef.current = true;
    fetchPRD();
  }, []);

  async function fetchPRD() {
    setLoading(true);
    setPrdStep(0);
    setError('');
    let step = 0;
    prdStepTimer.current = setInterval(() => {
      step = Math.min(step + 1, PRD_STEPS.length - 1);
      setPrdStep(step);
    }, 2800);
    try {
      const res = await fetch('/api/prd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, insights }),
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPrdData(data);
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      if (prdStepTimer.current) { clearInterval(prdStepTimer.current); prdStepTimer.current = null; }
      setLoading(false);
    }
  }

  async function exportPDF() {
    if (!prdData) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = 210;
    const margin = 20;
    const contentW = pageW - margin * 2;
    let y = margin;
    const lineH = 5;
    const sectionGap = 10;

    const addText = (text: string, fontSize: number, fontStyle: 'normal' | 'bold', color: [number, number, number], maxWidth: number) => {
      doc.setFontSize(fontSize); doc.setFont('helvetica', fontStyle); doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxWidth);
      for (const line of lines) {
        if (y > 270) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += lineH * (fontSize / 10);
      }
    };

    addText(prdData.title, 18, 'bold', [10, 10, 10], contentW);
    y += 4;
    addText(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 9, 'normal', [140, 140, 140], contentW);
    y += sectionGap;
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y, pageW - margin, y);
    y += sectionGap;

    const colW = contentW / 4;
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(170, 170, 170);
    COL_HEADERS.forEach((h, i) => doc.text(h.toUpperCase(), margin + i * colW, y));
    y += 6;
    doc.line(margin, y, pageW - margin, y);
    y += 6;

    for (const section of prdData.sections) {
      const rowCells = [section.problem, section.userStory, section.requirement, section.successMetric];
      const cellLines = rowCells.map(cell => doc.splitTextToSize(cell, colW - 4));
      const maxLines = Math.max(...cellLines.map(l => l.length));
      const rowH = maxLines * 4.5 + 4;
      if (y + rowH > 270) { doc.addPage(); y = margin; }
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50);
      rowCells.forEach((_, i) => {
        let cy = y;
        for (const line of cellLines[i]) { doc.text(line, margin + i * colW, cy); cy += 4.5; }
      });
      y += rowH;
      doc.setDrawColor(240, 240, 240);
      doc.line(margin, y, pageW - margin, y);
      y += 4;
    }
    doc.save(`${productName.replace(/\s+/g, '-').toLowerCase()}-decision.pdf`);
  }

  return (
    <main className="page-container py-20 sm:py-28">
      {/* Header */}
      <div className="mb-16">
        <p className="label-tag mb-6">{productName}</p>
        <div className="flex items-end gap-5">
          <h1 className="font-semibold text-[#1D1D1F] leading-tight" style={{ fontSize: 'clamp(32px, 4vw, 48px)', letterSpacing: '-0.3px' }}>
            Recommend Product<br />Decision
          </h1>
          {loading && (
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="thinking-dot" />
              <div className="thinking-dot" />
              <div className="thinking-dot" />
            </div>
          )}
        </div>
        {!loading && prdData && (
          <p className="mt-3 text-sm" style={{ color: '#6E6E73' }}>
            {prdData.sections.length} recommendations · click any row to expand
          </p>
        )}

        {loading && (
          <div className="mt-8 space-y-2">
            {PRD_STEPS.map((step, i) => (
              <div key={i} className={`flex items-center gap-3 transition-all duration-300 ${i <= prdStep ? 'opacity-100' : 'opacity-20'}`}>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                  background: i < prdStep ? '#6E6E73' : i === prdStep ? '#0071E3' : '#D2D2D7',
                }} />
                <span className="text-[10px] tracking-[0.15em] uppercase" style={{ color: i === prdStep ? '#0071E3' : '#6E6E73' }}>
                  {step}
                  {i === prdStep && <span className="ml-1">…</span>}
                  {i < prdStep && <span className="ml-1" style={{ color: '#D2D2D7' }}>✓</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="p-6 mb-12 max-w-lg rounded-2xl" style={{ background: '#F5F5F7' }}>
          <p className="text-sm mb-4" style={{ color: '#1D1D1F' }}>{error}</p>
          <button onClick={() => { startedRef.current = false; fetchPRD(); }} className="btn-primary text-xs">Retry</button>
        </div>
      )}

      {loading && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #D2D2D7' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex" style={{ borderBottom: '1px solid #F5F5F7' }}>
              <div className="w-[3px] shrink-0" style={{ background: '#F5F5F7' }} />
              <div className="flex-1 px-6 py-4 flex items-center justify-between">
                <div className="loading-bar h-2.5 w-40 rounded" />
                <div className="loading-bar h-2 w-12 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {prdData && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #D2D2D7' }}>
          {[...prdData.sections]
            .sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority))
            .map((section, i) => (
              <PRDRow key={section.id} section={section} index={i} />
            ))}
        </div>
      )}

      {prdData && (
        <div className="mt-16 pt-10 space-y-6" style={{ borderTop: '1px solid #D2D2D7' }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm" style={{ color: '#6E6E73' }}>
              Based on research from {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
            <div className="flex items-center gap-3">
              <button onClick={copyShareLink} className="btn-secondary">
                {copied
                  ? <><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>Link copied</>
                  : <><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 7.5a3 3 0 004.24 0l2-2a3 3 0 00-4.24-4.24l-1 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><path d="M8 5.5a3 3 0 00-4.24 0l-2 2a3 3 0 004.24 4.24l1-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>Copy link to share</>
                }
              </button>
              <button onClick={exportPDF} className="btn-primary">
                Export as PDF
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M6.5 1v8M3 6.5l3.5 3.5 3.5-3.5M1 11h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid #D2D2D7' }}>
            <button onClick={onGoLanding} className="btn-secondary">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1L1 6.5h2v5.5h7V6.5h2L6.5 1z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to home
            </button>
            <button onClick={onNewProduct} className="btn-secondary">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              New product
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
