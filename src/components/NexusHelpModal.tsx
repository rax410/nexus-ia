import React, { useState } from 'react';
import { X, HelpCircle, Sparkles, Code2, Calculator, Image as ImageIcon, ArrowRight, Lightbulb } from 'lucide-react';

interface NexusHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}

const HELP_CATEGORIES = [
  {
    id: 'calculs',
    name: 'Calculs & Sciences',
    icon: Calculator,
    examples: [
      'Résous l\'équation différentielle y\' + 2y = e^{-x}',
      'Calcule la vitesse de libération de la Terre en expliquant les formules',
      'Explique-moi le théorème de Pythagore avec un exemple pratique',
      'Quelle est la distance Terre-Soleil et combien de temps met la lumière ?'
    ]
  },
  {
    id: 'code',
    name: 'Développement & Code',
    icon: Code2,
    examples: [
      'Écris un composant React complet avec Tailwind pour un compteur interactif',
      'Comment utiliser les générateurs en JavaScript avec des exemples ?',
      'Écris un script Python pour trier un gros fichier CSV par ordre alphabétique',
      'Quelles sont les meilleures pratiques pour sécuriser une API Node.js ?'
    ]
  },
  {
    id: 'images',
    name: 'Création d\'images IA',
    icon: ImageIcon,
    examples: [
      'Crée une image d\'un chat astronaute explorant une galaxie colorée',
      'Génère un paysage de montagne enneigée au coucher du soleil en style peinture à l\'huile',
      'Crée le logo futuriste d\'une entreprise de cybersécurité high-tech',
      'Illustration d\'un café cosy un jour de pluie avec style chaleureux'
    ]
  },
  {
    id: 'general',
    name: 'Culture & Rédaction',
    icon: Sparkles,
    examples: [
      'Résume les points clés de l\'histoire de la Rome antique en 5 points',
      'Rédige une lettre de motivation professionnelle et percutante pour un poste en IA',
      'Donne-moi 5 idées de recettes de cuisine rapides et végétariennes',
      'Explique la physique quantique comme si j\'avais 10 ans'
    ]
  }
];

const FAQ_ITEMS = [
  {
    question: 'Comment fonctionne Nexus ?',
    answer: 'Nexus est votre assistant IA universel propulsé par les technologies de pointe de Google. Il répond directement à toutes vos questions (calculs, sciences, code, culture générale).'
  },
  {
    question: 'À quoi servent les pièces (🪙) et comment en gagner ?',
    answer: 'Les pièces vous permettent de débloquer des abonnements VIP et Ultra VIP ou d\'acheter du temps supplémentaire. Vous pouvez gagner des pièces en jouant au mini-jeu ou en étant actif sur la plateforme.'
  },
  {
    question: 'Comment utiliser le mode vocal ?',
    answer: 'Cliquez sur le bouton microphone dans la barre de discussion ou l\'en-tête pour ouvrir le mode vocal interactif avec le rond animé et converser directement à l\'oral avec Nexus.'
  },
  {
    question: 'Qui est le créateur de Nexus ?',
    answer: 'Nexus Compagnie a été conçu et déployé par le créateur officiel : le vrai Rax.'
  }
];

export function NexusHelpModal({ isOpen, onClose, onSelectPrompt }: NexusHelpModalProps) {
  const [activeTab, setActiveTab] = useState<'prompts' | 'faq'>('prompts');
  const [activeCategory, setActiveCategory] = useState<string>('calculs');

  if (!isOpen) return null;

  const currentCat = HELP_CATEGORIES.find((c) => c.id === activeCategory) || HELP_CATEGORIES[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#1e1f20] border border-[#333538] rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-[#e3e3e3]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#282a2c] bg-[#131314]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-600/50 flex items-center justify-center text-cyan-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Centre d'aide & Exemples Nexus</h2>
              <p className="text-xs text-[#9aa0a6]">Guides, suggestions de requêtes et foire aux questions</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#9aa0a6] hover:text-white hover:bg-[#282a2c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#282a2c] bg-[#131314]/30 px-6 pt-2 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('prompts')}
            className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'prompts'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-[#9aa0a6] hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Exemples de requêtes</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'faq'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-[#9aa0a6] hover:text-white'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Guide & FAQ</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'prompts' ? (
            <div className="space-y-4">
              {/* Category pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {HELP_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                        isActive
                          ? 'bg-cyan-950/80 border-cyan-500/70 text-cyan-300 shadow-sm'
                          : 'bg-[#131314] border-[#333538] text-[#9aa0a6] hover:text-white hover:border-[#444746]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Prompt Examples List */}
              <div className="space-y-2.5 pt-1">
                <div className="text-xs font-bold text-[#9aa0a6] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <currentCat.icon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Suggestions pour {currentCat.name}</span>
                </div>

                {currentCat.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[#131314] hover:bg-[#232427] border border-[#282a2c] hover:border-cyan-500/40 transition-all group"
                  >
                    <p className="text-sm text-[#e3e3e3] pr-3 leading-relaxed">{ex}</p>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectPrompt(ex);
                        onClose();
                      }}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 hover:text-white text-xs font-semibold border border-cyan-700/50 transition-all shadow-xs group-hover:scale-105"
                    >
                      <span>Essayer</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#9aa0a6] uppercase tracking-wider mb-2">
                Foire aux questions & Fonctionnalités Nexus
              </div>

              {FAQ_ITEMS.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#131314] border border-[#282a2c] space-y-1.5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    {item.question}
                  </h4>
                  <p className="text-xs text-[#9aa0a6] pl-4 leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#282a2c] bg-[#131314]/80 flex items-center justify-between text-xs text-[#9aa0a6]">
          <span>Besoin d'aide supplémentaire ? Utilisez le bouton de message direct avec Rax.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#282a2c] hover:bg-[#333538] text-white font-semibold transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
