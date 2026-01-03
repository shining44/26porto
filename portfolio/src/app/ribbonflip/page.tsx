'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

type Color = 0 | 1 | 2 | 3; // 4 colors

interface GameState {
  screen: 'home' | 'playing' | 'gameover';
  ribbon: Color[];
  turn: number;
  score: number;
  maxLen: number;
  mode: 'daily' | 'practice';
  seed: string;
  bestCascade: number;
  selectionStart: number | null;
}

interface SavedData {
  bestScore: number;
  lastDaily: string;
  lastDailyScore: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_LENGTH = 20;
const COLORS = ['bg-[var(--foreground)]', 'bg-[var(--foreground)] opacity-70', 'bg-[var(--foreground)] opacity-45', 'bg-[var(--foreground)] opacity-25'];
const COLOR_LABELS = ['A', 'B', 'C', 'D'];

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

function isSparkTriple(a: Color, b: Color, c: Color): boolean {
  // All three colors must be different
  return a !== b && b !== c && a !== c;
}

function resolveClears(ribbon: Color[]): { newRibbon: Color[]; removed: number; waves: number } {
  let current = [...ribbon];
  let totalRemoved = 0;
  let waves = 0;

  while (true) {
    // Find all indices that are part of at least one spark triple
    const toRemove = new Set<number>();

    for (let i = 0; i <= current.length - 3; i++) {
      if (isSparkTriple(current[i], current[i + 1], current[i + 2])) {
        toRemove.add(i);
        toRemove.add(i + 1);
        toRemove.add(i + 2);
      }
    }

    if (toRemove.size === 0) break;

    waves++;
    totalRemoved += toRemove.size;

    // Remove marked beads
    current = current.filter((_, i) => !toRemove.has(i));
  }

  return { newRibbon: current, removed: totalRemoved, waves };
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function RibbonFlipGame() {
  const [gameState, setGameState] = useState<GameState>({
    screen: 'home',
    ribbon: [],
    turn: 0,
    score: 0,
    maxLen: MAX_LENGTH,
    mode: 'daily',
    seed: '',
    bestCascade: 0,
    selectionStart: null,
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
    const saved = localStorage.getItem('ribbonflip_data');
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
      localStorage.setItem('ribbonflip_data', JSON.stringify(newData));
      return newData;
    });
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.screen !== 'playing') return;

      if (e.key === 'Escape') {
        setGameState(prev => ({ ...prev, selectionStart: null }));
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

    // Start with 3 beads
    const initialRibbon: Color[] = [
      Math.floor(randRef.current() * 4) as Color,
      Math.floor(randRef.current() * 4) as Color,
      Math.floor(randRef.current() * 4) as Color,
    ];

    setGameState({
      screen: 'playing',
      ribbon: initialRibbon,
      turn: 0,
      score: 0,
      maxLen: MAX_LENGTH,
      mode,
      seed,
      bestCascade: 0,
      selectionStart: null,
    });
    setUndoStack([]);
  }, []);

  const handleBeadClick = useCallback((index: number) => {
    if (gameState.screen !== 'playing') return;

    if (gameState.selectionStart === null) {
      // First click - set start
      setGameState(prev => ({ ...prev, selectionStart: index }));
    } else if (gameState.selectionStart === index) {
      // Same bead - cancel selection
      setGameState(prev => ({ ...prev, selectionStart: null }));
    } else {
      // Second click - perform flip
      const start = Math.min(gameState.selectionStart, index);
      const end = Math.max(gameState.selectionStart, index);

      // Save for undo
      setUndoStack(prev => [...prev, { ...gameState }]);

      // Add new bead first
      const newBead = Math.floor(randRef.current() * 4) as Color;
      const ribbonWithNew = [...gameState.ribbon, newBead];

      // Reverse the segment (adjusting for the new bead)
      const newRibbon = [...ribbonWithNew];
      const segment = newRibbon.slice(start, end + 1).reverse();
      for (let i = 0; i < segment.length; i++) {
        newRibbon[start + i] = segment[i];
      }

      // Resolve clears
      const { newRibbon: clearedRibbon, removed, waves } = resolveClears(newRibbon);

      // Calculate score
      let addedScore = removed;
      if (waves > 1) {
        addedScore += (waves - 1) * 5;
      }

      const isGameOver = clearedRibbon.length >= MAX_LENGTH;

      const newState: GameState = {
        ...gameState,
        ribbon: clearedRibbon,
        turn: gameState.turn + 1,
        score: gameState.score + addedScore,
        bestCascade: Math.max(gameState.bestCascade, waves),
        selectionStart: null,
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
    const { seed, score, turn, bestCascade, ribbon } = gameState;
    const text = `RibbonFlip ${seed}\nScore: ${score}\nTurns: ${turn}\nBest cascade: ${bestCascade} waves\nFinal length: ${ribbon.length}`;
    navigator.clipboard.writeText(text);
  }, [gameState]);

  const renderRibbon = () => {
    const { ribbon, selectionStart } = gameState;
    const beadSize = Math.min(36, (340 - 20) / Math.max(ribbon.length, 10));

    return (
      <div className="flex flex-wrap gap-1 justify-center max-w-[340px]">
        {ribbon.map((color, i) => {
          const isSelected = selectionStart === i;

          return (
            <button
              key={i}
              onClick={() => handleBeadClick(i)}
              className={`flex items-center justify-center font-medium border-2 transition-all ${
                i === selectionStart
                  ? 'border-[var(--foreground)] ring-2 ring-[var(--foreground)]'
                  : 'border-[var(--foreground)]'
              } ${COLORS[color]}`}
              style={{
                width: beadSize,
                height: beadSize,
                fontSize: beadSize * 0.4,
                color: color < 2 ? 'var(--background)' : 'var(--foreground)',
              }}
            >
              {COLOR_LABELS[color]}
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
              Segment Reversal
            </p>
            <h1 className="text-3xl font-medium tracking-tight text-[var(--foreground)] mb-8">
              RibbonFlip
            </h1>

            <div className="mb-8 text-center">
              <p className="text-[var(--muted)] text-sm mb-2">
                Reverse segments to create matches
              </p>
              <p className="text-[var(--muted)] text-xs">
                Each turn adds a new bead
              </p>
              <p className="text-[var(--muted)] text-xs">
                Triples of 3 different colors vanish
              </p>
              <p className="text-[var(--muted)] text-xs">
                Don&apos;t let ribbon reach {MAX_LENGTH}!
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
                  {gameState.ribbon.length}/{MAX_LENGTH}
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
                style={{ width: `${(gameState.ribbon.length / MAX_LENGTH) * 100}%` }}
              />
            </div>

            <div className="mb-6">
              {renderRibbon()}
            </div>

            {gameState.selectionStart !== null && (
              <p className="text-xs text-[var(--muted)] mb-4">
                Click another bead to reverse segment
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
              Click two beads to reverse that segment
            </p>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState.screen === 'gameover' && (
          <div className="flex flex-col items-center text-center">
            <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-3">
              Ribbon Full
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
                  {gameState.bestCascade}
                </p>
                <p className="text-xs text-[var(--muted)]">Best Cascade</p>
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
                <p>Each turn, one new bead is added to the ribbon.</p>
                <p>Click two beads to reverse the segment between them.</p>
                <p>Any consecutive triple of 3 DIFFERENT colors vanishes.</p>
                <p>Cascades can trigger: cleared beads may create new triples.</p>
                <p>Game ends when ribbon reaches {MAX_LENGTH} beads.</p>
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
