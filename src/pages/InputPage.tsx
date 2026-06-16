import { useRef } from 'react';
import type { FormData, FeatureConstraint, TimeConstraint } from '../App';

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

export default function InputPage({ formData, setFormData, onSubmit }: Props) {
  const screenshotRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  const update = (field: keyof FormData, value: string) =>
    setFormData({ ...formData, [field]: value });

  const addFiles = (field: 'screenshots' | 'documents', files: FileList | null) => {
    if (!files) return;
    setFormData({ ...formData, [field]: [...formData[field] as File[], ...Array.from(files)] });
  };

  const removeFile = (field: 'screenshots' | 'documents', idx: number) => {
    setFormData({ ...formData, [field]: (formData[field] as File[]).filter((_, i) => i !== idx) });
  };

  // ── Feature constraints ──────────────────────────────
  const addFeatureConstraint = () => {
    setFormData({ ...formData, featureConstraints: [...formData.featureConstraints, { module: '', constraint: '' }] });
  };

  const updateFeatureConstraint = (idx: number, field: keyof FeatureConstraint, value: string) => {
    const updated = formData.featureConstraints.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    setFormData({ ...formData, featureConstraints: updated });
  };

  const removeFeatureConstraint = (idx: number) => {
    setFormData({ ...formData, featureConstraints: formData.featureConstraints.filter((_, i) => i !== idx) });
  };

  // ── Time constraints ─────────────────────────────────
  const addTimeConstraint = () => {
    setFormData({ ...formData, timeConstraints: [...formData.timeConstraints, { timeline: '', description: '' }] });
  };

  const updateTimeConstraint = (idx: number, field: keyof TimeConstraint, value: string) => {
    const updated = formData.timeConstraints.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    setFormData({ ...formData, timeConstraints: updated });
  };

  const removeTimeConstraint = (idx: number) => {
    setFormData({ ...formData, timeConstraints: formData.timeConstraints.filter((_, i) => i !== idx) });
  };

  const moveTimeConstraint = (idx: number, dir: 'up' | 'down') => {
    const list = [...formData.timeConstraints];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= list.length) return;
    [list[idx], list[target]] = [list[target], list[idx]];
    setFormData({ ...formData, timeConstraints: list });
  };

  const canSubmit = formData.productName.trim() && formData.coreFunctions.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) onSubmit();
  };

  return (
    <main className="page-container py-20 sm:py-28">
      {/* Hero */}
      <div className="mb-20 sm:mb-28">
        <p className="label-tag mb-6">User Perspective Simulator</p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-zinc-900 leading-[1.1] tracking-tight max-w-3xl">
          Understand your product<br />through real user eyes.
        </h1>
        <p className="mt-6 text-zinc-400 text-lg font-light max-w-xl leading-relaxed">
          Describe your product and get AI-generated user perspectives, behavioral insights, and a structured requirements document.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">

        {/* Product Name */}
        <div className="mb-10">
          <label className="label-tag block mb-3">Product Name</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Notion, Linear, Figma"
            value={formData.productName}
            onChange={(e) => update('productName', e.target.value)}
          />
        </div>

        {/* Product Type — optional */}
        <div className="mb-10">
          <div className="flex items-baseline gap-3 mb-3">
            <label className="label-tag">Product Type</label>
            <span className="font-mono text-[9px] tracking-widest uppercase text-zinc-300">Optional</span>
          </div>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. B2B SaaS, Consumer App, Developer Tool"
            value={formData.productType}
            onChange={(e) => update('productType', e.target.value)}
          />
        </div>

        {/* Core Functions */}
        <div className="mb-10">
          <label className="label-tag block mb-3">Core Functions</label>
          <textarea
            className="input-field resize-none"
            rows={5}
            placeholder="Describe what your product does, who it's for, and what problems it solves. The more specific, the more accurate the perspectives."
            value={formData.coreFunctions}
            onChange={(e) => update('coreFunctions', e.target.value)}
          />
        </div>

        <div className="divider mb-10" />

        {/* Feature Module Constraints */}
        <div className="mb-10">
          <div className="flex items-baseline gap-3 mb-1">
            <label className="label-tag">Feature Module Constraints</label>
            <span className="font-mono text-[9px] tracking-widest uppercase text-zinc-300">Optional</span>
          </div>
          <p className="text-xs text-zinc-400 mb-5">Specify which modules have restrictions, dependencies, or are off-limits.</p>

          {formData.featureConstraints.length > 0 && (
            <div className="space-y-2 mb-3">
              {formData.featureConstraints.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    className="input-field text-xs py-2.5"
                    style={{ flex: '0 0 38%' }}
                    placeholder="Module name"
                    value={item.module}
                    onChange={(e) => updateFeatureConstraint(i, 'module', e.target.value)}
                  />
                  <input
                    type="text"
                    className="input-field text-xs py-2.5 flex-1"
                    placeholder="Constraint or note"
                    value={item.constraint}
                    onChange={(e) => updateFeatureConstraint(i, 'constraint', e.target.value)}
                  />
                  <RemoveBtn onClick={() => removeFeatureConstraint(i)} />
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addFeatureConstraint}
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Add constraint
          </button>
        </div>

        {/* Time Constraints with Priority */}
        <div className="mb-10">
          <div className="flex items-baseline gap-3 mb-1">
            <label className="label-tag">Change Timeline & Priority</label>
            <span className="font-mono text-[9px] tracking-widest uppercase text-zinc-300">Optional</span>
          </div>
          <p className="text-xs text-zinc-400 mb-5">Add time-bound changes in priority order. Drag or use arrows to reorder.</p>

          {formData.timeConstraints.length > 0 && (
            <div className="space-y-2 mb-3">
              {formData.timeConstraints.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  {/* Priority number */}
                  <span
                    className="font-mono text-zinc-200 shrink-0 select-none text-right"
                    style={{ fontSize: '1.4rem', lineHeight: 1, width: '1.8rem' }}
                  >
                    {i + 1}
                  </span>
                  {/* Up/down */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <ArrowBtn direction="up"   onClick={() => moveTimeConstraint(i, 'up')}   disabled={i === 0} />
                    <ArrowBtn direction="down" onClick={() => moveTimeConstraint(i, 'down')} disabled={i === formData.timeConstraints.length - 1} />
                  </div>
                  {/* Timeline */}
                  <input
                    type="text"
                    className="input-field text-xs py-2.5"
                    style={{ flex: '0 0 30%' }}
                    placeholder="e.g. Q1 2025"
                    value={item.timeline}
                    onChange={(e) => updateTimeConstraint(i, 'timeline', e.target.value)}
                  />
                  {/* Description */}
                  <input
                    type="text"
                    className="input-field text-xs py-2.5 flex-1"
                    placeholder="What needs to change"
                    value={item.description}
                    onChange={(e) => updateTimeConstraint(i, 'description', e.target.value)}
                  />
                  <RemoveBtn onClick={() => removeTimeConstraint(i)} />
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addTimeConstraint}
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Add timeline item
          </button>
        </div>

        <div className="divider mb-10" />

        {/* Screenshots Upload */}
        <div className="mb-10">
          <div className="flex items-baseline gap-3 mb-1">
            <label className="label-tag">Screenshots</label>
            <span className="font-mono text-[9px] tracking-widest uppercase text-zinc-300">Optional</span>
          </div>
          <p className="text-xs text-zinc-400 mb-4">Upload UI screenshots for visual context.</p>
          <button
            type="button"
            onClick={() => screenshotRef.current?.click()}
            className="w-full border border-dashed border-zinc-200 py-8 text-center hover:border-zinc-400 transition-colors"
          >
            <span className="text-sm text-zinc-400">Click to upload images</span>
          </button>
          <input ref={screenshotRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => addFiles('screenshots', e.target.files)} />
          {formData.screenshots.length > 0 && (
            <div className="mt-3 space-y-1">
              {formData.screenshots.map((f, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-100">
                  <span className="text-xs text-zinc-500 truncate max-w-xs">{f.name}</span>
                  <button type="button" onClick={() => removeFile('screenshots', i)} className="text-zinc-300 hover:text-zinc-700 ml-4 text-xs">Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents Upload */}
        <div className="mb-16">
          <div className="flex items-baseline gap-3 mb-1">
            <label className="label-tag">Design Documents</label>
            <span className="font-mono text-[9px] tracking-widest uppercase text-zinc-300">Optional</span>
          </div>
          <p className="text-xs text-zinc-400 mb-4">Upload specs, PRDs, or briefs.</p>
          <button
            type="button"
            onClick={() => docRef.current?.click()}
            className="w-full border border-dashed border-zinc-200 py-8 text-center hover:border-zinc-400 transition-colors"
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

        {/* CTA */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`btn-primary ${!canSubmit ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          Generate User Perspectives
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

      </form>
    </main>
  );
}
