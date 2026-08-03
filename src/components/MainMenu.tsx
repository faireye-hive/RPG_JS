import React from 'react';
import { Play, RotateCcw, Settings, HelpCircle, Sparkles, Trophy, ShieldAlert, Globe } from 'lucide-react';
import { audioEngine } from '../utils/audio';

interface MainMenuProps {
  onPlayNew: () => void;
  onResume: () => void;
  hasSavedGame: boolean;
  onOpenSettings: () => void;
  onOpenControls: () => void;
  onOpenGithubGuide: () => void;
}

const GithubIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const MainMenu: React.FC<MainMenuProps> = ({
  onPlayNew,
  onResume,
  hasSavedGame,
  onOpenSettings,
  onOpenControls,
  onOpenGithubGuide
}) => {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))] p-6 text-slate-100 select-none overflow-y-auto">
      {/* Background Pixel Grid Accents */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-xl w-full flex flex-col items-center text-center">
        
        {/* Title Header */}
        <div className="mb-8 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> Modernized Vite Edition
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 drop-shadow-sm font-mono">
            JAVASCRIPT RPG
          </h1>
          <p className="mt-3 text-slate-400 text-sm sm:text-base max-w-md">
            Rescue the lost baby hidden in the endless grid map while defending against aggressive forest enemies!
          </p>
        </div>

        {/* Menu Buttons Group */}
        <div className="w-full flex flex-col gap-3.5 sm:gap-4 mb-8">
          
          {/* Resume Button (if saved state exists) */}
          {hasSavedGame && (
            <button
              id="btn-resume-game"
              onClick={() => {
                audioEngine.playClick();
                onResume();
              }}
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-emerald-900/30 border border-emerald-400/30 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <RotateCcw className="w-5 h-5 text-emerald-200" />
              <span>Resume Game</span>
            </button>
          )}

          {/* Play New Game Button */}
          <button
            id="btn-play-game"
            onClick={() => {
              audioEngine.playClick();
              onPlayNew();
            }}
            className={`w-full py-4 px-6 ${
              hasSavedGame
                ? 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-100 border border-slate-700/60'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/30 border border-emerald-400/30'
            } font-bold text-lg rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer`}
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{hasSavedGame ? 'New Game' : 'Play Game'}</span>
          </button>

          {/* Settings / Config Button */}
          <button
            id="btn-open-settings"
            onClick={() => {
              audioEngine.playClick();
              onOpenSettings();
            }}
            className="w-full py-3.5 px-6 bg-slate-800/60 hover:bg-slate-700/60 text-slate-200 font-semibold text-base rounded-xl border border-slate-700/50 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <Settings className="w-5 h-5 text-slate-400" />
            <span>Config & Sound</span>
          </button>

          {/* Controls & Rules Button */}
          <button
            id="btn-open-controls"
            onClick={() => {
              audioEngine.playClick();
              onOpenControls();
            }}
            className="w-full py-3.5 px-6 bg-slate-800/60 hover:bg-slate-700/60 text-slate-200 font-semibold text-base rounded-xl border border-slate-700/50 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <HelpCircle className="w-5 h-5 text-slate-400" />
            <span>Controls & How to Play</span>
          </button>

          {/* GitHub Pages Deploy Guide Button */}
          <button
            id="btn-open-github-guide"
            onClick={() => {
              audioEngine.playClick();
              onOpenGithubGuide();
            }}
            className="w-full py-3.5 px-6 bg-slate-900/80 hover:bg-slate-800 text-cyan-300 font-semibold text-base rounded-xl border border-cyan-500/30 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-sm"
          >
            <GithubIcon className="w-5 h-5 text-cyan-400" />
            <span>Deploy to GitHub Pages</span>
          </button>
        </div>

        {/* Feature Highlights Footer */}
        <div className="grid grid-cols-3 gap-3 w-full pt-4 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex flex-col items-center gap-1">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Saved Progress</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span>Retro Audio FX</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Vite + React</span>
          </div>
        </div>

      </div>
    </div>
  );
};
