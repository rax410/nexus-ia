import { useState, useEffect } from 'react';
import { ShieldAlert, Coins, UserX, Trash2, X, AlertTriangle, Sparkles, Check, Clock, Calendar, BarChart3, Radio, Wrench, Mail, RefreshCw, CreditCard, ShieldX } from 'lucide-react';

interface FlaggedMessage {
  id: string;
  username: string;
  text: string;
  timestamp: string;
}

interface InboxMessage {
  id: string;
  username: string;
  text: string;
  timestamp: string;
}

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  onAddCoins: (amount: number) => void;
}

export function AdminModal({ isOpen, onClose, coins, onAddCoins }: AdminModalProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'broadcast' | 'inbox' | 'maintenance' | 'events' | 'time' | 'coins' | 'banned' | 'flagged' | 'subscription'>('stats');
  const [customCoinAmount, setCustomCoinAmount] = useState('1000');
  const [targetUsername, setTargetUsername] = useState('moi');

  // Time management state
  const [timeTargetUser, setTimeTargetUser] = useState('moi');
  const [customMinutes, setCustomMinutes] = useState('60');

  // Subscription termination state
  const [subTargetUsername, setSubTargetUsername] = useState('');
  const [subStep1Open, setSubStep1Open] = useState(false);
  const [subStep2Open, setSubStep2Open] = useState(false);

  // Broadcast state
  const [broadcastText, setBroadcastText] = useState(() => {
    return localStorage.getItem('nexus_broadcast_message') || '';
  });

  // Event tester state
  const [birthdayForced, setBirthdayForced] = useState(() => {
    return localStorage.getItem('nexus_force_birthday') === 'true';
  });

  const [bannedUsers, setBannedUsers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_banned_users');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [flaggedMessages, setFlaggedMessages] = useState<FlaggedMessage[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_flagged_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [inboxMessages, setInboxMessages] = useState<InboxMessage[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_user_inbox');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [banInput, setBanInput] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      try {
        const savedBanned = localStorage.getItem('nexus_banned_users');
        if (savedBanned) setBannedUsers(JSON.parse(savedBanned));
        const savedFlagged = localStorage.getItem('nexus_flagged_messages');
        if (savedFlagged) setFlaggedMessages(JSON.parse(savedFlagged));
        const savedInbox = localStorage.getItem('nexus_user_inbox');
        if (savedInbox) setInboxMessages(JSON.parse(savedInbox));
        setBirthdayForced(localStorage.getItem('nexus_force_birthday') === 'true');
        setBroadcastText(localStorage.getItem('nexus_broadcast_message') || '');
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddUnlimitedCoins = () => {
    const amt = parseInt(customCoinAmount, 10);
    if (!isNaN(amt) && amt > 0) {
      onAddCoins(amt);
      const userLabel = targetUsername.trim().toLowerCase() === 'moi' ? 'Rax (vous)' : `@${targetUsername}`;
      setSuccessMsg(`+${amt} pièces ajoutées avec succès pour ${userLabel} !`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleAddTime = (minutesToAdd: number) => {
    try {
      const currentMinutes = parseInt(localStorage.getItem('nexus_usage_minutes') || '60', 10);
      const nextMinutes = currentMinutes + minutesToAdd;
      localStorage.setItem('nexus_usage_minutes', nextMinutes.toString());
      const userLabel = timeTargetUser.trim().toLowerCase() === 'moi' ? 'Rax (vous)' : `@${timeTargetUser}`;
      setSuccessMsg(`⏱️ +${minutesToAdd} minutes ajoutées avec succès pour ${userLabel} (${nextMinutes}m total) !`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch {
      setSuccessMsg('Erreur lors de la modification du temps.');
    }
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('nexus_broadcast_message', broadcastText.trim());
    setSuccessMsg('📢 Annonce diffusée à tous les utilisateurs avec succès !');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleClearBroadcast = () => {
    localStorage.removeItem('nexus_broadcast_message');
    setBroadcastText('');
    setSuccessMsg('Annonce globale retirée.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleToggleBirthdayForce = () => {
    const nextState = !birthdayForced;
    setBirthdayForced(nextState);
    localStorage.setItem('nexus_force_birthday', nextState.toString());
    setSuccessMsg(nextState ? '🎉 Événement "Anniversaire du 22 Janvier" activé (Testeur) !' : 'Événement anniversaire désactivé.');
    setTimeout(() => setSuccessMsg(null), 4000);
    window.location.reload();
  };

  const handleSimulateNormalExpiry = () => {
    localStorage.setItem('nexus_sub_expired_forced', 'true');
    setSuccessMsg('⏳ Simulation de fin d\'abonnement Normal activée ! Affichage de l\'écran de renouvellement...');
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
      window.location.reload();
    }, 1200);
  };

  const handleBanUser = (usernameToBan: string) => {
    const clean = usernameToBan.trim().toLowerCase();
    if (!clean || clean === 'rax') return;
    if (!bannedUsers.includes(clean)) {
      const updated = [...bannedUsers, clean];
      setBannedUsers(updated);
      localStorage.setItem('nexus_banned_users', JSON.stringify(updated));
      setSuccessMsg(`Utilisateur "${usernameToBan}" banni avec succès.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleUnbanUser = (usernameToUnban: string) => {
    const updated = bannedUsers.filter((u) => u !== usernameToUnban);
    setBannedUsers(updated);
    localStorage.setItem('nexus_banned_users', JSON.stringify(updated));
    setSuccessMsg(`Utilisateur "${usernameToUnban}" débanni.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDeleteFlagged = (id: string) => {
    const updated = flaggedMessages.filter((m) => m.id !== id);
    setFlaggedMessages(updated);
    localStorage.setItem('nexus_flagged_messages', JSON.stringify(updated));
  };

  const handleDeleteInboxItem = (id: string) => {
    const updated = inboxMessages.filter((m) => m.id !== id);
    setInboxMessages(updated);
    localStorage.setItem('nexus_user_inbox', JSON.stringify(updated));
  };

  const handleMaintenanceResetCache = () => {
    try {
      localStorage.removeItem('nexus_chat_history');
      setSuccessMsg('Cache des discussions vidé avec succès !');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {}
  };

  const handleMaintenanceResetAll = () => {
    if (window.confirm('Voulez-vous vraiment réinitialiser l\'application et vider toutes les données locales ?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const confirmSubscriptionCutFinal = () => {
    localStorage.setItem('nexus_sub_expired_forced', 'true');
    localStorage.setItem('nexus_user_tier', 'normal');
    setSubStep2Open(false);
    setSuccessMsg(`Abonnement de @${subTargetUsername || 'l\'utilisateur'} résilié instantanément avec succès !`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#18191a] border border-red-500/40 rounded-3xl w-full max-w-5xl p-6 md:p-8 text-[#e3e3e3] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Ambient glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#8e918f] hover:text-white hover:bg-[#282a2c] transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="p-3.5 bg-red-950/80 border border-red-600/50 rounded-2xl text-red-400 shadow-inner">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Panneau d'Administration Secret • Rax
              </h2>
              <Sparkles className="w-5 h-5 text-red-400 animate-pulse" />
            </div>
            <p className="text-xs md:text-sm text-[#9aa0a6] mt-0.5">
              Interface exclusive et sécurisée réservée au créateur Rax. Gestion des abonnements, pièces, temps et modération.
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#282a2c] pb-3 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'stats'
                ? 'bg-blue-950/80 text-blue-300 border border-blue-600/60 shadow'
                : 'bg-[#1e1f20] text-[#9aa0a6] hover:text-white border border-[#333538]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Statistiques Globales</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('subscription')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'subscription'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-600/60 shadow'
                : 'bg-[#1e1f20] text-[#9aa0a6] hover:text-white border border-[#333538]'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Résiliation Abonnement</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'inbox'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-600/60 shadow'
                : 'bg-[#1e1f20] text-[#9aa0a6] hover:text-white border border-[#333538]'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Messages Reçus ({inboxMessages.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('broadcast')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'broadcast'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-600/60 shadow'
                : 'bg-[#1e1f20] text-[#9aa0a6] hover:text-white border border-[#333538]'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Console Broadcast</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('maintenance')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'maintenance'
                ? 'bg-red-950/80 text-red-300 border border-red-600/60 shadow'
                : 'bg-[#1e1f20] text-[#9aa0a6] hover:text-white border border-[#333538]'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Maintenance & Reset</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'events'
                ? 'bg-purple-950/80 text-purple-300 border border-purple-600/60 shadow'
                : 'bg-[#1e1f20] text-[#9aa0a6] hover:text-white border border-[#333538]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Testeur d'Événements</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('time')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'time'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-600/60 shadow'
                : 'bg-[#1e1f20] text-[#9aa0a6] hover:text-white border border-[#333538]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Gestion Temps</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('coins')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'coins'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-600/60 shadow'
                : 'bg-[#1e1f20] text-[#9aa0a6] hover:text-white border border-[#333538]'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Ajout Pièces</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('flagged')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'flagged'
                ? 'bg-red-950/80 text-red-300 border border-red-600/60 shadow'
                : 'bg-[#1e1f20] text-[#9aa0a6] hover:text-white border border-[#333538]'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Signalés ({flaggedMessages.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('banned')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'banned'
                ? 'bg-red-950/80 text-red-300 border border-red-600/60 shadow'
                : 'bg-[#1e1f20] text-[#9aa0a6] hover:text-white border border-[#333538]'
            }`}
          >
            <UserX className="w-4 h-4" />
            <span>Bannis ({bannedUsers.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {activeTab === 'stats' && (
            <div className="space-y-6 py-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span>Tableau de bord des statistiques globales de l'application</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-[#131314] border border-[#282a2c] rounded-2xl p-5 space-y-2">
                  <div className="text-xs text-[#9aa0a6] font-medium">Solde de pièces Rax</div>
                  <div className="text-2xl font-black text-amber-400 flex items-center gap-2">
                    <span>{coins}</span> 🪙
                  </div>
                  <div className="text-[11px] text-emerald-400">Statut: Actif & Illimité</div>
                </div>

                <div className="bg-[#131314] border border-[#282a2c] rounded-2xl p-5 space-y-2">
                  <div className="text-xs text-[#9aa0a6] font-medium">Messages Signalés / Modération</div>
                  <div className="text-2xl font-black text-red-400">
                    {flaggedMessages.length}
                  </div>
                  <div className="text-[11px] text-[#9aa0a6]">Journal de surveillance actif</div>
                </div>

                <div className="bg-[#131314] border border-[#282a2c] rounded-2xl p-5 space-y-2">
                  <div className="text-xs text-[#9aa0a6] font-medium">Utilisateurs Bannis</div>
                  <div className="text-2xl font-black text-amber-500">
                    {bannedUsers.length}
                  </div>
                  <div className="text-[11px] text-[#9aa0a6]">Sécurité maximale Rax</div>
                </div>

                <div className="bg-[#131314] border border-[#282a2c] rounded-2xl p-5 space-y-2">
                  <div className="text-xs text-[#9aa0a6] font-medium">Messages Reçus (Inbox)</div>
                  <div className="text-2xl font-black text-cyan-400">
                    {inboxMessages.length}
                  </div>
                  <div className="text-[11px] text-[#9aa0a6]">Retours directs utilisateurs</div>
                </div>

                <div className="bg-[#131314] border border-[#282a2c] rounded-2xl p-5 space-y-2">
                  <div className="text-xs text-[#9aa0a6] font-medium">Temps d'Utilisation Global</div>
                  <div className="text-2xl font-black text-purple-400">
                    {localStorage.getItem('nexus_usage_minutes') || '60'} min
                  </div>
                  <div className="text-[11px] text-[#9aa0a6]">Quota de session actif</div>
                </div>

                <div className="bg-[#131314] border border-[#282a2c] rounded-2xl p-5 space-y-2">
                  <div className="text-xs text-[#9aa0a6] font-medium">Version du Système</div>
                  <div className="text-2xl font-black text-emerald-400">v4.4 Rax</div>
                  <div className="text-[11px] text-emerald-300">Connexion Cloud Sécurisée</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="max-w-xl mx-auto space-y-6 py-4">
              <div className="bg-[#131314] border border-amber-500/40 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>Résiliation d'abonnement (Administrateur Rax)</span>
                </h3>
                <p className="text-xs text-[#9aa0a6]">
                  Entrez le nom d'utilisateur pour couper son abonnement en cours instantanément (même s'il est Ultra VIP), sans attendre la fin du mois.
                </p>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-[#c4c7c5] mb-1.5">
                      Nom d'utilisateur cible
                    </label>
                    <input
                      type="text"
                      value={subTargetUsername}
                      onChange={(e) => setSubTargetUsername(e.target.value)}
                      placeholder="Ex: utilisateur123"
                      className="w-full bg-[#1e1f20] border border-[#3c4043] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (subTargetUsername.trim()) {
                        setSubStep1Open(true);
                      }
                    }}
                    className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <ShieldX className="w-4 h-4" />
                    <span>Couper l'abonnement en cours</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inbox' && (
            <div className="space-y-4 py-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>Boîte de réception des messages utilisateurs (@Rax)</span>
              </h3>
              <p className="text-xs text-[#9aa0a6]">
                Retrouvez ici tous les messages envoyés directement par les utilisateurs via le bouton de contact direct.
              </p>

              {inboxMessages.length === 0 ? (
                <div className="text-center py-12 bg-[#131314] rounded-2xl border border-[#282a2c] text-[#8e918f] text-xs">
                  Aucun message reçu pour le moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {inboxMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="bg-[#131314] border border-cyan-900/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-cyan-400">@{msg.username}</span>
                          <span className="text-[10px] text-[#8e918f]">{msg.timestamp}</span>
                        </div>
                        <p className="text-xs text-white bg-[#1e1f20] p-3 rounded-xl border border-[#282a2c]">
                          "{msg.text}"
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDeleteInboxItem(msg.id)}
                          className="p-2 bg-[#282a2c] hover:bg-red-950 text-[#9aa0a6] hover:text-red-400 rounded-xl transition-colors"
                          title="Supprimer le message"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'broadcast' && (
            <div className="max-w-xl mx-auto space-y-6 py-4">
              <div className="bg-[#131314] border border-[#282a2c] rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>Console de diffusion (Broadcast global)</span>
                </h3>
                <p className="text-xs text-[#9aa0a6]">
                  Envoyez une annonce ou un message important qui s'affichera instantanément en haut de l'application pour tous les utilisateurs.
                </p>

                <form onSubmit={handleSendBroadcast} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#c4c7c5] mb-1.5">
                      Message de diffusion
                    </label>
                    <textarea
                      rows={3}
                      value={broadcastText}
                      onChange={(e) => setBroadcastText(e.target.value)}
                      placeholder="Ex: Maintenance prévue ce soir à 22h..."
                      className="w-full bg-[#1e1f20] border border-[#3c4043] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-xl text-xs shadow-lg shadow-amber-900/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Radio className="w-4 h-4" />
                      <span>Diffuser à tous</span>
                    </button>
                    {broadcastText && (
                      <button
                        type="button"
                        onClick={handleClearBroadcast}
                        className="px-4 py-3 bg-[#282a2c] hover:bg-[#333538] text-red-400 font-medium rounded-xl text-xs transition-colors"
                      >
                        Retirer l'annonce
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="max-w-xl mx-auto space-y-6 py-4">
              <div className="bg-[#131314] border border-[#282a2c] rounded-2xl p-6 space-y-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-red-400" />
                  <span>Outils de maintenance et de réinitialisation</span>
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#1e1f20] border border-[#333538]">
                    <div>
                      <div className="text-xs font-bold text-white">Vider le cache des discussions</div>
                      <div className="text-[11px] text-[#9aa0a6]">Efface l'historique de chat local</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleMaintenanceResetCache}
                      className="px-4 py-2 bg-[#282a2c] hover:bg-[#333538] text-cyan-300 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Vider le cache</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#1e1f20] border border-red-900/40">
                    <div>
                      <div className="text-xs font-bold text-red-400">Réinitialisation complète du système</div>
                      <div className="text-[11px] text-[#9aa0a6]">Remet à zéro toutes les données locales</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleMaintenanceResetAll}
                      className="px-4 py-2 bg-red-950 hover:bg-red-900 text-red-300 font-semibold rounded-xl text-xs transition-colors border border-red-700/60"
                    >
                      Reset Total
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-6 py-2">
              <div className="flex items-center justify-between bg-[#131314] p-5 rounded-2xl border border-[#333538]">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>🎉 Anniversaire du Créateur (22 Janvier)</span>
                    <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded-full border border-purple-800">
                      Événement Annuel
                    </span>
                  </div>
                  <p className="text-xs text-[#9aa0a6]">
                    Affiche le message festif « Bon anniversaire mon créateur ! » accompagné d'animations de ballons sur les écrans d'IA.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleBirthdayForce}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    birthdayForced
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                      : 'bg-[#282a2c] hover:bg-[#333538] text-purple-300 border border-purple-500/40'
                  }`}
                >
                  {birthdayForced ? '✓ Événement Forcé (Actif)' : 'Tester / Forcer'}
                </button>
              </div>

              {/* Normal Subscription Expiry Simulator */}
              <div className="flex items-center justify-between bg-[#131314] p-5 rounded-2xl border border-amber-500/30">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>⏳ Simuler la fin d'un abonnement Normal</span>
                    <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded-full border border-amber-800">
                      Test Expiration
                    </span>
                  </div>
                  <p className="text-xs text-[#9aa0a6]">
                    Affiche instantanément l'écran de fin de mois avec le message « Les un mois sont terminés. Si tu veux repayer, paye. » et les 3 propositions d'abonnements.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateNormalExpiry}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-500 text-black shadow-lg shadow-amber-900/30 transition-all cursor-pointer whitespace-nowrap"
                >
                  Simuler Fin Mois
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/30 text-xs text-cyan-300 flex items-center gap-3">
                <Sparkles className="w-5 h-5 shrink-0 text-cyan-400 animate-pulse" />
                <span>
                  Le testeur d'événements dynamique liste automatiquement chaque nouvel événement spécial ajouté dans le code de Nexus Rax AI.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'time' && (
            <div className="max-w-xl mx-auto space-y-6 py-4">
              <div className="bg-[#131314] border border-[#282a2c] rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Gestion du temps d'utilisation personnalisée</span>
                </h3>

                <div>
                  <label className="block text-xs font-medium text-[#c4c7c5] mb-1.5">
                    Nom d'utilisateur (ou "moi" pour vous)
                  </label>
                  <input
                    type="text"
                    value={timeTargetUser}
                    onChange={(e) => setTimeTargetUser(e.target.value)}
                    className="w-full bg-[#1e1f20] border border-[#3c4043] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Ex: Rax ou moi"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => handleAddTime(60)}
                    className="py-3 px-4 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-600/60 font-bold text-xs transition-all shadow"
                  >
                    + 1 Heure ⏱️
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTime(120)}
                    className="py-3 px-4 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-600/60 font-bold text-xs transition-all shadow"
                  >
                    + 2 Heures ⏱️
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTime(1440)}
                    className="py-3 px-4 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-600/60 font-bold text-xs transition-all shadow"
                  >
                    + 1 Jour 📅
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTime(10080)}
                    className="py-3 px-4 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-600/60 font-bold text-xs transition-all shadow"
                  >
                    + 1 Semaine 🌟
                  </button>
                </div>

                <div className="pt-4 border-t border-[#282a2c] space-y-2">
                  <label className="block text-xs font-medium text-[#c4c7c5]">
                    Ou ajouter un temps personnalisé (en minutes)
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      className="flex-1 bg-[#1e1f20] border border-[#3c4043] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                      placeholder="Ex: 30 minutes"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const m = parseInt(customMinutes, 10);
                        if (!isNaN(m)) handleAddTime(m);
                      }}
                      className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition-all"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'coins' && (
            <div className="max-w-xl mx-auto space-y-6 py-6 text-center">
              <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl">
                <div className="text-xs text-[#9aa0a6] uppercase font-bold mb-1">Solde Actuel de Rax</div>
                <div className="text-3xl font-black text-amber-400 flex items-center justify-center gap-2">
                  <span>{coins}</span> pièces 🪙
                </div>
              </div>

              <div className="bg-[#131314] border border-[#282a2c] rounded-2xl p-6 text-left space-y-4">
                <h3 className="text-sm font-bold text-white">Ajouter des pièces instantanément (Illimité)</h3>

                <div>
                  <label className="block text-xs font-medium text-[#c4c7c5] mb-1.5">
                    Nom d'utilisateur (ou "moi")
                  </label>
                  <input
                    type="text"
                    value={targetUsername}
                    onChange={(e) => setTargetUsername(e.target.value)}
                    className="w-full bg-[#1e1f20] border border-[#3c4043] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                    placeholder="Ex: Rax ou moi"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#c4c7c5] mb-1.5">
                    Montant à créditer
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={customCoinAmount}
                      onChange={(e) => setCustomCoinAmount(e.target.value)}
                      className="flex-1 bg-[#1e1f20] border border-[#3c4043] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                      placeholder="Ex: 50000"
                    />
                    <button
                      type="button"
                      onClick={handleAddUnlimitedCoins}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Coins className="w-4 h-4" />
                      <span>Créditer</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onAddCoins(500);
                      setSuccessMsg('+500 pièces ajoutées !');
                      setTimeout(() => setSuccessMsg(null), 3000);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#282a2c] hover:bg-[#333538] text-xs text-amber-300 font-medium border border-[#333538]"
                  >
                    +500 🪙
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onAddCoins(10000);
                      setSuccessMsg('+10 000 pièces ajoutées !');
                      setTimeout(() => setSuccessMsg(null), 3000);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#282a2c] hover:bg-[#333538] text-xs text-amber-300 font-medium border border-[#333538]"
                  >
                    +10 000 🪙
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onAddCoins(100000);
                      setSuccessMsg('+100 000 pièces ajoutées !');
                      setTimeout(() => setSuccessMsg(null), 3000);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#282a2c] hover:bg-[#333538] text-xs text-amber-300 font-medium border border-[#333538]"
                  >
                    +100 000 🪙 (Illimité)
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'flagged' && (
            <div>
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Messages signalés / jugés problématiques ou insultants</span>
              </h3>
              <p className="text-xs text-[#9aa0a6] mb-4">
                Le système analyse en temps réel les discussions. Les contenus inappropriés s'affichent ici pour surveillance.
              </p>

              {flaggedMessages.length === 0 ? (
                <div className="text-center py-12 bg-[#131314] rounded-2xl border border-[#282a2c] text-[#8e918f] text-xs">
                  Aucun message problématique détecté pour le moment. Tout est calme.
                </div>
              ) : (
                <div className="space-y-3">
                  {flaggedMessages.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#131314] border border-red-900/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-red-400">@{item.username}</span>
                          <span className="text-[10px] text-[#8e918f]">{item.timestamp}</span>
                        </div>
                        <p className="text-xs text-white bg-[#1e1f20] p-2.5 rounded-xl border border-[#282a2c]">
                          "{item.text}"
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleBanUser(item.username)}
                          className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-300 border border-red-700/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Bannir @{item.username}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFlagged(item.id)}
                          className="p-1.5 bg-[#282a2c] hover:bg-red-950 text-[#9aa0a6] hover:text-red-400 rounded-xl transition-colors"
                          title="Supprimer du journal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'banned' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-white mb-2">Bannir un utilisateur posant problème</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={banInput}
                  onChange={(e) => setBanInput(e.target.value)}
                  placeholder="Nom d'utilisateur exact à bannir..."
                  className="flex-1 bg-[#131314] border border-[#3c4043] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (banInput.trim()) {
                      handleBanUser(banInput);
                      setBanInput('');
                    }
                  }}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-900/30 transition-all flex items-center gap-2"
                >
                  <UserX className="w-4 h-4" />
                  <span>Bannir</span>
                </button>
              </div>

              <div className="mt-6">
                <h4 className="text-xs font-bold text-[#9aa0a6] uppercase tracking-wider mb-3">
                  Liste des utilisateurs bannis ({bannedUsers.length})
                </h4>
                {bannedUsers.length === 0 ? (
                  <div className="text-center py-8 bg-[#131314] rounded-2xl border border-[#282a2c] text-[#8e918f] text-xs">
                    Aucun utilisateur banni actuellement.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bannedUsers.map((user) => (
                      <div
                        key={user}
                        className="bg-[#131314] border border-[#282a2c] rounded-2xl px-4 py-3 flex items-center justify-between"
                      >
                        <span className="text-xs font-bold text-red-400">@{user}</span>
                        <button
                          type="button"
                          onClick={() => handleUnbanUser(user)}
                          className="px-3 py-1.5 bg-[#282a2c] hover:bg-[#333538] text-white text-xs rounded-xl font-medium transition-colors"
                        >
                          Débannir
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#282a2c] flex items-center justify-between text-xs text-[#8e918f]">
          <span>Nexus Admin Core v4.4 • Accès sécurisé Rax</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#282a2c] hover:bg-[#333538] text-white font-medium transition-colors"
          >
            Fermer le panneau
          </button>
        </div>
      </div>

      {/* Subscription Cut Step 1 Modal */}
      {subStep1Open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#1e1f20] border border-amber-500/50 rounded-3xl w-full max-w-md p-6 text-[#e3e3e3] shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-amber-950/80 border border-amber-600/60 text-amber-400 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Résiliation d'abonnement</h4>
            <p className="text-sm font-semibold text-amber-300 bg-amber-950/40 border border-amber-500/40 p-3 rounded-2xl">
              "Les un mois sont terminés. Si tu veux repayer, paye."
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSubStep1Open(false)}
                className="flex-1 py-3 rounded-xl bg-[#282a2c] hover:bg-[#333538] text-white text-xs font-semibold transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubStep1Open(false);
                  setSubStep2Open(true);
                }}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors shadow-lg shadow-red-950/40"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Cut Step 2 (Second security window) */}
      {subStep2Open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#1e1f20] border border-red-500/60 rounded-3xl w-full max-w-md p-6 text-[#e3e3e3] shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-red-950 border border-red-600 text-red-400 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Sécurité Maximale • Confirmation Définitive</h4>
            <p className="text-xs text-[#9aa0a6]">
              Voulez-vous vraiment résilier définitivement l'abonnement en cours de <strong className="text-white">@{subTargetUsername || 'l\'utilisateur'}</strong> (même s'il est Ultra VIP) ?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSubStep2Open(false)}
                className="flex-1 py-3 rounded-xl bg-[#282a2c] hover:bg-[#333538] text-white text-xs font-semibold transition-colors"
              >
                Non
              </button>
              <button
                type="button"
                onClick={confirmSubscriptionCutFinal}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors shadow-lg shadow-red-950/40"
              >
                Oui (Résilier)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
