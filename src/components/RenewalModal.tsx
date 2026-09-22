import { useState } from 'react';
import { Crown, Sparkles, Shield, Zap, RefreshCw, CheckCircle2 } from 'lucide-react';

interface RenewalModalProps {
  isOpen: boolean;
  coins: number;
  onChooseNormal: () => void;
  onChooseVip: () => void;
  onChooseUltraVip: () => void;
}

export function RenewalModal({
  isOpen,
  coins,
  onChooseNormal,
  onChooseVip,
  onChooseUltraVip,
}: RenewalModalProps) {
  const [selected, setSelected] = useState<'normal' | 'vip' | 'ultravip'>('vip');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#18191a] border border-[#333538] rounded-3xl w-full max-w-lg p-6 md:p-8 text-[#e3e3e3] shadow-2xl relative overflow-hidden text-center">
        {/* Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex p-3.5 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400 mb-4 shadow-inner">
          <RefreshCw className="w-8 h-8 animate-spin-slow" />
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <span>Période d'abonnement expirée</span>
          <Sparkles className="w-5 h-5 text-amber-400" />
        </h2>
        <p className="text-sm font-semibold text-amber-300 mb-6 bg-amber-950/40 border border-amber-500/40 p-3.5 rounded-2xl">
          "Les un mois sont terminés. Si tu veux repayer, paye."
        </p>

        {/* Options */}
        <div className="space-y-3 mb-6 text-left">
          {/* Normal Option */}
          <div
            onClick={() => setSelected('normal')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center justify-between ${
              selected === 'normal'
                ? 'bg-[#1e2229] border-cyan-500 ring-2 ring-cyan-500/20'
                : 'bg-[#131314] border-[#282a2c] hover:border-[#3d4248]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#282a2c] text-white">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Mode Normal (1 jour)</div>
                <div className="text-xs text-[#9aa0a6]">Gratuit (standard)</div>
              </div>
            </div>
            {selected === 'normal' && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
          </div>

          {/* VIP Option */}
          <div
            onClick={() => setSelected('vip')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center justify-between ${
              selected === 'vip'
                ? 'bg-[#1e2229] border-cyan-500 ring-2 ring-cyan-500/20'
                : 'bg-[#131314] border-[#282a2c] hover:border-[#3d4248]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-800/60">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Mode VIP (1 mois)</div>
                <div className="text-xs text-amber-400 font-semibold">100 pièces 🪙</div>
              </div>
            </div>
            {selected === 'vip' && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
          </div>

          {/* Ultra VIP Option */}
          <div
            onClick={() => setSelected('ultravip')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center justify-between ${
              selected === 'ultravip'
                ? 'bg-[#221c2e] border-amber-500 ring-2 ring-amber-500/20'
                : 'bg-[#131314] border-[#282a2c] hover:border-[#3d4248]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/60">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Renouvellement Ultra VIP (1 mois)</div>
                <div className="text-xs text-amber-400 font-semibold">300 pièces 🪙</div>
              </div>
            </div>
            {selected === 'ultravip' && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
          </div>
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={() => {
            if (selected === 'normal') onChooseNormal();
            else if (selected === 'vip') onChooseVip();
            else onChooseUltraVip();
          }}
          disabled={
            (selected === 'vip' && coins < 100) || (selected === 'ultravip' && coins < 300)
          }
          className={`w-full py-3.5 rounded-2xl text-sm font-bold shadow-lg transition-all ${
            (selected === 'vip' && coins < 100) || (selected === 'ultravip' && coins < 300)
              ? 'bg-[#282a2c] text-[#8e918f] cursor-not-allowed border border-[#333538]'
              : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-amber-500/20 cursor-pointer'
          }`}
        >
          {selected === 'normal'
            ? 'Renouveler Mode Normal (1 jour)'
            : selected === 'vip'
            ? coins >= 100
              ? 'Activer le Mode VIP 1 mois (100 🪙)'
              : 'Pièces insuffisantes pour VIP (100 🪙)'
            : coins >= 300
            ? 'Renouveler Ultra VIP pour 1 mois (300 🪙)'
            : 'Pièces insuffisantes pour Ultra VIP (300 🪙)'}
        </button>
      </div>
    </div>
  );
}
