import { useEffect, useRef, useState } from 'react';
import type { FormData, ProductStage } from '../App';

function FormRow({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 lg:gap-16 py-10" style={{ borderBottom: '1px solid #F5F5F7' }}>
      <div className="pt-1">
        <p className="label-tag mb-2">{label}</p>
        <p className="text-sm leading-relaxed" style={{ color: '#6E6E73' }}>{hint}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

interface Props {
  formData: FormData;
  setFormData: (d: FormData) => void;
  onSubmit: () => void;
}

const STAGES: { id: ProductStage; label: string; desc: string }[] = [
  { id: 'unpublished', label: 'Unpublished', desc: 'Pre-launch or in development' },
  { id: 'web',        label: 'Web Product',  desc: 'Live on the web'             },
  { id: 'client',     label: 'Client App',   desc: 'Desktop or mobile app'       },
];

interface VerifyResult {
  name: string;
  tagline: string;
  audience: string;
  features: string[];
  logo?: string;
  screenshot?: string;
}

interface AppResult {
  name: string;
  tagline: string;
  audience: string;
  features: string[];
  logo?: string;
  appId?: number;
}

export default function InputPage({ formData, setFormData, onSubmit }: Props) {
  const [phase, setPhase] = useState<'picking' | 'forming'>(
    formData.productStage ? 'forming' : 'picking'
  );
  const [transitioning, setTransitioning] = useState(false);

  // Verify state
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'loading' | 'done' | 'multiple' | 'error'>('idle');
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [multipleResults, setMultipleResults] = useState<AppResult[]>([]);
  const [verifyError, setVerifyError] = useState('');

  const stage = formData.productStage as ProductStage | '';
  const docRef = useRef<HTMLInputElement>(null);

  const update = (field: keyof FormData, value: string) =>
    setFormData({ ...formData, [field]: value });

  const selectStage = (s: ProductStage) => {
    if (phase === 'picking') {
      setTransitioning(true);
      setTimeout(() => {
        setFormData({ ...formData, productStage: s });
        setPhase('forming');
        setTransitioning(false);
        setVerifyStatus('idle');
        setVerifyResult(null);
      }, 280);
    } else {
      setFormData({ ...formData, productStage: s });
      setVerifyStatus('idle');
      setVerifyResult(null);
      setMultipleResults([]);
    }
  };

  const canVerify =
    (stage === 'web' && formData.webLink.trim()) ||
    (stage === 'client' && formData.productName.trim());

  const canSubmitDirect = stage === 'unpublished' && formData.productName.trim();

  async function verify() {
    setVerifyStatus('loading');
    setVerifyError('');
    setVerifyResult(null);
    setMultipleResults([]);
    try {
      const res = await fetch('/api/verify-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webLink: formData.webLink,
          productName: formData.productName,
          productStage: stage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not verify product');
      if (data.multiple) {
        setMultipleResults(data.multiple);
        setVerifyStatus('multiple');
      } else {
        setVerifyResult(data);
        // Auto-fill product name from verified result for web
        if (stage === 'web' && data.name) {
          setFormData({ ...formData, productName: data.name });
        }
        setVerifyStatus('done');
      }
    } catch (e: any) {
      setVerifyError(e.message);
      setVerifyStatus('error');
    }
  }

  function selectApp(app: AppResult) {
    setFormData({ ...formData, productName: app.name });
    setVerifyResult({ ...app, features: app.features ?? [] });
    setVerifyStatus('done');
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col">

      {/* ── Picking phase: centered stage selector ── */}
      {phase === 'picking' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <h1
            className={`font-semibold text-[#1D1D1F] text-center mb-10 transition-opacity duration-200 ${transitioning ? 'opacity-0' : 'opacity-100'}`}
            style={{ fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: '1.08', letterSpacing: '-0.3px' }}
          >
            What stage is<br />your product at?
          </h1>

          <div className="grid grid-cols-3 gap-3 w-full max-w-2xl">
            {STAGES.map((s, i) => {
              const selected = stage === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => selectStage(s.id)}
                  className="text-left stage-card-enter"
                  style={{
                    animationDelay: `${i * 80}ms`,
                    background: selected ? '#1D1D1F' : '#F5F5F7',
                    borderRadius: '20px',
                    padding: '24px 20px',
                    transition: 'background 0.24s cubic-bezier(0.4,0,0.6,1)',
                  }}
                >
                  <span className="text-[9px] tracking-widest uppercase block mb-4" style={{ color: selected ? '#6E6E73' : '#D2D2D7' }}>
                    0{i + 1}
                  </span>
                  <span className="block text-base font-semibold leading-snug mb-1.5" style={{ color: selected ? 'white' : '#1D1D1F' }}>
                    {s.label}
                  </span>
                  <p className="text-xs leading-snug" style={{ color: '#6E6E73' }}>
                    {s.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Form phase ── */}
      {phase === 'forming' && stage && (
        <div className="flex-1 flex flex-col items-center px-6 pt-8 pb-12">
        <div className="w-full max-w-lg">

          {/* Stage pill switcher */}
          <div className="flex items-center justify-center gap-2 mb-16">
            {STAGES.map(s => {
              const selected = stage === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => selectStage(s.id)}
                  className="text-base font-semibold px-7 py-3 rounded-full transition-all"
                  style={{
                    background: selected ? '#1D1D1F' : '#F5F5F7',
                    color: selected ? 'white' : '#6E6E73',
                    transition: 'background 0.24s cubic-bezier(0.4,0,0.6,1), color 0.24s cubic-bezier(0.4,0,0.6,1)',
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-4">

            {/* Product Name */}
            {stage !== 'web' && (
              <div>
                <label className="label-tag block mb-2">Product Name</label>
                <input
                  type="text"
                  className="w-full text-[#1D1D1F] outline-none rounded-xl px-4 py-3"
                  style={{ fontSize: '17px', lineHeight: '1.5', background: '#F5F5F7', border: 'none' }}
                  placeholder="e.g. Notion, Linear, Figma"
                  value={formData.productName}
                  onChange={e => update('productName', e.target.value)}
                />
              </div>
            )}

            {/* Web Link */}
            {stage === 'web' && (
              <div>
                <label className="label-tag block mb-2">Website URL</label>
                <input
                  type="url"
                  className="w-full text-[#1D1D1F] outline-none rounded-xl px-4 py-3"
                  style={{ fontSize: '17px', lineHeight: '1.5', background: '#F5F5F7', border: 'none' }}
                  placeholder="https://yourproduct.com"
                  value={formData.webLink}
                  onChange={e => { update('webLink', e.target.value); setVerifyStatus('idle'); }}
                />
              </div>
            )}

            {/* Design documents */}
            {stage === 'unpublished' && (
              <div>
                <label className="label-tag block mb-2">Design Documents <span className="ml-1 normal-case font-normal" style={{ color: '#D2D2D7' }}>optional</span></label>
                <button
                  type="button"
                  onClick={() => docRef.current?.click()}
                  className="w-full py-5 text-center rounded-xl transition-colors"
                  style={{ background: '#F5F5F7', border: 'none' }}
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="mx-auto mb-1" style={{ color: '#D2D2D7' }}>
                    <path d="M10 3v10M6 7l4-4 4 4M3 14v1a2 2 0 002 2h10a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-sm" style={{ color: '#6E6E73' }}>Click to upload</span>
                </button>
                <input ref={docRef} type="file" multiple className="hidden"
                  onChange={e => {
                    if (!e.target.files) return;
                    setFormData({ ...formData, documents: [...formData.documents, ...Array.from(e.target.files)] });
                  }} />
                {formData.documents.length > 0 && (
                  <div className="mt-2 rounded-xl overflow-hidden" style={{ background: '#F5F5F7' }}>
                    {formData.documents.map((f, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: i < formData.documents.length - 1 ? '1px solid #E8E8ED' : 'none' }}>
                        <span className="text-sm truncate" style={{ color: '#6E6E73' }}>{f.name}</span>
                        <button type="button" className="ml-4 text-xs shrink-0" style={{ color: '#D2D2D7' }}
                          onClick={() => setFormData({ ...formData, documents: formData.documents.filter((_, j) => j !== i) })}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Context */}
            <div>
              <label className="label-tag block mb-2">
                Context <span className="ml-1 normal-case font-normal" style={{ color: '#D2D2D7' }}>optional</span>
              </label>
              <textarea
                className="w-full text-[#1D1D1F] outline-none rounded-xl px-4 py-3 resize-none"
                style={{ fontSize: '17px', lineHeight: '1.6', background: '#F5F5F7', border: 'none' }}
                rows={4}
                placeholder={
                  stage === 'web'
                    ? 'Angles to explore, known pain points, or research goals…'
                    : stage === 'unpublished'
                    ? 'Core functions, target audience, the problem this solves…'
                    : "What the app does, who it's for, what you want to learn…"
                }
                value={formData.requirements}
                onChange={e => update('requirements', e.target.value)}
              />
            </div>

          </div>

          {/* ── Actions ── */}
          <div className="py-10">
            {/* Unpublished: direct submit */}
            {stage === 'unpublished' && (
              <button
                onClick={onSubmit}
                disabled={!canSubmitDirect}
                className={`btn-primary ${!canSubmitDirect ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                Generate User Perspectives
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}

            {/* Web / Client: verify flow */}
            {(stage === 'web' || stage === 'client') && (
              <div>
                {verifyStatus === 'idle' && (
                  <button
                    onClick={verify}
                    disabled={!canVerify}
                    className={`btn-primary ${!canVerify ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    Verify Product
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1a6 6 0 100 12A6 6 0 007 1zM7 4v4M7 10h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </button>
                )}

                {verifyStatus === 'loading' && (
                  <div className="flex items-center gap-3 text-sm" style={{ color: '#6E6E73' }}>
                    <div className="flex gap-1">
                      <div className="thinking-dot" />
                      <div className="thinking-dot" />
                      <div className="thinking-dot" />
                    </div>
                    <span>Searching for product info…</span>
                  </div>
                )}

                {verifyStatus === 'error' && (
                  <div className="space-y-4">
                    <div className="p-5 rounded-xl" style={{ background: '#F5F5F7' }}>
                      <p className="text-sm mb-1" style={{ color: '#6E6E73' }}>Couldn't find this product.</p>
                      <p className="text-xs" style={{ color: '#6E6E73' }}>{verifyError}</p>
                    </div>
                    <p className="text-xs" style={{ color: '#6E6E73' }}>Try adjusting the {stage === 'web' ? 'URL' : 'product name'} above, or add more details in Requirements.</p>
                    <button onClick={verify} className="btn-secondary text-xs">Try again</button>
                  </div>
                )}

                {verifyStatus === 'multiple' && (
                  <div>
                    <p className="label-tag mb-4">Multiple apps found — select yours</p>
                    <div className="space-y-2">
                      {multipleResults.map((app, i) => (
                        <button
                          key={i}
                          onClick={() => selectApp(app)}
                          className="w-full text-left flex items-center gap-4 p-4 rounded-xl transition-colors"
                          style={{ background: '#F5F5F7' }}
                        >
                          {app.logo && <img src={app.logo} alt="" className="w-10 h-10 rounded-xl shrink-0" />}
                          <div>
                            <p className="text-sm font-semibold" style={{ color: '#1D1D1F' }}>{app.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: '#6E6E73' }}>{app.tagline?.slice(0, 80)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setVerifyStatus('idle')} className="mt-4 text-xs" style={{ color: '#6E6E73' }}>
                      None of these — go back
                    </button>
                  </div>
                )}

                {verifyStatus === 'done' && verifyResult && (
                  <div className="space-y-6">
                    <div className="rounded-2xl overflow-hidden" style={{ background: '#F5F5F7' }}>
                      <div className="flex items-center gap-4 p-5" style={{ borderBottom: '1px solid #D2D2D7' }}>
                        {verifyResult.logo && (
                          <img src={verifyResult.logo} alt="" className="w-10 h-10 rounded-xl shrink-0" />
                        )}
                        <div>
                          <p className="text-base font-semibold" style={{ color: '#1D1D1F' }}>{verifyResult.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#6E6E73' }}>{verifyResult.tagline}</p>
                        </div>
                      </div>
                      {verifyResult.screenshot && (
                        <div className="overflow-hidden max-h-36" style={{ borderBottom: '1px solid #D2D2D7' }}>
                          <img src={verifyResult.screenshot} alt="Product screenshot" className="w-full object-cover object-top" />
                        </div>
                      )}
                      <div>
                        {verifyResult.audience && (
                          <div className="flex items-start gap-4 px-5 py-3" style={{ borderBottom: '1px solid #D2D2D7' }}>
                            <span className="label-tag w-20 shrink-0 pt-0.5">For</span>
                            <p className="text-xs" style={{ color: '#1D1D1F' }}>{verifyResult.audience}</p>
                          </div>
                        )}
                        {verifyResult.features?.length > 0 && (
                          <div className="flex items-start gap-4 px-5 py-3">
                            <span className="label-tag w-20 shrink-0 pt-0.5">Features</span>
                            <ul className="space-y-1">
                              {verifyResult.features.map((f, i) => (
                                <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: '#1D1D1F' }}>
                                  <span className="mt-0.5" style={{ color: '#D2D2D7' }}>–</span>{f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button onClick={onSubmit} className="btn-primary">
                        Generate Perspectives
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button onClick={() => { setVerifyStatus('idle'); setVerifyResult(null); }} className="btn-secondary">
                        Not quite, retry
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
        </div>
      )}
    </div>
  );
}
