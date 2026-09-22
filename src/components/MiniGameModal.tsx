import { useState, useEffect, useRef } from 'react';
import { X, Trophy, Sparkles, RefreshCw, Zap, Flame, Target } from 'lucide-react';

interface MiniGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEarnCoins: (amount: number) => void;
}

export function MiniGameModal({ isOpen, onClose, onEarnCoins }: MiniGameModalProps) {
  const [gameMode, setGameMode] = useState<'menu' | 'clicker' | 'trivia' | 'hardest'>('menu');
  
  // Clicker game state
  const [clicks, setClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [isPlayingClicker, setIsPlayingClicker] = useState(false);
  const [clickerReward, setClickerReward] = useState(0);
  const [clickerFailed, setClickerFailed] = useState(false);

  // Trivia game state
  const [questionIndex, setQuestionIndex] = useState(0);
  const [triviaScore, setTriviaScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);

  // Hardest game state (Extrême Dur - Le jeu le plus dur du monde)
  const [hardestTimeLeft, setHardestTimeLeft] = useState(10);
  const [isPlayingHardest, setIsPlayingHardest] = useState(false);
  const [hardestScore, setHardestScore] = useState(0);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const [hardestWon, setHardestWon] = useState(false);
  const [hardestFailed, setHardestFailed] = useState(false);

  const clickerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hardestTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hardestMoveRef = useRef<NodeJS.Timeout | null>(null);

  const triviaQuestions = [
    {
      question: "Quel animal préhistorique fait danser Nexus ?",
      options: ["Le T-Rex (Rax)", "Le chat", "Le pigeon", "La licorne"],
      correct: 0,
    },
    {
      question: "Combien font 7 x 8 ?",
      options: ["54", "56", "64", "49"],
      correct: 1,
    },
    {
      question: "Qui est le créateur officiel de Nexus ?",
      options: ["Elon Musk", "Le vrai Rax", "Bill Gates", "Einstein"],
      correct: 1,
    },
  ];

  // Clicker Timer effect (guaranteed to countdown smoothly even during clicks)
  useEffect(() => {
    if (isPlayingClicker) {
      clickerTimerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (clickerTimerRef.current) clearInterval(clickerTimerRef.current);
            setIsPlayingClicker(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (clickerTimerRef.current) clearInterval(clickerTimerRef.current);
    };
  }, [isPlayingClicker]);

  // Handle clicker end when timeLeft hits 0
  useEffect(() => {
    if (!isPlayingClicker && timeLeft === 0 && gameMode === 'clicker') {
      // Required at least 15 clicks to win!
      if (clicks >= 15) {
        const earned = Math.floor(clicks / 2) + 5;
        setClickerReward(earned);
        setClickerFailed(false);
        onEarnCoins(earned);
      } else {
        setClickerReward(0);
        setClickerFailed(true);
        // 0 coins when player loses!
      }
    }
  }, [isPlayingClicker, timeLeft, clicks, gameMode, onEarnCoins]);

  // Hardest game timer & ultra-fast target movement (Extrême Dur)
  useEffect(() => {
    if (isPlayingHardest && hardestTimeLeft > 0 && !hardestWon && !hardestFailed) {
      hardestTimerRef.current = setInterval(() => {
        setHardestTimeLeft((prev) => {
          if (prev <= 1) {
            if (hardestTimerRef.current) clearInterval(hardestTimerRef.current);
            if (hardestMoveRef.current) clearInterval(hardestMoveRef.current);
            setIsPlayingHardest(false);
            // Check if reached required score of 18
            setHardestScore((currentScore) => {
              if (currentScore >= 18) {
                setHardestWon(true);
                onEarnCoins(500); // 500 coins jackpot!
              } else {
                setHardestFailed(true);
                // 0 coins when player loses!
              }
              return currentScore;
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Super fast movement every 380ms for extreme difficulty
      hardestMoveRef.current = setInterval(() => {
        setTargetPos({
          x: Math.floor(Math.random() * 80) + 10,
          y: Math.floor(Math.random() * 75) + 15,
        });
      }, 380);
    }
    return () => {
      if (hardestTimerRef.current) clearInterval(hardestTimerRef.current);
      if (hardestMoveRef.current) clearInterval(hardestMoveRef.current);
    };
  }, [isPlayingHardest, hardestTimeLeft, hardestWon, hardestFailed, onEarnCoins]);

  const startClicker = () => {
    setClicks(0);
    setTimeLeft(5);
    setClickerReward(0);
    setClickerFailed(false);
    setIsPlayingClicker(true);
  };

  const startHardestGame = () => {
    setHardestTimeLeft(10);
    setHardestScore(0);
    setHardestWon(false);
    setHardestFailed(false);
    setIsPlayingHardest(true);
    setTargetPos({ x: 50, y: 50 });
  };

  const handleTargetClick = () => {
    if (!isPlayingHardest || hardestWon || hardestFailed) return;
    setHardestScore((s) => {
      const next = s + 1;
      if (next >= 18) {
        if (hardestTimerRef.current) clearInterval(hardestTimerRef.current);
        if (hardestMoveRef.current) clearInterval(hardestMoveRef.current);
        setIsPlayingHardest(false);
        setHardestWon(true);
        onEarnCoins(500); // 500 coins jackpot!
      }
      return next;
    });
    setTargetPos({
      x: Math.floor(Math.random() * 80) + 10,
      y: Math.floor(Math.random() * 75) + 15,
    });
  };

  const handleTriviaAnswer = (index: number) => {
    setSelectedAnswer(index);
    const correct = triviaQuestions[questionIndex].correct === index;
    setIsAnswerCorrect(correct);
    let updatedScore = triviaScore;
    if (correct) {
      updatedScore = triviaScore + 1;
      setTriviaScore(updatedScore);
    }

    setTimeout(() => {
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
      if (questionIndex + 1 < triviaQuestions.length) {
        setQuestionIndex((prev) => prev + 1);
      } else {
        // Require at least 2 correct answers out of 3 to earn coins
        const finalCorrectCount = updatedScore;
        const reward = finalCorrectCount >= 2 ? finalCorrectCount * 5 : 0;
        if (reward > 0) {
          onEarnCoins(reward);
        }
        setGameMode('menu');
        setQuestionIndex(0);
        setTriviaScore(0);
      }
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#1e1f20] border border-[#333538] rounded-3xl w-full max-w-md p-6 text-[#e3e3e3] shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#8e918f] hover:text-white hover:bg-[#282a2c] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Mini-Jeux Nexus</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h2>
            <p className="text-xs text-[#9aa0a6]">Jouez et réussissez pour gagner des pièces 🪙 !</p>
          </div>
        </div>

        {gameMode === 'menu' && (
          <div className="space-y-3">
            {/* The Hardest Game in the World (Extrême Dur) */}
            <button
              type="button"
              onClick={() => {
                setGameMode('hardest');
                startHardestGame();
              }}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-red-950/60 to-[#131314] hover:from-red-950 hover:to-[#282a2c] border border-red-600/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-950 text-red-400 border border-red-800/60 animate-pulse">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-white group-hover:text-red-300 flex items-center gap-2 transition-colors">
                    <span>Le jeu le plus dur du monde</span>
                    <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-extrabold uppercase">Extrême Dur</span>
                  </div>
                  <div className="text-xs text-[#9aa0a6]">18 cibles ultra-rapides en 10s (0 pièce si échec)</div>
                </div>
              </div>
              <span className="text-xs font-extrabold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-600/60 shadow">
                500 🪙 🔥
              </span>
            </button>

            {/* Click-Chrono */}
            <button
              type="button"
              onClick={() => {
                setGameMode('clicker');
                startClicker();
              }}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#131314] hover:bg-[#282a2c] border border-[#333538] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-950/50 text-cyan-400 border border-cyan-800/40">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                    Clic-Chrono (Frénésie)
                  </div>
                  <div className="text-xs text-[#9aa0a6]">15 clics en 5s minimum (0 pièce si échec)</div>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-800/50">
                + de 10 🪙
              </span>
            </button>

            {/* Quiz */}
            <button
              type="button"
              onClick={() => {
                setGameMode('trivia');
                setQuestionIndex(0);
                setTriviaScore(0);
              }}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#131314] hover:bg-[#282a2c] border border-[#333538] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-950/50 text-purple-400 border border-purple-800/40">
                  <Trophy className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                    Quiz Nexus & Rax
                  </div>
                  <div className="text-xs text-[#9aa0a6]">2/3 bonnes réponses requises</div>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-800/50">
                + de 10 🪙
              </span>
            </button>
          </div>
        )}

        {gameMode === 'hardest' && (
          <div className="text-center py-4 space-y-4">
            <div className="flex justify-between items-center bg-[#131314] px-4 py-2 rounded-xl border border-[#333538] text-xs">
              <span>Temps : <strong className="text-red-400">{hardestTimeLeft}s</strong></span>
              <span>Cibles : <strong className="text-amber-400">{hardestScore} / 18</strong></span>
            </div>

            {isPlayingHardest && !hardestWon && !hardestFailed ? (
              <div className="relative w-full h-72 bg-[#131314] border-2 border-red-500/60 rounded-2xl overflow-hidden cursor-crosshair shadow-inner">
                <div className="absolute inset-0 flex items-center justify-center opacity-10 text-xs text-red-500 pointer-events-none font-black tracking-widest uppercase">
                  EXTRÊME DUR - 18 CIBLES
                </div>
                <button
                  type="button"
                  onClick={handleTargetClick}
                  style={{ top: `${targetPos.y}%`, left: `${targetPos.x}%` }}
                  className="absolute w-12 h-12 -ml-6 -mt-6 rounded-full bg-gradient-to-r from-red-600 via-purple-600 to-amber-500 text-white flex items-center justify-center shadow-2xl shadow-red-600 hover:scale-125 active:scale-90 transition-transform animate-spin"
                  title="Clique vite sur la cible !"
                >
                  <Target className="w-6 h-6 animate-pulse" />
                </button>
              </div>
            ) : hardestWon ? (
              <div className="space-y-4 py-6 bg-amber-950/40 border border-amber-500/60 rounded-2xl p-4 animate-in fade-in">
                <div className="text-2xl font-black text-amber-400 flex items-center justify-center gap-2">
                  🏆 EXPLOIT EXTRÊME ! VICTOIRE ! 🏆
                </div>
                <p className="text-xs text-white leading-relaxed">
                  Incroyable ! Vous avez triomphé du mode Extrême Dur ! Vous remportez le jackpot de <strong className="text-amber-400 text-base">500 pièces 🪙</strong> !
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={startHardestGame}
                    className="flex-1 bg-[#282a2c] hover:bg-[#333538] text-white py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Rejouer
                  </button>
                  <button
                    type="button"
                    onClick={() => setGameMode('menu')}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-black font-bold py-2.5 rounded-xl text-xs"
                  >
                    Menu des jeux
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-6 bg-[#131314] border border-red-500/40 rounded-2xl p-4 animate-in fade-in">
                <div className="text-base font-bold text-red-400">
                  ❌ ÉCHEC ! Mode Extrême Dur non validé
                </div>
                <p className="text-xs text-[#9aa0a6] leading-relaxed">
                  Vous n'avez pas atteint les 18 cibles à temps ({hardestScore}/18). <strong>0 pièce gagnée.</strong> Retentez votre chance !
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={startHardestGame}
                    className="flex-1 bg-[#282a2c] hover:bg-[#333538] text-white py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Réessayer
                  </button>
                  <button
                    type="button"
                    onClick={() => setGameMode('menu')}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2.5 rounded-xl text-xs font-medium"
                  >
                    Menu des jeux
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {gameMode === 'clicker' && (
          <div className="text-center py-6 space-y-6">
            <div className="flex justify-between items-center bg-[#131314] px-4 py-2 rounded-xl border border-[#333538]">
              <span className="text-xs text-[#9aa0a6]">Temps restant : <strong className="text-white">{timeLeft}s</strong></span>
              <span className="text-xs text-[#9aa0a6]">Clics : <strong className="text-cyan-400 text-base">{clicks} / 15</strong></span>
            </div>

            {isPlayingClicker ? (
              <button
                type="button"
                onClick={() => setClicks((c) => c + 1)}
                className="w-36 h-36 mx-auto rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-2xl shadow-xl shadow-cyan-900/50 flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer select-none"
              >
                <span>CLIQUE !</span>
                <span className="text-xs font-normal opacity-80 mt-1">Objectif: 15</span>
              </button>
            ) : clickerFailed ? (
              <div className="space-y-4 py-4 animate-in fade-in bg-[#131314] border border-red-500/40 rounded-2xl p-4">
                <div className="text-base font-bold text-red-400">
                  ❌ Échec ! Seulement {clicks} clics (15 requis).
                </div>
                <p className="text-xs text-[#9aa0a6]">Vous n'avez gagné <strong>0 pièce</strong>.</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={startClicker}
                    className="flex-1 bg-[#282a2c] hover:bg-[#333538] text-white py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Réessayer
                  </button>
                  <button
                    type="button"
                    onClick={() => setGameMode('menu')}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2.5 rounded-xl text-xs font-medium"
                  >
                    Menu des jeux
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4 animate-in fade-in">
                <div className="text-base font-bold text-emerald-400">
                  🎉 Victoire ! Vous avez gagné <span className="text-amber-400 font-extrabold">{clickerReward} pièces 🪙</span> !
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={startClicker}
                    className="flex-1 bg-[#282a2c] hover:bg-[#333538] text-white py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Rejouer
                  </button>
                  <button
                    type="button"
                    onClick={() => setGameMode('menu')}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2.5 rounded-xl text-xs font-medium"
                  >
                    Menu des jeux
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {gameMode === 'trivia' && (
          <div className="space-y-4 py-2">
            <div className="flex justify-between items-center text-xs text-[#9aa0a6] mb-2">
              <span>Question {questionIndex + 1} / {triviaQuestions.length}</span>
              <span>Score : {triviaScore} 🎯 (2 requis)</span>
            </div>

            <div className="bg-[#131314] p-4 rounded-2xl border border-[#333538] text-sm font-medium text-white mb-4">
              {triviaQuestions[questionIndex].question}
            </div>

            <div className="space-y-2">
              {triviaQuestions[questionIndex].options.map((opt, idx) => {
                let btnStyle = "bg-[#131314] hover:bg-[#282a2c] border-[#333538] text-[#e3e3e3]";
                if (selectedAnswer !== null) {
                  if (idx === triviaQuestions[questionIndex].correct) {
                    btnStyle = "bg-emerald-950/60 border-emerald-600 text-emerald-300";
                  } else if (idx === selectedAnswer) {
                    btnStyle = "bg-red-950/60 border-red-600 text-red-300";
                  }
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={selectedAnswer !== null}
                    onClick={() => handleTriviaAnswer(idx)}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all ${btnStyle}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
