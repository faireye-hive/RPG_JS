import React from 'react';
import { X, Sword, Compass, Heart, Award, ShieldAlert, Key } from 'lucide-react';
import { audioEngine } from '../utils/audio';

interface ControlsModalProps {
  onClose: () => void;
}

export const ControlsModal: React.FC<ControlsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none overflow-y-auto">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col my-8 max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-mono">
            HOW TO PLAY & CONTROLS
          </h2>
          <button
            onClick={() => {
              audioEngine.playClick();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="py-4 space-y-4 text-xs sm:text-sm text-slate-300 overflow-y-auto pr-1">
          
          {/* Main Objective */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
              <Compass className="w-4 h-4" /> Objective
            </div>
            <p className="text-slate-300">
              Explore the infinite procedurally generated wilderness grid maps to locate and rescue the <strong className="text-amber-300">lost baby</strong>! Every time you walk past the edge of the map, a new coordinate location is explored.
            </p>
          </div>

          {/* Controls List */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-cyan-400 text-sm mb-2">
              <Key className="w-4 h-4" /> Keyboard Controls
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Move Character</span>
                <span className="font-mono text-emerald-300 bg-slate-800 px-2 py-0.5 rounded">
                  Arrow Keys / WASD
                </span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Sword Attack</span>
                <span className="font-mono text-emerald-300 bg-slate-800 px-2 py-0.5 rounded">
                  SPACEBAR
                </span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Sentar & Descansar</span>
                <span className="font-mono text-sky-300 bg-slate-800 px-2 py-0.5 rounded">
                  C / Z
                </span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Comprar Poção (20🪙)</span>
                <span className="font-mono text-amber-300 bg-slate-800 px-2 py-0.5 rounded">
                  B
                </span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Usar Poção (+50 HP)</span>
                <span className="font-mono text-emerald-300 bg-slate-800 px-2 py-0.5 rounded">
                  H / E
                </span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Pause Game</span>
                <span className="font-mono text-emerald-300 bg-slate-800 px-2 py-0.5 rounded">
                  ESC / P
                </span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Restart Map</span>
                <span className="font-mono text-emerald-300 bg-slate-800 px-2 py-0.5 rounded">
                  R (when dead/won)
                </span>
              </div>
            </div>
          </div>

          {/* Game Elements Guide */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
              <ShieldAlert className="w-4 h-4" /> RPG Progression & Item Drops
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 bg-rose-950 text-rose-400 font-mono rounded text-[10px] uppercase font-bold">HP & Combat</span>
                <span>Each monster has an HP health bar. Attack monsters multiple times to slay them. Monsters deal damage to your HP on touch!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 bg-sky-950 text-sky-400 font-mono rounded text-[10px] uppercase font-bold">XP & Level Up</span>
                <span>Defeating monsters grants XP. Filling your XP bar Levels Up your hero, increasing Max HP, Attack Damage, and fully healing you!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 bg-sky-950 text-sky-400 font-mono rounded text-[10px] uppercase font-bold">Sentar & Descansar 💤</span>
                <span>Pressione <strong>Sentar 💤</strong> (Tecla C/Z) para o herói sentar e regenerar HP gradualmente de graça! Mover ou atacar cancela o descanso, e se um monstro atacar você enquanto descansa, o herói acorda.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 bg-amber-950 text-amber-400 font-mono rounded text-[10px] uppercase font-bold">Poções & Loja 🛒</span>
                <span>Poções não são grátis! Custa <strong>20 Ouro 🪙</strong> para comprar cada Poção na Loja HUD ou tecla B. Ouro é ganho derrotando monstros pelo mapa.</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Footer Close */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              audioEngine.playClick();
              onClose();
            }}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm rounded-xl transition-all cursor-pointer"
          >
            Got It!
          </button>
        </div>

      </div>
    </div>
  );
};
