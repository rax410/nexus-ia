import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp, Loader2, Sparkles, ShieldCheck, Mic, Image as ImageIcon, X, Settings, MessageSquare, Radio, Gamepad2, LogOut } from 'lucide-react';
import { ChatMessage, ChatSession } from './types';
import { GeminiSidebar } from './components/GeminiSidebar';
import { GeminiHeader } from './components/GeminiHeader';
import { ChatMessageItem } from './components/ChatMessageItem';
import { SuggestedPrompts } from './components/SuggestedPrompts';
import { NexusAvatar } from './components/NexusAvatar';
import { NexusVoiceModal } from './components/NexusVoiceModal';
import { NexusSettingsModal } from './components/NexusSettingsModal';
import { CartoonDinosOverlay } from './components/CartoonDinosOverlay';
import { AuthScreen } from './components/AuthScreen';
import { MiniGameModal } from './components/MiniGameModal';
import { UpgradeModal } from './components/UpgradeModal';
import { RenewalModal } from './components/RenewalModal';
import { AdminModal } from './components/AdminModal';
import { BirthdayCelebration } from './components/BirthdayCelebration';
import { DirectContactModal } from './components/DirectContactModal';
import { NexusHelpModal } from './components/NexusHelpModal';

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
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    try {
      return localStorage.getItem('nexus_logged_user');
    } catch {
      return null;
    }
  });

  const handleLogin = (username: string) => {
    setCurrentUser(username);
    localStorage.setItem('nexus_logged_user', username);
  };

  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const handleLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('nexus_logged_user');
    setIsLogoutConfirmOpen(false);
  };

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
  const [isDirectContactOpen, setIsDirectContactOpen] = useState(false);

  // Settings states
  const [temperature, setTemperature] = useState<number>(() => {
    const saved = localStorage.getItem('nexus_ai_temp');
    return saved !== null ? parseFloat(saved) : 0.6;
  });

  const [brightness, setBrightness] = useState<number>(() => {
    const saved = localStorage.getItem('nexus_screen_brightness');
    return saved !== null ? parseInt(saved, 10) : 100;
  });

  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('nexus_audio_volume');
    return saved !== null ? parseInt(saved, 10) : 100;
  });

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [showDinos, setShowDinos] = useState(false);

  // Coin wallet & upgrade states
  const [coins, setCoins] = useState<number>(() => {
    const saved = localStorage.getItem('nexus_user_coins');
    return saved !== null ? parseInt(saved, 10) : 5; // Start with 5 welcome coins
  });
  const [userTier, setUserTier] = useState<'normal' | 'vip' | 'ultravip'>(() => {
    return (localStorage.getItem('nexus_user_tier') as 'normal' | 'vip' | 'ultravip') || 'normal';
  });

  // Usage time tracker state (Normal mode: 60 minutes default per day, or +60m per 30 coins; Ultra VIP: unlimited)
  const [usageMinutesLeft, setUsageMinutesLeft] = useState<number>(() => {
    const savedDate = localStorage.getItem('nexus_usage_date');
    const today = new Date().toDateString();
    if (savedDate !== today) {
      localStorage.setItem('nexus_usage_date', today);
      localStorage.setItem('nexus_usage_minutes', '60');
      return 60;
    }
    const saved = localStorage.getItem('nexus_usage_minutes');
    return saved !== null ? parseInt(saved, 10) : 60;
  });

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (userTier !== 'ultravip') {
        setUsageMinutesLeft((prev) => {
          if (prev <= 0) return 0;
          const next = prev - 1;
          localStorage.setItem('nexus_usage_minutes', next.toString());
          return next;
        });
      }
    }, 60000); // every minute
    return () => clearInterval(interval);
  }, [userTier]);

  const handleBuyExtraTime = () => {
    if (coins >= 30) {
      const nextCoins = coins - 30;
      setCoins(nextCoins);
      localStorage.setItem('nexus_user_coins', nextCoins.toString());

      const nextMinutes = usageMinutesLeft + 60;
      setUsageMinutesLeft(nextMinutes);
      localStorage.setItem('nexus_usage_minutes', nextMinutes.toString());

      setCoinToast('⏱️ +1 heure de temps ajoutée avec succès !');
      setTimeout(() => setCoinToast(null), 4000);
      setIsUpgradeModalOpen(false);
    }
  };

  const usageTimeFormatted =
    userTier === 'ultravip'
      ? 'Illimité 🌟'
      : `${Math.floor(usageMinutesLeft / 60)}h ${usageMinutesLeft % 60}m restants`;

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isMiniGameOpen, setIsMiniGameOpen] = useState(false);
  const [coinToast, setCoinToast] = useState<string | null>(null);

  const handleAdminAddCoins = (amount: number) => {
    setCoins((prev) => {
      const next = prev + amount;
      localStorage.setItem('nexus_user_coins', next.toString());
      return next;
    });
  };

  useEffect(() => {
    // Check if subscription expired or terminated by admin
    const expiry = localStorage.getItem('nexus_sub_expiry');
    const expiredForced = localStorage.getItem('nexus_sub_expired_forced');
    const now = Date.now();
    const lastShown = localStorage.getItem('nexus_renewal_last_shown');
    const oneMonthMs = 30 * 24 * 60 * 60 * 1000;

    let isExpired = false;
    if (expiredForced === 'true') {
      isExpired = true;
    } else if (expiry) {
      const expiryTime = parseInt(expiry, 10);
      if (now > expiryTime) {
        isExpired = true;
      }
    }

    if (isExpired) {
      // Show only once, then only a month later if still expired and not renewed
      if (!lastShown || now - parseInt(lastShown, 10) > oneMonthMs) {
        setShowRenewalModal(true);
        localStorage.setItem('nexus_renewal_last_shown', now.toString());
      }
    }
  }, []);

  const checkRaxTrigger = (text: string) => {
    if (!text) return;
    if (/\brax\b/i.test(text)) {
      setShowDinos(true);
    }
  };

  const checkCompliment = (text: string) => {
    if (!text) return;
    const complimentKeywords = [
      'merci', 'génial', 'super', 'sympa', 'beau', 'fort', 'intelligent',
      'bravo', 'magnifique', 'incroyable', 'top', 'cool', 'parfait',
      'amour', 'adore', 'gentil', 'magnifique', 'excellent', 'champion', 'merveilleux'
    ];
    const lower = text.toLowerCase();
    const isMatch = complimentKeywords.some((word) => lower.includes(word));
    if (isMatch) {
      setCoins((c) => {
        const next = c + 1;
        localStorage.setItem('nexus_user_coins', next.toString());
        return next;
      });
      setCoinToast('+1 pièce 🪙 ajoutée pour votre compliment !');
      setTimeout(() => setCoinToast(null), 3500);
    }
  };

  const handleEarnCoins = (amount: number) => {
    setCoins((prev) => {
      const earned = userTier === 'vip' ? amount * 2 : amount; // VIP x2 bonus
      const next = prev + earned;
      localStorage.setItem('nexus_user_coins', next.toString());
      return next;
    });
    setCoinToast(`+${userTier === 'vip' ? amount * 2 : amount} pièces 🪙 gagnées ${userTier === 'vip' ? '(Bonus VIP x2)' : ''}!`);
    setTimeout(() => setCoinToast(null), 4000);
  };

  const handleUpgradeTier = (tier: 'vip' | 'ultravip', cost: number) => {
    if (coins >= cost) {
      const nextCoins = coins - cost;
      setCoins(nextCoins);
      localStorage.setItem('nexus_user_coins', nextCoins.toString());

      setUserTier(tier);
      localStorage.setItem('nexus_user_tier', tier);

      const expiryTime = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days / 1 month
      localStorage.setItem('nexus_sub_expiry', expiryTime.toString());
      localStorage.removeItem('nexus_sub_expired_forced');
      localStorage.removeItem('nexus_renewal_last_shown');

      if (tier === 'ultravip') {
        setCoinToast('🌟 Mode Ultra VIP (1 mois illimité) activé avec succès !');
      } else {
        setCoinToast('🛡️ Mode VIP (1 mois) activé avec succès !');
      }
      setTimeout(() => setCoinToast(null), 4500);
      setIsUpgradeModalOpen(false);
      setShowRenewalModal(false);
    }
  };

  const handleChooseNormal = () => {
    setUserTier('normal');
    localStorage.setItem('nexus_user_tier', 'normal');
    const expiryTime = Date.now() + 24 * 60 * 60 * 1000; // 1 day
    localStorage.setItem('nexus_sub_expiry', expiryTime.toString());
    localStorage.removeItem('nexus_sub_expired_forced');
    localStorage.removeItem('nexus_renewal_last_shown');
    setShowRenewalModal(false);
    setCoinToast('Passé en Mode Normal (Valable 1 jour).');
    setTimeout(() => setCoinToast(null), 3500);
  };

  useEffect(() => {
    localStorage.setItem('nexus_ai_temp', temperature.toString());
  }, [temperature]);

  useEffect(() => {
    localStorage.setItem('nexus_screen_brightness', brightness.toString());
  }, [brightness]);

  useEffect(() => {
    localStorage.setItem('nexus_audio_volume', volume.toString());
  }, [volume]);



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
    if (userTier !== 'ultravip' && usageMinutesLeft <= 0) {
      setCoinToast('⚠️ Temps d\'utilisation épuisé ! Achetez +1h (30 🪙) ou passez en Ultra VIP.');
      setIsUpgradeModalOpen(true);
      return;
    }

    const messageContent = (textToSend !== undefined ? textToSend : input).trim();
    if (!messageContent || loading) return;

    // Check for problematic / insulting words for Rax's admin journal
    const problematicWords = ['connard', 'pute', 'merde', 'salope', 'con', 'fdp', 'ta gueule', 'encule', 'debile', 'arnaque', 'haine', 'idiot', 'connasse', 'batard', 'cretin'];
    const lowerText = messageContent.toLowerCase();
    if (problematicWords.some((w) => lowerText.includes(w))) {
      try {
        const existingFlagged = JSON.parse(localStorage.getItem('nexus_flagged_messages') || '[]');
        const newFlagged = [
          {
            id: Date.now().toString(),
            username: currentUser || 'Anonyme',
            text: messageContent,
            timestamp: new Date().toLocaleTimeString() + ' - ' + new Date().toLocaleDateString(),
          },
          ...existingFlagged,
        ];
        localStorage.setItem('nexus_flagged_messages', JSON.stringify(newFlagged));
      } catch {}
    }

    checkRaxTrigger(messageContent);
    checkCompliment(messageContent);

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
          temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }

      const data = await response.json();
      checkRaxTrigger(data.reply);
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
    }
  };

  const handleVoiceNewMessage = (spokenText: string) => {
    handleSendMessage(spokenText);
  };

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'Nouvelle discussion',
      messages: [DEFAULT_WELCOME_MESSAGE],
      updatedAt: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) return;

    const remaining = sessions.filter((s) => s.id !== sessionId);
    setSessions(remaining);
    if (currentSessionId === sessionId) {
      setCurrentSessionId(remaining[0].id);
    }
  };

  const handleResetChat = () => {
    const freshMessage: ChatMessage = {
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      content: 'Discussion réinitialisée. Comment puis-je vous aider ?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSession.id
          ? { ...s, messages: [freshMessage], title: 'Discussion générale', updatedAt: Date.now() }
          : s
      )
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 144)}px`;
    }
  }, [input]);

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-[#131314] text-[#e3e3e3] font-sans antialiased select-none"
      style={{ filter: `brightness(${brightness}%)` }}
    >
      {/* Gemini Sidebar */}
      <GeminiSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSelectSession={(id) => {
          setCurrentSessionId(id);
          if (window.innerWidth < 768) {
            setSidebarOpen(false);
          }
        }}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        hasApiKey={hasApiKey}
        coins={coins}
        onOpenMiniGame={() => setIsMiniGameOpen(true)}
        onUpgrade={() => setIsUpgradeModalOpen(true)}
        userTier={userTier}
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#131314] relative">
        {/* Gemini Header */}
        <GeminiHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onReset={handleResetChat}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          hasApiKey={hasApiKey}
          messageCount={messages.length}
          currentUser={currentUser}
          onLogout={handleLogout}
          coins={coins}
          onOpenMiniGame={() => setIsMiniGameOpen(true)}
          userTier={userTier}
          usageTimeFormatted={usageTimeFormatted}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
          onOpenDirectContact={() => setIsDirectContactOpen(true)}
        />

        {/* Birthday Creator Banner (January 22) */}
        <BirthdayCelebration />

        {/* Broadcast Announcement Banner */}
        {localStorage.getItem('nexus_broadcast_message') && (
          <div className="bg-gradient-to-r from-amber-950 via-red-950 to-amber-950 border-b border-amber-500/60 py-2.5 px-4 text-center text-xs sm:text-sm font-bold text-amber-200 flex items-center justify-center gap-2 z-40 shadow-md">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>📢 Annonce de Rax : {localStorage.getItem('nexus_broadcast_message')}</span>
          </div>
        )}

        {/* Mobile-only Quick Access Bar (Visible strictly on smartphones < 640px) */}
        {currentUser && (
          <div className="flex sm:hidden items-center justify-between bg-[#18191a] border-b border-[#282a2c] px-3 py-2 text-xs gap-2 shrink-0 z-20">
            {/* Profile info */}
            <div className="flex items-center gap-1.5 overflow-hidden">
              <div className="w-6 h-6 rounded-full bg-cyan-600/30 border border-cyan-500/50 flex items-center justify-center text-cyan-300 text-xs font-bold shrink-0">
                {currentUser.charAt(0).toUpperCase()}
              </div>
              <span className="text-white font-semibold truncate max-w-[90px]">{currentUser}</span>
              {userTier === 'ultravip' ? (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow-md uppercase border border-amber-200 shrink-0">
                  Ultra VIP 🌟
                </span>
              ) : userTier === 'vip' ? (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-[9px] px-2 py-0.5 rounded-full shadow-xs shrink-0">
                  👑 VIP
                </span>
              ) : (
                <span className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded bg-[#282a2c] text-[#8e918f] border border-[#3c4043] font-normal shrink-0">
                  Normal
                </span>
              )}
            </div>

            {/* Actions: Game & Logout */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsMiniGameOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-semibold shadow-xs"
                title="Mini-jeu"
              >
                <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Jeu</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/60 text-red-300 border border-red-800/60 font-semibold shadow-xs"
                title="Se déconnecter"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>Quitter</span>
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Conversation Center */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6 flex flex-col items-center nexus-mobile-container">
          <div className="w-full max-w-3xl flex-1 flex flex-col">
            {messages.length === 1 && (
              <div className="py-6 sm:py-10 text-center space-y-4 animate-fade-in">
                <div className="inline-flex p-3 rounded-2xl bg-[#1e1f20] border border-[#2d2f31] shadow-md mb-2">
                  <NexusAvatar size="lg" showStatus />
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                  Bonjour, je suis Nova IA • Coucou.
                </h1>
                <p className="text-sm text-[#9aa0a6] max-w-md mx-auto leading-relaxed">
                  Assistant IA universel doté des technologies de pointe de Google. Posez vos questions, demandez des calculs, des images ou de l'aide en programmation.
                </p>
                <div className="pt-2">
                  <SuggestedPrompts onSelectPrompt={(p) => handleSendMessage(p)} />
                </div>
              </div>
            )}

            <div className="space-y-4 flex-1 pb-6">
              {messages.map((msg) => (
                <ChatMessageItem key={msg.id} message={msg} />
              ))}

              {loading && (
                <div className="flex items-start gap-3.5 py-4 px-2 sm:px-4 animate-pulse">
                  <div className="shrink-0 pt-0.5">
                    <NexusAvatar size="md" showStatus />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#8e918f] bg-[#1e1f20] px-4 py-3 rounded-2xl border border-[#282a2c]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#8ab4f8]" />
                    <span>Nexus réfléchit et rédige sa réponse...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </main>

        {/* Fixed Bottom Input Area */}
        <div className="p-3 sm:p-4 bg-[#131314] border-t border-[#282a2c]/60 nexus-mobile-input-bar">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-end gap-2 rounded-3xl bg-[#1e1f20] hover:bg-[#232427] focus-within:bg-[#282a2c] border border-[#3c4043] focus-within:border-[#8ab4f8] p-2 sm:p-3 transition-all shadow-lg"
            >
              <div className="flex-1 relative flex items-center">
                <textarea
                  id="gemini-prompt-textarea"
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    checkRaxTrigger(e.target.value);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Discutez avec Nexus..."
                  rows={1}
                  className="w-full max-h-36 min-h-[28px] resize-none bg-transparent px-3 py-1.5 text-sm sm:text-base text-[#e3e3e3] placeholder-[#8e918f] focus:outline-none leading-relaxed pr-8"
                  style={{ height: 'auto' }}
                />
                {input && (
                  <button
                    id="btn-clear-input"
                    type="button"
                    onClick={() => {
                      setInput('');
                      textareaRef.current?.focus();
                    }}
                    className="absolute right-2 p-1 rounded-full text-[#8e918f] hover:text-white hover:bg-[#282a2c] transition-colors"
                    title="Effacer le texte"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

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

                {/* Settings Button in Chat Input Bar */}
                <button
                  id="btn-chat-settings"
                  type="button"
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-[#282a2c] hover:bg-[#333538] text-blue-400 hover:text-white border border-[#3c4043] shadow-sm active:scale-95 group"
                  title="Paramètres (Température IA, Luminosité, Son)"
                >
                  <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
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

            {/* Big Admin Button at the bottom of the interface (visible only for Rax) */}
            {currentUser && currentUser.toLowerCase() === 'rax' && (
              <div className="mt-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(true)}
                  className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-red-950 via-red-900 to-red-950 hover:from-red-900 hover:to-red-800 text-red-200 border border-red-600/70 font-bold text-xs sm:text-sm shadow-xl shadow-red-950/40 flex items-center justify-center gap-2.5 transition-all animate-pulse"
                >
                  <ShieldCheck className="w-5 h-5 text-red-400 shrink-0" />
                  <span>🛡️ PANNEAU ADMINISTRATEUR SECRET (Réservé au créateur Rax)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Voice Mode Modal with animated Orb (Le Rond) */}
      <NexusVoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onNewMessage={handleVoiceNewMessage}
      />

      {/* Nexus Settings Modal (Temperature, Brightness, Sound) */}
      <NexusSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        temperature={temperature}
        setTemperature={setTemperature}
        brightness={brightness}
        setBrightness={setBrightness}
        volume={volume}
        setVolume={setVolume}
      />

      {/* Cartoon Dinosaurs Invasion Overlay on mentioning 'rax' */}
      <CartoonDinosOverlay
        active={showDinos}
        onClose={() => setShowDinos(false)}
      />

      {/* Mini-Game Modal */}
      <MiniGameModal
        isOpen={isMiniGameOpen}
        onClose={() => setIsMiniGameOpen(false)}
        onEarnCoins={handleEarnCoins}
      />

      {/* Upgrade Store Modal (VIP 100 coins, Ultra VIP 300 coins) */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        coins={coins}
        currentTier={userTier}
        onUpgrade={handleUpgradeTier}
        onBuyExtraTime={handleBuyExtraTime}
      />

      {/* Admin Panel Modal (Reserved for Rax) */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        coins={coins}
        onAddCoins={handleAdminAddCoins}
      />

      {/* Direct Contact Modal */}
      <DirectContactModal
        isOpen={isDirectContactOpen}
        onClose={() => setIsDirectContactOpen(false)}
        currentUser={currentUser || 'Anonyme'}
      />

      {/* Nexus Help & AI Assistant Guide Modal */}
      <NexusHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onSelectPrompt={(prompt) => {
          setInput(prompt);
          textareaRef.current?.focus();
        }}
      />

      {/* Subscription Renewal Modal after 1 Month */}
      <RenewalModal
        isOpen={showRenewalModal}
        coins={coins}
        onChooseNormal={handleChooseNormal}
        onChooseVip={() => handleUpgradeTier('vip', 100)}
        onChooseUltraVip={() => handleUpgradeTier('ultravip', 300)}
      />

      {/* Logout Confirmation Modal */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#1e1f20] border border-[#333538] rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-600/50 flex items-center justify-center mx-auto text-red-400">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Confirmation de déconnexion</h3>
            <p className="text-sm text-[#9aa0a6] leading-relaxed">
              Êtes-vous sûr de vouloir vous déconnecter ?
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#282a2c] hover:bg-[#333538] text-white font-semibold text-sm transition-colors border border-[#3c4043]"
              >
                Non
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-red-900/40"
              >
                Oui
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coin reward toast notification */}
      {coinToast && (
        <div className="fixed top-20 right-6 z-50 bg-amber-500 text-black px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 font-bold text-sm animate-in slide-in-from-top-4 duration-300 border border-amber-300">
          <span className="text-lg">🪙</span>
          <span>{coinToast}</span>
        </div>
      )}
    </div>
  );
}
