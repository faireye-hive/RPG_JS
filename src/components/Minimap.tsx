import React, { useState } from 'react';
import { Map, Maximize2, Minimize2, Navigation, Compass } from 'lucide-react';
import { audioEngine } from '../utils/audio';

interface MinimapProps {
  currentCoords: [number, number];
  visitedCoords?: string[];
  className?: string;
}

export const Minimap: React.FC<MinimapProps> = ({
  currentCoords,
  visitedCoords = [],
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [gridSize, setGridSize] = useState<5 | 7>(5);

  const [curX, curY] = currentCoords;
  const visitedSet = new Set(visitedCoords);
  // Ensure current location is in visited set
  visitedSet.add(`${curX},${curY}`);

  // Calculate offsets for rendering grid
  const halfSize = Math.floor(gridSize / 2);
  const gridCells: { x: number; y: number; key: string }[] = [];

  for (let dy = -halfSize; dy <= halfSize; dy++) {
    for (let dx = -halfSize; dx <= halfSize; dx++) {
      const gx = curX + dx;
      const gy = curY + dy;
      gridCells.push({ x: gx, y: gy, key: `${gx},${gy}` });
    }
  }

  const handleToggleExpand = () => {
    audioEngine.playClick();
    setIsExpanded(prev => !prev);
  };

  const handleCycleGridSize = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioEngine.playClick();
    setGridSize(prev => (prev === 5 ? 7 : 5));
  };

  return (
    <div className={`relative pointer-events-auto select-none ${className}`}>
      
      {/* Main Minimap Box */}
      <div
        onClick={handleToggleExpand}
        className="group relative bg-[#0b171a]/90 hover:bg-[#0b171a]/95 backdrop-blur-md border border-[#1b3d45] hover:border-emerald-500/50 rounded-2xl p-2.5 shadow-2xl transition-all duration-200 cursor-pointer flex flex-col gap-2 min-w-[140px]"
        title="Click to expand minimap"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-200 px-0.5">
          <div className="flex items-center gap-1 text-emerald-400">
            <Map className="w-3.5 h-3.5 text-emerald-400" />
            <span className="tracking-wide">MINIMAP³</span>
          </div>
          
          <div className="flex items-center gap-1 text-slate-400 group-hover:text-slate-200 transition-colors">
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
            )}
          </div>
        </div>

        {/* Radar Canvas / Grid Container */}
        <div className="relative bg-[#071113]/90 rounded-xl p-1.5 border border-[#173339] overflow-hidden flex flex-col items-center">
          
          {/* Compass direction indicators */}
          <span className="absolute top-0.5 text-[8px] font-mono font-bold text-slate-400 leading-none">N</span>
          <span className="absolute bottom-0.5 text-[8px] font-mono font-bold text-slate-400 leading-none">S</span>
          <span className="absolute left-0.5 top-1/2 -translate-y-1/2 text-[8px] font-mono font-bold text-slate-400 leading-none">W</span>
          <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[8px] font-mono font-bold text-slate-400 leading-none">E</span>

          {/* Grid Layout */}
          <div
            className="grid gap-1 my-2"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`
            }}
          >
            {gridCells.map((cell) => {
              const isCurrent = cell.x === curX && cell.y === curY;
              const isVisited = visitedSet.has(cell.key);
              const isOrigin = cell.x === 0 && cell.y === 0;

              return (
                <div
                  key={cell.key}
                  className={`relative rounded-sm transition-all duration-300 flex items-center justify-center ${
                    gridSize === 5 ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'
                  } ${
                    isCurrent
                      ? 'bg-cyan-500/30 border border-cyan-400 ring-2 ring-cyan-400/40'
                      : isVisited
                      ? isOrigin
                        ? 'bg-amber-500/20 border border-amber-400/60'
                        : 'bg-emerald-950/80 border border-emerald-500/40 hover:bg-emerald-800/50'
                      : 'bg-slate-900/60 border border-slate-800/60'
                  }`}
                >
                  {/* Current Position Marker */}
                  {isCurrent && (
                    <div className="relative flex items-center justify-center w-full h-full">
                      <div className="absolute w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-75" />
                      <div className="w-1.5 h-1.5 bg-cyan-300 rounded-full shadow-[0_0_8px_rgba(34,211,238,1)]" />
                    </div>
                  )}

                  {/* Origin Marker (if not current) */}
                  {!isCurrent && isOrigin && (
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_4px_rgba(251,191,36,0.8)]" />
                  )}

                  {/* Visited Tile subtle dot */}
                  {!isCurrent && !isOrigin && isVisited && (
                    <div className="w-1 h-1 bg-emerald-400/70 rounded-full" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Coords footer readout */}
          <div className="text-[10px] font-mono text-cyan-300 font-bold bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
            <Navigation className="w-2.5 h-2.5 text-cyan-400" />
            <span>({curX}, {curY})</span>
          </div>

        </div>

        {/* Quick controls bar */}
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 px-0.5 pt-0.5">
          <button
            onClick={handleCycleGridSize}
            className="hover:text-emerald-400 transition-colors cursor-pointer"
          >
            Zoom: {gridSize}x{gridSize}
          </button>
          <span className="text-slate-500">Tap to expand</span>
        </div>

      </div>

      {/* Expanded Modal Overlay View */}
      {isExpanded && (
        <div
          onClick={() => setIsExpanded(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150 cursor-default"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-sm w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 font-mono select-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                <Compass className="w-5 h-5 text-emerald-400" />
                <span>WORLD GRID RADAR</span>
              </div>
              <button
                onClick={handleToggleExpand}
                className="p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer text-xs"
              >
                Close
              </button>
            </div>

            {/* Grid Info Stats */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
                <span className="text-[10px] text-slate-400 block">CURRENT</span>
                <span className="text-cyan-300 font-bold">X:{curX} Y:{curY}</span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
                <span className="text-[10px] text-slate-400 block">EXPLORED</span>
                <span className="text-emerald-400 font-bold">{visitedSet.size} Maps</span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
                <span className="text-[10px] text-slate-400 block">ORIGIN</span>
                <span className="text-amber-400 font-bold">X:0 Y:0</span>
              </div>
            </div>

            {/* Expanded 9x9 Grid Visualization */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider">NORTH (Y - 1)</span>
              
              <div className="grid grid-cols-9 gap-1 my-1">
                {Array.from({ length: 9 }).flatMap((_, rowIdx) => {
                  const dy = rowIdx - 4; // -4 to +4
                  return Array.from({ length: 9 }).map((_, colIdx) => {
                    const dx = colIdx - 4; // -4 to +4
                    const gx = curX + dx;
                    const gy = curY + dy;
                    const key = `${gx},${gy}`;
                    const isCurrent = gx === curX && gy === curY;
                    const isVisited = visitedSet.has(key);
                    const isOrigin = gx === 0 && gy === 0;

                    return (
                      <div
                        key={key}
                        title={`Map (${gx}, ${gy})${isCurrent ? ' - YOU ARE HERE' : isVisited ? ' - Visited' : ' - Unexplored'}`}
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md transition-all duration-200 flex items-center justify-center text-[8px] ${
                          isCurrent
                            ? 'bg-cyan-500/30 border-2 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                            : isVisited
                            ? isOrigin
                              ? 'bg-amber-500/30 border border-amber-400 text-amber-300'
                              : 'bg-emerald-900/60 border border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-900/80 border border-slate-800/80 text-slate-600'
                        }`}
                      >
                        {isCurrent ? (
                          <div className="w-2 h-2 bg-cyan-300 rounded-full animate-pulse shadow-[0_0_6px_rgba(34,211,238,1)]" />
                        ) : isOrigin ? (
                          <span className="font-bold text-[9px] text-amber-400">0</span>
                        ) : isVisited ? (
                          <div className="w-1 h-1 bg-emerald-400 rounded-full" />
                        ) : null}
                      </div>
                    );
                  });
                })}
              </div>

              <span className="text-[10px] text-slate-500 font-semibold tracking-wider">SOUTH (Y + 1)</span>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-around text-[10px] text-slate-300 pt-1 border-t border-slate-800">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full" />
                <span>You</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-emerald-600 border border-emerald-400 rounded-sm" />
                <span>Explored</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-amber-500/40 border border-amber-400 rounded-sm" />
                <span>Origin (0,0)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-slate-900 border border-slate-800 rounded-sm" />
                <span>Unexplored</span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
