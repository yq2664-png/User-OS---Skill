import { useEffect, useState } from 'react';
import { decodeShare } from './utils/shareLink';
import LandingPage from './pages/LandingPage';
import InputPage from './pages/InputPage';
import SimulationPage from './pages/SimulationPage';
import InsightPage from './pages/InsightPage';
import PRDPage from './pages/PRDPage';

export type Page = 'landing' | 'input' | 'simulation' | 'insights' | 'prd';
export type ProductStage = 'unpublished' | 'web' | 'client';

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
  productStage: ProductStage | '';
  productType: string;
  coreFunctions: string;
  webLink: string;
  requirements: string;
  featureConstraints: FeatureConstraint[];
  timeConstraints: TimeConstraint[];
  screenshots: File[];
  documents: File[];
}

export interface Card {
  perspective: string;   // motivation-based label e.g. "Looking for Simplicity"
  driver: string;        // what the user is trying to achieve
  thought: string;       // first-person reaction
  highlight?: string;
  worry?: string;        // what they're afraid of
  assumption?: string;   // underlying belief driving their behavior
}

export interface RealCard {
  source: string;
  sourceUrl?: string;
  persona: string;
  quote: string;
  highlight?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export type ImpactLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type EffortLevel = 'High' | 'Medium' | 'Low';

export interface InsightItem {
  rank: number;
  title: string;
  observation: string;
  interpretation: string;
  behavioralInsight: string;
  score: number;
  impact: ImpactLevel;
  valueNote: string;
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
  name: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  impact: 'High' | 'Medium' | 'Low';
  confidence: number;   // 0–100
  effort: EffortLevel;
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
    productStage: '',
    productType: '',
    coreFunctions: '',
    webLink: '',
    requirements: '',
    featureConstraints: [],
    timeConstraints: [],
    screenshots: [],
    documents: [],
  });
  const [cards, setCards] = useState<Card[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [prdData, setPrdData] = useState<PRDData | null>(null);

  // Restore shared data from URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#insights=')) {
      try {
        const data = decodeShare<{ insights: Insights; productName: string }>(hash.slice(10));
        if (data.insights && data.productName) {
          setInsights(data.insights);
          setFormData(prev => ({ ...prev, productName: data.productName }));
          setPage('insights');
          window.history.replaceState(null, '', window.location.pathname);
        }
      } catch {}
    } else if (hash.startsWith('#prd=')) {
      try {
        const data = decodeShare<{ prdData: PRDData; productName: string }>(hash.slice(5));
        if (data.prdData && data.productName) {
          setPrdData(data.prdData);
          setFormData(prev => ({ ...prev, productName: data.productName }));
          setPage('prd');
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
    { page: 'prd',        label: 'Decision',      description: 'Recommend product decisions'   },
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
      <nav className="sticky top-0 z-10 bg-white" style={{ borderBottom: '1px solid #D2D2D7' }}>
        {page === 'landing' ? (
          /* Landing: just the logo */
          <div className="page-container flex items-center h-11">
            <button
              onClick={() => navigate('landing')}
              className="text-xs font-semibold tracking-[0.12em] uppercase text-[#1D1D1F] transition-colors"
              style={{ transition: 'color 0.24s cubic-bezier(0.4,0,0.6,1)' }}
            >
              User OS
            </button>
          </div>
        ) : (
          /* Steps nav */
          <div className="page-container py-2">
            <div className="flex items-stretch">
              {/* Logo */}
              <button
                onClick={() => navigate('landing')}
                className="text-xs font-semibold tracking-[0.12em] uppercase text-[#1D1D1F] pr-6 flex items-center"
                style={{ borderRight: '1px solid #D2D2D7' }}
              >
                User OS
              </button>

              {/* Steps — each takes equal flex width, with bar below label */}
              <div className="flex flex-1 pl-4">
                {STEPS.map((step, i) => {
                  const isDone    = stepIndex > i;
                  const isActive  = stepIndex === i;
                  const reachable = isReachable(step.page);
                  return (
                    <button
                      key={step.page}
                      onClick={() => reachable && navigate(step.page)}
                      className={`flex-1 flex flex-col gap-1.5 py-1 ${reachable ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      {/* Label row */}
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                          background: isActive ? '#0071E3' : isDone ? '#6E6E73' : '#D2D2D7',
                        }} />
                        <span
                          className="text-[11px] font-medium"
                          style={{
                            color: isActive ? '#0071E3' : isDone ? '#1D1D1F' : '#D2D2D7',
                            transition: 'color 0.24s cubic-bezier(0.4,0,0.6,1)',
                          }}
                        >
                          {step.label}
                        </span>
                      </div>
                      {/* Bar — full width of this flex cell */}
                      <div className="h-px w-full overflow-hidden" style={{ background: '#F5F5F7' }}>
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width:      isDone || isActive ? '100%' : '0%',
                            background: isActive ? '#0071E3' : '#6E6E73',
                            opacity:    isDone ? 0.4 : isActive ? 1 : 0,
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
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
            onGoLanding={() => navigate('landing')}
            onNewProduct={() => { setCards([]); setInsights(null); setPrdData(null); navigate('input'); }}
          />
        )}
      </div>
    </div>
  );
}
