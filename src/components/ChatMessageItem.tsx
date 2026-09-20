import { useState } from 'react';
import Markdown from 'react-markdown';
import { User, Copy, Check, Volume2, VolumeX, ShieldCheck } from 'lucide-react';
import { ChatMessage } from '../types';
import { NexusAvatar } from './NexusAvatar';

interface ChatMessageItemProps {
  message: ChatMessage;
}

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const isAssistant = message.role === 'assistant';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.0;

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  if (!isAssistant) {
    // Gemini-style user message (clean right-aligned capsule bubble)
    return (
      <div
        id={`message-${message.id}`}
        className="flex justify-end py-3 px-2 sm:px-4"
      >
        <div className="flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%] flex-row-reverse">
          <div className="w-8 h-8 rounded-full bg-[#2d2f31] border border-[#3c4043] flex items-center justify-center text-[#c4c7c5] shrink-0 text-xs">
            <User className="w-4 h-4" />
          </div>
          <div className="flex flex-col items-end">
            <div className="bg-[#282a2c] text-[#e3e3e3] px-4 py-2.5 rounded-3xl rounded-tr-md text-sm leading-relaxed border border-[#3c4043]/60 shadow-xs whitespace-pre-wrap break-words">
              {message.content}
            </div>
            <span className="text-[10px] text-[#8e918f] mt-1 px-1">{message.timestamp}</span>
          </div>
        </div>
      </div>
    );
  }

  // Gemini-style assistant message (clean left-aligned with Nexus Avatar and typography)
  return (
    <div
      id={`message-${message.id}`}
      className="group flex flex-col py-4 px-2 sm:px-4 hover:bg-white/[0.01] transition-colors rounded-2xl"
    >
      <div className="flex items-start gap-3.5 max-w-full">
        {/* Nexus Avatar */}
        <div className="shrink-0 pt-0.5">
          <NexusAvatar size="md" showStatus />
        </div>

        {/* Content body */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header info */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-semibold text-white tracking-tight">Nexus</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#c2e7ff] bg-[#004a77]/40 px-2 py-0.5 rounded-full border border-[#004a77]">
              <ShieldCheck className="w-3 h-3 text-[#7fcfff]" />
              Créé par le vrai Rax
            </span>
            <span className="text-[11px] text-[#8e918f]">{message.timestamp}</span>
          </div>

          {/* Assistant text formatted with Markdown */}
          <div className="text-[#e3e3e3] text-[15px] leading-relaxed break-words">
            <div className="markdown-body space-y-3">
              <Markdown>{message.content}</Markdown>
            </div>
          </div>

          {/* Action pills (Copy, Speak) */}
          <div className="flex items-center gap-2 pt-2 text-[#8e918f]">
            <button
              id={`btn-copy-${message.id}`}
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs hover:text-[#e3e3e3] hover:bg-[#282a2c] transition-colors border border-transparent hover:border-[#3c4043]"
              title="Copier la réponse"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié' : 'Copier'}</span>
            </button>

            {'speechSynthesis' in window && (
              <button
                id={`btn-speak-${message.id}`}
                type="button"
                onClick={handleSpeak}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors border ${
                  speaking
                    ? 'text-[#7fcfff] bg-[#004a77]/40 border-[#004a77]'
                    : 'hover:text-[#e3e3e3] hover:bg-[#282a2c] border-transparent hover:border-[#3c4043]'
                }`}
                title={speaking ? 'Arrêter la lecture' : 'Écouter Nexus'}
              >
                {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{speaking ? 'Stop' : 'Écouter'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
