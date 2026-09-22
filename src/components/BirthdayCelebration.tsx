import { useEffect, useState } from 'react';
import { Sparkles, PartyPopper, Heart } from 'lucide-react';

interface BirthdayCelebrationProps {
  forceShow?: boolean;
}

export function BirthdayCelebration({ forceShow = false }: BirthdayCelebrationProps) {
  const [isBirthday, setIsBirthday] = useState(false);

  useEffect(() => {
    if (forceShow || localStorage.getItem('nexus_force_birthday') === 'true') {
      setIsBirthday(true);
      return;
    }
    const now = new Date();
    // January 22nd check (Month 0 is January, day 22)
    if (now.getMonth() === 0 && now.getDate() === 22) {
      setIsBirthday(true);
    }
  }, [forceShow]);

  if (!isBirthday && !forceShow) return null;

  return (
    <div className="bg-gradient-to-r from-purple-950 via-amber-950 to-pink-950 border-b border-amber-500/50 py-2.5 px-4 text-center relative overflow-hidden z-40 animate-fade-in shadow-lg">
      {/* Floating balloons background effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 flex justify-around items-center text-xl">
        <span className="animate-bounce">🎈</span>
        <span className="animate-pulse delay-100">🎉</span>
        <span className="animate-bounce delay-200">🎂</span>
        <span className="animate-pulse delay-350">✨</span>
        <span className="animate-bounce delay-500">🎁</span>
        <span className="animate-pulse delay-700">🎈</span>
      </div>

      <div className="relative z-10 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-amber-200">
        <PartyPopper className="w-4 h-4 text-amber-400 animate-bounce" />
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-pink-200 to-yellow-300">
          🎉 Bon anniversaire mon créateur ! Joyeux anniversaire Rax ! 🎂✨
        </span>
        <Heart className="w-4 h-4 text-pink-400 fill-pink-400 animate-pulse" />
      </div>
    </div>
  );
}
