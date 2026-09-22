import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X } from 'lucide-react';

interface CartoonDinosOverlayProps {
  active: boolean;
  onClose: () => void;
}

interface DinoItem {
  id: number;
  emoji: string;
  name: string;
  color: string;
  startY: number;
  duration: number;
  delay: number;
  size: number;
  direction: 'left-to-right' | 'right-to-left';
}

const DINO_TYPES = [
  { emoji: '🦖', name: 'Rexy le T-Rex', color: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' },
  { emoji: '🦕', name: 'Brachio le doux', color: 'bg-blue-500/20 border-blue-500/50 text-blue-300' },
  { emoji: '🐉', name: 'Drago le dragon', color: 'bg-purple-500/20 border-purple-500/50 text-purple-300' },
  { emoji: '🦖', name: 'Kiki le Raptor', color: 'bg-amber-500/20 border-amber-500/50 text-amber-300' },
  { emoji: '🦕', name: 'Tricera', color: 'bg-rose-500/20 border-rose-500/50 text-rose-300' },
];

export function CartoonDinosOverlay({ active, onClose }: CartoonDinosOverlayProps) {
  const [dinos, setDinos] = useState<DinoItem[]>([]);

  useEffect(() => {
    if (active) {
      const generated: DinoItem[] = [];
      for (let i = 0; i < 18; i++) {
        const type = DINO_TYPES[Math.floor(Math.random() * DINO_TYPES.length)];
        generated.push({
          id: i,
          emoji: type.emoji,
          name: type.name,
          color: type.color,
          startY: 10 + Math.random() * 75, // percentage from top
          duration: 4 + Math.random() * 4, // 4 to 8 seconds
          delay: Math.random() * 1.5,
          size: 40 + Math.floor(Math.random() * 32),
          direction: i % 2 === 0 ? 'left-to-right' : 'right-to-left',
        });
      }
      setDinos(generated);

      const timer = setTimeout(() => {
        onClose();
      }, 7500);

      return () => clearTimeout(timer);
    }
  }, [active, onClose]);

  if (!active) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden flex flex-col justify-between p-6">
        {/* Top celebratory banner */}
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30 }}
          className="self-center pointer-events-auto bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white px-6 py-3 rounded-2xl shadow-2xl border border-emerald-400/40 flex items-center gap-3 backdrop-blur-md"
        >
          <span className="text-2xl animate-bounce">🦖</span>
          <div>
            <div className="font-bold text-sm sm:text-base flex items-center gap-1.5">
              <span>Mot "Rax" détecté ! Invasion de dinosaures !</span>
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            </div>
            <div className="text-xs text-emerald-100 opacity-90">
              Le créateur le vrai Rax libère la ménagerie jurassique cartoon !
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Floating Dinos across screen */}
        <div className="absolute inset-0 pointer-events-none">
          {dinos.map((dino) => {
            const isLTR = dino.direction === 'left-to-right';
            return (
              <motion.div
                key={dino.id}
                initial={{
                  x: isLTR ? -120 : window.innerWidth + 120,
                  y: `${dino.startY}%`,
                  scale: 0.5,
                  rotate: isLTR ? -15 : 15,
                }}
                animate={{
                  x: isLTR ? window.innerWidth + 120 : -120,
                  y: [`${dino.startY}%`, `${dino.startY + (Math.random() * 10 - 5)}%`, `${dino.startY}%`],
                  scale: [0.8, 1.2, 1],
                  rotate: isLTR ? [ -10, 10, -5 ] : [ 10, -10, 5 ],
                }}
                transition={{
                  duration: dino.duration,
                  delay: dino.delay,
                  ease: 'easeInOut',
                  repeat: 0,
                }}
                className="absolute flex items-center gap-2 pointer-events-auto cursor-pointer group"
                style={{ fontSize: `${dino.size}px` }}
              >
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-lg backdrop-blur-sm bg-[#1e1f20]/90 ${dino.color} transition-transform hover:scale-125`}>
                  <span className="animate-bounce" style={{ animationDuration: `${0.8 + Math.random()}s` }}>
                    {dino.emoji}
                  </span>
                  <span className="text-xs font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {dino.name}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AnimatePresence>
  );
}
