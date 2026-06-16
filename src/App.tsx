import { useEffect, useState } from 'react';
import LandingPage from './pages/LandingPage';
import InputPage from './pages/InputPage';
import SimulationPage from './pages/SimulationPage';
import InsightPage from './pages/InsightPage';
import PRDPage from './pages/PRDPage';

export type Page = 'landing' | 'input' | 'simulation' | 'insights' | 'prd';

export interface FeatureConstraint {
  module: string;
  constraint: string;
}

export interface TimeConstraint {
  timeline: string;
  description: string;
}

export interface FormData {
  productName: string;
  productType: string;
  coreFunctions: string;
  featureConstraints: FeatureConstraint[];
  timeConstraints: TimeConstraint[];
  screenshots: File[];
  documents: File[];
}

export interface CardBackground {
  name: string;
  age: number;
  job: string;
  context: string;
}

export interface Card {
  persona: string;
  emotion: string;
  thought: string;
  highlight?: string;
  background?: CardBackground;
}

export type ImpactLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface InsightItem {
  rank: number;
  title: string;
  description: string;
  score: number;       // 1–10
  impact: ImpactLevel;
  valueNote: string;   // one-line reason this matters to the business
}

export interface Insights {
  frustrations: InsightItem[];
  hiddenNeeds: InsightItem[];
  decisionBarriers: InsightItem[];
  trustIssues: InsightItem[];
  opportunities: InsightItem[];
}

export interface PRDSection {
  id: number;
  problem: string;
  userStory: string;
  requirement: string;
  successMetric: string;
}

export interface PRDData {
  title: string;
  sections: PRDSection[];
}

export default function App() {
  const [page, setPage] = useState<Page>('landing');
  const [formData, setFormData] = useState<FormData>({
    productName: '',
    productType: '',
    coreFunctions: '',
    featureConstraints: [],
    timeConstraints: [],
    screenshots: [],
    documents: [],
  });
  const [cards, setCards] = useState<Card[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [prdData, setPrdData] = useState<PRDData | null>(null);

  // Restore shared insights from URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#insights=')) {
      try {
        const data = JSON.parse(atob(hash.slice(10)));
        if (data.insights && data.productName) {
          setInsights(data.insights);
          setFormData(prev => ({ ...prev, productName: data.productName }));
          setPage('insights');
          window.history.replaceState(null, '', window.location.pathname);
        }
      } catch {}
    }
  }, []);

  const navigate = (p: Page) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setPage(p), 50);
  };

  const STEPS: { page: Page; label: string; description: string }[] = [
    { page: 'input',      label: 'Input',        description: 'Describe your product'         },
    { page: 'simulation', label: 'Perspectives',  description: 'Simulate user reactions'       },
    { page: 'insights',   label: 'Insights',      description: 'Analyze patterns & friction'   },
    { page: 'prd',        label: 'PRD',           description: 'Generate requirements doc'     },
  ];

  const stepIndex = STEPS.findIndex(s => s.page === page);
  const currentStep = STEPS[stepIndex];

  const isReachable = (p: Page) =>
    p === 'input' ||
    (p === 'simulation' && cards.length > 0) ||
    (p === 'insights' && insights !== null) ||
    (p === 'prd' && prdData !== null);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-zinc-100 sticky top-0 bg-white z-10">

        {/* Top row: logo + step labels */}
        <div className="page-container flex items-center justify-between h-12">
          <button
            onClick={() => navigate('landing')}
            className="font-mono text-xs tracking-[0.15em] uppercase text-zinc-900 hover:text-zinc-500 transition-colors shrink-0"
          >
            UPS
          </button>

          {page !== 'landing' && (
            <div className="flex items-center">
              {STEPS.map((step, i) => {
                const isDone   = stepIndex > i;
                const isActive = stepIndex === i;
                const reachable = isReachable(step.page);
                return (
                  <button
                    key={step.page}
                    onClick={() => reachable && navigate(step.page)}
                    className={`flex items-center gap-0 ${reachable ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    {/* Connector line between steps */}
                    {i > 0 && (
                      <div className={`w-8 h-px mx-1 transition-colors duration-300 ${isDone ? 'bg-zinc-400' : 'bg-zinc-100'}`} />
                    )}
                    {/* Step */}
                    <div className="flex items-center gap-1.5">
                      {/* Circle indicator */}
                      <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        isActive ? 'bg-zinc-900 scale-125' :
                        isDone   ? 'bg-zinc-400' :
                                   'bg-zinc-200'
                      }`} />
                      {/* Label */}
                      <span className={`font-mono text-[10px] tracking-[0.12em] uppercase transition-colors duration-200 ${
                        isActive ? 'text-zinc-900' :
                        isDone   ? 'text-zinc-400 hover:text-zinc-700' :
                                   'text-zinc-200'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom row: segmented bar + step description */}
        {page !== 'landing' && (
          <div className="page-container pb-2">
            {/* Segmented progress bar */}
            <div className="flex gap-1 mb-1.5">
              {STEPS.map((step, i) => {
                const isDone   = stepIndex > i;
                const isActive = stepIndex === i;
                return (
                  <div key={step.page} className="flex-1 h-px bg-zinc-100 overflow-hidden">
                    <div
                      className="h-full bg-zinc-900 transition-all duration-500 ease-out"
                      style={{ width: isDone ? '100%' : isActive ? '100%' : '0%',
                               opacity: isDone ? 0.3 : isActive ? 1 : 0 }}
                    />
                  </div>
                );
              })}
            </div>
            {/* Description */}
            <div className="flex items-center justify-between">
              <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-zinc-400">
                Step {stepIndex + 1} of {STEPS.length} — {currentStep?.description}
              </p>
              {stepIndex === STEPS.length - 1 && (
                <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-zinc-300">Complete</p>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Pages */}
      <div key={page} className="animate-fade-in">
        {page === 'landing' && (
          <LandingPage onStart={() => navigate('input')} />
        )}
        {page === 'input' && (
          <InputPage
            formData={formData}
            setFormData={setFormData}
            onSubmit={() => { setCards([]); setInsights(null); setPrdData(null); navigate('simulation'); }}
          />
        )}
        {page === 'simulation' && (
          <SimulationPage
            formData={formData}
            cards={cards}
            setCards={setCards}
            onNext={() => navigate('insights')}
          />
        )}
        {page === 'insights' && (
          <InsightPage
            productName={formData.productName}
            cards={cards}
            insights={insights}
            setInsights={setInsights}
            onNext={() => navigate('prd')}
          />
        )}
        {page === 'prd' && (
          <PRDPage
            productName={formData.productName}
            insights={insights!}
            prdData={prdData}
            setPrdData={setPrdData}
          />
        )}
      </div>
    </div>
  );
}
