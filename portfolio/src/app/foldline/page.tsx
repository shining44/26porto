'use client';

import { useEffect, useState, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

type Grid = boolean[][];

interface GameState {
  screen: 'home' | 'playing' | 'win' | 'lose';
  grid: Grid;
  movesLeft: number;
  initialLitCount: number;
  mode: 'daily' | 'practice';
  seed: string;
  score: number;
  moveHistory: string[];
}

interface SavedData {
  bestScore: number;
  lastDaily: string;
  lastDailyResult: 'win' | 'lose' | null;
  lastDailyScore: number;
}

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

// ============================================================================
// GAME LOGIC
// ============================================================================

function createGrid(seed: string): Grid {
  const rand = seededRandom(seed);
  const grid: Grid = [];
  for (let r = 0; r < 6; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < 6; c++) {
      row.push(rand() < 0.45);
    }
    grid.push(row);
  }
  return grid;
}

function countLit(grid: Grid): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell) count++;
    }
  }
  return count;
}

function cloneGrid(grid: Grid): Grid {
  return grid.map(row => [...row]);
}

function foldHorizontal(grid: Grid, k: number): Grid {
  const H = grid.length;
  const W = grid[0].length;
  const topHeight = k;
  const bottomHeight = H - k;

  if (topHeight <= bottomHeight) {
    // Top folds down
    const newH = bottomHeight;
    const newGrid: Grid = [];
    // Base = bottom portion
    for (let r = k; r < H; r++) {
      newGrid.push([...grid[r]]);
    }
    // Overlay top with reflection
    for (let r = 0; r < k; r++) {
      const targetR = k - 1 - r;
      for (let c = 0; c < W; c++) {
        newGrid[targetR][c] = newGrid[targetR][c] !== grid[r][c];
      }
    }
    return newGrid;
  } else {
    // Bottom folds up
    const newH = topHeight;
    const newGrid: Grid = [];
    // Base = top portion
    for (let r = 0; r < k; r++) {
      newGrid.push([...grid[r]]);
    }
    // Overlay bottom with reflection
    for (let r = k; r < H; r++) {
      const b = r - k;
      const targetR = newH - 1 - b;
      for (let c = 0; c < W; c++) {
        newGrid[targetR][c] = newGrid[targetR][c] !== grid[r][c];
      }
    }
    return newGrid;
  }
}

function foldVertical(grid: Grid, k: number): Grid {
  const H = grid.length;
  const W = grid[0].length;
  const leftWidth = k;
  const rightWidth = W - k;

  if (leftWidth <= rightWidth) {
    // Left folds right
    const newW = rightWidth;
    const newGrid: Grid = [];
    // Base = right portion
    for (let r = 0; r < H; r++) {
      newGrid.push(grid[r].slice(k));
    }
    // Overlay left with reflection
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < k; c++) {
        const targetC = k - 1 - c;
        newGrid[r][targetC] = newGrid[r][targetC] !== grid[r][c];
      }
    }
    return newGrid;
  } else {
    // Right folds left
    const newW = leftWidth;
    const newGrid: Grid = [];
    // Base = left portion
    for (let r = 0; r < H; r++) {
      newGrid.push(grid[r].slice(0, k));
    }
    // Overlay right with reflection
    for (let r = 0; r < H; r++) {
      for (let c = k; c < W; c++) {
        const b = c - k;
        const targetC = newW - 1 - b;
        newGrid[r][targetC] = newGrid[r][targetC] !== grid[r][c];
      }
    }
    return newGrid;
  }
}

