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
    body: 'Go beyond surface-level feedback. Uncover what users want but can\'t articulate, and what quietly blocks them from converting.',
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

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="page-container pt-20 pb-16 sm:pt-28 sm:pb-20 border-b border-zinc-100">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light text-zinc-900 leading-[1.05] tracking-tight max-w-4xl mb-8">
          Know what your users<br />
          actually think.
        </h1>
        <p className="text-zinc-400 text-lg font-light max-w-xl leading-relaxed mb-14">
          Paste in a product description. Get AI-generated user perspectives,
          behavioral insights, and a PRD — grounded in how real people think.
        </p>
        <button
          onClick={onStart}
          className="inline-flex items-center gap-3 bg-zinc-900 text-white px-8 py-4 text-sm font-medium hover:bg-zinc-700 transition-colors duration-150"
        >
          Start here
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="page-container py-14 sm:py-20 border-b border-zinc-100">
        <p className="section-title">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px border border-zinc-100">
          {STEPS.map((step) => (
            <div key={step.num} className="bg-white p-8 lg:p-10">
              <span
                className="font-mono font-semibold text-zinc-100 block mb-6 leading-none select-none"
                style={{ fontSize: '3rem' }}
              >
                {step.num}
              </span>
              <p className="text-sm font-medium text-zinc-900 mb-2">{step.title}</p>
              <p className="text-sm text-zinc-400 font-light leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="page-container py-14 sm:py-20 border-b border-zinc-100">
        <p className="section-title">What you get</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px border border-zinc-100">
          {FEATURES.map((f) => (
            <div key={f.label} className="bg-white p-8 lg:p-10">
              <span className="label-tag block mb-6">{f.label}</span>
              <p className="text-xl font-light text-zinc-900 mb-3 leading-snug">{f.title}</p>
              <p className="text-sm text-zinc-400 font-light leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────── */}
      <section className="page-container py-14 sm:py-20">
        <div className="max-w-xl">
          <h2 className="text-3xl sm:text-4xl font-light text-zinc-900 leading-tight mb-6">
            Ready to see your product<br />through user eyes?
          </h2>
          <button
            onClick={onStart}
            className="inline-flex items-center gap-3 bg-zinc-900 text-white px-8 py-4 text-sm font-medium hover:bg-zinc-700 transition-colors duration-150"
          >
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
