import { useState, useEffect, useRef } from 'react';
import { motion, useAnimationFrame, useMotionValue, useTransform } from 'framer-motion';
import { PERSONAS } from '../data/personas';
import PersonaCard from './PersonaCard';

const CARD = 224;

// Shallow, wide fan. offsetX is computed as a percentage so the cluster
// fills its parent width (aligned with the nav content edges).
// Vertical arc kept shallow to minimise height.
// Symmetric, shallow arc — keeps the outer cards from dipping too low so their
// downward thought bubbles don't reach the description below.
const LAYOUT = [
  { offsetY: 18, rotation: -15, zIndex: 1 },
  { offsetY: 6,  rotation: -9,  zIndex: 2 },
  { offsetY: 0,  rotation: -3,  zIndex: 4 },
  { offsetY: 0,  rotation: 3,   zIndex: 4 },
  { offsetY: 6,  rotation: 9,   zIndex: 2 },
  { offsetY: 18, rotation: 15,  zIndex: 1 },
];

function FloatWrapper({ children }: { children: React.ReactNode }) {
  const t = useMotionValue(0);
  const y = useTransform(t, (v) => Math.sin(v * 0.00065) * 7);
  useAnimationFrame((time) => t.set(time));
  return <motion.div style={{ y, position: 'relative', width: '100%', height: '100%' }}>{children}</motion.div>;
}

export default function HeroPersonaCluster() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [cycleId, setCycleId] = useState<string | null>(null);
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const thoughtIdxRef = useRef<Record<string, number>>({});

  useEffect(() => {
    PERSONAS.forEach(p => {
      thoughtIdxRef.current[p.id] = Math.floor(Math.random() * p.thoughts.length);
    });
  }, []);

  useEffect(() => {
    if (hoveredId !== null) {
      setCycleId(null);
      if (cycleRef.current) clearInterval(cycleRef.current);
      return;
    }
    const nextRandom = () => {
      const idx = Math.floor(Math.random() * PERSONAS.length);
      setCycleId(PERSONAS[idx].id);
    };
    const timeout = setTimeout(() => {
      nextRandom();
      cycleRef.current = setInterval(nextRandom, 2800);
    }, 1200);
    return () => {
      clearTimeout(timeout);
      if (cycleRef.current) clearInterval(cycleRef.current);
    };
  }, [hoveredId]);

  const anyActive = hoveredId !== null || cycleId !== null;
  const n = PERSONAS.length;

  return (
    <div style={{ position: 'relative', width: '100%', height: 248 }}>
      <FloatWrapper>
        {PERSONAS.map((persona, i) => {
          const layout = LAYOUT[i];
          // Spread cards from left edge (0) to right edge (100% - CARD)
          const left = `calc((100% - ${CARD}px) * ${i / (n - 1)})`;
          return (
            <PersonaCard
              key={persona.id}
              persona={persona}
              cardSize={CARD}
              rotation={layout.rotation}
              offsetY={layout.offsetY}
              offsetX={left}
              zIndex={layout.zIndex}
              enterDelay={0.08 + i * 0.065}
              isAnyActive={anyActive}
              isHovered={hoveredId === persona.id}
              isCycling={cycleId === persona.id && hoveredId === null}
              onHover={setHoveredId}
            />
          );
        })}
      </FloatWrapper>
    </div>
  );
}