function getDateSeed(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function generateValidPuzzle(seed: string): Grid {
  let attempts = 0;
  let rand = seededRandom(seed);

  while (attempts < 100) {
    const grid: Grid = [];
    for (let r = 0; r < 6; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < 6; c++) {
        row.push(rand() < 0.45);
      }
      grid.push(row);
    }

    const litCount = countLit(grid);
    const total = 36;

    if (litCount > total * 0.2 && litCount < total * 0.7) {
      return grid;
    }

    attempts++;
    rand = seededRandom(seed + attempts);
  }

  return createGrid(seed);
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function FoldlineGame() {
  const [gameState, setGameState] = useState<GameState>({
    screen: 'home',
    grid: [],
    movesLeft: 7,
    initialLitCount: 0,
    mode: 'daily',
    seed: '',
    score: 0,
    moveHistory: [],
  });

  const [savedData, setSavedData] = useState<SavedData>({
    bestScore: 0,
    lastDaily: '',
    lastDailyResult: null,
    lastDailyScore: 0,
  });

  const [hoverLine, setHoverLine] = useState<{ type: 'h' | 'v'; index: number } | null>(null);
  const [undoStack, setUndoStack] = useState<GameState[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('foldline_data');
    if (saved) {
      setSavedData(JSON.parse(saved));
    }
  }, []);

  const startGame = useCallback((mode: 'daily' | 'practice') => {
    const seed = mode === 'daily' ? getDateSeed() : `practice-${Date.now()}`;
    const grid = generateValidPuzzle(seed);
    const litCount = countLit(grid);

    setGameState({
      screen: 'playing',
      grid,
      movesLeft: 7,
      initialLitCount: litCount,
      mode,
      seed,
      score: 0,
      moveHistory: [],
    });
    setUndoStack([]);
  }, []);

  const handleFold = useCallback((type: 'h' | 'v', index: number) => {
    if (gameState.screen !== 'playing' || gameState.movesLeft <= 0) return;

    const { grid, movesLeft } = gameState;

    // Save current state for undo
    setUndoStack(prev => [...prev, { ...gameState, grid: cloneGrid(grid) }]);

    let newGrid: Grid;
    let moveLabel: string;

    if (type === 'h') {
      newGrid = foldHorizontal(grid, index);
      moveLabel = `H${index}`;
    } else {
      newGrid = foldVertical(grid, index);
      moveLabel = `V${index}`;
    }

    const newMovesLeft = movesLeft - 1;
    const litCount = countLit(newGrid);
    const isWin = litCount === 0;
    const isLose = newMovesLeft === 0 && !isWin;

    let newScreen: 'playing' | 'win' | 'lose' = 'playing';
    let newScore = gameState.initialLitCount - litCount;

    if (isWin) {
      newScreen = 'win';
      newScore = newScore + 50 + 10 * newMovesLeft;
    } else if (isLose) {
      newScreen = 'lose';
    }

    const newState: GameState = {
      ...gameState,
      grid: newGrid,
      movesLeft: newMovesLeft,
      screen: newScreen,
      score: newScore,
      moveHistory: [...gameState.moveHistory, moveLabel],
    };

    setGameState(newState);

    // Save results
    if (newScreen === 'win' || newScreen === 'lose') {
      const newSavedData = { ...savedData };
      if (newScore > savedData.bestScore) {
        newSavedData.bestScore = newScore;
      }
      if (gameState.mode === 'daily') {
        newSavedData.lastDaily = gameState.seed;
        newSavedData.lastDailyResult = newScreen;
        newSavedData.lastDailyScore = newScore;
      }
      setSavedData(newSavedData);
      localStorage.setItem('foldline_data', JSON.stringify(newSavedData));
    }
  }, [gameState, savedData]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prevState = undoStack[undoStack.length - 1];
    setGameState(prevState);
    setUndoStack(prev => prev.slice(0, -1));
  }, [undoStack]);

  const copyShare = useCallback(() => {
    const { grid, moveHistory, seed, score, screen, initialLitCount } = gameState;
    const litCount = countLit(grid);
    const result = screen === 'win' ? 'WIN' : 'LOSE';
    const movesUsed = moveHistory.length;

    let text = `Foldline ${seed}\n`;
    text += `Result: ${result} in ${movesUsed}/7\n`;
    text += `Cleared: ${initialLitCount - litCount}/${initialLitCount}\n`;
    text += `Score: ${score}\n`;
    text += `Moves: ${moveHistory.join(' ')}\n`;

    navigator.clipboard.writeText(text);
  }, [gameState]);

  const renderGrid = () => {
    const { grid } = gameState;
    if (grid.length === 0) return null;

    const H = grid.length;
    const W = grid[0].length;
    const cellSize = Math.min(48, (320 - 20) / Math.max(H, W));
    const gapSize = 3;

    return (
      <div className="relative">
        {/* Horizontal fold lines (above each row except first) */}
        {Array.from({ length: H - 1 }, (_, i) => i + 1).map(k => (
          <div
            key={`h-${k}`}
            className={`absolute left-0 right-0 h-3 cursor-pointer transition-colors ${
              hoverLine?.type === 'h' && hoverLine.index === k
                ? 'bg-[var(--foreground)] opacity-20'
                : 'hover:bg-[var(--muted)] hover:opacity-20'
            }`}
            style={{
              top: k * (cellSize + gapSize) - gapSize / 2 - 6,
            }}
            onClick={() => handleFold('h', k)}
            onMouseEnter={() => setHoverLine({ type: 'h', index: k })}
            onMouseLeave={() => setHoverLine(null)}
          />
        ))}

        {/* Vertical fold lines (to the left of each column except first) */}
        {Array.from({ length: W - 1 }, (_, i) => i + 1).map(k => (
          <div
            key={`v-${k}`}
            className={`absolute top-0 bottom-0 w-3 cursor-pointer transition-colors ${
              hoverLine?.type === 'v' && hoverLine.index === k
                ? 'bg-[var(--foreground)] opacity-20'
                : 'hover:bg-[var(--muted)] hover:opacity-20'
            }`}
            style={{
              left: k * (cellSize + gapSize) - gapSize / 2 - 6,
            }}
            onClick={() => handleFold('v', k)}
            onMouseEnter={() => setHoverLine({ type: 'v', index: k })}
            onMouseLeave={() => setHoverLine(null)}
          />
        ))}

        {/* Grid cells */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${W}, ${cellSize}px)`,
            gap: `${gapSize}px`,
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                className={`transition-all duration-150 ${
                  cell
                    ? 'bg-[var(--foreground)]'
                    : 'bg-[var(--border)]'
                }`}
                style={{
                  width: cellSize,
                  height: cellSize,
                }}
              />
            ))
          )}
        </div>
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
              XOR Paper-Folding
            </p>
            <h1 className="text-3xl font-medium tracking-tight text-[var(--foreground)] mb-8">
              Foldline
            </h1>

            <div className="mb-8 text-center">
              <p className="text-[var(--muted)] text-sm mb-2">
                Fold the grid to cancel lit cells
              </p>
              <p className="text-[var(--muted)] text-xs">
                Click between rows/cols to fold
              </p>
              <p className="text-[var(--muted)] text-xs">
                Overlapping cells XOR (same = off)
              </p>
              <p className="text-[var(--muted)] text-xs">
                Turn all cells off to win
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

            {savedData.lastDaily === getDateSeed() && savedData.lastDailyResult && (
              <p className="text-xs text-[var(--muted)] mt-2">
                Today: {savedData.lastDailyResult === 'win' ? 'Won' : 'Lost'} ({savedData.lastDailyScore})
              </p>
            )}
          </div>
        )}

        {/* Playing Screen */}
        {gameState.screen === 'playing' && (
          <div className="flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-6">
              <div>
                <p className="text-xs text-[var(--muted)] uppercase tracking-widest">
                  {gameState.mode === 'daily' ? gameState.seed : 'Practice'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-medium text-[var(--foreground)]">
                  {gameState.movesLeft}
                </p>
                <p className="text-xs text-[var(--muted)]">moves left</p>
              </div>
            </div>

            <div className="mb-6">
              {renderGrid()}
            </div>

            <div className="flex items-center gap-4 mb-4">
              <p className="text-sm text-[var(--muted)]">
                Lit: {countLit(gameState.grid)}
              </p>
              <button
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className="px-3 py-1 text-xs border border-[var(--muted)] text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Undo
              </button>
              <button
                onClick={() => setShowHelp(true)}
                className="px-3 py-1 text-xs border border-[var(--muted)] text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                ?
              </button>
            </div>

            <p className="text-xs text-[var(--muted)]">
              Click gaps between rows/cols to fold
            </p>
          </div>
        )}

        {/* Win/Lose Screen */}
        {(gameState.screen === 'win' || gameState.screen === 'lose') && (
          <div className="flex flex-col items-center text-center">
            <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-3">
              {gameState.mode === 'daily' ? gameState.seed : 'Practice'}
            </p>
            <h2 className="text-2xl font-medium text-[var(--foreground)] mb-6">
              {gameState.screen === 'win' ? 'Solved!' : 'Out of Moves'}
            </h2>

            <p className="text-4xl font-medium text-[var(--foreground)] mb-6">
              {gameState.score}
            </p>

            <div className="flex gap-8 mb-8">
              <div>
                <p className="text-lg font-medium text-[var(--foreground)]">
                  {gameState.moveHistory.length}
                </p>
                <p className="text-xs text-[var(--muted)]">Moves</p>
              </div>
              <div>
                <p className="text-lg font-medium text-[var(--foreground)]">
                  {gameState.initialLitCount - countLit(gameState.grid)}
                </p>
                <p className="text-xs text-[var(--muted)]">Cleared</p>
              </div>
              <div>
                <p className="text-lg font-medium text-[var(--foreground)]">
                  {countLit(gameState.grid)}
                </p>
                <p className="text-xs text-[var(--muted)]">Remaining</p>
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
                New Game
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
                <p>Click between rows or columns to fold the grid.</p>
                <p>The smaller half folds onto the larger half.</p>
                <p>Overlapping cells XOR: same state → off, different → on.</p>
                <p>Turn all cells off within the move limit to win.</p>
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
