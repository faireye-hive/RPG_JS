import React, { useEffect, useRef } from 'react';
import { RpgGameEngine } from '../utils/gameEngine';
import { GameConfig, GameStats } from '../types/game';

interface CanvasGameProps {
  config: GameConfig;
  engineRef: React.MutableRefObject<RpgGameEngine | null>;
  onStateUpdate: (stats: GameStats) => void;
  onPauseToggle: (isPaused: boolean) => void;
  onGameOver: () => void;
  onVictory: () => void;
}

export const CanvasGame: React.FC<CanvasGameProps> = ({
  config,
  engineRef,
  onStateUpdate,
  onPauseToggle,
  onGameOver,
  onVictory
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new RpgGameEngine(canvasRef.current, config);
    engineRef.current = engine;

    engine.onStateChange = () => {
      onStateUpdate({ ...engine.stats });
    };

    engine.onPauseToggle = (isPaused) => {
      onPauseToggle(isPaused);
    };

    engine.onGameOver = () => {
      onGameOver();
    };

    engine.onVictory = () => {
      onVictory();
    };

    // Auto resume/start loop
    engine.startLoop();

    return () => {
      engine.unbindEvents();
      engineRef.current = null;
    };
  }, []);

  // Update engine config when config prop changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.config = config;
    }
  }, [config]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        id="canvas"
        className="w-full h-full object-contain aspect-video"
      />
    </div>
  );
};
