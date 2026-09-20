import { MessageSquare, Plus, Trash2, ShieldCheck, ChevronLeft, ChevronRight, Sparkles, Cpu } from 'lucide-react';
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
}: GeminiSidebarProps) {
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
                  Nexus
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    AI
                  </span>
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

        {/* Recent Conversations List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {isOpen && (
            <div className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-[#8e918f]">
              Récents
            </div>
          )}

          {sessions.map((session) => {
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
                <MessageSquare
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#a8c7fa]' : 'text-[#8e918f] group-hover:text-white'
                  }`}
                />

                {isOpen && (
                  <>
                    <span className="truncate flex-1 text-xs">
                      {session.title || 'Discussion Nexus'}
                    </span>

                    {sessions.length > 1 && (
                      <button
                        type="button"
                        id={`btn-delete-session-${session.id}`}
                        onClick={(e) => onDeleteSession(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-full text-[#8e918f] hover:text-rose-400 hover:bg-[#282a2c] transition-all"
                        title="Supprimer la discussion"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Creator Attribution & Tech Badge */}
        <div className="p-3 border-t border-[#282a2c]/80 bg-[#131314]">
          {isOpen ? (
            <div className="rounded-xl p-3 bg-[#1e1f20] border border-[#2d2f31] space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-white">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Assistant Nexus</span>
              </div>
              <p className="text-[11px] text-[#9aa0a6] leading-snug">
                Conçu et paramétré sous la directive officielle du{' '}
                <strong className="text-white">vrai Rax</strong>.
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-[#2d2f31] text-[10px] text-[#8e918f]">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-blue-400" />
                  {hasApiKey ? 'Gemini 3.8 Flash' : 'Moteur Nexus'}
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
