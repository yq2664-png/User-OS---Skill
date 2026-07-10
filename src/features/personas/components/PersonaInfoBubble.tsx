import { motion } from 'framer-motion';
import type { Persona } from '../data/personas';

export default function PersonaInfoBubble({ persona }: { persona: Persona }) {
  return (
    // Static positioning wrapper — centered on the card. framer-motion controls
    // `transform` on the inner element, so centering must live out here.
    <div style={{
      position: 'absolute',
      bottom: 'calc(100% + 14px)',
      left: '50%',
      transform: 'translateX(-50%)',
      pointerEvents: 'none',
      zIndex: 100,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          position: 'relative',
          background: 'white',
          borderRadius: 14,
          padding: '9px 14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.11), 0 2px 8px rgba(0,0,0,0.06)',
          whiteSpace: 'nowrap',
          width: 192,
          boxSizing: 'border-box',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 12, fontWeight: 600, color: '#1D1D1F', lineHeight: 1.3, marginBottom: 2 }}>
          {persona.name}, {persona.age}
        </p>
        <p style={{ fontSize: 10, color: '#6E6E73', lineHeight: 1.45 }}>{persona.occupation}</p>
        <p style={{ fontSize: 10, color: '#6E6E73', lineHeight: 1.45 }}>{persona.city}</p>
        <p style={{ fontSize: 9, color: '#2E6E4E', fontWeight: 600, marginTop: 5, lineHeight: 1, letterSpacing: '0.02em' }}>
          {persona.personality}
        </p>
        {/* Arrow tail */}
        <div style={{
          position: 'absolute',
          bottom: -6,
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          width: 12,
          height: 12,
          background: 'white',
          boxShadow: '2px 2px 4px rgba(0,0,0,0.05)',
          borderRadius: 2,
        }} />
      </motion.div>
    </div>
  );
}
