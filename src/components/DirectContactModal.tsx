import { useState } from 'react';
import { X, Send, MessageSquare, Check, Sparkles } from 'lucide-react';

interface DirectContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string;
}

export function DirectContactModal({ isOpen, onClose, currentUser }: DirectContactModalProps) {
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      const existingInbox = JSON.parse(localStorage.getItem('nexus_user_inbox') || '[]');
      const newMsg = {
        id: Date.now().toString(),
        username: currentUser || 'Anonyme',
        text: message.trim(),
        timestamp: new Date().toLocaleTimeString() + ' - ' + new Date().toLocaleDateString(),
      };
      localStorage.setItem('nexus_user_inbox', JSON.stringify([newMsg, ...existingInbox]));
      setSuccess(true);
      setMessage('');
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-[#1e1f20] border border-[#333538] rounded-3xl w-full max-w-md p-6 text-[#e3e3e3] shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#8e918f] hover:text-white hover:bg-[#282a2c] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-cyan-950/60 border border-cyan-800/50 rounded-2xl text-cyan-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Contact direct avec Rax</span>
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </h2>
            <p className="text-xs text-[#9aa0a6]">Envoyez un message direct dans la boîte de réception du créateur.</p>
          </div>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-3 animate-in fade-in">
            <div className="w-12 h-12 bg-emerald-950 border border-emerald-600 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-emerald-300">Message envoyé à Rax avec succès !</div>
            <p className="text-xs text-[#9aa0a6]">Le créateur le lira dans son panneau d'administration.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#c4c7c5] mb-1.5">
                Votre message pour @Rax
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Écrivez votre suggestion, question ou message ici..."
                className="w-full bg-[#131314] border border-[#3c4043] rounded-2xl p-3.5 text-sm text-white focus:outline-none focus:border-cyan-500 resize-none"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-[#282a2c] hover:bg-[#333538] text-white text-xs font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/40 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Envoyer à Rax</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
