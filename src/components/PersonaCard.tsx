import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Persona } from '../data/personas';
import PersonaInfoBubble from './PersonaInfoBubble';
import PersonaThoughtBubble from './PersonaThoughtBubble';

interface Props {
  persona: Persona;
  cardSize: number;
  rotation: number;
  offsetY: number;
  offsetX: number | string;
  zIndex: number;
  enterDelay: number;
  isAnyActive: boolean;
  isHovered: boolean;
  isCycling: boolean;
  onHover: (id: string | null) => void;
}

export default function PersonaCard({
  persona,
  cardSize,
  rotation,
  offsetY,
  offsetX,
  zIndex,
  enterDelay,
  isAnyActive,
  isHovered,
  isCycling,
  onHover,
}: Props) {
  const [thoughtIdx] = useState(() => Math.floor(Math.random() * persona.thoughts.length));

  const isActive = isHovered || isCycling;
  // Straighten the active card (hover OR auto-cycle) so the png is upright
  // and the bubbles line up with its centre.
  const rot      = isActive ? 0 : rotation;
  const scale    = isHovered ? 1.06 : isCycling ? 1.04 : isAnyActive ? 0.95 : 1;
  const opacity  = isAnyActive && !isActive ? 0.45 : 1;
  const yLift    = isHovered ? -14 : isCycling ? -8 : 0;
  const shadow   = isHovered
    ? '0 28px 64px rgba(0,0,0,0.18), 0 6px 20px rgba(0,0,0,0.10)'
    : '0 8px 28px rgba(0,0,0,0.09), 0 2px 6px rgba(0,0,0,0.05)';
  const z = isActive ? 50 : zIndex;

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: offsetX,
        top: offsetY,
        width: cardSize,        // fixed width so % children center on the card
        zIndex: z,
        originX: '50%',
        originY: '100%',
      }}
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: enterDelay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Info bubble — only on manual hover */}
      {isHovered && <PersonaInfoBubble persona={persona} />}

      <motion.div
        animate={{ rotate: rot, scale, opacity, y: yLift, boxShadow: shadow }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        onHoverStart={() => onHover(persona.id)}
        onHoverEnd={() => onHover(null)}
        style={{
          width: cardSize,
          height: cardSize,
          borderRadius: 22,
          overflow: 'hidden',
          cursor: 'default',
          border: '1px solid rgba(255,255,255,0.75)',
          position: 'relative',
          willChange: 'transform',
        }}
      >
        <img
          src={persona.image}
          alt={persona.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          draggable={false}
        />
      </motion.div>

      {/* Thought bubble — on hover OR auto-cycle */}
      {isActive && (
        <PersonaThoughtBubble thought={persona.thoughts[thoughtIdx]} key={persona.id} />
      )}
    </motion.div>
  );
}
