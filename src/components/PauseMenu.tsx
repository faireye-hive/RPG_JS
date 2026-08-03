import React from 'react';
import { Play, RotateCcw, Settings, Home, HelpCircle } from 'lucide-react';
import { audioEngine } from '../utils/audio';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onOpenControls: () => void;
  onReturnToMenu: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  onOpenSettings,
  onOpenControls,
  onReturnToMenu
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center">
        
        {/* Badge */}
        <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
          Game Paused
        </div>

        <h2 className="text-3xl font-black text-slate-100 mb-6 font-mono tracking-wide">
          PAUSE MENU
        </h2>

        {/* Buttons List */}
        <div className="w-full flex flex-col gap-3">
          
          <button
            id="btn-pause-resume"
            onClick={() => {
              audioEngine.playClick();
              onResume();
            }}
            className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base rounded-xl shadow-md border border-emerald-400/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Resume Game</span>
          </button>

          <button
            id="btn-pause-restart"
            onClick={() => {
              audioEngine.playClick();
              onRestart();
            }}
            className="w-full py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-base rounded-xl border border-slate-700/60 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Restart Map</span>
          </button>

          <button
            id="btn-pause-settings"
            onClick={() => {
              audioEngine.playClick();
              onOpenSettings();
            }}
            className="w-full py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-base rounded-xl border border-slate-700/60 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings & Sound</span>
          </button>

          <button
            id="btn-pause-controls"
            onClick={() => {
              audioEngine.playClick();
              onOpenControls();
            }}
            className="w-full py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-base rounded-xl border border-slate-700/60 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Controls & Rules</span>
          </button>

          <button
            id="btn-pause-main-menu"
            onClick={() => {
              audioEngine.playClick();
              onReturnToMenu();
            }}
            className="w-full py-3 px-5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-semibold text-base rounded-xl border border-rose-800/40 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95 mt-2"
          >
            <Home className="w-4 h-4 text-rose-400" />
            <span>Main Menu</span>
          </button>

        </div>

      </div>
    </div>
  );
};
