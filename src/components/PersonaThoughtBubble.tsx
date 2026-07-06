import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  thought: string;
}

export default function PersonaThoughtBubble({ thought }: Props) {
  return (
    // Static positioning wrapper — centered on the card. framer-motion controls
    // `transform` on the inner element, so centering must live out here.
    <div style={{
      position: 'absolute',
      top: 'calc(100% - 34px)',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 192,
      pointerEvents: 'none',
      zIndex: 100,
    }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={thought}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, delay: 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            position: 'relative',
            background: 'white',
            borderRadius: 12,
            padding: '8px 12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)',
          }}
        >
          {/* Arrow tail */}
          <div style={{
            position: 'absolute',
            top: -6,
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 12,
            height: 12,
            background: 'white',
            boxShadow: '-2px -2px 4px rgba(0,0,0,0.04)',
            borderRadius: 2,
          }} />
          <p style={{
            fontSize: 11,
            color: '#3A3A3C',
            lineHeight: 1.5,
            fontStyle: 'italic',
            margin: 0,
            textAlign: 'center',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            "{thought}"
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
