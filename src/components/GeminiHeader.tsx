import { Menu, ShieldCheck, RefreshCw, Mic, Settings, User, LogOut, Coins, Gamepad2, Crown, Sparkles, Clock, Zap, MessageSquare } from 'lucide-react';
import { NexusAvatar } from './NexusAvatar';

interface GeminiHeaderProps {
  onToggleSidebar: () => void;
  onReset: () => void;
  onOpenSettings: () => void;
  hasApiKey: boolean;
  messageCount: number;
  currentUser?: string | null;
  onLogout?: () => void;
  coins: number;
  onOpenMiniGame: () => void;
  userTier: 'normal' | 'vip' | 'ultravip';
  usageTimeFormatted: string;
  onOpenAdmin?: () => void;
  onOpenDirectContact: () => void;
}

export function GeminiHeader({
  onToggleSidebar,
  onReset,
  onOpenSettings,
  hasApiKey,
  messageCount,
  currentUser,
  onLogout,
  coins,
  onOpenMiniGame,
  userTier,
  usageTimeFormatted,
  onOpenAdmin,
  onOpenDirectContact,
}: GeminiHeaderProps) {
  return (
    <header
      id="gemini-header"
      className="sticky top-0 z-30 w-full bg-[#131314]/90 backdrop-blur-md border-b border-[#282a2c] px-4 py-2.5 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <button
          id="btn-sidebar-hamburger"
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-full text-[#c4c7c5] hover:text-white hover:bg-[#282a2c] transition-colors"
          title="Afficher/Masquer la barre latérale"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Profile / Avatar Nexus */}
        <div className="flex items-center gap-3">
          <NexusAvatar size="md" showStatus />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-medium text-white tracking-tight">Nova IA</span>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-600/50 shadow-xs">
                Nova Rax AI
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#9aa0a6]">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>
                Créateur officiel : <strong className="text-[#c4c7c5]">le vrai Rax</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Usage Time Counter Widget */}
        <div className="hidden lg:flex items-center gap-1.5 bg-[#1e1f20] border border-cyan-500/30 px-3 py-1 rounded-full text-xs text-cyan-300">
          {userTier === 'ultravip' ? (
            <>
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="font-semibold text-white">Illimité (Ultra VIP)</span>
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Temps : <strong className="text-white">{usageTimeFormatted}</strong></span>
            </>
          )}
        </div>

        {/* Always Visible Coin Counter in Header */}
        <div className="flex items-center gap-1.5 bg-[#1e1f20] border border-amber-500/40 px-3 py-1 rounded-full text-xs">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-extrabold text-white">{coins}</span>
          <span className="text-[11px] text-amber-400 hidden xs:inline">🪙</span>
        </div>

        {/* Direct Contact Button (Top Header) */}
        <button
          type="button"
          onClick={onOpenDirectContact}
          className="w-9 h-9 rounded-full bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 hover:text-white border border-cyan-700/60 flex items-center justify-center transition-all shadow-sm group"
          title="Envoyer un message direct à Rax"
        >
          <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>

        {/* Always Visible Game Button */}
        <button
          type="button"
          onClick={onOpenMiniGame}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/80 border border-cyan-700/60 shadow-sm transition-all"
          title="Jouer au mini-jeu pour gagner des pièces"
        >
          <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Jeu</span>
        </button>

        {messageCount > 1 && (
          <button
            id="btn-header-reset"
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#c4c7c5] hover:text-white bg-[#1e1f20] hover:bg-[#282a2c] border border-[#333538] transition-colors"
            title="Effacer la discussion"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Effacer</span>
          </button>
        )}

        {/* User Profile Badge (Permanent Top Right with VIP Badge) */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-[#333538]">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
              userTier === 'ultravip'
                ? 'bg-gradient-to-r from-amber-950/80 to-purple-950/80 border-amber-500/60 shadow-md shadow-amber-500/10'
                : userTier === 'vip'
                ? 'bg-cyan-950/80 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                : 'bg-[#1e1f20] border-[#333538]'
            }`}>
              <div className="w-6 h-6 rounded-full bg-cyan-600/30 border border-cyan-500/50 flex items-center justify-center text-cyan-300 text-xs font-bold">
                {currentUser.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-white tracking-tight max-w-[100px] truncate">
                {currentUser}
              </span>

              {/* Status Badge according to tier */}
              {userTier === 'ultravip' ? (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-lg shadow-pink-500/50 uppercase border border-amber-200">
                  <Sparkles className="w-3 h-3" /> Ultra VIP 🌟
                </span>
              ) : userTier === 'vip' ? (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                  <Crown className="w-3 h-3" /> VIP
                </span>
              ) : (
                <span className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded bg-[#282a2c] text-[#8e918f] border border-[#3c4043] font-normal">
                  Normal
                </span>
              )}
            </div>



            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded-full bg-[#1e1f20] hover:bg-red-950/50 text-[#9aa0a6] hover:text-red-400 border border-[#333538] transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
