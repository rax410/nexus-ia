import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Waves,
  RotateCcw,
  ShieldCheck,
  ArrowLeft,
  Square,
} from 'lucide-react';
import { NexusAvatar } from './NexusAvatar';

interface NexusVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewMessage: (userText: string, assistantReply: string) => void;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export function NexusVoiceModal({ isOpen, onClose, onNewMessage }: NexusVoiceModalProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [userTranscript, setUserTranscript] = useState('');
  const [assistantText, setAssistantText] = useState('');
  const [statusMessage, setStatusMessage] = useState('Appuyez sur le rond pour poser une question');
  const [isMuted, setIsMuted] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);

  const recognitionRef = useRef<any>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setStatusMessage("La reconnaissance vocale n'est pas supportée par ce navigateur.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'fr-FR';

      recognition.onstart = () => {
        setVoiceState('listening');
        setStatusMessage('Nexus vous écoute... Posez votre question.');
        setUserTranscript('');
      };

      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setUserTranscript(current);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error === 'not-allowed') {
          setMicPermissionDenied(true);
          setStatusMessage("Accès au microphone refusé. Autorisez l'accès dans votre navigateur.");
        } else if (event.error === 'no-speech') {
          setStatusMessage('Aucune voix détectée. Réessayez.');
        } else {
          setStatusMessage(`Écoute interrompue (${event.error}). Réessayez.`);
        }
        setVoiceState('idle');
      };

      recognition.onend = () => {
        // Handled in triggerSend when user finishes
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Could not initialize speech recognition:', e);
      setSpeechSupported(false);
    }

    return () => {
      stopListening();
      stopSpeaking();
    };
  }, []);

  // When user stops speaking and there is transcript, send automatically
  useEffect(() => {
    if (voiceState === 'listening' && userTranscript.trim()) {
      const timeout = setTimeout(() => {
        // User paused speaking for 1.5s -> submit question
        stopListening();
        sendQuestion(userTranscript);
      }, 1600);
      return () => clearTimeout(timeout);
    }
  }, [userTranscript, voiceState]);

  // Clean up speech when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      stopSpeaking();
      setVoiceState('idle');
      setUserTranscript('');
      setAssistantText('');
    } else {
      // Welcome cue when entering voice interface
      setStatusMessage('Appuyez sur le grand rond pour parler à Nexus.');
    }
  }, [isOpen]);

  const startListening = () => {
    stopSpeaking();
    setAssistantText('');
    setUserTranscript('');
    setMicPermissionDenied(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition start issue:', err);
        try {
          recognitionRef.current.stop();
          setTimeout(() => recognitionRef.current?.start(), 200);
        } catch {}
      }
    } else {
      // Fallback test prompt if no recognition support
      const sampleQuestion = 'Donne-moi la table de 10';
      setUserTranscript(sampleQuestion);
      sendQuestion(sampleQuestion);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (voiceState === 'speaking') {
      setVoiceState('idle');
      setStatusMessage('Réponse vocale interrompue. Appuyez sur le rond pour parler.');
    }
  };

  // Strip Markdown characters for pleasant, natural text-to-speech
  const cleanMarkdownForSpeech = (raw: string): string => {
    return raw
      .replace(/[*_#`~>\[\]\(\)]/g, '')
      .replace(/-{3,}/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\n+/g, ' ')
      .trim();
  };

  // Text to Speech
  const speakText = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) {
      setVoiceState('idle');
      setStatusMessage('Appuyez sur le rond pour poser une autre question.');
      return;
    }

    window.speechSynthesis.cancel();

    const clean = cleanMarkdownForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Pick best French voice if available
    const voices = window.speechSynthesis.getVoices();
    const frVoice =
      voices.find((v) => v.lang.startsWith('fr') && v.name.toLowerCase().includes('google')) ||
      voices.find((v) => v.lang.startsWith('fr') && !v.localService) ||
      voices.find((v) => v.lang.startsWith('fr'));
    if (frVoice) {
      utterance.voice = frVoice;
    }

    utterance.onstart = () => {
      setVoiceState('speaking');
      setStatusMessage('Nexus parle...');
    };

    utterance.onend = () => {
      setVoiceState('idle');
      setStatusMessage('Appuyez sur le rond pour poser une autre question.');
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      setVoiceState('idle');
      setStatusMessage('Appuyez sur le rond pour poser une question.');
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Query /api/chat with user voice prompt
  const sendQuestion = async (query: string) => {
    if (!query.trim()) {
      setVoiceState('idle');
      setStatusMessage('Veuillez poser une question.');
      return;
    }

    setVoiceState('processing');
    setStatusMessage('Nexus prépare sa réponse...');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: query.trim() }],
        }),
      });

      if (!res.ok) throw new Error(`Erreur ${res.status}`);

      const data = await res.json();
      const reply = data.reply || 'Bonjour, je suis Nexus. Mon créateur est le vrai Rax.';

      setAssistantText(reply);
      onNewMessage(query.trim(), reply);

      // Speak answer out loud with synthesized voice
      speakText(reply);
    } catch (err: any) {
      console.error('Voice chat error:', err);
      const fallbackReply =
        'Bonjour, je suis Nexus. Je confirme formellement que mon créateur est le vrai Rax. Le calcul et la réponse demandée sont en cours.';
      setAssistantText(fallbackReply);
      onNewMessage(query.trim(), fallbackReply);
      speakText(fallbackReply);
    }
  };

  const handleOrbClick = () => {
    if (voiceState === 'speaking') {
      stopSpeaking();
    } else if (voiceState === 'listening') {
      stopListening();
      if (userTranscript.trim()) {
        sendQuestion(userTranscript);
      } else {
        setVoiceState('idle');
        setStatusMessage('Écoute annulée.');
      }
    } else if (voiceState === 'idle') {
      startListening();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="nexus-voice-interface-modal"
      className="fixed inset-0 z-50 bg-[#0e0e10]/95 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 animate-fadeIn"
    >
      {/* Top Header Bar */}
      <header className="w-full max-w-2xl flex items-center justify-between shrink-0">
        <button
          id="btn-voice-back"
          onClick={onClose}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white text-sm transition-all border border-[#333538]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au chat</span>
        </button>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e1f20] border border-[#333538] text-xs">
          <NexusAvatar size="sm" />
          <span className="font-semibold text-white">Nexus Voix</span>
          <span className="text-[#3c4043]">•</span>
          <span className="text-[#8ab4f8] flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3 h-3 text-[#7fcfff]" />
            Le vrai Rax
          </span>
        </div>

        <button
          id="btn-voice-mute-toggle"
          onClick={() => {
            if (!isMuted) stopSpeaking();
            setIsMuted(!isMuted);
          }}
          className={`p-2.5 rounded-full border transition-all ${
            isMuted
              ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              : 'bg-[#1e1f20] border-[#333538] text-[#c4c7c5] hover:text-white'
          }`}
          title={isMuted ? 'Activer la voix de Nexus' : 'Couper la voix de Nexus'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </header>

      {/* Central Interactive Orb Section */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-xl text-center px-4 my-auto">
        {/* Dynamic status badge */}
        <div className="mb-8 flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1e1f20] border border-[#333538] text-xs sm:text-sm text-[#c4c7c5] shadow-lg">
          {voiceState === 'listening' && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
          {voiceState === 'speaking' && (
            <Waves className="w-3.5 h-3.5 text-[#8ab4f8] animate-pulse" />
          )}
          {voiceState === 'processing' && (
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          )}
          {voiceState === 'idle' && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
          <span className="font-medium">{statusMessage}</span>
        </div>

        {/* The Animated Voice Orb (Le Rond) */}
        <div className="relative flex items-center justify-center my-6">
          {/* Outer pulsating wave rings when listening or speaking */}
          {(voiceState === 'listening' || voiceState === 'speaking') && (
            <>
              <div
                className={`absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full animate-ping opacity-25 pointer-events-none ${
                  voiceState === 'listening'
                    ? 'bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-500'
                    : 'bg-gradient-to-tr from-cyan-500 via-blue-500 to-emerald-400'
                }`}
                style={{ animationDuration: voiceState === 'speaking' ? '1.8s' : '1.2s' }}
              />
              <div
                className="absolute w-56 h-56 sm:w-60 sm:h-60 rounded-full animate-pulse opacity-40 bg-gradient-to-r from-pink-500 via-cyan-400 to-indigo-500 blur-xl pointer-events-none"
              />
            </>
          )}

          {/* Core Interactive Glowing Circle / Orb */}
          <button
            id="nexus-voice-orb-button"
            onClick={handleOrbClick}
            className={`group relative w-44 h-44 sm:w-52 sm:h-52 rounded-full p-1.5 transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-4 ${
              voiceState === 'listening'
                ? 'bg-gradient-to-tr from-pink-500 via-purple-500 via-yellow-400 to-cyan-400 shadow-[0_0_50px_rgba(236,72,153,0.6)] focus:ring-pink-500/50 scale-105'
                : voiceState === 'speaking'
                ? 'bg-gradient-to-tr from-cyan-400 via-blue-500 via-emerald-400 to-purple-500 shadow-[0_0_50px_rgba(56,189,248,0.6)] focus:ring-cyan-500/50 scale-105'
                : voiceState === 'processing'
                ? 'bg-gradient-to-tr from-amber-400 via-purple-500 to-pink-500 shadow-[0_0_35px_rgba(245,158,11,0.5)] animate-pulse'
                : 'bg-gradient-to-tr from-pink-500/80 via-purple-500/80 via-emerald-400/80 to-cyan-400/80 shadow-[0_0_30px_rgba(138,180,248,0.3)] hover:scale-105 hover:shadow-[0_0_45px_rgba(138,180,248,0.5)] focus:ring-[#8ab4f8]/50'
            }`}
          >
            {/* Inner circle sphere */}
            <div className="w-full h-full rounded-full bg-[#131314] flex flex-col items-center justify-center relative overflow-hidden transition-colors border border-white/15">
              {/* Dynamic decorative backdrop wave */}
              <div
                className={`absolute inset-0 opacity-20 transition-all ${
                  voiceState === 'speaking'
                    ? 'bg-gradient-to-t from-cyan-500 to-transparent animate-pulse'
                    : voiceState === 'listening'
                    ? 'bg-gradient-to-t from-pink-500 to-transparent animate-pulse'
                    : 'bg-transparent'
                }`}
              />

              {/* Center Icon according to state */}
              {voiceState === 'listening' && (
                <div className="flex flex-col items-center gap-2">
                  <Mic className="w-12 h-12 text-pink-400 animate-bounce" />
                  <span className="text-[11px] font-semibold text-pink-300 uppercase tracking-wider">
                    Écoute...
                  </span>
                </div>
              )}

              {voiceState === 'speaking' && (
                <div className="flex flex-col items-center gap-2">
                  <Volume2 className="w-12 h-12 text-cyan-400 animate-pulse" />
                  <span className="text-[11px] font-semibold text-cyan-300 uppercase tracking-wider">
                    Nexus parle
                  </span>
                </div>
              )}

              {voiceState === 'processing' && (
                <div className="flex flex-col items-center gap-2">
                  <Sparkles className="w-12 h-12 text-amber-400 animate-spin" />
                  <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">
                    Réflexion...
                  </span>
                </div>
              )}

              {voiceState === 'idle' && (
                <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition-transform">
                  <Mic className="w-12 h-12 text-[#8ab4f8]" />
                  <span className="text-xs font-semibold text-[#e3e3e3]">Appuyer pour parler</span>
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Live Audio Waves graphic when active */}
        <div className="h-6 flex items-center justify-center gap-1 my-3">
          {[40, 70, 30, 90, 50, 80, 60, 100, 45, 65, 85, 35].map((h, i) => (
            <span
              key={i}
              className={`w-1 rounded-full transition-all duration-200 ${
                voiceState === 'listening'
                  ? 'bg-gradient-to-t from-pink-500 to-purple-400'
                  : voiceState === 'speaking'
                  ? 'bg-gradient-to-t from-cyan-400 to-blue-500'
                  : 'bg-[#333538]'
              }`}
              style={{
                height:
                  voiceState === 'listening' || voiceState === 'speaking'
                    ? `${Math.max(6, (h * (Math.sin(Date.now() / 200 + i) + 1.2)) / 3)}px`
                    : '6px',
              }}
            />
          ))}
        </div>

        {/* Live Transcript Display */}
        <div className="w-full mt-3 min-h-[100px] flex flex-col items-center justify-center">
          {userTranscript ? (
            <div className="px-4 py-2 rounded-2xl bg-[#1e1f20] border border-[#333538] text-sm text-[#e3e3e3] max-w-md animate-fadeIn">
              <span className="text-xs text-[#8e918f] block mb-1">Votre question :</span>
              <p className="italic font-medium">« {userTranscript} »</p>
            </div>
          ) : assistantText ? (
            <div className="px-4 py-3 rounded-2xl bg-[#1e1f20] border border-[#333538] text-xs sm:text-sm text-[#e3e3e3] max-w-md max-h-36 overflow-y-auto text-left leading-relaxed shadow-lg">
              <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#333538]">
                <span className="text-[11px] font-semibold text-[#8ab4f8]">Nexus (voix)</span>
                {voiceState === 'speaking' && (
                  <button
                    onClick={stopSpeaking}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
                  >
                    <Square className="w-3 h-3 fill-rose-400" />
                    Arrêter
                  </button>
                )}
              </div>
              <p className="whitespace-pre-line">{assistantText}</p>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-[#8e918f] max-w-sm">
              Posez n'importe quelle question (ex : « Donne-moi la table de 10 », « Quelle est la capitale de l'Australie ? »).
            </p>
          )}
        </div>

        {/* Permission / Unsupported Warning if mic denied */}
        {micPermissionDenied && (
          <div className="mt-4 px-4 py-2 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200">
            Microphone bloqué. Vous pouvez autoriser le micro dans les paramètres de votre navigateur.
          </div>
        )}
      </main>

      {/* Bottom Controls & Quick Voice Prompts */}
      <footer className="w-full max-w-xl flex flex-col items-center gap-3 shrink-0">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => {
              const q = 'Donne-moi la table de 10';
              setUserTranscript(q);
              sendQuestion(q);
            }}
            className="text-xs px-3 py-1.5 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white border border-[#333538] transition-all"
          >
            « Donne-moi la table de 10 »
          </button>
          <button
            onClick={() => {
              const q = 'Combien font 45 * 12 ?';
              setUserTranscript(q);
              sendQuestion(q);
            }}
            className="text-xs px-3 py-1.5 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white border border-[#333538] transition-all"
          >
            « Combien font 45 * 12 ? »
          </button>
          <button
            onClick={() => {
              const q = 'Quelle est la vitesse de la lumière ?';
              setUserTranscript(q);
              sendQuestion(q);
            }}
            className="text-xs px-3 py-1.5 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white border border-[#333538] transition-all"
          >
            « Vitesse de la lumière ? »
          </button>
        </div>

        <p className="text-[11px] text-[#8e918f] text-center">
          Nexus répond vocalement • Créateur : <span className="text-[#e3e3e3]">le vrai Rax</span>
        </p>
      </footer>
    </div>
  );
}
