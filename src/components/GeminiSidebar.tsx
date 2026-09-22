import { useState } from 'react';
import { Plus, Trash2, ShieldCheck, ChevronLeft, ChevronRight, Cpu, Search, Coins, Gamepad2, Sparkles, ArrowUpCircle, MessageSquare } from 'lucide-react';
import { ChatSession } from '../types';
import { NexusAvatar } from './NexusAvatar';

interface GeminiSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  hasApiKey: boolean;
  coins: number;
  onOpenMiniGame: () => void;
  onUpgrade: () => void;
  userTier: 'normal' | 'vip' | 'ultravip';
}

export function GeminiSidebar({
  sessions,
  currentSessionId,
  isOpen,
  onToggle,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  hasApiKey,
  coins,
  onOpenMiniGame,
  onUpgrade,
  userTier,
}: GeminiSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchTitle = s.title.toLowerCase().includes(q);
    const matchMessage = s.messages.some((m) => m.content.toLowerCase().includes(q));
    return matchTitle || matchMessage;
  });

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        id="gemini-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col bg-[#131314] border-r border-[#282a2c] text-[#e3e3e3] transition-all duration-300 ease-in-out ${
          isOpen ? 'w-72 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-[68px]'
        }`}
      >
        {/* Top bar with Toggle & Brand */}
        <div className="flex items-center justify-between p-3.5 border-b border-[#282a2c]/60">
          <div className="flex items-center gap-3 overflow-hidden">
            <NexusAvatar size="sm" showStatus />
            {isOpen && (
              <div className="truncate">
                <div className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
                  Nova IA
                </div>
                <div className="text-[11px] text-[#9aa0a6] truncate flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span>Créateur : <strong>le vrai Rax</strong></span>
                </div>
              </div>
            )}
          </div>

          <button
            id="btn-toggle-sidebar"
            type="button"
            onClick={onToggle}
            className="p-1.5 rounded-lg text-[#c4c7c5] hover:text-white hover:bg-[#282a2c] transition-colors"
            title={isOpen ? 'Réduire la barre latérale' : 'Développer la barre latérale'}
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Coin Wallet & Upgrade Section */}
        {isOpen ? (
          <div className="p-3 bg-[#18191a] border-b border-[#282a2c]/80 space-y-2.5">
            {/* Wallet Counter */}
            <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-[#1e1f20] border border-[#333538]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-[#9aa0a6] uppercase tracking-wider font-semibold">Portefeuille</div>
                  <div className="text-sm font-extrabold text-white flex items-center gap-1">
                    <span>{coins}</span> <span className="text-xs text-amber-400">pièces 🪙</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenMiniGame}
                className="px-2.5 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/60 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                title="Jouer au mini-jeu pour gagner des pièces"
              >
                <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mini-jeu</span>
              </button>
            </div>

            {/* Upgrade Button */}
            <button
              type="button"
              onClick={onUpgrade}
              className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md ${
                userTier === 'ultravip'
                  ? 'bg-amber-950/60 border border-amber-600/60 text-amber-300'
                  : userTier === 'vip'
                  ? 'bg-cyan-950/60 border border-cyan-600/60 text-cyan-300'
                  : 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-amber-900/30 cursor-pointer'
              }`}
            >
              {userTier === 'ultravip' ? (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Ultra VIP Actif (1 Mois 🌟)</span>
                </>
              ) : userTier === 'vip' ? (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>VIP Actif (100 🪙)</span>
                </>
              ) : (
                <>
                  <ArrowUpCircle className="w-4 h-4 text-amber-200" />
                  <span>Mettre à niveau (Boutique 🪙)</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-2 flex flex-col items-center gap-2 border-b border-[#282a2c]">
            <button
              type="button"
              onClick={onOpenMiniGame}
              className="p-2 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
              title={`Portefeuille : ${coins} pièces 🪙 (Cliquez pour mini-jeu)`}
            >
              <Coins className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* New Chat Button (Gemini Pill Style) */}
        <div className="p-3">
          <button
            id="btn-new-chat"
            type="button"
            onClick={onNewChat}
            className={`w-full flex items-center rounded-full bg-[#1e1f20] hover:bg-[#2d2f31] text-[#e3e3e3] hover:text-white transition-all border border-[#333538] shadow-sm active:scale-[0.98] ${
              isOpen ? 'gap-3 px-4 py-2.5 text-sm font-medium' : 'justify-center p-2.5'
            }`}
            title="Nouvelle discussion"
          >
            <Plus className="w-4 h-4 text-[#8ab4f8] shrink-0" />
            {isOpen && <span>Nouvelle discussion</span>}
          </button>
        </div>

        {/* Search Bar */}
        {isOpen && (
          <div className="px-3 pb-2">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-3.5 h-3.5 text-[#8e918f]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une discussion..."
                className="w-full bg-[#1e1f20] hover:bg-[#232427] focus:bg-[#282a2c] text-xs text-[#e3e3e3] placeholder-[#8e918f] pl-9 pr-7 py-2 rounded-full border border-[#333538] focus:border-[#8ab4f8] focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-xs text-[#8e918f] hover:text-white"
                  title="Effacer la recherche"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Recent Conversations List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {isOpen && (
            <div className="px-3 pb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-[#8e918f]">
              <span>Récents</span>
              {searchQuery && (
                <span className="text-[10px] text-[#8ab4f8] lowercase">
                  ({filteredSessions.length} résultat{filteredSessions.length > 1 ? 's' : ''})
                </span>
              )}
            </div>
          )}

          {filteredSessions.length === 0 ? (
            isOpen && (
              <div className="px-4 py-6 text-center text-xs text-[#8e918f]">
                Aucune discussion trouvée pour "{searchQuery}".
              </div>
            )
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === currentSessionId;
              return (
                <div
                  key={session.id}
                  id={`session-item-${session.id}`}
                  onClick={() => onSelectSession(session.id)}
                  className={`group relative flex items-center gap-3 rounded-full cursor-pointer transition-all ${
                    isOpen ? 'px-3.5 py-2 text-sm' : 'justify-center p-2'
                  } ${
                    isActive
                      ? 'bg-[#004a77]/30 text-[#c2e7ff] font-medium'
                      : 'text-[#c4c7c5] hover:bg-[#1e1f20] hover:text-white'
                  }`}
                  title={session.title}
                >
                  <MessageSquare className="w-4 h-4 shrink-0 text-[#8e918f]" />
                  {isOpen && (
                    <>
                      <span className="truncate flex-1">{session.title}</span>
                      {sessions.length > 1 && (
                        <button
                          id={`btn-delete-session-${session.id}`}
                          type="button"
                          onClick={(e) => onDeleteSession(session.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#282a2c] text-[#8e918f] hover:text-red-400 transition-all"
                          title="Supprimer la discussion"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Creator Attribution & Tech Badge */}
        <div className="p-3 border-t border-[#282a2c]/80 bg-[#131314]">
          {isOpen ? (
            <div className="rounded-xl p-3 bg-[#1e1f20] border border-[#2d2f31] space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-white">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Assistant Nova IA</span>
              </div>
              <p className="text-[11px] text-[#9aa0a6] leading-snug">
                Conçu et paramétré sous la directive officielle du{' '}
                <strong className="text-white">vrai Rax</strong>.
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-[#2d2f31] text-[10px] text-[#8e918f]">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-blue-400" />
                  {hasApiKey ? 'Gemini 3.8 Flash' : 'Moteur Nova'}
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Actif
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1" title="Créateur : le vrai Rax">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
