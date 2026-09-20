import { useState, useRef } from 'react';
import Markdown from 'react-markdown';
import { User, Copy, Check, Volume2, VolumeX, ShieldCheck, Download, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';
import { NexusAvatar } from './NexusAvatar';

interface ChatMessageItemProps {
  message: ChatMessage;
}

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const fallbackSpeechSynthesis = (textToSpeak: string) => {
    if (!('speechSynthesis' in window)) {
      setSpeaking(false);
      return;
    }
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'fr-FR';
      utterance.rate = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const frVoice =
        voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith('fr') &&
            (v.name.toLowerCase().includes('google') ||
              v.name.toLowerCase().includes('natural') ||
              v.name.toLowerCase().includes('premium'))
        ) ||
        voices.find((v) => v.lang.toLowerCase().startsWith('fr')) ||
        null;

      if (frVoice) {
        utterance.voice = frVoice;
      }

      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } catch {
      setSpeaking(false);
    }
  };

  const handleSpeak = () => {
    if (speaking) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setSpeaking(false);
      return;
    }

    const cleaned = message.content
      .replace(/[*_#`~>\[\]\(\)]/g, '')
      .replace(/-{3,}/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\|/g, ', ')
      .replace(/×/g, ' fois ')
      .replace(/\*/g, ' fois ')
      .replace(/[\n\r]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) return;

    setSpeaking(true);

    try {
      let audio = audioRef.current;
      if (!audio) {
        audio = new Audio();
        audioRef.current = audio;
      }

      const textSnippet = cleaned.slice(0, 360);
      audio.src = `/api/tts?text=${encodeURIComponent(textSnippet)}`;

      audio.onended = () => setSpeaking(false);
      audio.onerror = () => {
        fallbackSpeechSynthesis(textSnippet);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          fallbackSpeechSynthesis(textSnippet);
        });
      }
    } catch {
      fallbackSpeechSynthesis(cleaned.slice(0, 360));
    }
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

          {/* AI Generated Image Display */}
          {message.imageUrl && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-[#3c4043] bg-[#1b1d22] max-w-md shadow-xl">
              <div className="relative group">
                <img
                  src={message.imageUrl}
                  alt="Génération IA Nexus"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-96 object-cover rounded-2xl transition-transform duration-300 group-hover:scale-[1.01]"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-[11px] text-cyan-300">
                  <Sparkles className="w-3 h-3 text-cyan-300" />
                  <span>Image IA Nexus</span>
                </div>
                <a
                  href={message.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black text-white text-xs font-medium backdrop-blur-md border border-white/20 flex items-center gap-1.5 transition-colors shadow-lg"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ouvrir en HD</span>
                </a>
              </div>
            </div>
          )}

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
