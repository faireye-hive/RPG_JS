import React, { useState, useEffect, useRef } from 'react';
import { MainMenu } from './components/MainMenu';
import { PauseMenu } from './components/PauseMenu';
import { SettingsModal } from './components/SettingsModal';
import { ControlsModal } from './components/ControlsModal';
import { GitHubPagesGuideModal } from './components/GitHubPagesGuideModal';
import { CanvasGame } from './components/CanvasGame';
import { GameUIOverlay } from './components/GameUIOverlay';
import { VictoryModal } from './components/VictoryModal';
import { GameOverModal } from './components/GameOverModal';
import { RpgGameEngine } from './utils/gameEngine';
import { GameConfig, GameStats, GameScreen } from './types/game';
import { audioEngine } from './utils/audio';

const DEFAULT_CONFIG: GameConfig = {
  soundEnabled: true,
  sfxVolume: 0.6,
  musicEnabled: true,
  musicVolume: 0.3,
  keyBindings: {
    up: ['ArrowUp', 'KeyW', 'w'],
    down: ['ArrowDown', 'KeyS', 's'],
    left: ['ArrowLeft', 'KeyA', 'a'],
    right: ['ArrowRight', 'KeyD', 'd'],
    attack: ['Space', 'space', ' '],
    pause: ['Escape', 'KeyP', 'p', 'escape'],
    restart: ['KeyR', 'r']
  },
  showTouchControls: false,
  difficulty: 'normal'
};

export const App: React.FC = () => {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [config, setConfig] = useState<GameConfig>(() => {
    try {
      const saved = localStorage.getItem('rpg_game_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CONFIG;
  });

  const [hasSavedGame, setHasSavedGame] = useState<boolean>(() => {
    return !!localStorage.getItem('gameState');
  });

  const [stats, setStats] = useState<GameStats>({
    enemiesKilled: 0,
    mapsExplored: 1,
    timeElapsed: 0,
    babyRescued: false,
    currentCoords: [0, 0]
  });

  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);

  const [activeModal, setActiveModal] = useState<'settings' | 'controls' | 'github_guide' | null>(null);

  const engineRef = useRef<RpgGameEngine | null>(null);

  // Save config changes to localStorage
  const handleUpdateConfig = (newConfig: GameConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('rpg_game_config', JSON.stringify(newConfig));
    } catch {}
  };

  const handleClearSavedProgress = () => {
    localStorage.removeItem('gameState');
    setHasSavedGame(false);
  };

  const handlePlayNewGame = () => {
    setIsGameOver(false);
    setIsVictory(false);
    setIsPaused(false);
    setScreen('playing');

    // Give engine time to mount if needed
    setTimeout(() => {
      if (engineRef.current) {
        engineRef.current.restart();
      }
    }, 50);
  };

  const handleResumeGame = () => {
    setIsGameOver(false);
    setIsVictory(false);
    setIsPaused(false);
    setScreen('playing');

    setTimeout(() => {
      if (engineRef.current) {
        engineRef.current.loadFromStorage();
        engineRef.current.startLoop();
      }
    }, 50);
  };

  const handleReturnToMenu = () => {
    if (engineRef.current) {
      engineRef.current.saveToStorage();
      engineRef.current.stopLoop();
    }
    setHasSavedGame(true);
    setIsPaused(false);
    setIsGameOver(false);
    setIsVictory(false);
    setScreen('menu');
  };

  const handleRespawnInTown = () => {
    setIsGameOver(false);
    setIsVictory(false);
    if (engineRef.current) {
      engineRef.current.respawnInTown();
      engineRef.current.startLoop();
    }
  };

  const handleRestart = () => {
    setIsGameOver(false);
    setIsVictory(false);
    setIsPaused(false);
    if (engineRef.current) {
      engineRef.current.restart();
      engineRef.current.startLoop();
    }
  };

  const handleToggleSound = () => {
    const updated = { ...config, soundEnabled: !config.soundEnabled };
    handleUpdateConfig(updated);
    audioEngine.setConfig(updated.soundEnabled, updated.sfxVolume, updated.musicEnabled, updated.musicVolume);
  };

  // Keep check of saved game state
  useEffect(() => {
    const checkSave = () => {
      setHasSavedGame(!!localStorage.getItem('gameState'));
    };
    window.addEventListener('storage', checkSave);
    return () => window.removeEventListener('storage', checkSave);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      
      {/* 1. Main Menu Screen */}
      {screen === 'menu' && (
        <MainMenu
          onPlayNew={handlePlayNewGame}
          onResume={handleResumeGame}
          hasSavedGame={hasSavedGame}
          onOpenSettings={() => setActiveModal('settings')}
          onOpenControls={() => setActiveModal('controls')}
          onOpenGithubGuide={() => setActiveModal('github_guide')}
        />
      )}

      {/* 2. Playing Canvas Screen */}
      {screen === 'playing' && (
        <div className="relative w-full h-full">
          <CanvasGame
            config={config}
            engineRef={engineRef}
            onStateUpdate={(newStats) => setStats(newStats)}
            onPauseToggle={(paused) => setIsPaused(paused)}
            onGameOver={() => setIsGameOver(true)}
            onVictory={() => setIsVictory(true)}
          />

          <GameUIOverlay
            stats={stats}
            soundEnabled={config.soundEnabled}
            onTogglePause={() => {
              if (engineRef.current) engineRef.current.togglePause();
            }}
            onToggleSound={handleToggleSound}
            onUsePotion={() => {
              if (engineRef.current) engineRef.current.usePotion();
            }}
            onToggleRest={() => {
              if (engineRef.current) engineRef.current.toggleRest();
            }}
            onBuyPotion={() => {
              if (engineRef.current) engineRef.current.buyPotion();
            }}
            showTouchControls={config.showTouchControls}
            onDirectionPress={(dir, pressed) => {
              if (engineRef.current) {
                const keyMap = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
                engineRef.current.setVirtualKey(keyMap[dir], pressed);
              }
            }}
            onAttackPress={() => {
              if (engineRef.current) engineRef.current.triggerVirtualAttack();
            }}
          />

          {/* Pause Modal */}
          {isPaused && (
            <PauseMenu
              onResume={() => {
                if (engineRef.current) engineRef.current.togglePause();
              }}
              onRestart={handleRestart}
              onOpenSettings={() => setActiveModal('settings')}
              onOpenControls={() => setActiveModal('controls')}
              onReturnToMenu={handleReturnToMenu}
            />
          )}

          {/* Victory Modal */}
          {isVictory && (
            <VictoryModal
              stats={stats}
              onContinue={() => setIsVictory(false)}
              onRestart={handleRestart}
              onReturnToMenu={handleReturnToMenu}
            />
          )}

          {/* Game Over Modal */}
          {isGameOver && (
            <GameOverModal
              stats={stats}
              onRespawn={handleRespawnInTown}
              onRestart={handleRestart}
              onReturnToMenu={handleReturnToMenu}
            />
          )}
        </div>
      )}

      {/* Shared Modals */}
      {activeModal === 'settings' && (
        <SettingsModal
          config={config}
          onUpdateConfig={handleUpdateConfig}
          onClose={() => setActiveModal(null)}
          onClearSavedProgress={handleClearSavedProgress}
        />
      )}

      {activeModal === 'controls' && (
        <ControlsModal
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'github_guide' && (
        <GitHubPagesGuideModal
          onClose={() => setActiveModal(null)}
        />
      )}

    </div>
  );
};
