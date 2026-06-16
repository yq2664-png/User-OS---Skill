import { useEffect, useRef, useState } from 'react';
import type { FormData, FeatureConstraint, TimeConstraint, ProductStage } from '../App';

interface Props {
  formData: FormData;
  setFormData: (d: FormData) => void;
  onSubmit: () => void;
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 text-zinc-200 hover:text-zinc-600 transition-colors ml-2"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function ArrowBtn({ direction, onClick, disabled }: { direction: 'up' | 'down'; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-zinc-200 hover:text-zinc-500 disabled:opacity-0 transition-colors"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        {direction === 'up'
          ? <path d="M1 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          : <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
    </button>
  );
}

const STAGES: { id: ProductStage; label: string; desc: string; detail: string }[] = [
  {
    id: 'unpublished',
    label: 'Unpublished',
    desc: 'Pre-launch or in development',
    detail: 'Product name + design documents + your requirements',
  },
  {
    id: 'web',
    label: 'Web Product',
    desc: 'Live on the web',
    detail: 'Product name + web link + your requirements',
  },
  {
    id: 'client',
    label: 'Client App',
    desc: 'Desktop or mobile app',
    detail: 'Product name + your requirements',
  },
];

// ── Stage Picker ──────────────────────────────────────────────────────────────
function StagePicker({ onSelect }: { onSelect: (s: ProductStage) => void }) {
  const [hovered, setHovered] = useState<ProductStage | null>(null);

  return (
    <main className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center page-container py-20">
      <h1 className="text-4xl sm:text-5xl font-light text-zinc-900 leading-[1.1] tracking-tight mb-16 text-center">
        What stage is<br />your product at?
      </h1>

      <div className="w-full grid grid-cols-3 gap-3">
        {STAGES.map((s, i) => {
          const active = hovered === s.id;
          const dimmed = hovered !== null && hovered !== s.id;
          return (
            <button
              key={s.id}
              type="button"
              onMouseEnter={() => setHovered(s.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(s.id)}
              className={`stage-card-enter w-full text-left border p-5 transition-all duration-200
                ${active
                  ? 'bg-zinc-900 border-zinc-900 scale-[1.02] shadow-lg'
                  : dimmed
                  ? 'bg-white border-zinc-100 opacity-40'
                  : 'bg-white border-zinc-200'
                }`}
            >
              <span className={`font-mono text-[9px] tracking-widest uppercase block mb-3 transition-colors duration-200 ${active ? 'text-zinc-500' : 'text-zinc-300'}`}>
                0{i + 1}
              </span>
              <span className={`text-base font-light block mb-2 transition-colors duration-200 leading-snug ${active ? 'text-white' : 'text-zinc-800'}`}>
                {s.label}
              </span>
              <p className={`text-xs leading-snug transition-colors duration-200 ${active ? 'text-zinc-400' : 'text-zinc-400'}`}>
                {s.desc}
              </p>
            </button>
          );
        })}
      </div>
    </main>
  );
}

// ── Form ──────────────────────────────────────────────────────────────────────
function StageForm({
  formData,
  setFormData,
  onBack,
  onSubmit,
}: {
  formData: FormData;
  setFormData: (d: FormData) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const screenshotRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const stage = formData.productStage as ProductStage;
  const stageInfo = STAGES.find(s => s.id === stage)!;

  const update = (field: keyof FormData, value: string) =>
    setFormData({ ...formData, [field]: value });

  const addFiles = (field: 'screenshots' | 'documents', files: FileList | null) => {
    if (!files) return;
    setFormData({ ...formData, [field]: [...(formData[field] as File[]), ...Array.from(files)] });
  };

  const removeFile = (field: 'screenshots' | 'documents', idx: number) => {
    setFormData({ ...formData, [field]: (formData[field] as File[]).filter((_, i) => i !== idx) });
  };

  const addFeatureConstraint = () =>
    setFormData({ ...formData, featureConstraints: [...formData.featureConstraints, { module: '', constraint: '' }] });

  const updateFeatureConstraint = (idx: number, field: keyof FeatureConstraint, value: string) => {
    const updated = formData.featureConstraints.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    setFormData({ ...formData, featureConstraints: updated });
  };

  const removeFeatureConstraint = (idx: number) =>
    setFormData({ ...formData, featureConstraints: formData.featureConstraints.filter((_, i) => i !== idx) });

  const addTimeConstraint = () =>
    setFormData({ ...formData, timeConstraints: [...formData.timeConstraints, { timeline: '', description: '' }] });

  const updateTimeConstraint = (idx: number, field: keyof TimeConstraint, value: string) => {
    const updated = formData.timeConstraints.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    setFormData({ ...formData, timeConstraints: updated });
  };

  const removeTimeConstraint = (idx: number) =>
    setFormData({ ...formData, timeConstraints: formData.timeConstraints.filter((_, i) => i !== idx) });

  const moveTimeConstraint = (idx: number, dir: 'up' | 'down') => {
    const list = [...formData.timeConstraints];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= list.length) return;
    [list[idx], list[target]] = [list[target], list[idx]];
    setFormData({ ...formData, timeConstraints: list });
  };

  const canSubmit =
    formData.productName.trim() &&
    (stage === 'web' ? formData.webLink.trim() : true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) onSubmit();
  };

  return (
    <main className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center page-container py-20 relative">
      {/* Back — pinned to page left edge, aligned with heading */}
      <button
        type="button"
        onClick={onBack}
        className="absolute left-6 sm:left-10 flex items-center text-zinc-300 hover:text-zinc-900 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
          <path d="M11 6H1M5 2L1 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="w-full max-w-lg">

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-light text-zinc-900 leading-tight tracking-tight mb-10">
          {stageInfo.label}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Product Name */}
          <div className="input-underline border-b border-zinc-200 pb-6">
            <label className="label-tag block mb-3">Product Name</label>
            <input
              type="text"
              className="w-full text-lg font-light text-zinc-900 placeholder:text-zinc-300 outline-none bg-transparent"
              placeholder="e.g. Notion, Linear, Figma"
              value={formData.productName}
              onChange={(e) => update('productName', e.target.value)}
            />
          </div>

          {/* Web link */}
          {stage === 'web' && (
            <div className="input-underline border-b border-zinc-200 pb-6">
              <label className="label-tag block mb-3">Web Link</label>
              <input
                type="url"
                className="w-full text-lg font-light text-zinc-900 placeholder:text-zinc-300 outline-none bg-transparent"
                placeholder="https://yourproduct.com"
                value={formData.webLink}
                onChange={(e) => update('webLink', e.target.value)}
              />
              <p className="text-xs text-zinc-300 mt-3">AI will explore this URL to understand your product.</p>
            </div>
          )}

          {/* Design documents — unpublished only */}
          {stage === 'unpublished' && (
            <div>
              <label className="label-tag block mb-3">Design Documents <span className="text-zinc-300 ml-2">Optional</span></label>
              <button
                type="button"
                onClick={() => docRef.current?.click()}
                className="w-full border border-dashed border-zinc-200 py-6 text-center hover:border-zinc-400 transition-colors"
              >
                <span className="text-sm text-zinc-400">Click to upload files</span>
              </button>
              <input ref={docRef} type="file" multiple className="hidden"
                onChange={(e) => addFiles('documents', e.target.files)} />
              {formData.documents.length > 0 && (
                <div className="mt-3 space-y-1">
                  {formData.documents.map((f, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-100">
                      <span className="text-xs text-zinc-500 truncate max-w-xs">{f.name}</span>
                      <button type="button" onClick={() => removeFile('documents', i)} className="text-zinc-300 hover:text-zinc-700 ml-4 text-xs">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Requirements */}
          <div className="input-underline border-b border-zinc-200 pb-6">
            <label className="label-tag block mb-3">
              Requirements
              <span className="text-zinc-300 ml-2">Optional</span>
            </label>
            <textarea
              className="w-full text-base font-light text-zinc-900 placeholder:text-zinc-300 outline-none bg-transparent resize-none"
              rows={4}
              placeholder={
                stage === 'web'
                  ? 'What aspects do you want to explore? Any known pain points or goals?'
                  : stage === 'unpublished'
                  ? 'Core functions, target audience, and problem your product solves.'
                  : "What your app does, who it's for, and what you want to learn."
              }
              value={formData.requirements}
              onChange={(e) => update('requirements', e.target.value)}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={!canSubmit}
              className={`btn-primary ${!canSubmit ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              {stage === 'unpublished' ? 'Generate User Perspectives' : 'Continue'}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

        </form>
      </div>
    </main>
  );
}

interface ProductInfo {
  name: string;
  tagline: string;
  audience: string;
  features: string[];
}

// ── Confirm ───────────────────────────────────────────────────────────────────
function ConfirmView({
  formData,
  onEdit,
  onConfirm,
}: {
  formData: FormData;
  onEdit: () => void;
  onConfirm: () => void;
}) {
  const stage = formData.productStage as ProductStage;
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (stage !== 'web') { setStatus('done'); return; }
    fetch('/api/verify-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webLink: formData.webLink }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setProduct(data);
        setStatus('done');
      })
      .catch(e => { setErrorMsg(e.message); setStatus('error'); });
  }, []);

  return (
    <main className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center page-container py-20">
      <p className="label-tag mb-10">
        {stage === 'web' ? 'Verifying your product' : 'Confirm your product'}
      </p>

      {/* Loading */}
      {status === 'loading' && (
        <>
          <h1 className="text-4xl sm:text-5xl font-light text-zinc-900 leading-[1.1] tracking-tight mb-6">
            Exploring your site…
          </h1>
          <p className="text-zinc-400 text-sm mb-16">We're reading {formData.webLink} to understand your product.</p>
          <div className="max-w-2xl border border-zinc-100 divide-y divide-zinc-100">
            {[80, 60, 70, 50].map((w, i) => (
              <div key={i} className="px-8 py-6">
                <div className={`loading-bar h-2.5 rounded`} style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Error */}
      {status === 'error' && (
        <>
          <h1 className="text-4xl sm:text-5xl font-light text-zinc-900 leading-[1.1] tracking-tight mb-6">
            Couldn't reach the site
          </h1>
          <p className="text-zinc-400 text-sm mb-12">{errorMsg}</p>
          <button onClick={onEdit} className="btn-secondary self-start">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M11 6H1M5 2L1 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Edit URL
          </button>
        </>
      )}

      {/* Done */}
      {status === 'done' && (
        <>
          <h1 className="text-4xl sm:text-5xl font-light text-zinc-900 leading-[1.1] tracking-tight mb-16">
            Is this your product?
          </h1>

          <div className="max-w-2xl border border-zinc-200 divide-y divide-zinc-100 mb-12">
            {/* Product name — from AI or user input */}
            <div className="flex items-start gap-6 px-8 py-6">
              <span className="font-mono text-[9px] tracking-widest uppercase text-zinc-300 pt-0.5 w-28 shrink-0">Product</span>
              <span className="text-zinc-900 font-medium text-lg">{product?.name || formData.productName}</span>
            </div>

            {/* Tagline — web only */}
            {product?.tagline && (
              <div className="flex items-start gap-6 px-8 py-6">
                <span className="font-mono text-[9px] tracking-widest uppercase text-zinc-300 pt-0.5 w-28 shrink-0">What it does</span>
                <p className="text-sm text-zinc-700 leading-relaxed">{product.tagline}</p>
              </div>
            )}

            {/* Audience — web only */}
            {product?.audience && (
              <div className="flex items-start gap-6 px-8 py-6">
                <span className="font-mono text-[9px] tracking-widest uppercase text-zinc-300 pt-0.5 w-28 shrink-0">For</span>
                <p className="text-sm text-zinc-700">{product.audience}</p>
              </div>
            )}

            {/* Key features — web only */}
            {product?.features?.length > 0 && (
              <div className="flex items-start gap-6 px-8 py-6">
                <span className="font-mono text-[9px] tracking-widest uppercase text-zinc-300 pt-0.5 w-28 shrink-0">Key features</span>
                <ul className="space-y-1.5">
                  {product.features.map((f, i) => (
                    <li key={i} className="text-sm text-zinc-600 flex items-start gap-2">
                      <span className="text-zinc-300 mt-0.5">–</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Client stage — just show name + requirements */}
            {stage === 'client' && formData.requirements.trim() && (
              <div className="flex items-start gap-6 px-8 py-6">
                <span className="font-mono text-[9px] tracking-widest uppercase text-zinc-300 pt-0.5 w-28 shrink-0">Notes</span>
                <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">{formData.requirements}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button type="button" onClick={onEdit} className="btn-secondary">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M11 6H1M5 2L1 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Not quite, edit
            </button>
            <button type="button" onClick={onConfirm} className="btn-primary">
              Yes, generate perspectives
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </>
      )}
    </main>
  );
}

// ── InputPage ─────────────────────────────────────────────────────────────────
export default function InputPage({ formData, setFormData, onSubmit }: Props) {
  const [view, setView] = useState<'stage' | 'form' | 'confirm'>(
    formData.productStage ? 'form' : 'stage'
  );

  const scroll = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleSelectStage = (stage: ProductStage) => {
    setFormData({ ...formData, productStage: stage });
    setView('form');
    scroll();
  };

  const handleFormSubmit = () => {
    // unpublished goes straight to generation; web/client show confirm first
    if (formData.productStage === 'unpublished') {
      onSubmit();
    } else {
      setView('confirm');
      scroll();
    }
  };

  if (view === 'stage') {
    return <StagePicker onSelect={handleSelectStage} />;
  }

  if (view === 'confirm') {
    return (
      <ConfirmView
        formData={formData}
        onEdit={() => { setView('form'); scroll(); }}
        onConfirm={onSubmit}
      />
    );
  }

  return (
    <StageForm
      formData={formData}
      setFormData={setFormData}
      onBack={() => { setView('stage'); scroll(); }}
      onSubmit={handleFormSubmit}
    />
  );
}
