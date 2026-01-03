'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

type Grid = number[][];

interface Stencil {
  name: string;
  offsets: [number, number][];
  weight: number;
}

interface GameState {
  screen: 'home' | 'playing' | 'gameover';
  grid: Grid;
  spill: number;
  spillLimit: number;
  turn: number;
  score: number;
  stencilsOffered: number[];
  selectedStencil: number | null;
  mode: 'daily' | 'practice';
  seed: string;
  bestBurst: number;
}

interface SavedData {
  bestScore: number;
  lastDaily: string;
  lastDailyScore: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const GRID_SIZE = 7;
const BURST_THRESHOLD = 4;
const SPILL_LIMIT = 25;

const STENCILS: Stencil[] = [
  { name: 'Dot', offsets: [[0, 0]], weight: 30 },
  { name: 'H-Domino', offsets: [[0, 0], [1, 0]], weight: 20 },
  { name: 'V-Domino', offsets: [[0, 0], [0, 1]], weight: 20 },
  { name: 'H-Line', offsets: [[0, 0], [1, 0], [2, 0]], weight: 10 },
  { name: 'V-Line', offsets: [[0, 0], [0, 1], [0, 2]], weight: 10 },
  { name: 'L-Shape', offsets: [[0, 0], [1, 0], [0, 1]], weight: 8 },
  { name: 'Square', offsets: [[0, 0], [1, 0], [0, 1], [1, 1]], weight: 2 },
];

// ============================================================================
// SEEDED RNG
// ============================================================================

function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function() {
    h ^= h >>> 16;
    h = Math.imul(h, 2246822507);
    h ^= h >>> 13;
    h = Math.imul(h, 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function getDateSeed(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// ============================================================================
// GAME LOGIC
// ============================================================================

function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

function cloneGrid(grid: Grid): Grid {
  return grid.map(row => [...row]);
}

function pickStencils(rand: () => number): number[] {
  const totalWeight = STENCILS.reduce((sum, s) => sum + s.weight, 0);
  const result: number[] = [];

  for (let i = 0; i < 3; i++) {
    let r = rand() * totalWeight;
    for (let j = 0; j < STENCILS.length; j++) {
      r -= STENCILS[j].weight;
      if (r <= 0) {
        result.push(j);
        break;
      }
    }
  }

  return result;
}

function canPlace(grid: Grid, stencilIdx: number, anchorR: number, anchorC: number): boolean {
  const stencil = STENCILS[stencilIdx];
  for (const [dc, dr] of stencil.offsets) {
    const r = anchorR + dr;
    const c = anchorC + dc;
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) {
      return false;
    }
  }
  return true;
}

function applyStamp(grid: Grid, stencilIdx: number, anchorR: number, anchorC: number): Grid {
  const newGrid = cloneGrid(grid);
  const stencil = STENCILS[stencilIdx];

  for (const [dc, dr] of stencil.offsets) {
    const r = anchorR + dr;
    const c = anchorC + dc;
    newGrid[r][c] += 1;
  }

  return newGrid;
}

function resolveBursts(grid: Grid): { newGrid: Grid; bursts: number; spillInc: number } {
  const newGrid = cloneGrid(grid);
  let bursts = 0;
  let spillInc = 0;

  const queue: [number, number][] = [];

  // Initialize queue with cells >= threshold
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (newGrid[r][c] >= BURST_THRESHOLD) {
        queue.push([r, c]);
      }
    }
  }

  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;

    while (newGrid[r][c] >= BURST_THRESHOLD) {
      newGrid[r][c] -= 4;
      bursts++;

      for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;

        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
          newGrid[nr][nc] += 1;
          if (newGrid[nr][nc] === BURST_THRESHOLD) {
            queue.push([nr, nc]);
          }
        } else {
          spillInc++;
        }
      }
    }
  }

  return { newGrid, bursts, spillInc };
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function InkPressureGame() {
  const [gameState, setGameState] = useState<GameState>({
    screen: 'home',
    grid: createEmptyGrid(),
    spill: 0,
    spillLimit: SPILL_LIMIT,
    turn: 0,
    score: 0,
    stencilsOffered: [0, 1, 2],
    selectedStencil: null,
    mode: 'daily',
    seed: '',
    bestBurst: 0,
  });

  const [savedData, setSavedData] = useState<SavedData>({
    bestScore: 0,
    lastDaily: '',
    lastDailyScore: 0,
  });

  const [hoveredCell, setHoveredCell] = useState<[number, number] | null>(null);
  const [undoStack, setUndoStack] = useState<GameState[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const randRef = useRef<() => number>(() => Math.random());

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('inkpressure_data');
    if (saved) {
      setSavedData(JSON.parse(saved));
    }
  }, []);

  const saveScore = useCallback((score: number, mode: 'daily' | 'practice', seed: string) => {
    setSavedData(prev => {
      const newData = { ...prev };
      if (score > prev.bestScore) {
        newData.bestScore = score;
      }
      if (mode === 'daily') {
        newData.lastDaily = seed;
        newData.lastDailyScore = score;
      }
      localStorage.setItem('inkpressure_data', JSON.stringify(newData));
      return newData;
    });
  }, []);

  // Keyboard controls for stencil selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.screen !== 'playing') return;

      if (e.key === '1') {
        setGameState(prev => ({ ...prev, selectedStencil: prev.selectedStencil === 0 ? null : 0 }));
      } else if (e.key === '2') {
        setGameState(prev => ({ ...prev, selectedStencil: prev.selectedStencil === 1 ? null : 1 }));
      } else if (e.key === '3') {
        setGameState(prev => ({ ...prev, selectedStencil: prev.selectedStencil === 2 ? null : 2 }));
      } else if (e.key === 'z' || e.key === 'Z') {
        if (undoStack.length > 0) {
          const prevState = undoStack[undoStack.length - 1];
          setGameState(prevState);
          setUndoStack(prev => prev.slice(0, -1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.screen, undoStack]);

  const startGame = useCallback((mode: 'daily' | 'practice') => {
    const seed = mode === 'daily' ? getDateSeed() : `practice-${Date.now()}`;
    randRef.current = seededRandom(seed);

    setGameState({
      screen: 'playing',
      grid: createEmptyGrid(),
      spill: 0,
      spillLimit: SPILL_LIMIT,
      turn: 0,
      score: 0,
      stencilsOffered: pickStencils(randRef.current),
      selectedStencil: null,
      mode,
      seed,
      bestBurst: 0,
    });
    setUndoStack([]);
  }, []);

  const handleStencilSelect = useCallback((index: number) => {
    setGameState(prev => ({
      ...prev,
      selectedStencil: prev.selectedStencil === index ? null : index,
    }));
  }, []);

  const handleCellClick = useCallback((r: number, c: number) => {
    if (gameState.screen !== 'playing' || gameState.selectedStencil === null) return;

    const stencilIdx = gameState.stencilsOffered[gameState.selectedStencil];
    if (!canPlace(gameState.grid, stencilIdx, r, c)) return;

    // Save state for undo
    setUndoStack(prev => [...prev, { ...gameState, grid: cloneGrid(gameState.grid) }]);

    // Apply stamp
    const stampedGrid = applyStamp(gameState.grid, stencilIdx, r, c);

    // Resolve bursts
    const { newGrid, bursts, spillInc } = resolveBursts(stampedGrid);

    const newSpill = gameState.spill + spillInc;
    const isGameOver = newSpill >= gameState.spillLimit;

    // Calculate score
    let addedScore = bursts * 2;
    if (bursts >= 5) {
      addedScore += (bursts - 4) * 3;
    }

    const newState: GameState = {
      ...gameState,
      grid: newGrid,
      spill: newSpill,
      turn: gameState.turn + 1,
      score: gameState.score + addedScore,
      stencilsOffered: pickStencils(randRef.current),
      selectedStencil: null,
      bestBurst: Math.max(gameState.bestBurst, bursts),
      screen: isGameOver ? 'gameover' : 'playing',
    };

    setGameState(newState);

    // Save results on game over
    if (isGameOver) {
      saveScore(newState.score, gameState.mode, gameState.seed);
    }
  }, [gameState, saveScore]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prevState = undoStack[undoStack.length - 1];
    setGameState(prevState);
    setUndoStack(prev => prev.slice(0, -1));
  }, [undoStack]);

  const copyShare = useCallback(() => {
    const { seed, score, turn, spill, spillLimit, bestBurst } = gameState;
    const text = `InkPressure ${seed}\nScore: ${score}\nTurns: ${turn}\nSpill: ${spill}/${spillLimit}\nBest burst: ${bestBurst}`;
    navigator.clipboard.writeText(text);
  }, [gameState]);

  const getPreviewCells = (): Set<string> => {
    if (gameState.selectedStencil === null || hoveredCell === null) return new Set();

    const stencilIdx = gameState.stencilsOffered[gameState.selectedStencil];
    const stencil = STENCILS[stencilIdx];
    const [hr, hc] = hoveredCell;
    const cells = new Set<string>();

    for (const [dc, dr] of stencil.offsets) {
      const r = hr + dr;
      const c = hc + dc;
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        cells.add(`${r}-${c}`);
      }
    }

    return cells;
  };

  const renderGrid = () => {
    const { grid, selectedStencil, stencilsOffered } = gameState;
    const cellSize = 40;
    const gap = 2;
    const previewCells = getPreviewCells();
    const canPlaceHere = hoveredCell && selectedStencil !== null
      ? canPlace(grid, stencilsOffered[selectedStencil], hoveredCell[0], hoveredCell[1])
      : false;

    return (
      <div
        className="border border-[var(--border)]"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize}px)`,
          gap: `${gap}px`,
          padding: gap,
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isPreview = previewCells.has(`${r}-${c}`);
            const opacity = cell === 0 ? 0.1 : Math.min(0.3 + cell * 0.2, 0.9);

            return (
              <div
                key={`${r}-${c}`}
                className={`flex items-center justify-center text-xs font-medium cursor-pointer transition-all duration-100 ${
                  isPreview && canPlaceHere
                    ? 'ring-2 ring-[var(--foreground)]'
                    : isPreview && !canPlaceHere
                    ? 'ring-2 ring-red-500'
                    : ''
                }`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: `rgba(var(--foreground-rgb, 23, 23, 23), ${opacity})`,
                  color: cell >= 2 ? 'var(--background)' : 'var(--foreground)',
                }}
                onClick={() => handleCellClick(r, c)}
                onMouseEnter={() => setHoveredCell([r, c])}
                onMouseLeave={() => setHoveredCell(null)}
              >
                {cell > 0 && cell}
              </div>
            );
          })
        )}
      </div>
    );
  };

  const renderStencilPreview = (stencilIdx: number) => {
    const stencil = STENCILS[stencilIdx];
    const previewSize = 40;
    const cellSize = 8;

    // Find bounds
    let maxR = 0, maxC = 0;
    for (const [dc, dr] of stencil.offsets) {
      maxR = Math.max(maxR, dr);
      maxC = Math.max(maxC, dc);
    }

    return (
      <div
        className="relative"
        style={{ width: previewSize, height: previewSize }}
      >
        {stencil.offsets.map(([dc, dr], i) => (
          <div
            key={i}
            className="absolute bg-[var(--foreground)]"
            style={{
              width: cellSize,
              height: cellSize,
              left: dc * (cellSize + 1) + (previewSize - (maxC + 1) * (cellSize + 1)) / 2,
              top: dr * (cellSize + 1) + (previewSize - (maxR + 1) * (cellSize + 1)) / 2,
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-[var(--background)]">
      <div className="w-full max-w-sm">
        {/* Home Screen */}
        {gameState.screen === 'home' && (
          <div className="flex flex-col items-center text-center">
            <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-3">
              Sandpile Bursts
            </p>
            <h1 className="text-3xl font-medium tracking-tight text-[var(--foreground)] mb-8">
              Ink Pressure
            </h1>

            <div className="mb-8 text-center">
              <p className="text-[var(--muted)] text-sm mb-2">
                Stamp patterns to build ink counts
              </p>
              <p className="text-[var(--muted)] text-xs">
                Cells at 4+ burst and spread ink
              </p>
              <p className="text-[var(--muted)] text-xs">
                Ink that spills off the edge fills the meter
              </p>
              <p className="text-[var(--muted)] text-xs">
                Game ends when spill meter fills
              </p>
            </div>

            <div className="flex gap-3 mb-8">
              <button
                onClick={() => startGame('daily')}
                className="px-6 py-3 text-sm font-medium border border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
              >
                Daily
              </button>
              <button
                onClick={() => startGame('practice')}
                className="px-6 py-3 text-sm font-medium border border-[var(--muted)] text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                Practice
              </button>
            </div>

            {savedData.bestScore > 0 && (
              <p className="text-xs text-[var(--muted)]">
                Best: {savedData.bestScore}
              </p>
            )}
          </div>
        )}

        {/* Playing Screen */}
        {gameState.screen === 'playing' && (
          <div className="flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-4">
              <div>
                <p className="text-lg font-medium text-[var(--foreground)]">
                  {gameState.score}
                </p>
                <p className="text-xs text-[var(--muted)]">score</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-[var(--foreground)]">
                  Turn {gameState.turn + 1}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--muted)]">
                  spill {gameState.spill}/{gameState.spillLimit}
                </p>
              </div>
            </div>

            {/* Spill meter */}
            <div className="w-full h-2 bg-[var(--border)] mb-4">
              <div
                className="h-full bg-[var(--foreground)] transition-all duration-200"
                style={{ width: `${(gameState.spill / gameState.spillLimit) * 100}%` }}
              />
            </div>

            {/* Stencil selection */}
            <div className="flex gap-2 mb-4">
              {gameState.stencilsOffered.map((stencilIdx, i) => (
                <button
                  key={i}
                  onClick={() => handleStencilSelect(i)}
                  className={`p-2 border transition-colors ${
                    gameState.selectedStencil === i
                      ? 'border-[var(--foreground)] bg-[var(--foreground)]/10'
                      : 'border-[var(--muted)] hover:border-[var(--foreground)]'
                  }`}
                >
                  {renderStencilPreview(stencilIdx)}
                </button>
              ))}
            </div>

            {renderGrid()}

            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className="px-3 py-1 text-xs border border-[var(--muted)] text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Undo
              </button>
              <button
                onClick={() => setShowHelp(true)}
                className="px-2 py-1 text-xs border border-[var(--muted)] text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                ?
              </button>
            </div>

            <p className="mt-2 text-xs text-[var(--muted)]">
              Select a stencil, then click to place
            </p>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState.screen === 'gameover' && (
          <div className="flex flex-col items-center text-center">
            <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-3">
              Ink Overflowed
            </p>
            <h2 className="text-2xl font-medium text-[var(--foreground)] mb-6">
              Game Over
            </h2>

            <p className="text-4xl font-medium text-[var(--foreground)] mb-6">
              {gameState.score}
            </p>

            <div className="flex gap-8 mb-8">
              <div>
                <p className="text-lg font-medium text-[var(--foreground)]">
                  {gameState.turn}
                </p>
                <p className="text-xs text-[var(--muted)]">Turns</p>
              </div>
              <div>
                <p className="text-lg font-medium text-[var(--foreground)]">
                  {gameState.bestBurst}
                </p>
                <p className="text-xs text-[var(--muted)]">Best Burst</p>
              </div>
            </div>

            <div className="flex gap-3 mb-6">
              <button
                onClick={copyShare}
                className="px-6 py-3 text-sm font-medium border border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
              >
                Copy Share
              </button>
              <button
                onClick={() => startGame('practice')}
                className="px-6 py-3 text-sm font-medium border border-[var(--muted)] text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                Play Again
              </button>
            </div>

            {savedData.bestScore > 0 && (
              <p className="text-xs text-[var(--muted)]">
                Best: {savedData.bestScore}
              </p>
            )}
          </div>
        )}

        {/* Help Modal */}
        {showHelp && (
          <div className="fixed inset-0 bg-[var(--background)]/95 flex items-center justify-center p-6 z-50">
            <div className="max-w-sm text-center">
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">
                How to Play
              </h3>
              <div className="text-sm text-[var(--muted)] space-y-2 mb-6">
                <p>Each turn, pick a stencil and stamp it on the grid.</p>
                <p>Cells gain +1 ink for each stamp.</p>
                <p>When a cell reaches 4, it bursts: -4 to self, +1 to neighbors.</p>
                <p>Bursts can chain reaction!</p>
                <p>Ink that bursts off the edge fills the spill meter.</p>
                <p>Game ends when spill reaches {SPILL_LIMIT}.</p>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="px-6 py-2 text-sm border border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
