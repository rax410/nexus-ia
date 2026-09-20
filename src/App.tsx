import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp, Loader2, Sparkles, ShieldCheck, Mic, Image as ImageIcon } from 'lucide-react';
import { ChatMessage, ChatSession } from './types';
import { GeminiSidebar } from './components/GeminiSidebar';
import { GeminiHeader } from './components/GeminiHeader';
import { ChatMessageItem } from './components/ChatMessageItem';
import { SuggestedPrompts } from './components/SuggestedPrompts';
import { NexusAvatar } from './components/NexusAvatar';
import { NexusVoiceModal } from './components/NexusVoiceModal';

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-0',
  role: 'assistant',
  content: 'Bonjour ! Que souhaitez-vous savoir ou calculer aujourd\'hui ? Je réponds directement à toutes vos questions (calculs, sciences, faits, programmation, culture générale).',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const INITIAL_SESSIONS: ChatSession[] = [
  {
    id: 'session-default',
    title: 'Discussion générale',
    messages: [DEFAULT_WELCOME_MESSAGE],
    updatedAt: Date.now(),
  },
];

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_gemini_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback to initial
    }
    return INITIAL_SESSIONS;
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return sessions[0]?.id || 'session-default';
  });

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Active session helper
  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const messages = currentSession?.messages || [DEFAULT_WELCOME_MESSAGE];

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nexus_gemini_sessions', JSON.stringify(sessions));
    } catch {
      // Ignore
    }
  }, [sessions]);

  // Check health and API key status on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.hasApiKey === 'boolean') {
          setHasApiKey(data.hasApiKey);
        }
      })
      .catch(() => {
        // Fallback
      });
  }, []);

  // Auto-scroll on new messages or loading
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Responsive sidebar collapse on smaller screens initially
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend !== undefined ? textToSend : input).trim();
    if (!messageContent || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];

    // Compute title for the session if it was default
    const sessionTitle =
      currentSession.messages.length <= 1
        ? messageContent.slice(0, 32) + (messageContent.length > 32 ? '...' : '')
        : currentSession.title;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSession.id
          ? { ...s, title: sessionTitle, messages: newMessages, updatedAt: Date.now() }
          : s
      )
    );

    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: `nexus-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Voici la réponse à votre demande.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source,
        imageUrl: data.imageUrl,
        audioUrl: data.audioUrl,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSession.id
            ? { ...s, messages: [...newMessages, assistantMessage], updatedAt: Date.now() }
            : s
        )
      );
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackMessage: ChatMessage = {
        id: `nexus-fallback-${Date.now()}`,
        role: 'assistant',
        content: `Une légère interruption réseau est survenue lors de l'envoi. Veuillez réessayer votre question, je suis disponible pour vous répondre.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSession.id
            ? { ...s, messages: [...newMessages, fallbackMessage], updatedAt: Date.now() }
            : s
        )
      );
    } finally {
      setLoading(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    const newSessionId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'Nouvelle discussion',
      messages: [
        {
          ...DEFAULT_WELCOME_MESSAGE,
          id: `welcome-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      updatedAt: Date.now(),
    };

    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSessionId);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      handleResetCurrentSession();
      return;
    }
    const filtered = sessions.filter((s) => s.id !== id);
    setSessions(filtered);
    if (currentSessionId === id) {
      setCurrentSessionId(filtered[0]?.id || 'session-default');
    }
  };

  const handleResetCurrentSession = () => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? {
              ...s,
              title: 'Nouvelle discussion',
              messages: [
                {
                  ...DEFAULT_WELCOME_MESSAGE,
                  id: `welcome-${Date.now()}`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ],
              updatedAt: Date.now(),
            }
          : s
      )
    );
  };

  const handleVoiceNewMessage = (
    userText: string,
    assistantReply: string,
    imageUrl?: string,
    audioUrl?: string
  ) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user-voice-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: nowTime,
    };
    const assistantMsg: ChatMessage = {
      id: `assistant-voice-${Date.now() + 1}`,
      role: 'assistant',
      content: assistantReply,
      timestamp: nowTime,
      imageUrl,
      audioUrl,
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          const updatedTitle =
            s.messages.length <= 1
              ? userText.length > 25
                ? userText.slice(0, 25) + '...'
                : userText
              : s.title;
          return {
            ...s,
            title: updatedTitle,
            messages: [...s.messages, userMsg, assistantMsg],
            updatedAt: Date.now(),
          };
        }
        return s;
      })
    );
  };

  const isFreshConversation = messages.length <= 1;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#131314] text-[#e3e3e3] font-sans">
      {/* Gemini Left Sidebar */}
      <GeminiSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        onSelectSession={(id) => {
          setCurrentSessionId(id);
          if (window.innerWidth < 768) setSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        hasApiKey={hasApiKey}
      />

      {/* Main Central Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#131314] relative overflow-hidden">
        {/* Gemini Header */}
        <GeminiHeader
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onReset={handleResetCurrentSession}
          onOpenVoice={() => setIsVoiceModalOpen(true)}
          hasApiKey={hasApiKey}
          messageCount={messages.length}
        />

        {/* Scrollable Conversation Center */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6 flex flex-col items-center">
          <div className="w-full max-w-3xl flex-1 flex flex-col">
            {isFreshConversation ? (
              // Gemini Empty State Hero Screen
              <div className="my-auto py-8 flex flex-col items-center text-center">
                <div className="mb-6 relative">
                  <NexusAvatar size="xl" showStatus className="ring-4 ring-[#1e1f20]" />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-[#1e1f20] border border-[#333538] text-[11px] text-[#8ab4f8] font-medium flex items-center gap-1 shadow-md">
                    <ShieldCheck className="w-3 h-3 text-[#7fcfff]" />
                    Le vrai Rax
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
                  <span className="bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] text-transparent bg-clip-text">
                    Bonjour, je suis Nexus
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-[#9aa0a6] max-w-lg mx-auto leading-relaxed mb-8">
                  Votre assistant IA universel et polyvalent. Réponses directes, complètes et naturelles pour l'ensemble de vos questions (calculs, sciences, faits, programmation).
                </p>

                {/* Gemini-style prompt suggestions cards */}
                <SuggestedPrompts onSelectPrompt={(p) => handleSendMessage(p)} />
              </div>
            ) : (
              // Chat messages stream
              <div className="space-y-2 pb-6">
                {messages.map((msg) => (
                  <ChatMessageItem key={msg.id} message={msg} />
                ))}

                {/* Loading state with Gemini spark animation */}
                {loading && (
                  <div id="gemini-loading-indicator" className="py-4 px-2 sm:px-4 flex items-start gap-3.5">
                    <NexusAvatar size="md" showStatus />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-[#8e918f]">
                        <span className="font-semibold text-white">Nexus</span>
                        <span className="text-[11px] text-[#7fcfff]">Génération en cours...</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#8ab4f8] bg-[#1e1f20] px-4 py-2.5 rounded-2xl border border-[#333538]">
                        <Sparkles className="w-4 h-4 animate-spin text-[#8ab4f8]" />
                        <span>Nexus prépare votre réponse personnalisée...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Gemini Iconic Floating Input Bar */}
        <div className="w-full bg-[#131314] px-4 pb-4 pt-1 flex flex-col items-center shrink-0">
          <div className="w-full max-w-3xl">
            <form
              id="gemini-input-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-end gap-2 rounded-3xl bg-[#1e1f20] hover:bg-[#232427] focus-within:bg-[#282a2c] border border-[#3c4043] focus-within:border-[#8ab4f8] p-2 sm:p-3 transition-all shadow-lg"
            >
              <textarea
                id="gemini-prompt-textarea"
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Discutez avec Nexus..."
                rows={1}
                className="flex-1 max-h-36 min-h-[28px] resize-none bg-transparent px-3 py-1.5 text-sm sm:text-base text-[#e3e3e3] placeholder-[#8e918f] focus:outline-none leading-relaxed"
                style={{ height: 'auto' }}
              />

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  id="btn-quick-image"
                  type="button"
                  onClick={() => {
                    setInput('Génère une image de ');
                    textareaRef.current?.focus();
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 hover:text-white border border-purple-700/50 hover:border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.25)] active:scale-95 group"
                  title="Générer une image par IA avec Nexus"
                >
                  <ImageIcon className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                </button>

                <button
                  id="btn-open-voice-mode"
                  type="button"
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 hover:text-white border border-cyan-700/50 hover:border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)] active:scale-95 group"
                  title="Ouvrir l'interface vocale Nexus (parlez au rond interactif)"
                >
                  <Mic className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                </button>

                <button
                  id="btn-gemini-send"
                  type="submit"
                  disabled={!input.trim() || loading}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    input.trim() && !loading
                      ? 'bg-[#8ab4f8] text-[#041e49] shadow-md hover:bg-[#a8c7fa] active:scale-95'
                      : 'bg-[#282a2c] text-[#5e6368] cursor-not-allowed'
                  }`}
                  title="Envoyer à Nexus"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                  )}
                </button>
              </div>
            </form>

            <div className="mt-2 text-center text-[11px] text-[#8e918f] flex items-center justify-center gap-1.5 flex-wrap">
              <span>Nexus peut faire des erreurs.</span>
              <span className="inline-block w-1 h-1 rounded-full bg-[#5e6368]" />
              <span>
                Assistant officiel conçu et déployé par <strong className="text-[#c4c7c5]">le vrai Rax</strong>.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Voice Mode Modal with animated Orb (Le Rond) */}
      <NexusVoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onNewMessage={handleVoiceNewMessage}
      />
    </div>
  );
}
