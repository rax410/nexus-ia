import { X, Sun, Volume2, Sparkles, Sliders, RotateCcw } from 'lucide-react';

interface NexusSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  temperature: number;
  setTemperature: (t: number) => void;
  brightness: number;
  setBrightness: (b: number) => void;
  volume: number;
  setVolume: (v: number) => void;
}

export function NexusSettingsModal({
  isOpen,
  onClose,
  temperature,
  setTemperature,
  brightness,
  setBrightness,
  volume,
  setVolume,
}: NexusSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#1e1f20] border border-[#333538] rounded-2xl shadow-2xl p-6 text-[#e3e3e3] space-y-6 relative">
        <div className="flex items-center justify-between border-b border-[#333538] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Paramètres Nexus</h2>
              <p className="text-xs text-[#9aa0a6]">Ajustez la créativité, l'écran et le son</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#8e918f] hover:text-white hover:bg-[#282a2c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* AI Temperature */}
          <div className="space-y-2 bg-[#131314] p-4 rounded-xl border border-[#2d2f31]">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Température de l'IA (Créativité)
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/50 text-purple-300 text-xs font-semibold">
                {temperature.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-[#8ab4f8] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#8e918f]">
              <span>Précis & Factuel (0.0)</span>
              <span>Équilibré (0.5)</span>
              <span>Très Créatif (1.0)</span>
            </div>
          </div>

          {/* Screen Brightness */}
          <div className="space-y-2 bg-[#131314] p-4 rounded-xl border border-[#2d2f31]">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-white flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                Luminosité de l'écran
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/50 text-amber-300 text-xs font-semibold">
                {brightness}%
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="150"
              step="5"
              value={brightness}
              onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#8e918f]">
              <span>Tamisé (30%)</span>
              <span>Normal (100%)</span>
              <span>Clair (150%)</span>
            </div>
          </div>

          {/* Audio Volume */}
          <div className="space-y-2 bg-[#131314] p-4 rounded-xl border border-[#2d2f31]">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-white flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                Volume Sonore (Voix / Synthèse)
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs font-semibold">
                {volume}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#8e918f]">
              <span>Muet (0%)</span>
              <span>Moyen (50%)</span>
              <span>Max (100%)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#333538]">
          <button
            type="button"
            onClick={() => {
              setTemperature(0.6);
              setBrightness(100);
              setVolume(100);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#8e918f] hover:text-white bg-[#131314] hover:bg-[#282a2c] border border-[#2d2f31] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Par défaut</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#8ab4f8] text-[#041e49] hover:bg-[#a8c7fa] text-xs font-semibold transition-all shadow-md"
          >
            Enregistrer & Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
