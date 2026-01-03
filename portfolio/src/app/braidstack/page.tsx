'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

type Cell = 0 | 1 | 2 | 3 | 4; // 0 = empty, 1-4 = bead ranks

interface GameState {
  screen: 'home' | 'playing' | 'gameover';
  grid: Cell[][]; // N rows x 3 cols
  incoming: [Cell, Cell, Cell];
  swapsLeft: number;
  score: number;
  turn: number;
  bestChain: number;
  mode: 'daily' | 'practice';
  seed: string;
  autoDropTimer: number;
}

interface SavedData {
  bestScore: number;
  lastDaily: string;
  lastDailyScore: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const GRID_HEIGHT = 12;
const AUTO_DROP_TIME = 3000;

// Valid clearing patterns (consecutive runs, order matters)
const CLEAR_PATTERNS: [Cell, Cell, Cell][] = [
  [1, 2, 3],
  [2, 3, 4],
  [3, 2, 1],
  [4, 3, 2],
];

const BEAD_COLORS: Record<Cell, string> = {
  0: '',
  1: 'bg-[var(--foreground)]',
  2: 'bg-[var(--foreground)] opacity-75',
  3: 'bg-[var(--foreground)] opacity-50',
  4: 'bg-[var(--foreground)] opacity-30',
};

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

function getDateSeed(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function createEmptyGrid(): Cell[][] {
  return Array.from({ length: GRID_HEIGHT }, () => [0, 0, 0] as Cell[]);
}

function generateIncoming(rand: () => number): [Cell, Cell, Cell] {
  return [
    (Math.floor(rand() * 4) + 1) as Cell,
    (Math.floor(rand() * 4) + 1) as Cell,
    (Math.floor(rand() * 4) + 1) as Cell,
  ];
}

function matchesPattern(row: Cell[], pattern: [Cell, Cell, Cell]): boolean {
  return row[0] === pattern[0] && row[1] === pattern[1] && row[2] === pattern[2];
}

function rowClears(row: Cell[]): boolean {
  if (row[0] === 0 || row[1] === 0 || row[2] === 0) return false;
  return CLEAR_PATTERNS.some(pattern => matchesPattern(row, pattern));
}

function resolveClears(grid: Cell[][]): { newGrid: Cell[][], clearedRows: number, chainWaves: number } {
  let currentGrid = grid.map(row => [...row] as Cell[]);
  let totalCleared = 0;
  let chainWaves = 0;

  while (true) {
    const rowsToClear: number[] = [];
    for (let r = 0; r < currentGrid.length; r++) {
      if (rowClears(currentGrid[r])) {
        rowsToClear.push(r);
      }
    }

    if (rowsToClear.length === 0) break;

    chainWaves++;
    totalCleared += rowsToClear.length;

    // Remove cleared rows
    currentGrid = currentGrid.filter((_, i) => !rowsToClear.includes(i));

    // Add empty rows at the top
    while (currentGrid.length < GRID_HEIGHT) {
      currentGrid.unshift([0, 0, 0] as Cell[]);
    }
  }

  return { newGrid: currentGrid, clearedRows: totalCleared, chainWaves };
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function BraidstackGame() {
  const [gameState, setGameState] = useState<GameState>({
    screen: 'home',
    grid: createEmptyGrid(),
    incoming: [1, 2, 3],
    swapsLeft: 2,
    score: 0,
    turn: 0,
    bestChain: 0,
    mode: 'daily',
    seed: '',
    autoDropTimer: AUTO_DROP_TIME,
  });

  const [savedData, setSavedData] = useState<SavedData>({
    bestScore: 0,
    lastDaily: '',
    lastDailyScore: 0,
  });

  const [showHelp, setShowHelp] = useState(false);
  const randRef = useRef<() => number>(() => Math.random());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('braidstack_data');
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
      localStorage.setItem('braidstack_data', JSON.stringify(newData));
      return newData;
    });
  }, []);

  const handleDropInternal = useCallback((state: GameState): GameState => {
    const { grid, incoming } = state;

    // Check if bottom row has any non-empty cell (overflow)
    if (grid[GRID_HEIGHT - 1].some(c => c !== 0)) {
      // Game over - save score
      saveScore(state.score, state.mode, state.seed);
      return { ...state, screen: 'gameover' };
    }

    // Shift grid down by 1, insert incoming at top
    const newGrid = grid.map(row => [...row] as Cell[]);
    for (let r = GRID_HEIGHT - 1; r > 0; r--) {
      newGrid[r] = [...newGrid[r - 1]] as Cell[];
    }
    newGrid[0] = [...incoming] as Cell[];

    // Resolve clears
    const { newGrid: clearedGrid, clearedRows, chainWaves } = resolveClears(newGrid);

    // Calculate score
    let addedScore = clearedRows * 10;
    if (chainWaves > 1) {
      addedScore += (chainWaves - 1) * 15;
    }

    // Generate new incoming
    const newIncoming = generateIncoming(randRef.current);

    return {
      ...state,
      grid: clearedGrid,
      incoming: newIncoming,
      swapsLeft: 2,
      score: state.score + addedScore,
      turn: state.turn + 1,
      bestChain: Math.max(state.bestChain, chainWaves),
      autoDropTimer: AUTO_DROP_TIME,
    };
  }, [saveScore]);

  // Auto-drop timer
  useEffect(() => {
    if (gameState.screen !== 'playing') return;

    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.screen !== 'playing') return prev;

        const newTimer = prev.autoDropTimer - 100;
        if (newTimer <= 0) {
          return handleDropInternal(prev);
        }
        return { ...prev, autoDropTimer: newTimer };
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.screen, handleDropInternal]);

  const startGame = useCallback((mode: 'daily' | 'practice') => {
    const seed = mode === 'daily' ? getDateSeed() : `practice-${Date.now()}`;
    randRef.current = seededRandom(seed);

    setGameState({
      screen: 'playing',
      grid: createEmptyGrid(),
      incoming: generateIncoming(randRef.current),
      swapsLeft: 2,
      score: 0,
      turn: 0,
      bestChain: 0,
      mode,
      seed,
      autoDropTimer: AUTO_DROP_TIME,
    });
  }, []);

  const handleSwap = useCallback((pos: 'left' | 'right') => {
    if (gameState.screen !== 'playing' || gameState.swapsLeft <= 0) return;

    setGameState(prev => {
      const newIncoming = [...prev.incoming] as [Cell, Cell, Cell];
      if (pos === 'left') {
        [newIncoming[0], newIncoming[1]] = [newIncoming[1], newIncoming[0]];
      } else {
        [newIncoming[1], newIncoming[2]] = [newIncoming[2], newIncoming[1]];
      }
      return {
        ...prev,
        incoming: newIncoming,
        swapsLeft: prev.swapsLeft - 1,
      };
    });
  }, [gameState.screen, gameState.swapsLeft]);

  const handleDrop = useCallback(() => {
    if (gameState.screen !== 'playing') return;
    setGameState(prev => handleDropInternal(prev));
  }, [gameState.screen, handleDropInternal]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.screen !== 'playing') return;

      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        e.preventDefault();
        if (gameState.swapsLeft > 0) {
          setGameState(prev => {
            if (prev.swapsLeft <= 0) return prev;
            const newIncoming = [...prev.incoming] as [Cell, Cell, Cell];
            [newIncoming[0], newIncoming[1]] = [newIncoming[1], newIncoming[0]];
            return { ...prev, incoming: newIncoming, swapsLeft: prev.swapsLeft - 1 };
          });
        }
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (gameState.swapsLeft > 0) {
          setGameState(prev => {
            if (prev.swapsLeft <= 0) return prev;
            const newIncoming = [...prev.incoming] as [Cell, Cell, Cell];
            [newIncoming[1], newIncoming[2]] = [newIncoming[2], newIncoming[1]];
            return { ...prev, incoming: newIncoming, swapsLeft: prev.swapsLeft - 1 };
          });
        }
      } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        setGameState(prev => handleDropInternal(prev));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.screen, gameState.swapsLeft, handleDropInternal]);

  const copyShare = useCallback(() => {
    const { seed, score, turn, bestChain } = gameState;
    const text = `Braidstack ${seed}\nScore: ${score}\nTurns: ${turn}\nBest chain: x${bestChain}`;
    navigator.clipboard.writeText(text);
  }, [gameState]);

  const renderGrid = () => {
    const { grid, incoming } = gameState;
    const cellSize = 48;
    const gap = 3;

    return (
      <div className="flex flex-col items-center">
        {/* Incoming triplet */}
        <div className="mb-4 flex gap-1">
          {incoming.map((cell, i) => (
            <div
              key={`incoming-${i}`}
              className={`flex items-center justify-center border-2 border-[var(--foreground)] text-[var(--background)] font-medium ${BEAD_COLORS[cell]}`}
              style={{ width: cellSize, height: cellSize }}
            >
              {cell}
            </div>
          ))}
        </div>

        {/* Swap buttons */}
        <div className="flex gap-1 mb-4">
          <button
            onClick={() => handleSwap('left')}
            disabled={gameState.swapsLeft <= 0}
            className="px-3 py-1 text-xs border border-[var(--muted)] text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            L↔M
          </button>
          <button
            onClick={handleDrop}
            className="px-4 py-1 text-xs border border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
          >
            Drop
          </button>
          <button
            onClick={() => handleSwap('right')}
            disabled={gameState.swapsLeft <= 0}
            className="px-3 py-1 text-xs border border-[var(--muted)] text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            M↔R
          </button>
        </div>

        {/* Timer bar */}
        <div className="w-full max-w-[160px] h-1 bg-[var(--border)] mb-4">
          <div
            className="h-full bg-[var(--foreground)] transition-all duration-100"
            style={{ width: `${(gameState.autoDropTimer / AUTO_DROP_TIME) * 100}%` }}
          />
        </div>

        {/* Grid */}
        <div
          className="border border-[var(--border)]"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(3, ${cellSize}px)`,
            gap: `${gap}px`,
            padding: gap,
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                className={`flex items-center justify-center font-medium transition-all duration-150 ${
                  cell === 0
                    ? 'bg-[var(--border)]'
                    : `${BEAD_COLORS[cell]} text-[var(--background)]`
                }`}
                style={{ width: cellSize, height: cellSize }}
              >
                {cell !== 0 && cell}
              </div>
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
              Triplet Weaving
            </p>
            <h1 className="text-3xl font-medium tracking-tight text-[var(--foreground)] mb-8">
              Braidstack
            </h1>

            <div className="mb-8 text-center">
              <p className="text-[var(--muted)] text-sm mb-2">
                Swap incoming beads before they drop
              </p>
              <p className="text-[var(--muted)] text-xs">
                Rows clear when they form runs:
              </p>
              <p className="text-[var(--muted)] text-xs">
                1-2-3, 2-3-4, 3-2-1, or 4-3-2
              </p>
              <p className="text-[var(--muted)] text-xs">
                Don&apos;t let the stack overflow!
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
                <p className="text-sm text-[var(--muted)]">
                  {gameState.swapsLeft} swaps
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-medium text-[var(--foreground)]">
                  {gameState.turn}
                </p>
                <p className="text-xs text-[var(--muted)]">turns</p>
              </div>
            </div>

            {renderGrid()}

            <div className="mt-4 flex items-center gap-4">
              <p className="text-xs text-[var(--muted)]">
                A/D to swap • Space to drop
              </p>
              <button
                onClick={() => setShowHelp(true)}
                className="px-2 py-1 text-xs border border-[var(--muted)] text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                ?
              </button>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState.screen === 'gameover' && (
          <div className="flex flex-col items-center text-center">
            <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-3">
              Stack Overflow
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
                  x{gameState.bestChain}
                </p>
                <p className="text-xs text-[var(--muted)]">Best Chain</p>
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
                <p>Each turn, you get 3 beads (values 1-4).</p>
                <p>You can swap adjacent beads up to 2 times.</p>
                <p>Beads drop into the stack automatically or on command.</p>
                <p>Rows clear if they form consecutive runs:</p>
                <p className="font-mono">1-2-3, 2-3-4, 3-2-1, 4-3-2</p>
                <p>Game ends when the stack overflows.</p>
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
