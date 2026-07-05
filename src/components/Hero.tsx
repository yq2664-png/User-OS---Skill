import HeroPersonaCluster from './HeroPersonaCluster';

interface Props {
  onStart: () => void;
}

export default function Hero({ onStart }: Props) {
  return (
    <section style={{
      maxWidth: 1200,
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      padding: '28px 64px 24px',   // 64px matches the nav (page-container px-16)
      gap: 0,
    }}>
      {/* Eyebrow */}
      <p style={{
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: '#8E8E93',
        marginBottom: 18,
      }}>
        User Perspective Simulator
      </p>

      {/* Headline */}
      <h1 style={{
        fontSize: 'clamp(38px, 4vw, 54px)',
        fontWeight: 700,
        color: '#1D1D1F',
        lineHeight: 1.05,
        letterSpacing: '-1.4px',
        margin: '0 0 104px',
        maxWidth: 720,
      }}>
        Discover what users need<br />before they tell you.
      </h1>

      {/* Persona cluster — spans full content width, aligned with the nav.
          Extra top room so hover info bubbles don't reach the headline. */}
      <div style={{ width: 'calc(100% + 120px)', marginLeft: -60, marginRight: -60, marginBottom: 48 }}>
        <HeroPersonaCluster />
      </div>

      {/* Description — single line */}
      <p style={{
        fontSize: 16,
        fontWeight: 400,
        color: '#6E6E73',
        lineHeight: 1.5,
        margin: '0 0 26px',
        maxWidth: 'none',
        whiteSpace: 'nowrap',
      }}>
        Paste in a product description. Get AI-generated user perspectives and behavioral insights — grounded in how real people think.
      </p>

      {/* CTA */}
      <button
        onClick={onStart}
        style={{
          height: 52,
          padding: '0 32px',
          background: '#0071E3',
          color: 'white',
          borderRadius: 9999,
          border: 'none',
          fontSize: 16,
          fontWeight: 500,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          transition: 'background 0.16s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#0077ED')}
        onMouseLeave={e => (e.currentTarget.style.background = '#0071E3')}
      >
        Start for free
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </section>
  );
}
