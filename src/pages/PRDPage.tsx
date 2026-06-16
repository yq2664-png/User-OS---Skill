import { useEffect, useRef, useState } from 'react';
import { encodeShare } from '../utils/shareLink';
import type { Insights, PRDData, PRDSection } from '../App';
import LoadingModal from '../components/LoadingModal';

interface Props {
  productName: string;
  insights: Insights;
  prdData: PRDData | null;
  setPrdData: (d: PRDData) => void;
}

const COL_HEADERS = ['Problem', 'User Story', 'Requirement', 'Success Metric'];

const PRIORITY_ORDER = ['Critical', 'High', 'Medium', 'Low'] as const;
const PRIORITY_COLOR: Record<string, string> = {
  Critical: '#ef4444',
  High:     '#f59e0b',
  Medium:   '#eab308',
  Low:      '#22c55e',
};

function PRDRow({ section, index }: { section: PRDSection; index: number }) {
  const cells = [section.problem, section.userStory, section.requirement, section.successMetric];
  const color = PRIORITY_COLOR[section.priority] ?? '#d4d4d8';
  return (
    <div
      className="card-enter border-b border-zinc-100 last:border-0 flex"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Priority color bar */}
      <div className="w-[3px] shrink-0" style={{ background: color }} />

      <div className="flex-1 min-w-0">
        {/* Row name + priority label */}
        <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-3 border-b border-zinc-50">
          <span className="text-sm font-medium text-zinc-900">{section.name || `Requirement ${section.id}`}</span>
          <span className="font-mono text-[9px] tracking-widest uppercase shrink-0" style={{ color }}>
            {section.priority}
          </span>
        </div>

        {/* 4-column content */}
        <div className="grid grid-cols-1 lg:grid-cols-4">
          {cells.map((cell, ci) => (
            <div
              key={ci}
              className={`p-6 ${ci < cells.length - 1 ? 'lg:border-r lg:border-zinc-100' : ''} ${ci > 0 ? 'border-t lg:border-t-0 border-zinc-100' : ''}`}
            >
              <p className="label-tag mb-2 lg:hidden">{COL_HEADERS[ci]}</p>
              <p className="text-sm text-zinc-700 font-light leading-relaxed">{cell}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PRDPage({ productName, insights, prdData, setPrdData }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const startedRef = useRef(false);

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
    setError('');
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
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxWidth);
      for (const line of lines) {
        if (y > 270) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += lineH * (fontSize / 10);
      }
    };

    // Title
    addText(prdData.title, 18, 'bold', [10, 10, 10], contentW);
    y += 4;
    addText(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 9, 'normal', [140, 140, 140], contentW);
    y += sectionGap;

    // Divider
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y, pageW - margin, y);
    y += sectionGap;

    // Column headers
    const colW = contentW / 4;
    const headers = COL_HEADERS;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(170, 170, 170);
    headers.forEach((h, i) => doc.text(h.toUpperCase(), margin + i * colW, y));
    y += 6;
    doc.line(margin, y, pageW - margin, y);
    y += 6;

    // Rows
    for (const section of prdData.sections) {
      const rowCells = [section.problem, section.userStory, section.requirement, section.successMetric];
      const cellLines = rowCells.map(cell => doc.splitTextToSize(cell, colW - 4));
      const maxLines = Math.max(...cellLines.map(l => l.length));
      const rowH = maxLines * 4.5 + 4;

      if (y + rowH > 270) { doc.addPage(); y = margin; }

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);

      rowCells.forEach((_, i) => {
        let cy = y;
        for (const line of cellLines[i]) {
          doc.text(line, margin + i * colW, cy);
          cy += 4.5;
        }
      });

      y += rowH;
      doc.setDrawColor(240, 240, 240);
      doc.line(margin, y, pageW - margin, y);
      y += 4;
    }

    doc.save(`${productName.replace(/\s+/g, '-').toLowerCase()}-prd.pdf`);
  }

  const prdSteps = [
    { label: 'Reading research insights', sublabel: 'Analyzing patterns and priorities' },
    { label: 'Defining problems', sublabel: 'Translating findings into problem statements' },
    { label: 'Writing requirements', sublabel: 'Crafting testable product requirements' },
    { label: 'Setting success metrics', sublabel: 'Defining measurable outcomes' },
  ];

  return (
    <>
      <LoadingModal visible={loading} steps={prdSteps} />
    <main className="page-container py-20 sm:py-28">
      {/* Header */}
      <div className="mb-16">
        <p className="label-tag mb-6">{productName}</p>
        <div className="flex items-end gap-5">
          <h1 className="text-4xl sm:text-5xl font-light text-zinc-900 leading-tight tracking-tight">
            Product Requirements
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
          <p className="mt-3 text-sm text-zinc-400 font-light">
            {prdData.sections.length} requirements derived from user research
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="border border-zinc-200 p-6 mb-12 max-w-lg">
          <p className="text-sm text-zinc-700 mb-4">{error}</p>
          <button onClick={() => { startedRef.current = false; fetchPRD(); }} className="btn-primary text-xs">
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div>
          <div className="hidden lg:grid grid-cols-4 gap-px border border-zinc-100 mb-px">
            {COL_HEADERS.map((h) => (
              <div key={h} className="p-4 bg-zinc-50">
                <span className="label-tag">{h}</span>
              </div>
            ))}
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-1 lg:grid-cols-4 border border-t-0 border-zinc-100">
              {[0, 1, 2, 3].map((ci) => (
                <div key={ci} className="p-6">
                  <div className="space-y-2">
                    <div className="loading-bar h-2.5 w-full rounded" />
                    <div className="loading-bar h-2.5 w-5/6 rounded" />
                    <div className="loading-bar h-2.5 w-3/4 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* PRD Table */}
      {prdData && (
        <div>
          {/* Column headers — desktop only */}
          <div className="hidden lg:grid grid-cols-4 border border-zinc-100 border-b-0">
            {COL_HEADERS.map((h, i) => (
              <div key={h} className={`p-5 bg-zinc-50 ${i < 3 ? 'border-r border-zinc-100' : ''}`}>
                <span className="label-tag">{h}</span>
              </div>
            ))}
          </div>

          <div className="border border-zinc-100">
            {[...prdData.sections]
              .sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority))
              .map((section, i) => (
                <PRDRow key={section.id} section={section} index={i} />
              ))}
          </div>
        </div>
      )}

      {/* Footer */}
      {prdData && (
        <div className="mt-16 pt-10 border-t border-zinc-100 flex items-center justify-between flex-wrap gap-4">
          <p className="text-sm text-zinc-400 font-light">
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
      )}
    </main>
    </>
  );
}
