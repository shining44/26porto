'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

type Symbol = 0 | 1 | 2; // 3 symbols (A, B, C)

interface GameState {
  screen: 'home' | 'playing' | 'gameover';
  line: Symbol[];
  turn: number;
  score: number;
  maxLen: number;
  mode: 'daily' | 'practice';
  seed: string;
  bestClear: number;
  selectedIndex: number | null;
}

interface SavedData {
  bestScore: number;
  lastDaily: string;
  lastDailyScore: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_LENGTH = 24;
const SYMBOL_LABELS = ['A', 'B', 'C'];
const SYMBOL_COLORS = [
  'bg-[var(--foreground)]',
  'bg-[var(--foreground)] opacity-60',
  'bg-[var(--foreground)] opacity-30',
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

/**
 * Reduces the line by removing adjacent equal pairs until stable.
 * Uses stack-based reduction for deterministic O(n) operation.
 */
function reduceLine(line: Symbol[]): Symbol[] {
  const stack: Symbol[] = [];

  for (const symbol of line) {
    if (stack.length > 0 && stack[stack.length - 1] === symbol) {
      stack.pop(); // Remove pair
    } else {
      stack.push(symbol);
    }
  }

  return stack;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function FlipbookGame() {
  const [gameState, setGameState] = useState<GameState>({
    screen: 'home',
    line: [],
    turn: 0,
    score: 0,
    maxLen: MAX_LENGTH,
    mode: 'daily',
    seed: '',
    bestClear: 0,
    selectedIndex: null,
  });

  const [savedData, setSavedData] = useState<SavedData>({
    bestScore: 0,
    lastDaily: '',
    lastDailyScore: 0,
  });

  const [undoStack, setUndoStack] = useState<GameState[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const randRef = useRef<() => number>(() => Math.random());

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('flipbook_data');
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
      localStorage.setItem('flipbook_data', JSON.stringify(newData));
      return newData;
    });
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.screen !== 'playing') return;

      if (e.key === 'Escape') {
        setGameState(prev => ({ ...prev, selectedIndex: null }));
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

    // Start with 3 symbols
    const initialLine: Symbol[] = [
      Math.floor(randRef.current() * 3) as Symbol,
      Math.floor(randRef.current() * 3) as Symbol,
      Math.floor(randRef.current() * 3) as Symbol,
    ];

    setGameState({
      screen: 'playing',
      line: initialLine,
      turn: 0,
      score: 0,
      maxLen: MAX_LENGTH,
      mode,
      seed,
      bestClear: 0,
      selectedIndex: null,
    });
    setUndoStack([]);
  }, []);

