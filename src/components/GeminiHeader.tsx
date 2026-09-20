import { Menu, ShieldCheck, Sparkles, RefreshCw, Mic } from 'lucide-react';
import { NexusAvatar } from './NexusAvatar';

interface GeminiHeaderProps {
  onToggleSidebar: () => void;
  onReset: () => void;
  onOpenVoice?: () => void;
  hasApiKey: boolean;
  messageCount: number;
}

export function GeminiHeader({
  onToggleSidebar,
  onReset,
  onOpenVoice,
  hasApiKey,
  messageCount,
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
              <span className="text-base font-medium text-white tracking-tight">Nexus</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#1e2329] border border-[#2d3748] text-[#8ab4f8]">
                <Sparkles className="w-3 h-3 text-[#8ab4f8]" />
                Gemini Style
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

      <div className="flex items-center gap-2">
        {onOpenVoice && (
          <button
            id="btn-header-voice"
            type="button"
            onClick={onOpenVoice}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-700/50 shadow-sm transition-all"
            title="Ouvrir le mode vocal interactif avec le rond"
          >
            <Mic className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden xs:inline sm:inline">Mode Voix</span>
          </button>
        )}

        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1e1f20] border border-[#333538] text-xs text-[#c4c7c5]">
          <span className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="text-[11px]">{hasApiKey ? 'Nexus AI' : 'Moteur Universel'}</span>
        </div>

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
      </div>
    </header>
  );
}
