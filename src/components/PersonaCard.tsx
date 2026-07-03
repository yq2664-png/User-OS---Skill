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
  const opacity  = isHovered ? 0.9 : isCycling ? 0.95 : isAnyActive ? 0.4 : 0.85;
  const brightness = isHovered ? 0.96 : 1;
  const yLift    = isHovered ? -14 : isCycling ? -8 : 0;
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
        animate={{ rotate: rot, scale, opacity, y: yLift, filter: `brightness(${brightness})` }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        onHoverStart={() => onHover(persona.id)}
        onHoverEnd={() => onHover(null)}
        style={{
          width: cardSize,
          height: cardSize,
          cursor: 'default',
          position: 'relative',
          willChange: 'transform',
        }}
      >
        <img
          src={persona.image}
          alt={persona.name}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
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
