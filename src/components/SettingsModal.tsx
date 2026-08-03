import React, { useState } from 'react';
import { X, Volume2, VolumeX, Music, Shield, Smartphone, Keyboard, Trash2, Check } from 'lucide-react';
import { GameConfig, KeyBindings } from '../types/game';
import { audioEngine } from '../utils/audio';

interface SettingsModalProps {
  config: GameConfig;
  onUpdateConfig: (newConfig: GameConfig) => void;
  onClose: () => void;
  onClearSavedProgress: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  onUpdateConfig,
  onClose,
  onClearSavedProgress
}) => {
  const [activeTab, setActiveTab] = useState<'audio' | 'controls' | 'gameplay'>('audio');
  const [editingKey, setEditingKey] = useState<keyof KeyBindings | null>(null);
  const [clearedNotice, setClearedNotice] = useState(false);

  const handleSoundToggle = () => {
    const updated = { ...config, soundEnabled: !config.soundEnabled };
    onUpdateConfig(updated);
    audioEngine.setConfig(updated.soundEnabled, updated.sfxVolume, updated.musicEnabled, updated.musicVolume);
  };

  const handleMusicToggle = () => {
    const updated = { ...config, musicEnabled: !config.musicEnabled };
    onUpdateConfig(updated);
    audioEngine.setConfig(updated.soundEnabled, updated.sfxVolume, updated.musicEnabled, updated.musicVolume);
  };

  const handleSfxVolume = (val: number) => {
    const updated = { ...config, sfxVolume: val };
    onUpdateConfig(updated);
    audioEngine.setConfig(updated.soundEnabled, val, updated.musicEnabled, updated.musicVolume);
  };

  const handleMusicVolume = (val: number) => {
    const updated = { ...config, musicVolume: val };
    onUpdateConfig(updated);
    audioEngine.setConfig(updated.soundEnabled, updated.sfxVolume, updated.musicEnabled, val);
  };

  const handleDifficulty = (diff: 'easy' | 'normal' | 'hard') => {
    onUpdateConfig({ ...config, difficulty: diff });
  };

  const handleTouchControls = () => {
    onUpdateConfig({ ...config, showTouchControls: !config.showTouchControls });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none overflow-y-auto">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-mono">
            CONFIGURATION & SETTINGS
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

        {/* Navigation Tabs */}
        <div className="flex gap-2 my-4 p-1 bg-slate-950 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'audio'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Audio & Sound</span>
          </button>

          <button
            onClick={() => setActiveTab('controls')}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'controls'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Controls</span>
          </button>

          <button
            onClick={() => setActiveTab('gameplay')}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'gameplay'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Gameplay</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="py-2 space-y-5 min-h-[260px]">
          
          {/* Audio Tab */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              
              {/* SFX Toggle & Slider */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {config.soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-slate-500" />
                    )}
                    <div>
                      <div className="text-sm font-semibold text-slate-200">Sound Effects (SFX)</div>
                      <div className="text-xs text-slate-400">Sword slashes, enemy hits, victory chime</div>
                    </div>
                  </div>
                  <button
                    onClick={handleSoundToggle}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-colors ${
                      config.soundEnabled
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {config.soundEnabled ? 'ENABLED' : 'MUTED'}
                  </button>
                </div>

                {config.soundEnabled && (
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-xs text-slate-400 font-mono">Vol</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.sfxVolume}
                      onChange={(e) => handleSfxVolume(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <span className="text-xs font-mono text-emerald-400 min-w-[36px]">
                      {Math.round(config.sfxVolume * 100)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Music Toggle & Slider */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-teal-400" />
                    <div>
                      <div className="text-sm font-semibold text-slate-200">Retro Background Music</div>
                      <div className="text-xs text-slate-400">8-bit synth ambient melody</div>
                    </div>
                  </div>
                  <button
                    onClick={handleMusicToggle}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-colors ${
                      config.musicEnabled
                        ? 'bg-teal-950/60 text-teal-300 border-teal-600/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {config.musicEnabled ? 'ENABLED' : 'MUTED'}
                  </button>
                </div>

                {config.musicEnabled && (
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-xs text-slate-400 font-mono">Vol</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.musicVolume}
                      onChange={(e) => handleMusicVolume(parseFloat(e.target.value))}
                      className="w-full accent-teal-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <span className="text-xs font-mono text-teal-400 min-w-[36px]">
                      {Math.round(config.musicVolume * 100)}%
                    </span>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Controls Tab */}
          {activeTab === 'controls' && (
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                <div className="text-slate-300 font-semibold mb-2">Keyboard Keybindings</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between items-center p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400">Move Up</span>
                    <span className="font-mono text-emerald-400 bg-slate-800 px-2 py-0.5 rounded">
                      {config.keyBindings.up.join(' / ')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400">Move Down</span>
                    <span className="font-mono text-emerald-400 bg-slate-800 px-2 py-0.5 rounded">
                      {config.keyBindings.down.join(' / ')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400">Move Left</span>
                    <span className="font-mono text-emerald-400 bg-slate-800 px-2 py-0.5 rounded">
                      {config.keyBindings.left.join(' / ')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400">Move Right</span>
                    <span className="font-mono text-emerald-400 bg-slate-800 px-2 py-0.5 rounded">
                      {config.keyBindings.right.join(' / ')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-900 rounded border border-slate-800 col-span-2">
                    <span className="text-slate-400">Sword Attack</span>
                    <span className="font-mono text-emerald-400 bg-slate-800 px-2.5 py-0.5 rounded">
                      SPACEBAR
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-900 rounded border border-slate-800 col-span-2">
                    <span className="text-slate-400">Pause Game</span>
                    <span className="font-mono text-emerald-400 bg-slate-800 px-2.5 py-0.5 rounded">
                      ESC / P
                    </span>
                  </div>
                </div>
              </div>

              {/* Touch D-Pad Toggle */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="text-sm font-semibold text-slate-200">On-Screen Virtual D-Pad</div>
                    <div className="text-xs text-slate-400">Show touch controls for mobile / tablet devices</div>
                  </div>
                </div>
                <button
                  onClick={handleTouchControls}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-colors ${
                    config.showTouchControls
                      ? 'bg-cyan-950/60 text-cyan-300 border-cyan-600/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {config.showTouchControls ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          )}

          {/* Gameplay Tab */}
          {activeTab === 'gameplay' && (
            <div className="space-y-4">
              
              {/* Difficulty Selection */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                <div className="text-sm font-semibold text-slate-200 mb-1">Game Difficulty</div>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'normal', 'hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => handleDifficulty(diff)}
                      className={`py-2 px-3 text-xs font-bold uppercase rounded-lg border transition-all cursor-pointer ${
                        config.difficulty === diff
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {config.difficulty === 'easy' && 'Fewer enemies spawn, slower speed.'}
                  {config.difficulty === 'normal' && 'Balanced classic RPG experience.'}
                  {config.difficulty === 'hard' && 'More aggressive enemies with faster chase speeds.'}
                </p>
              </div>

              {/* Reset Saved Progress */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-rose-950/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-rose-300">Saved Game Data</div>
                    <div className="text-xs text-slate-400">Clear saved position, maps, and stats</div>
                  </div>
                  <button
                    onClick={() => {
                      onClearSavedProgress();
                      setClearedNotice(true);
                      setTimeout(() => setClearedNotice(false), 3000);
                    }}
                    className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-700/50 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Save</span>
                  </button>
                </div>
                {clearedNotice && (
                  <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                    <Check className="w-3.5 h-3.5" /> Saved progress cleared successfully!
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer Close */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              audioEngine.playClick();
              onClose();
            }}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm rounded-xl transition-all cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
