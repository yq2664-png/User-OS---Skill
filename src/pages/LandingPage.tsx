import Hero from '../components/Hero';

interface Props {
  onStart: () => void;
}

const STEPS = [
  {
    num: '01',
    title: 'Describe your product',
    body: 'Name, type, and core functions. Optionally upload screenshots or design docs.',
  },
  {
    num: '02',
    title: 'See user perspectives',
    body: '8 distinct user archetypes react to your product in real time — streamed as they generate.',
  },
  {
    num: '03',
    title: 'Read the insights',
    body: 'Frustrations, hidden needs, decision barriers, trust issues — ranked by impact.',
  },
  {
    num: '04',
    title: 'Export the PRD',
    body: 'A structured product requirements document tied directly to real user evidence.',
  },
];

const FEATURES = [
  {
    label: 'Perspectives',
    title: 'Think like your users',
    body: 'Simulate how different user archetypes — from early adopters to skeptics — perceive your product before a single line of code ships.',
  },
  {
    label: 'Insights',
    title: 'Surface hidden friction',
    body: "Go beyond surface-level feedback. Uncover what users want but can't articulate, and what quietly blocks them from converting.",
  },
  {
    label: 'PRD',
    title: 'Requirements from evidence',
    body: 'Skip the guesswork. Every requirement traces back to a real user need identified in the research.',
  },
];

export default function LandingPage({ onStart }: Props) {
  return (
    <main>

      <Hero onStart={onStart} />

      {/* ── How it works ──────────────────────────────────────── */}
      <section style={{ background: '#F7F5EF' }}>
        <div className="page-container pt-6 pb-10 sm:pt-7 sm:pb-12">
          <p className="section-title">How it works</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {STEPS.map((step) => (
              <div key={step.num} className="p-8 rounded-2xl" style={{ background: '#FDFCF9' }}>
                <span
                  className="font-semibold block mb-6 leading-none select-none"
                  style={{ fontSize: '3rem', color: '#D2D2D7' }}
                >
                  {step.num}
                </span>
                <p className="text-sm font-semibold text-[#1D1D1F] mb-2">{step.title}</p>
                <p className="text-sm text-[#6E6E73] leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="page-container pt-6 pb-10 sm:pt-7 sm:pb-12">
        <p className="section-title">What you get</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {FEATURES.map((f) => (
            <div key={f.label} className="p-8 rounded-2xl" style={{ background: '#F7F5EF' }}>
              <span className="label-tag block mb-5">{f.label}</span>
              <p className="text-xl font-semibold text-[#1D1D1F] mb-3 leading-snug">{f.title}</p>
              <p className="text-sm text-[#6E6E73] leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────── */}
      <section style={{ background: '#F7F5EF' }}>
        <div className="page-container py-16 sm:py-24 text-center">
          <h2
            className="font-semibold text-[#1D1D1F] mb-6"
            style={{ fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: '1.06', letterSpacing: '-0.3px' }}
          >
            Ready to see your product<br />through user eyes?
          </h2>
          <button onClick={onStart} className="btn-vintage-ghost">
            Start here
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </section>

    </main>
  );
}
