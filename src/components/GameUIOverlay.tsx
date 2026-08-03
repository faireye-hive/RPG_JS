import React, { useState } from 'react';
import { Pause, Volume2, VolumeX, Timer, Sword, Heart, Sparkles, Map, ShoppingBag, BedDouble, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { GameStats } from '../types/game';
import { audioEngine } from '../utils/audio';
import { Minimap } from './Minimap';

interface GameUIOverlayProps {
  stats: GameStats;
  soundEnabled: boolean;
  onTogglePause: () => void;
  onToggleSound: () => void;
  onUsePotion?: () => void;
  onToggleRest?: () => void;
  onBuyPotion?: () => void;
  showTouchControls: boolean;
  onDirectionPress?: (dir: 'up' | 'down' | 'left' | 'right', pressed: boolean) => void;
  onAttackPress?: () => void;
}

export const GameUIOverlay: React.FC<GameUIOverlayProps> = ({
  stats,
  soundEnabled,
  onTogglePause,
  onToggleSound,
  onUsePotion,
  onToggleRest,
  onBuyPotion,
  showTouchControls,
  onDirectionPress,
  onAttackPress
}) => {
  const [showMinimapMobile, setShowMinimapMobile] = useState(false);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentHp = stats.health ?? 100;
  const maxHp = stats.maxHealth ?? 100;
  const hpPercent = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));

  const level = stats.level ?? 1;
  const xp = stats.xp ?? 0;
  const maxXp = stats.maxXp ?? 100;

  const attackPower = stats.attackPower ?? 35;
  const potions = stats.potions ?? 0;
  const gold = stats.gold ?? 0;
  const isResting = !!stats.resting;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 sm:p-4 z-20 select-none overflow-hidden font-sans">
      
      {/* Top HUD Row */}
      <div className="flex items-start justify-between w-full gap-2 flex-nowrap">
        
        {/* Left: Hero Stats Card (Pixel-perfect matching screenshot) */}
        <div className="pointer-events-auto flex items-center gap-2.5 bg-[#0b171a]/90 backdrop-blur-md border border-[#1b3d45] rounded-2xl p-2.5 sm:p-3 text-slate-200 shadow-2xl min-w-[210px] sm:min-w-[250px]">
          
          {/* Avatar Thumbnail */}
          <div className="relative w-11 h-11 sm:w-12 sm:h-12 bg-rose-950/80 border border-rose-500/40 rounded-xl overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
            <span className="text-2xl sm:text-3xl">🧑‍🌾</span>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>

          {/* Hero Details Column */}
          <div className="flex flex-col gap-1 w-full min-w-0 font-mono">
            
            {/* Header: Name + Level */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-slate-100 font-sans font-bold text-xs sm:text-sm truncate">Herói</span>
                <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-1.5 py-0.2 rounded text-[10px] sm:text-[11px] font-bold">
                  Lv. {level}
                </span>
              </div>
              <div className="text-[10px] text-cyan-300 font-sans font-semibold truncate leading-tight">
                📍 {stats.regionName || "Vila Inicial - Vale Verde 🏡"}
              </div>
            </div>

            {/* Health Bar */}
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-bold leading-none">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Heart className="w-3 h-3 fill-emerald-500 text-emerald-400" />
                </span>
                <span className="text-slate-200 text-[10px]">{currentHp} / {maxHp}</span>
              </div>
              <div className="w-full h-2 bg-slate-950/90 rounded-full overflow-hidden border border-emerald-900/60 relative">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-300"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            {/* XP Bar */}
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-bold leading-none">
                <span className="flex items-center gap-1 text-sky-400">
                  <Sparkles className="w-2.5 h-2.5 text-sky-400" />
                </span>
                <span className="text-slate-300 text-[9px]">{xp} / {maxXp}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950/90 rounded-full overflow-hidden border border-sky-900/60">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-indigo-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, (xp / maxXp) * 100)}%` }}
                />
              </div>
            </div>

            {/* Bottom Stats Row: Attack, Defense, Timer */}
            <div className="flex items-center justify-between text-[10px] text-cyan-300/90 pt-0.5 border-t border-[#1a383f]">
              <span className="flex items-center gap-1 text-rose-300" title="Ataque">
                <Sword className="w-3 h-3 text-rose-400" />
                <span>{attackPower}</span>
              </span>
              <span className="flex items-center gap-1 text-sky-300" title="Defesa / Nível">
                <Shield className="w-3 h-3 text-sky-400" />
                <span>1</span>
              </span>
              <span className="flex items-center gap-1 text-emerald-300" title="Tempo">
                <Timer className="w-3 h-3 text-emerald-400" />
                <span>{formatTime(stats.timeElapsed)}</span>
              </span>
            </div>

          </div>

        </div>

        {/* Center Top Toolbar Pill */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 bg-[#0b171a]/90 backdrop-blur-md border border-[#1b3d45] rounded-full px-2.5 py-1.5 shadow-2xl font-mono text-xs">
          
          {/* Rest / Sit Button */}
          <button
            onClick={() => {
              if (onToggleRest) onToggleRest();
            }}
            className={`p-1.5 sm:px-2.5 sm:py-1 rounded-full border transition-all active:scale-95 flex items-center gap-1 ${
              isResting
                ? 'bg-sky-950/90 border-sky-400 text-sky-300 ring-2 ring-sky-500/40 animate-pulse'
                : 'bg-[#12252a] border-amber-500/40 text-amber-300 hover:border-amber-400'
            }`}
            title="Sentar / Descansar (Tecla C)"
          >
            <BedDouble className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-bold text-[11px]">{isResting ? 'Levantar' : 'Sentar'}</span>
          </button>

          {/* Syringe / Potion Use Button */}
          <button
            onClick={() => {
              if (onUsePotion) onUsePotion();
            }}
            disabled={potions <= 0}
            className={`p-1.5 sm:px-2.5 sm:py-1 rounded-full border transition-all active:scale-95 flex items-center gap-1 ${
              potions > 0
                ? 'bg-[#12252a] border-emerald-500/50 text-emerald-300 hover:border-emerald-400'
                : 'bg-slate-900/50 border-slate-800 text-slate-600 opacity-60'
            }`}
            title="Usar Poção (Tecla H)"
          >
            <span className="text-sm">🧪</span>
            <span className="font-bold text-[11px]">{potions}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              audioEngine.playClick();
              onToggleSound();
            }}
            className="p-1.5 bg-[#12252a] hover:bg-slate-800 border border-[#1b3d45] text-slate-300 rounded-full transition-all active:scale-95"
            title="Som"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={() => {
              audioEngine.playClick();
              onTogglePause();
            }}
            className="p-1.5 bg-[#12252a] hover:bg-slate-800 border border-[#1b3d45] text-amber-400 rounded-full transition-all active:scale-95"
            title="Pausar"
          >
            <Pause className="w-3.5 h-3.5 fill-amber-400" />
          </button>

          {/* Gold Coin Count */}
          <button
            onClick={() => {
              if (onBuyPotion) onBuyPotion();
            }}
            className="flex items-center gap-1 bg-[#12252a] border border-amber-500/40 px-2 py-1 rounded-full text-amber-300 font-bold text-xs hover:border-amber-400 transition-all cursor-pointer"
            title="Comprar Poção (20 Ouro) [Tecla B]"
          >
            <span>{gold}</span>
            <span>🪙</span>
          </button>

        </div>

        {/* Right Top Area: Minimap */}
        <div className="pointer-events-auto relative">
          
          {/* Mobile Minimap Toggle */}
          <button
            onClick={() => setShowMinimapMobile(!showMinimapMobile)}
            className="sm:hidden p-2 bg-[#0b171a]/90 border border-[#1b3d45] text-emerald-400 rounded-xl shadow-2xl flex items-center gap-1 font-mono text-xs"
          >
            <Map className="w-4 h-4" />
          </button>

          <div className={`${showMinimapMobile ? 'block absolute top-12 right-0 z-30' : 'hidden sm:block'}`}>
            <Minimap
              currentCoords={stats.currentCoords}
              visitedCoords={stats.visitedCoords}
            />
          </div>

        </div>

      </div>

      {/* On-screen Controls overlay for Mobile / Touch */}
      {showTouchControls && onDirectionPress && onAttackPress && (
        <div className="pointer-events-auto w-full flex items-end justify-between p-1 sm:p-3 touch-none select-none">
          
          {/* Bottom Left Ergonomic Virtual Joystick / D-Pad */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 bg-[#0b171a]/80 backdrop-blur-md border-2 border-cyan-500/20 rounded-full p-2 flex items-center justify-center shadow-2xl">
            
            {/* Center Thumbstick Knob */}
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#12282d] border-2 border-cyan-400/40 rounded-full shadow-inner flex items-center justify-center text-cyan-300 font-bold text-xs font-mono pointer-events-none">
              🕹️
            </div>

            {/* Up Direction Button */}
            <button
              onMouseDown={() => onDirectionPress('up', true)}
              onMouseUp={() => onDirectionPress('up', false)}
              onTouchStart={(e) => { e.preventDefault(); onDirectionPress('up', true); }}
              onTouchEnd={(e) => { e.preventDefault(); onDirectionPress('up', false); }}
              className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-slate-800/80 active:bg-cyan-600 text-cyan-200 rounded-xl flex items-center justify-center font-bold text-sm shadow active:scale-95"
            >
              ▲
            </button>

            {/* Down Direction Button */}
            <button
              onMouseDown={() => onDirectionPress('down', true)}
              onMouseUp={() => onDirectionPress('down', false)}
              onTouchStart={(e) => { e.preventDefault(); onDirectionPress('down', true); }}
              onTouchEnd={(e) => { e.preventDefault(); onDirectionPress('down', false); }}
              className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-slate-800/80 active:bg-cyan-600 text-cyan-200 rounded-xl flex items-center justify-center font-bold text-sm shadow active:scale-95"
            >
              ▼
            </button>

            {/* Left Direction Button */}
            <button
              onMouseDown={() => onDirectionPress('left', true)}
              onMouseUp={() => onDirectionPress('left', false)}
              onTouchStart={(e) => { e.preventDefault(); onDirectionPress('left', true); }}
              onTouchEnd={(e) => { e.preventDefault(); onDirectionPress('left', false); }}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-slate-800/80 active:bg-cyan-600 text-cyan-200 rounded-xl flex items-center justify-center font-bold text-sm shadow active:scale-95"
            >
              ◀
            </button>

            {/* Right Direction Button */}
            <button
              onMouseDown={() => onDirectionPress('right', true)}
              onMouseUp={() => onDirectionPress('right', false)}
              onTouchStart={(e) => { e.preventDefault(); onDirectionPress('right', true); }}
              onTouchEnd={(e) => { e.preventDefault(); onDirectionPress('right', false); }}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-slate-800/80 active:bg-cyan-600 text-cyan-200 rounded-xl flex items-center justify-center font-bold text-sm shadow active:scale-95"
            >
              ▶
            </button>

          </div>

          {/* Bottom Right Controls Cluster */}
          <div className="flex items-end gap-2 sm:gap-3">
            
            {/* Secondary Action Cluster (Potion & Backpack/Rest) */}
            <div className="flex flex-col gap-2">
              
              {/* Potion Use Button with Badge */}
              <button
                onClick={() => {
                  if (onUsePotion) onUsePotion();
                }}
                disabled={potions <= 0}
                className={`relative w-12 h-12 sm:w-14 sm:h-14 bg-[#0b171a]/90 border-2 rounded-full flex flex-col items-center justify-center shadow-xl active:scale-90 transition-transform ${
                  potions > 0 ? 'border-rose-500/80 text-rose-300' : 'border-slate-800 text-slate-600 opacity-60'
                }`}
                title="Usar Poção"
              >
                <span className="text-lg">🧪</span>
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-rose-400">
                  {potions}
                </span>
              </button>

              {/* Buy Potion / Backpack Button */}
              <button
                onClick={() => {
                  if (onBuyPotion) onBuyPotion();
                }}
                disabled={gold < 20}
                className={`w-12 h-12 sm:w-14 sm:h-14 bg-[#0b171a]/90 border-2 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform ${
                  gold >= 20 ? 'border-amber-500/80 text-amber-300' : 'border-slate-800 text-slate-600 opacity-60'
                }`}
                title="Comprar Poção (20🪙)"
              >
                <ShoppingBag className="w-5 h-5 text-amber-400" />
              </button>

            </div>

            {/* Primary Attack Sword Button */}
            <button
              onClick={onAttackPress}
              className="w-18 h-18 sm:w-22 sm:h-22 bg-gradient-to-br from-[#12282d] via-[#0e1d21] to-[#071113] active:from-rose-900 active:to-amber-900 text-white rounded-full flex items-center justify-center shadow-2xl border-2 border-cyan-400/60 active:border-amber-400 active:scale-90 transition-all cursor-pointer relative"
              title="Ataque"
            >
              <Sword className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300 transform -rotate-45" />
            </button>

          </div>

        </div>
      )}

    </div>
  );
};