  const handleTileClick = useCallback((index: number) => {
    if (gameState.screen !== 'playing') return;

    if (gameState.selectedIndex === null) {
      // Select this as cut point
      setGameState(prev => ({ ...prev, selectedIndex: index }));
    } else {
      // Same index - cancel selection
      if (gameState.selectedIndex === index) {
        setGameState(prev => ({ ...prev, selectedIndex: null }));
        return;
      }

      // Save for undo
      setUndoStack(prev => [...prev, { ...gameState }]);

      // Perform flip: spawn new symbol first, then reverse suffix from selected index
      const newSymbol = Math.floor(randRef.current() * 3) as Symbol;
      const lineWithNew = [...gameState.line, newSymbol];

      // Reverse suffix from selected index to end
      const k = gameState.selectedIndex;
      const newLine = [
        ...lineWithNew.slice(0, k),
        ...lineWithNew.slice(k).reverse(),
      ];

      // Reduce
      const oldLen = newLine.length;
      const reducedLine = reduceLine(newLine);
      const newLen = reducedLine.length;
      const removed = oldLen - newLen;

      // Score
      let addedScore = removed;
      if (removed >= 6) {
        addedScore += (removed - 5) * 2;
      }

      const isGameOver = reducedLine.length >= MAX_LENGTH;

      const newState: GameState = {
        ...gameState,
        line: reducedLine,
        turn: gameState.turn + 1,
        score: gameState.score + addedScore,
        bestClear: Math.max(gameState.bestClear, removed),
        selectedIndex: null,
        screen: isGameOver ? 'gameover' : 'playing',
      };

      setGameState(newState);

      // Save on game over
      if (isGameOver) {
        saveScore(newState.score, gameState.mode, gameState.seed);
      }
    }
  }, [gameState, saveScore]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prevState = undoStack[undoStack.length - 1];
    setGameState(prevState);
    setUndoStack(prev => prev.slice(0, -1));
  }, [undoStack]);

  const copyShare = useCallback(() => {
    const { seed, score, turn, bestClear, line } = gameState;
    const text = `Flipbook ${seed}\nScore: ${score}\nTurns: ${turn}\nBest clear: ${bestClear}\nFinal: ${line.length}`;
    navigator.clipboard.writeText(text);
  }, [gameState]);

  const renderLine = () => {
    const { line, selectedIndex } = gameState;
    const tileSize = Math.min(32, (340 - 20) / Math.max(line.length, 12));

    return (
      <div className="flex flex-wrap gap-1 justify-center max-w-[340px]">
        {line.map((symbol, i) => {
          const isSelected = selectedIndex === i;
          const isSuffix = selectedIndex !== null && i >= selectedIndex;

          return (
            <button
              key={i}
              onClick={() => handleTileClick(i)}
              className={`flex items-center justify-center font-medium border-2 transition-all ${
                isSelected
                  ? 'border-[var(--foreground)] ring-2 ring-[var(--foreground)]'
                  : isSuffix
                  ? 'border-[var(--foreground)] border-dashed'
                  : 'border-[var(--foreground)]'
              } ${SYMBOL_COLORS[symbol]}`}
              style={{
                width: tileSize,
                height: tileSize,
                fontSize: tileSize * 0.45,
                color: symbol === 0 ? 'var(--background)' : 'var(--foreground)',
              }}
            >
              {SYMBOL_LABELS[symbol]}
            </button>
          );
        })}
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
              Suffix Reversal
            </p>
            <h1 className="text-3xl font-medium tracking-tight text-[var(--foreground)] mb-8">
              Flipbook
            </h1>

            <div className="mb-8 text-center">
              <p className="text-[var(--muted)] text-sm mb-2">
                Reverse suffixes to create pairs
              </p>
              <p className="text-[var(--muted)] text-xs">
                Each turn adds a new symbol
              </p>
              <p className="text-[var(--muted)] text-xs">
                Adjacent matching pairs cancel out
              </p>
              <p className="text-[var(--muted)] text-xs">
                Don&apos;t let line reach {MAX_LENGTH}!
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
                  {gameState.line.length}/{MAX_LENGTH}
                </p>
                <p className="text-xs text-[var(--muted)]">length</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-medium text-[var(--foreground)]">
                  {gameState.turn}
                </p>
                <p className="text-xs text-[var(--muted)]">turns</p>
              </div>
            </div>

            {/* Length bar */}
            <div className="w-full h-2 bg-[var(--border)] mb-6">
              <div
                className="h-full bg-[var(--foreground)] transition-all duration-200"
                style={{ width: `${(gameState.line.length / MAX_LENGTH) * 100}%` }}
              />
            </div>

            <div className="mb-6">
              {renderLine()}
            </div>

            {gameState.selectedIndex !== null && (
              <p className="text-xs text-[var(--muted)] mb-4">
                Suffix from position {gameState.selectedIndex} will be reversed
              </p>
            )}

            <div className="flex items-center gap-4">
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

            <p className="mt-4 text-xs text-[var(--muted)]">
              Click a tile to select cut point, then click again to flip
            </p>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState.screen === 'gameover' && (
          <div className="flex flex-col items-center text-center">
            <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-3">
              Line Full
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
                  {gameState.bestClear}
                </p>
                <p className="text-xs text-[var(--muted)]">Best Clear</p>
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
                <p>Each turn, one new symbol is added.</p>
                <p>Click a tile to select it as the cut point.</p>
                <p>Click again anywhere to reverse everything from there to the end.</p>
                <p>Adjacent matching pairs (AA, BB, CC) cancel out.</p>
                <p>Cancellations cascade until no more pairs exist.</p>
                <p>Game ends when line reaches {MAX_LENGTH}.</p>
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
