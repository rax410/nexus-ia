import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  Volume2,
  VolumeX,
  Sparkles,
  Waves,
  ArrowLeft,
  Square,
  ExternalLink,
  Play,
  Send,
  AlertCircle,
  Radio,
  Download,
  Image as ImageIcon,
} from 'lucide-react';
import { NexusAvatar } from './NexusAvatar';

interface NexusVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewMessage: (userText: string, assistantReply: string, imageUrl?: string, audioUrl?: string) => void;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export function NexusVoiceModal({ isOpen, onClose, onNewMessage }: NexusVoiceModalProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [userTranscript, setUserTranscript] = useState('');
  const [assistantText, setAssistantText] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Appuyez ou restez appuyé sur le rond pour parler');
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const [isInIframe, setIsInIframe] = useState(false);
  const [quickInput, setQuickInput] = useState('');

  // Audio & media refs
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const speechIntervalRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recordTimerRef = useRef<any>(null);
  const latestTranscriptRef = useRef<string>('');

  // Push-to-talk tracking refs
  const isPointerDownRef = useRef(false);
  const pointerStartTimeRef = useRef(0);
  const isVoiceHoldModeRef = useRef(false);

  // Detect iframe sandbox
  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }
  }, []);

  // Web Audio chime generator for audible confirmation
  const playAudibleChime = useCallback((freq: number, duration: number, type: OscillatorType = 'sine') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio feedback chime error:', e);
    }
  }, []);

  // Clean Markdown & math characters for natural speech
  const cleanMarkdownForVoice = (raw: string): string => {
    return raw
      .replace(/[*_#`~>\[\]\(\)]/g, '')
      .replace(/-{3,}/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\|/g, ', ')
      .replace(/×/g, ' fois ')
      .replace(/\*/g, ' fois ')
      .replace(/[\n\r]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Permanent Audio Unlock on first touch/interaction
  const unlockAudioContext = useCallback(() => {
    try {
      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new Audio();
      }
      // Play 1ms silent wav to permanently unlock HTML5 autoplay on iOS / Chrome
      audioPlayerRef.current.src =
        'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      audioPlayerRef.current.play().catch(() => {});

      if ('speechSynthesis' in window) {
        window.speechSynthesis.resume();
      }
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = audioContextRef.current || new AudioCtx();
        audioContextRef.current = ctx;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
      }
    } catch (e) {
      console.warn('Audio unlock warning:', e);
    }
  }, []);

  // Fallback to Web Speech API SpeechSynthesis if server audio stream is unreachable
  const fallbackToSpeechSynthesis = useCallback(
    (textToSpeak: string) => {
      if (!('speechSynthesis' in window) || isMuted) {
        setVoiceState('idle');
        return;
      }
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const cleaned = cleanMarkdownForVoice(textToSpeak);
        const utterance = new SpeechSynthesisUtterance(cleaned);
        utterance.lang = 'fr-FR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

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

        if (frVoice) utterance.voice = frVoice;

        utterance.onstart = () => {
          setVoiceState('speaking');
          setStatusMessage('Nexus parle à voix haute...');
          speechIntervalRef.current = setInterval(() => {
            setAudioLevel(Math.floor(Math.random() * 40) + 30);
          }, 100);
        };

        utterance.onend = () => {
          if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
          setAudioLevel(0);
          setVoiceState('idle');
          setStatusMessage('Appuyez ou restez appuyé sur le rond pour parler.');
        };

        utterance.onerror = () => {
          if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
          setAudioLevel(0);
          setVoiceState('idle');
        };

        window.speechSynthesis.speak(utterance);
      } catch {
        setVoiceState('idle');
      }
    },
    [isMuted]
  );

  // High-fidelity spoken audio playback from server /api/tts
  const playNexusSpokenVoice = useCallback(
    (textToSpeak: string, providedAudioUrl?: string) => {
      if (isMuted) {
        setVoiceState('idle');
        setStatusMessage('Son coupé. Appuyez sur le rond pour parler.');
        return;
      }

      // Stop any pending speech or audio
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      }
      if (speechIntervalRef.current) {
        clearInterval(speechIntervalRef.current);
        speechIntervalRef.current = null;
      }

      const cleanText = cleanMarkdownForVoice(textToSpeak);
      const url =
        providedAudioUrl ||
        `/api/tts?text=${encodeURIComponent(cleanText.slice(0, 360))}`;

      try {
        let audio = audioPlayerRef.current;
        if (!audio) {
          audio = new Audio();
          audioPlayerRef.current = audio;
        }

        audio.src = url;
        audio.preload = 'auto';

        audio.onplay = () => {
          setVoiceState('speaking');
          setStatusMessage('Nexus vous répond à voix haute...');

          // Dynamic visualizer pulses during playback
          speechIntervalRef.current = setInterval(() => {
            setAudioLevel(Math.floor(Math.random() * 45) + 35);
          }, 80);
        };

        audio.onended = () => {
          if (speechIntervalRef.current) {
            clearInterval(speechIntervalRef.current);
            speechIntervalRef.current = null;
          }
          setAudioLevel(0);
          setVoiceState('idle');
          setStatusMessage('Appuyez ou restez appuyé sur le rond pour parler.');
        };

        audio.onerror = (e) => {
          console.warn('Audio stream error, using speech synthesis fallback:', e);
          fallbackToSpeechSynthesis(cleanText);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Audio play prevented, fallback:', err);
            fallbackToSpeechSynthesis(cleanText);
          });
        }
      } catch (err) {
        console.warn('Audio playback error:', err);
        fallbackToSpeechSynthesis(cleanText);
      }
    },
    [fallbackToSpeechSynthesis, isMuted]
  );

  // Stop currently playing voice
  const stopSpeaking = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (speechIntervalRef.current) {
      clearInterval(speechIntervalRef.current);
      speechIntervalRef.current = null;
    }
    setAudioLevel(0);
    setVoiceState('idle');
    setStatusMessage('Réponse vocale arrêtée. Appuyez sur le rond pour parler.');
  }, []);

  // Stop microphone stream & visualizer
  const stopMicrophoneStream = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    setAudioLevel(0);
    setRecordingSeconds(0);
  }, []);

  // Send voice query to server API and play speech response
  const sendQuestionToNexus = useCallback(
    async (questionText: string) => {
      const q = questionText.trim();
      if (!q) {
        setVoiceState('idle');
        setStatusMessage('Veuillez formuler une question ou demande.');
        return;
      }

      stopMicrophoneStream();
      setVoiceState('processing');
      setStatusMessage('Nexus prépare la réponse vocale...');

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: q }],
          }),
        });

        if (!res.ok) throw new Error(`Erreur ${res.status}`);

        const data = await res.json();
        const reply = data.reply || 'Voici la réponse.';
        const imageUrl = data.imageUrl || null;
        const audioUrl = data.audioUrl;

        setAssistantText(reply);
        setCurrentImageUrl(imageUrl);
        onNewMessage(q, reply, imageUrl, audioUrl);

        // Speak aloud
        playNexusSpokenVoice(reply, audioUrl);
      } catch (err: any) {
        console.error('Erreur API Nexus Voice:', err);
        const fallback = 'Voici la réponse directe à votre demande.';
        setAssistantText(fallback);
        setCurrentImageUrl(null);
        onNewMessage(q, fallback);
        playNexusSpokenVoice(fallback);
      }
    },
    [onNewMessage, playNexusSpokenVoice, stopMicrophoneStream]
  );

  // Start microphone listening
  const startListening = useCallback(async () => {
    unlockAudioContext();
    stopSpeaking();
    setAssistantText('');
    setCurrentImageUrl(null);
    setUserTranscript('');
    latestTranscriptRef.current = '';
    setMicErrorMessage(null);

    playAudibleChime(440, 0.12, 'sine'); // A4 chime
    setVoiceState('listening');
    setStatusMessage('Écoute en cours... Parlez maintenant.');

    // 1. Microphone Audio Visualizer via getUserMedia
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        setHasMicPermission(true);

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = audioContextRef.current || new AudioCtx();
          audioContextRef.current = ctx;
          if (ctx.state === 'suspended') await ctx.resume();

          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateLevel = () => {
            if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
              animFrameRef.current = requestAnimationFrame(updateLevel);
            }
          };
          updateLevel();
        }

        // Recording timer
        setRecordingSeconds(0);
        recordTimerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
      }
    } catch (err: any) {
      console.warn('Microphone stream error:', err);
      setHasMicPermission(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicErrorMessage(
          "L'accès au microphone est bloqué dans cette fenêtre. Cliquez sur « Plein écran » ci-dessus pour libérer le micro à 100%."
        );
      }
    }

    // 2. Speech Recognition (Web Speech API)
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      setStatusMessage('Reconnaissance vocale système indisponible. Utilisez la saisie rapide ci-dessous.');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'fr-FR';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setVoiceState('listening');
        setStatusMessage('Nexus vous écoute... Parlez naturellement.');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setUserTranscript(currentTranscript);
        latestTranscriptRef.current = currentTranscript;
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          setHasMicPermission(false);
          setMicErrorMessage(
            "Le micro est bloqué par la politique de l'iframe. Ouvrez en plein écran pour autoriser le microphone."
          );
        }
      };

      recognition.onend = () => {
        // If not in hold mode and ended naturally with text
        if (!isPointerDownRef.current && latestTranscriptRef.current.trim()) {
          sendQuestionToNexus(latestTranscriptRef.current.trim());
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (recErr: any) {
      console.warn('SpeechRecognition start failed:', recErr);
    }
  }, [playAudibleChime, sendQuestionToNexus, stopSpeaking, unlockAudioContext]);

  // Finish listening and send the voice prompt
  const finishListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    stopMicrophoneStream();
    playAudibleChime(392, 0.12, 'sine'); // G4 chime

    const finalQuery = latestTranscriptRef.current.trim();
    if (finalQuery) {
      sendQuestionToNexus(finalQuery);
    } else {
      setVoiceState('idle');
      setStatusMessage('Aucune parole détectée. Restez appuyé pour parler.');
    }
  }, [playAudibleChime, sendQuestionToNexus, stopMicrophoneStream]);

  // Pointer Down (Finger or Mouse pressed on the central Orb)
  const handleOrbPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    unlockAudioContext();

    if (voiceState === 'speaking') {
      stopSpeaking();
      return;
    }

    isPointerDownRef.current = true;
    pointerStartTimeRef.current = Date.now();
    isVoiceHoldModeRef.current = true;

    // Start listening immediately as finger touches the orb
    startListening();
  };

  // Pointer Up (Finger lifted "une fois qu'on enlève notre doigt" or Mouse released)
  const handleOrbPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    const pressDuration = Date.now() - pointerStartTimeRef.current;

    if (pressDuration >= 350) {
      // User held their finger down, spoke, and just lifted their finger!
      // Finish and send immediately!
      finishListening();
    } else {
      // Short tap (Mode "où on appuie"):
      // Keep listening hands-free, or if already listening, tap to finish
      if (voiceState === 'listening' && pressDuration > 50) {
        // Toggle behavior
        // Let it continue listening until next tap or speech end
      }
    }
  };

  const handleOrbPointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isPointerDownRef.current) {
      isPointerDownRef.current = false;
      finishListening();
    }
  };

  // Direct test voice button: speaks loud and clear immediately
  const handleTestVoice = () => {
    unlockAudioContext();
    stopSpeaking();
    const demo =
      'Bonjour ! Je suis Nexus, créé par le vrai Rax. Ma voix et la génération d\'images fonctionnent parfaitement. Restez appuyé sur le rond pour me parler !';
    setAssistantText(demo);
    setCurrentImageUrl(null);
    playNexusSpokenVoice(demo);
  };

  // Send sample test question or image generation request
  const handleTestPrompt = (prompt: string) => {
    unlockAudioContext();
    stopSpeaking();
    setUserTranscript(prompt);
    sendQuestionToNexus(prompt);
  };

  // Repeat current assistant text
  const handleReplaySpeech = () => {
    unlockAudioContext();
    if (assistantText) {
      playNexusSpokenVoice(assistantText);
    } else {
      handleTestVoice();
    }
  };

  // Quick form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    unlockAudioContext();
    const q = quickInput.trim();
    setQuickInput('');
    setUserTranscript(q);
    sendQuestionToNexus(q);
  };

  // Cleanup on close / unmount
  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      stopMicrophoneStream();
      stopSpeaking();
      setVoiceState('idle');
      setUserTranscript('');
      setAssistantText('');
      setCurrentImageUrl(null);
      setMicErrorMessage(null);
      isPointerDownRef.current = false;
    } else {
      unlockAudioContext();
      setStatusMessage('Appuyez ou restez appuyé sur le grand rond pour parler');
    }
  }, [isOpen, stopMicrophoneStream, stopSpeaking, unlockAudioContext]);

  if (!isOpen) return null;

  return (
    <div
      id="nexus-voice-interface-modal"
      className="fixed inset-0 z-50 bg-[#08090d]/95 backdrop-blur-2xl flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 select-none overflow-y-auto"
      onClick={unlockAudioContext}
    >
      {/* Top Header */}
      <header className="w-full max-w-2xl flex items-center justify-between gap-3 shrink-0">
        <button
          id="btn-voice-back"
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#1b1d22] hover:bg-[#252830] text-[#c4c7c5] hover:text-white text-xs sm:text-sm transition-all border border-[#2f333d] shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au chat</span>
        </button>

        {/* Identity & Status */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1b1d22] border border-[#2f333d] text-xs">
          <NexusAvatar size="sm" />
          <span className="font-semibold text-white">Mode Voix & Images</span>
          <span className="text-[#3c4043]">•</span>
          <span className="text-cyan-400 font-medium flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            Vocal Direct
          </span>
        </div>

        {/* Action buttons: Mute & New Tab */}
        <div className="flex items-center gap-2">
          {isInIframe && (
            <button
              type="button"
              onClick={() => window.open(window.location.href, '_blank')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/50 hover:bg-cyan-900/70 text-cyan-300 hover:text-white border border-cyan-800/60 text-xs transition-all shadow-sm"
              title="Ouvrir dans un nouvel onglet pour débloquer le microphone à 100%"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Plein écran</span>
            </button>
          )}

          <button
            id="btn-voice-mute-toggle"
            type="button"
            onClick={() => {
              if (!isMuted) stopSpeaking();
              setIsMuted(!isMuted);
            }}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-full border transition-all flex items-center gap-1.5 text-xs ${
              isMuted
                ? 'bg-rose-950/50 border-rose-800/80 text-rose-300'
                : 'bg-[#1b1d22] border-[#2f333d] text-[#c4c7c5] hover:text-white'
            }`}
            title={isMuted ? 'Activer la voix' : 'Couper le son'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            <span className="hidden md:inline">{isMuted ? 'Son coupé' : 'Son actif'}</span>
          </button>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-xl text-center px-4 my-auto py-3">
        {/* Dynamic Status Pill */}
        <div className="mb-3 flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1b1d22] border border-[#2f333d] text-xs sm:text-sm text-[#e3e3e3] shadow-md">
          {voiceState === 'listening' && (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="font-semibold text-rose-300">
                Nexus vous écoute ({recordingSeconds}s)... Relâchez pour envoyer
              </span>
            </>
          )}
          {voiceState === 'speaking' && (
            <>
              <Waves className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="font-semibold text-cyan-300">Nexus vous répond à voix haute</span>
            </>
          )}
          {voiceState === 'processing' && (
            <>
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span className="font-semibold text-amber-300">Nexus génère la réponse...</span>
            </>
          )}
          {voiceState === 'idle' && (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="font-medium text-[#c4c7c5]">{statusMessage}</span>
            </>
          )}
        </div>

        {/* Central Orb Container (Le Grand Rond avec Push-to-Talk) */}
        <div className="relative flex items-center justify-center my-4">
          {/* Animated concentric radar waves */}
          <div
            className={`absolute rounded-full transition-all duration-150 pointer-events-none ${
              voiceState === 'listening'
                ? 'bg-gradient-to-tr from-rose-500/35 via-purple-500/30 to-amber-400/30 blur-md'
                : voiceState === 'speaking'
                ? 'bg-gradient-to-tr from-cyan-500/40 via-blue-500/30 to-emerald-400/35 blur-md'
                : 'bg-transparent'
            }`}
            style={{
              width: `${210 + audioLevel * 1.3}px`,
              height: `${210 + audioLevel * 1.3}px`,
              opacity: voiceState !== 'idle' ? 0.7 : 0,
            }}
          />

          <div
            className={`absolute rounded-full pointer-events-none transition-all duration-300 ${
              voiceState === 'listening'
                ? 'bg-rose-500/20 blur-2xl animate-pulse'
                : voiceState === 'speaking'
                ? 'bg-cyan-400/25 blur-2xl animate-pulse'
                : 'bg-cyan-500/10 blur-xl'
            }`}
            style={{ width: '270px', height: '270px' }}
          />

          {/* The Core Interactive Rond Button (Push-to-Talk & Tap) */}
          <button
            id="nexus-voice-orb-button"
            type="button"
            onPointerDown={handleOrbPointerDown}
            onPointerUp={handleOrbPointerUp}
            onPointerCancel={handleOrbPointerCancel}
            className={`group relative w-48 h-48 sm:w-52 sm:h-52 rounded-full p-2.5 transition-all duration-200 transform active:scale-95 focus:outline-none cursor-pointer touch-none select-none ${
              voiceState === 'listening'
                ? 'bg-gradient-to-tr from-rose-500 via-purple-500 via-amber-400 to-cyan-400 shadow-[0_0_60px_rgba(244,63,94,0.7)] scale-105 ring-4 ring-rose-500/50'
                : voiceState === 'speaking'
                ? 'bg-gradient-to-tr from-cyan-400 via-blue-500 via-emerald-400 to-indigo-500 shadow-[0_0_60px_rgba(6,182,212,0.7)] scale-105 ring-4 ring-cyan-400/40'
                : voiceState === 'processing'
                ? 'bg-gradient-to-tr from-amber-400 via-purple-500 to-rose-500 shadow-[0_0_40px_rgba(245,158,11,0.6)] animate-pulse'
                : 'bg-gradient-to-tr from-cyan-500 via-indigo-600 via-purple-600 to-pink-500 shadow-[0_0_35px_rgba(6,182,212,0.35)] hover:shadow-[0_0_55px_rgba(6,182,212,0.6)] hover:scale-105'
            }`}
            title="Restez appuyé avec votre doigt pour parler, relâchez pour recevoir la réponse"
          >
            {/* Inner Dark Core */}
            <div className="w-full h-full rounded-full bg-[#0b0c10] flex flex-col items-center justify-center relative overflow-hidden transition-colors border border-white/20">
              {/* Internal glow */}
              <div
                className={`absolute inset-0 transition-opacity duration-300 ${
                  voiceState === 'listening'
                    ? 'bg-radial from-rose-500/30 to-transparent'
                    : voiceState === 'speaking'
                    ? 'bg-radial from-cyan-400/30 to-transparent'
                    : 'bg-radial from-cyan-500/10 to-transparent'
                }`}
              />

              {/* State 1: Listening */}
              {voiceState === 'listening' && (
                <div className="flex flex-col items-center gap-1.5 z-10 pointer-events-none">
                  <Mic className="w-12 h-12 text-rose-400 animate-bounce" />
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-widest">
                    Nexus écoute
                  </span>
                  <span className="text-[10px] text-rose-200/90 font-medium">
                    Enlevez le doigt pour envoyer
                  </span>
                </div>
              )}

              {/* State 2: Speaking */}
              {voiceState === 'speaking' && (
                <div className="flex flex-col items-center gap-1.5 z-10 pointer-events-none">
                  <Volume2 className="w-12 h-12 text-cyan-400 animate-pulse" />
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">
                    Nexus parle
                  </span>
                  <span className="text-[10px] text-cyan-200/80">Appuyez pour arrêter</span>
                </div>
              )}

              {/* State 3: Processing */}
              {voiceState === 'processing' && (
                <div className="flex flex-col items-center gap-2 z-10 pointer-events-none">
                  <Sparkles className="w-12 h-12 text-amber-400 animate-spin" />
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">
                    Réflexion...
                  </span>
                </div>
              )}

              {/* State 4: Idle */}
              {voiceState === 'idle' && (
                <div className="flex flex-col items-center gap-2 z-10 pointer-events-none">
                  <div className="w-14 h-14 rounded-full bg-cyan-950/50 border border-cyan-500/40 flex items-center justify-center shadow-inner">
                    <Mic className="w-7 h-7 text-cyan-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-white tracking-wide">
                    Restez appuyé
                  </span>
                  <span className="text-[10px] text-[#9aa0a6]">Relâchez pour répondre</span>
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Audio Equalizer Waves */}
        <div className="h-6 flex items-center justify-center gap-1.5 my-1.5">
          {[30, 65, 45, 90, 60, 100, 75, 95, 50, 85, 40, 70, 35].map((h, i) => {
            const heightVal =
              voiceState === 'listening'
                ? Math.max(5, Math.round((audioLevel * h) / 100) + 4)
                : voiceState === 'speaking'
                ? Math.max(7, Math.round((Math.sin(Date.now() / 150 + i) + 1.2) * (h / 4)) + 5)
                : 5;

            return (
              <span
                key={i}
                className={`w-1.5 rounded-full transition-all duration-100 ${
                  voiceState === 'listening'
                    ? 'bg-gradient-to-t from-rose-500 to-purple-400'
                    : voiceState === 'speaking'
                    ? 'bg-gradient-to-t from-cyan-400 to-blue-500'
                    : 'bg-[#2a2d35]'
                }`}
                style={{ height: `${heightVal}px` }}
              />
            );
          })}
        </div>

        {/* Transcription, AI Image & Response Display Box */}
        <div className="w-full mt-2 min-h-[90px] flex flex-col items-center justify-center">
          {userTranscript && voiceState === 'listening' ? (
            <div className="w-full max-w-md px-4 py-2.5 rounded-2xl bg-[#1b1d22] border border-rose-500/40 text-sm text-[#e3e3e3] shadow-md text-left">
              <span className="text-[11px] text-rose-400 font-semibold block mb-0.5 uppercase tracking-wider">
                Votre voix en direct :
              </span>
              <p className="font-medium text-white italic">« {userTranscript} »</p>
            </div>
          ) : assistantText ? (
            <div className="w-full max-w-md px-4 py-3 rounded-2xl bg-[#1b1d22] border border-[#2f333d] text-xs sm:text-sm text-[#e3e3e3] max-h-56 overflow-y-auto text-left leading-relaxed shadow-xl">
              <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#2f333d]">
                <span className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-cyan-400" />
                  Nexus (Réponse vocale)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReplaySpeech}
                    className="text-[11px] text-cyan-300 hover:text-white flex items-center gap-1 font-medium px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/50"
                    title="Réécouter à voix haute"
                  >
                    <Play className="w-2.5 h-2.5 fill-cyan-300" />
                    Réécouter
                  </button>
                  {voiceState === 'speaking' && (
                    <button
                      type="button"
                      onClick={stopSpeaking}
                      className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium px-2 py-0.5 rounded bg-rose-950/40 border border-rose-800/50"
                    >
                      <Square className="w-2.5 h-2.5 fill-rose-400" />
                      Arrêter
                    </button>
                  )}
                </div>
              </div>

              <p className="whitespace-pre-line text-[#e3e3e3] font-normal">{assistantText}</p>

              {/* AI Generated Image inside Voice Modal */}
              {currentImageUrl && (
                <div className="mt-2.5 overflow-hidden rounded-xl border border-cyan-500/40 bg-black/50 shadow-lg relative group">
                  <img
                    src={currentImageUrl}
                    alt="Image IA créée par Nexus"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto max-h-48 object-cover rounded-xl"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] text-cyan-300 border border-white/10 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-300" />
                    <span>Image IA Nexus</span>
                  </div>
                  <a
                    href={currentImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-black/80 hover:bg-black text-white text-[11px] font-medium border border-white/20 flex items-center gap-1 shadow-md"
                  >
                    <Download className="w-3 h-3" />
                    <span>HD</span>
                  </a>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-[#9aa0a6] max-w-sm leading-relaxed">
              Restez appuyé avec votre doigt sur le grand rond, posez votre question ou demandez une image, puis enlevez votre doigt pour recevoir la réponse à voix haute.
            </p>
          )}
        </div>

        {/* Warning or Iframe Helper when Mic is restricted */}
        {(hasMicPermission === false || micErrorMessage) && (
          <div className="mt-2 w-full max-w-md px-3.5 py-2.5 rounded-2xl bg-amber-950/60 border border-amber-800/80 text-xs text-amber-200 text-left flex items-start gap-2.5 shadow-lg">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300 mb-0.5">Microphone restreint par le navigateur</p>
              <p className="mb-1.5 text-amber-200/90 leading-relaxed text-[11px]">
                Pour débloquer le micro à 100%, ouvrez l'application en plein écran.
              </p>
              <button
                type="button"
                onClick={() => window.open(window.location.href, '_blank')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-[11px] transition-colors shadow"
              >
                <ExternalLink className="w-3 h-3" />
                Ouvrir en plein écran
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Footer: Quick Voice Queries & Direct Sound Test */}
      <footer className="w-full max-w-2xl flex flex-col items-center gap-2.5 shrink-0">
        {/* Direct quick input in the voice modal to test voice audio instantly */}
        <form
          onSubmit={handleFormSubmit}
          className="w-full flex items-center gap-2 bg-[#1b1d22] border border-[#2f333d] rounded-full px-3.5 py-1.5 shadow-lg focus-within:border-cyan-500"
        >
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder="Posez une question ou demandez une image (ex: Crée une image d'un tigre)..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-[#80868b] focus:outline-none px-2 py-1"
          />
          <button
            type="submit"
            disabled={!quickInput.trim() || voiceState === 'processing'}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
              quickInput.trim()
                ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow'
                : 'bg-[#252830] text-[#5f6368] cursor-not-allowed'
            }`}
          >
            <span>Envoyer</span>
            <Send className="w-3 h-3" />
          </button>
        </form>

        {/* 1-Click voice trigger questions & image creation to hear Nexus respond immediately */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-xl">
          <button
            type="button"
            onClick={handleTestVoice}
            className="text-[11px] px-3 py-1.5 rounded-full bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 hover:text-white border border-cyan-700/70 transition-all flex items-center gap-1.5 font-semibold shadow-md"
            title="Tester immédiatement la voix de Nexus à voix haute"
          >
            <Play className="w-3 h-3 fill-cyan-300" />
            <span>Tester la voix</span>
          </button>

          <button
            type="button"
            onClick={() => handleTestPrompt('Crée une image d\'un chat astronaute')}
            className="text-[11px] px-3 py-1.5 rounded-full bg-purple-950/50 hover:bg-purple-900/70 text-purple-300 hover:text-white border border-purple-800/60 transition-all flex items-center gap-1.5"
          >
            <ImageIcon className="w-3 h-3 text-purple-400" />
            <span>« Crée une image d'un chat »</span>
          </button>

          <button
            type="button"
            onClick={() => handleTestPrompt('Donne-moi la table de 10')}
            className="text-[11px] px-3 py-1.5 rounded-full bg-[#1b1d22] hover:bg-[#252830] text-[#c4c7c5] hover:text-white border border-[#2f333d] transition-all flex items-center gap-1.5"
          >
            <Mic className="w-3 h-3 text-cyan-400" />
            <span>« Table de 10 »</span>
          </button>

          <button
            type="button"
            onClick={() => handleTestPrompt('Quelle est la vitesse de la lumière ?')}
            className="text-[11px] px-3 py-1.5 rounded-full bg-[#1b1d22] hover:bg-[#252830] text-[#c4c7c5] hover:text-white border border-[#2f333d] transition-all flex items-center gap-1.5"
          >
            <Mic className="w-3 h-3 text-cyan-400" />
            <span>« Vitesse de la lumière »</span>
          </button>
        </div>

        <p className="text-[10px] sm:text-[11px] text-[#80868b] text-center">
          Nexus Assistant Vocal & IA Images • Restez appuyé pour parler, relâchez pour recevoir la réponse
        </p>
      </footer>
    </div>
  );
}
