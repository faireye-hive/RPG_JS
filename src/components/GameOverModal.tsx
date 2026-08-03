import React from 'react';
import { Skull, RotateCcw, Home, ShieldAlert, Timer } from 'lucide-react';
import { GameStats } from '../types/game';
import { audioEngine } from '../utils/audio';

interface GameOverModalProps {
  stats: GameStats;
  onRespawn: () => void;
  onRestart: () => void;
  onReturnToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ stats, onRespawn, onRestart, onReturnToMenu }) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in zoom-in-95 duration-200 select-none">
      <div className="max-w-md w-full bg-slate-900 border-2 border-rose-900/50 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Glow Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Icon Header */}
        <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-800/50 flex items-center justify-center mb-4 text-rose-400 shadow-xl">
          <Skull className="w-8 h-8" />
        </div>

        <h2 className="text-4xl font-black text-rose-400 mb-2 font-mono tracking-wider">
          DERROTADO
        </h2>

        <p className="text-slate-300 text-sm mb-6">
          Você caiu em combate! Escolha se deseja ressuscitar no centro da vila ou reiniciar sua jornada.
        </p>

        {/* Stats Summary */}
        <div className="w-full bg-slate-950/80 rounded-2xl border border-slate-800 p-3 mb-6 grid grid-cols-3 gap-2 font-mono text-xs">
          
          <div className="flex flex-col items-center gap-1 p-2 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-amber-400 font-bold text-xs">Lv. {stats.level ?? 1}</span>
            <span className="text-slate-400 text-[10px]">Nível</span>
            <span className="font-bold text-slate-100 text-xs">🪙 {stats.gold ?? 0}</span>
          </div>

          <div className="flex flex-col items-center gap-1 p-2 bg-slate-900 rounded-xl border border-slate-800">
            <Skull className="w-4 h-4 text-rose-400" />
            <span className="text-slate-400 text-[10px]">Inimigos</span>
            <span className="font-bold text-slate-100 text-sm">{stats.enemiesKilled}</span>
          </div>

          <div className="flex flex-col items-center gap-1 p-2 bg-slate-900 rounded-xl border border-slate-800">
            <Timer className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400 text-[10px]">Tempo</span>
            <span className="font-bold text-slate-100 text-sm">{formatTime(stats.timeElapsed)}</span>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5">
          
          <button
            onClick={() => {
              audioEngine.playClick();
              onRespawn();
            }}
            className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base rounded-xl shadow-lg border border-emerald-400/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95"
          >
            <ShieldAlert className="w-5 h-5 text-emerald-200" />
            <span>Ressuscitar no Centro da Vila 🏛️</span>
          </button>

          <button
            onClick={() => {
              audioEngine.playClick();
              onRestart();
            }}
            className="w-full py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Reiniciar Novo Jogo (R)</span>
          </button>

          <button
            onClick={() => {
              audioEngine.playClick();
              onReturnToMenu();
            }}
            className="w-full py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold text-xs rounded-xl border border-slate-800 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Menu Principal</span>
          </button>

        </div>

      </div>
    </div>
  );
};
