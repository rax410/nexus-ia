import { Sparkles, UserCheck, Code2, Compass, Image as ImageIcon } from 'lucide-react';

interface SuggestedPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

const GEMINI_SUGGESTIONS = [
  {
    icon: ImageIcon,
    title: 'Générer une image IA',
    subtitle: 'Créer un visuel IA instantanément',
    prompt: 'Crée une image d\'une ville cyberpunk futuriste avec des néons bleus et violets',
  },
  {
    icon: Sparkles,
    title: 'Mode Vocal & Conversation',
    subtitle: 'Parler directement à Nexus à voix haute',
    prompt: 'Explique-moi les dernières découvertes sur l\'exploration spatiale',
  },
  {
    icon: Code2,
    title: 'Assistance au développement',
    subtitle: 'Écrire du code propre et moderne',
    prompt: 'Peux-tu m\'expliquer comment optimiser une application React et TypeScript ?',
  },
  {
    icon: Compass,
    title: 'Brainstorming & Idées',
    subtitle: 'Explorer des concepts innovants',
    prompt: 'Donne-moi 3 idées de projets innovants avec de l\'IA et du multimédia.',
  },
];

export function SuggestedPrompts({ onSelectPrompt }: SuggestedPromptsProps) {
  return (
    <div id="gemini-suggestions-grid" className="w-full max-w-3xl mx-auto my-6 px-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {GEMINI_SUGGESTIONS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              id={`btn-gemini-suggestion-${idx}`}
              type="button"
              onClick={() => onSelectPrompt(item.prompt)}
              className="relative flex flex-col justify-between p-4 rounded-2xl bg-[#1e1f20] hover:bg-[#282a2c] border border-[#333538] hover:border-[#444746] text-left transition-all group shadow-xs hover:shadow-md cursor-pointer"
            >
              <div className="flex items-center justify-between w-full mb-3">
                <span className="text-sm font-medium text-[#e3e3e3] group-hover:text-white">
                  {item.title}
                </span>
                <div className="w-8 h-8 rounded-full bg-[#131314] flex items-center justify-center text-[#8ab4f8] group-hover:bg-[#004a77]/30 transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-[#9aa0a6] group-hover:text-[#c4c7c5] line-clamp-2">
                {item.subtitle}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
