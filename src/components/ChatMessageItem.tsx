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

      try {
        const savedVol = localStorage.getItem('nexus_audio_volume');
        const v = savedVol !== null ? parseInt(savedVol, 10) : 100;
        utterance.volume = Math.max(0, Math.min(1, v / 100));
      } catch {
        utterance.volume = 1.0;
      }

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

      try {
        const savedVol = localStorage.getItem('nexus_audio_volume');
        const v = savedVol !== null ? parseInt(savedVol, 10) : 100;
        audio.volume = Math.max(0, Math.min(1, v / 100));
      } catch {
        audio.volume = 1.0;
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
    let userTier = 'normal';
    try {
      userTier = localStorage.getItem('nexus_user_tier') || 'normal';
    } catch {}

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
            <div className="flex items-center gap-2 mt-1 px-1">
              <span className="text-[10px] text-[#8e918f]">{message.timestamp}</span>
              {userTier === 'ultravip' ? (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow-md uppercase border border-amber-200">
                  <Sparkles className="w-2.5 h-2.5" /> Ultra VIP 🌟
                </span>
              ) : userTier === 'vip' ? (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-[9px] px-2 py-0.5 rounded-full shadow-xs">
                  👑 VIP
                </span>
              ) : (
                <span className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded bg-[#282a2c] text-[#8e918f] border border-[#3c4043] font-normal">
                  Normal
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`message-${message.id}`}
      className="group flex flex-col py-4 px-2 sm:px-4 hover:bg-white/[0.01] transition-colors rounded-2xl"
    >
      <div className="flex items-start gap-3.5 max-w-full">
        <div className="shrink-0 pt-0.5">
          <NexusAvatar size="md" showStatus />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-semibold text-white tracking-tight">Nova IA</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#c2e7ff] bg-[#004a77]/40 px-2 py-0.5 rounded-full border border-[#004a77]">
              <Sparkles className="w-3 h-3 text-[#8ab4f8]" />
              {message.source === 'nexus_image_ai'
                ? 'Générateur d\'image'
                : message.source?.includes('gemini') || message.source?.includes('flash')
                ? 'Google Gemini AI'
                : 'Nova Engine'}
            </span>
            <span className="text-[11px] text-[#8e918f]">{message.timestamp}</span>
          </div>

          <div className="text-sm sm:text-base text-[#e3e3e3] leading-relaxed markdown-body prose prose-invert max-w-none break-words">
            <Markdown>{message.content}</Markdown>
          </div>

          {message.imageUrl && (
            <div className="mt-3 max-w-md rounded-2xl overflow-hidden border border-[#3c4043] shadow-lg bg-[#1e1f20]">
              <img
                src={message.imageUrl}
                alt="Création IA Nova"
                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="p-2.5 bg-[#18181b] flex items-center justify-between text-xs text-[#9aa0a6]">
                <span>Généré par Nova IA</span>
                <a
                  href={message.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[#8ab4f8] hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ouvrir HD</span>
                </a>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-[#8e918f] hover:text-white hover:bg-[#282a2c] transition-colors flex items-center gap-1 text-xs"
              title="Copier le texte"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié' : 'Copier'}</span>
            </button>

            <button
              type="button"
              onClick={handleSpeak}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs ${
                speaking
                  ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/50'
                  : 'text-[#8e918f] hover:text-white hover:bg-[#282a2c]'
              }`}
              title={speaking ? 'Arrêter la lecture' : 'Écouter la réponse'}
            >
              {speaking ? <VolumeX className="w-3.5 h-3.5 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{speaking ? 'Arrêter' : 'Écouter'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
