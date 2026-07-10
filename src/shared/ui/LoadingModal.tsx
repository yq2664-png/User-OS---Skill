import { useEffect, useState } from 'react';

interface Step {
  label: string;
  sublabel?: string;
}

interface Props {
  visible: boolean;
  steps: Step[];
  progress?: number; // 0–100, if provided shows real bar; otherwise animates
}

export default function LoadingModal({ visible, steps, progress }: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const [fakeProgress, setFakeProgress] = useState(0);

  const hasRealProgress = progress !== undefined;
  const pct = hasRealProgress ? Math.min(100, Math.round(progress)) : fakeProgress;

  // Animate steps when no real progress
  useEffect(() => {
    if (!visible || hasRealProgress) return;
    setActiveStep(0);
    setFakeProgress(0);

    const stepInterval = steps.length > 0 ? 2200 : 9999;
    const stepTimer = setInterval(() => {
      setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
    }, stepInterval);

    // Smooth fake progress bar
    const progTimer = setInterval(() => {
      setFakeProgress(prev => {
        const ceiling = Math.min(92, (Math.floor(prev / (100 / steps.length)) + 1) * (100 / steps.length) - 2);
        return prev < ceiling ? prev + 1 : prev;
      });
    }, 80);

    return () => { clearInterval(stepTimer); clearInterval(progTimer); };
  }, [visible]);

  // Keep activeStep in sync with real progress
  useEffect(() => {
    if (!hasRealProgress) return;
    const idx = Math.min(steps.length - 1, Math.floor((progress / 100) * steps.length));
    setActiveStep(idx);
  }, [progress]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white border border-zinc-200 shadow-xl w-full max-w-sm mx-6 p-10 animate-fade-in">
        {/* Spinner */}
        <div className="flex items-center gap-2 mb-8">
          <div className="thinking-dot" />
          <div className="thinking-dot" />
          <div className="thinking-dot" />
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          {steps.map((step, i) => {
            const done = i < activeStep;
            const active = i === activeStep;
            return (
              <div key={i} className={`flex items-start gap-3 transition-opacity duration-300 ${active ? 'opacity-100' : done ? 'opacity-30' : 'opacity-15'}`}>
                <div className="mt-0.5 w-4 h-4 shrink-0 flex items-center justify-center">
                  {done ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#18181b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-zinc-900 scale-125' : 'bg-zinc-200'} transition-all duration-300`} />
                  )}
                </div>
                <div>
                  <p className={`text-sm leading-snug ${active ? 'text-zinc-900 font-medium' : 'text-zinc-500 font-light'}`}>
                    {step.label}
                  </p>
                  {step.sublabel && active && (
                    <p className="text-xs text-zinc-400 mt-0.5">{step.sublabel}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="h-px bg-zinc-100 overflow-hidden">
          <div
            className="h-full bg-zinc-900 transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="font-mono text-[10px] tracking-widest text-zinc-300 mt-2 text-right">{pct}%</p>
      </div>
    </div>
  );
}
