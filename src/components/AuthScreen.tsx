import React, { useState } from 'react';
import { Sparkles, ShieldCheck, User, Lock, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { NexusAvatar } from './NexusAvatar';

interface AuthScreenProps {
  onLogin: (username: string) => void;
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    const cleanUsername = username.trim();
    const lowerName = cleanUsername.toLowerCase();

    // Check if user is banned
    try {
      const bannedData = localStorage.getItem('nexus_banned_users');
      const bannedUsers = bannedData ? JSON.parse(bannedData) : [];
      if (bannedUsers.includes(lowerName)) {
        setError('Ce compte a été banni par l\'administrateur Rax.');
        return;
      }
    } catch {}

    if (isRegister) {
      if (lowerName === 'rax') {
        // Allow creating Rax if password matches creator secret or if not created yet
        const usersData = localStorage.getItem('nexus_registered_users');
        const users = usersData ? JSON.parse(usersData) : {};
        if (users['rax']) {
          setError('Le compte "Rax" existe déjà et est strictement réservé. Veuillez vous connecter.');
          return;
        }
      }
      // Save user credentials in localStorage
      const usersData = localStorage.getItem('nexus_registered_users');
      const users = usersData ? JSON.parse(usersData) : {};
      users[lowerName] = { username: cleanUsername, password };
      localStorage.setItem('nexus_registered_users', JSON.stringify(users));
    } else {
      // Login check
      const usersData = localStorage.getItem('nexus_registered_users');
      const users = usersData ? JSON.parse(usersData) : {};
      const existing = users[lowerName];

      if (existing && existing.password !== password) {
        setError('Mot de passe incorrect.');
        return;
      }
    }

    setError('');
    onLogin(cleanUsername);
  };

  return (
    <div className="min-h-screen bg-[#131314] text-[#e3e3e3] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#1e1f20] border border-[#333538] rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-4 transform hover:scale-105 transition-transform">
            <NexusAvatar size="lg" showStatus />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Nexus Compagnie</span>
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </h1>
          <p className="text-sm text-[#9aa0a6] mt-1">
            {isRegister ? 'Créez votre compte pour accéder à votre espace' : 'Connectez-vous à votre espace personnel'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#c4c7c5] mb-1.5">
              Nom d'utilisateur
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8e918f]">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: Rax"
                className="w-full bg-[#131314] border border-[#3c4043] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#8e918f] focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#c4c7c5] mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8e918f]">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#131314] border border-[#3c4043] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#8e918f] focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            {isRegister ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Créer le compte</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Se connecter</span>
              </>
            )}
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#282a2c] text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-xs text-[#8ab4f8] hover:underline font-medium"
          >
            {isRegister
              ? 'Déjà un compte ? Se connecter'
              : "Pas encore de compte ? Créer un compte"}
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[#8e918f]">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Espace sécurisé Nexus • Créateur : Rax</span>
        </div>
      </div>
    </div>
  );
}
