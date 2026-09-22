import { useState } from 'react';
import { X, Sparkles, Crown, Zap, Shield, CheckCircle2, Coins, ArrowRight, Clock } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  currentTier: 'normal' | 'vip' | 'ultravip';
  onUpgrade: (tier: 'vip' | 'ultravip', cost: number) => void;
  onBuyExtraTime: () => void;
}

export function UpgradeModal({
  isOpen,
  onClose,
  coins,
  currentTier,
  onUpgrade,
  onBuyExtraTime,
}: UpgradeModalProps) {
  const [selectedType, setSelectedType] = useState<'extratime' | 'vip' | 'ultravip'>('vip');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedType === 'extratime') {
      if (coins >= 30) {
        onBuyExtraTime();
      }
    } else if (selectedType === 'vip') {
      if (coins >= 100) {
        onUpgrade('vip', 100);
      }
    } else {
      if (coins >= 300) {
        onUpgrade('ultravip', 300);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#18191a] border border-[#333538] rounded-3xl w-full max-w-3xl p-6 md:p-8 text-[#e3e3e3] shadow-2xl relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-cyan-600/20 to-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#8e918f] hover:text-white hover:bg-[#282a2c] transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="p-3.5 bg-gradient-to-tr from-amber-500/20 to-yellow-500/30 border border-amber-500/40 rounded-2xl text-amber-400 shadow-inner">
            <Crown className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Boutique d'Abonnement & Temps Nexus
              </h2>
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <p className="text-xs md:text-sm text-[#9aa0a6] mt-0.5">
              Utilisez vos pièces 🪙 pour prolonger votre temps, débloquer le VIP ou le mode Ultra VIP !
            </p>
          </div>
        </div>

        {/* Current Wallet Banner */}
        <div className="flex items-center justify-between bg-[#131314] px-4 py-3 rounded-2xl border border-[#333538] mb-6">
          <div className="flex items-center gap-2.5">
            <Coins className="w-5 h-5 text-amber-400" />
            <span className="text-xs text-[#9aa0a6] uppercase font-semibold">Votre Portefeuille :</span>
          </div>
          <div className="text-base font-extrabold text-white flex items-center gap-1.5">
            <span className="text-amber-400 text-lg">{coins}</span> pièces 🪙
          </div>
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Extra Time Option (+1h) */}
          <div
            onClick={() => setSelectedType('extratime')}
            className={`cursor-pointer rounded-2xl p-4 border transition-all relative flex flex-col justify-between ${
              selectedType === 'extratime'
                ? 'bg-[#1e2229] border-blue-500 ring-2 ring-blue-500/30 shadow-lg'
                : 'bg-[#131314] border-[#282a2c] hover:border-[#3d4248]'
            }`}
          >
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2.5 rounded-xl bg-blue-950/60 text-blue-400 border border-blue-800/60">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Mode Normal (+1h)</h3>
                  <p className="text-[11px] text-[#9aa0a6]">Temps d'utilisation en plus</p>
                </div>
              </div>
              <ul className="space-y-1.5 text-[11px] text-[#c4c7c5] mb-4">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>+1 heure de temps aujourd'hui</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Idéal pour prolonger vos sessions</span>
                </li>
              </ul>
            </div>
            <div className="pt-3 border-t border-[#282a2c] flex items-center justify-between">
              <span className="text-[11px] text-[#9aa0a6]">Tarif</span>
              <span className="text-xs font-extrabold text-amber-400 bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-800/50">
                30 🪙
              </span>
            </div>
          </div>

          {/* VIP Option */}
          <div
            onClick={() => setSelectedType('vip')}
            className={`cursor-pointer rounded-2xl p-4 border transition-all relative flex flex-col justify-between ${
              selectedType === 'vip'
                ? 'bg-[#1e2229] border-cyan-500 ring-2 ring-cyan-500/30 shadow-lg'
                : 'bg-[#131314] border-[#282a2c] hover:border-[#3d4248]'
            }`}
          >
            {currentTier === 'vip' && (
              <span className="absolute top-2.5 right-2.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Actif
              </span>
            )}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2.5 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-800/60">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Mode VIP</h3>
                  <p className="text-[11px] text-[#9aa0a6]">Valable 1 mois entier</p>
                </div>
              </div>
              <ul className="space-y-1.5 text-[11px] text-[#c4c7c5] mb-4">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Vrai badge VIP sur votre profil</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Bonus x2 pièces mini-jeux</span>
                </li>
              </ul>
            </div>
            <div className="pt-3 border-t border-[#282a2c] flex items-center justify-between">
              <span className="text-[11px] text-[#9aa0a6]">1 Mois</span>
              <span className="text-xs font-extrabold text-amber-400 bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-800/50">
                100 🪙
              </span>
            </div>
          </div>

          {/* Ultra VIP Option */}
          <div
            onClick={() => setSelectedType('ultravip')}
            className={`cursor-pointer rounded-2xl p-4 border transition-all relative flex flex-col justify-between ${
              selectedType === 'ultravip'
                ? 'bg-[#221c2e] border-amber-500 ring-2 ring-amber-500/30 shadow-lg'
                : 'bg-[#131314] border-[#282a2c] hover:border-[#3d4248]'
            }`}
          >
            {currentTier === 'ultravip' && (
              <span className="absolute top-2.5 right-2.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Actif
              </span>
            )}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2.5 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/60">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1">
                    <span>Ultra VIP</span>
                    <Sparkles className="w-3 h-3 text-amber-400" />
                  </h3>
                  <p className="text-[11px] text-[#9aa0a6]">100% illimité 1 mois</p>
                </div>
              </div>
              <ul className="space-y-1.5 text-[11px] text-[#c4c7c5] mb-4">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Temps de discussion illimité</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Sans aucune restriction 30j</span>
                </li>
              </ul>
            </div>
            <div className="pt-3 border-t border-[#282a2c] flex items-center justify-between">
              <span className="text-[11px] text-[#9aa0a6]">1 Mois</span>
              <span className="text-xs font-extrabold text-amber-400 bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-800/50">
                300 🪙
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#282a2c]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#282a2c] hover:bg-[#333538] text-white text-xs font-medium transition-colors"
          >
            Fermer
          </button>

          <button
            type="button"
            disabled={
              (selectedType === 'extratime' && coins < 30) ||
              (selectedType === 'vip' && coins < 100) ||
              (selectedType === 'ultravip' && coins < 300)
            }
            onClick={handleConfirm}
            className={`px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg ${
              (selectedType === 'extratime' && coins >= 30) ||
              (selectedType === 'vip' && coins >= 100) ||
              (selectedType === 'ultravip' && coins >= 300)
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-amber-500/20 cursor-pointer scale-105'
                : 'bg-[#282a2c] text-[#8e918f] border border-[#333538] cursor-not-allowed'
            }`}
          >
            <span>
              {selectedType === 'extratime'
                ? 'Acheter +1h (30 🪙)'
                : selectedType === 'vip'
                ? 'Débloquer VIP 1 Mois (100 🪙)'
                : 'Débloquer Ultra VIP 1 Mois (300 🪙)'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
