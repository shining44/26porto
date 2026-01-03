'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

type TokenType = 0 | 1 | 2; // 3 token types (A, B, C)

interface Token {
  id: number;
  type: TokenType;
  r: number;
  c: number;
}

interface GameState {
  screen: 'home' | 'playing' | 'gameover';
  tokens: Token[];
  junkBlocks: Set<string>; // "r-c" format
  turn: number;
  score: number;
  mode: 'daily' | 'practice';
  seed: string;
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
const MAX_JUNK = 15;
const TOKEN_LABELS = ['A', 'B', 'C'];
const TOKEN_COLORS = [
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

function getPerimeterCells(): [number, number][] {
  const cells: [number, number][] = [];
  for (let c = 0; c < GRID_SIZE; c++) {
    cells.push([0, c]); // top
    cells.push([GRID_SIZE - 1, c]); // bottom
  }
  for (let r = 1; r < GRID_SIZE - 1; r++) {
    cells.push([r, 0]); // left
    cells.push([r, GRID_SIZE - 1]); // right
  }
  return cells;
}

function findEmptyPerimeterCell(
  tokens: Token[],
  junkBlocks: Set<string>,
  rand: () => number
): [number, number] | null {
  const perimeterCells = getPerimeterCells();
  const occupiedCells = new Set<string>();

  for (const token of tokens) {
    occupiedCells.add(`${token.r}-${token.c}`);
  }

  const emptyCells = perimeterCells.filter(([r, c]) => {
    const key = `${r}-${c}`;
    return !occupiedCells.has(key) && !junkBlocks.has(key);
  });

  if (emptyCells.length === 0) return null;

  const idx = Math.floor(rand() * emptyCells.length);
  return emptyCells[idx];
}

function computeMove(
  tokenR: number,
  tokenC: number,
  anchorR: number,
  anchorC: number
): [number, number] {
  const dr = anchorR - tokenR;
  const dc = anchorC - tokenC;

  if (dr === 0 && dc === 0) {
    return [tokenR, tokenC]; // Stay
  }

  // Deterministic tie-break: prefer axis with larger distance; ties go horizontal
  if (Math.abs(dr) > Math.abs(dc)) {
    // Move vertically
    return [tokenR + Math.sign(dr), tokenC];
  } else {
    // Move horizontally (also handles tie)
    return [tokenR, tokenC + Math.sign(dc)];
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function AnchorDriftGame() {
  const [gameState, setGameState] = useState<GameState>({
    screen: 'home',
    tokens: [],
    junkBlocks: new Set(),
    turn: 0,
    score: 0,
    mode: 'daily',
    seed: '',
  });

  const [savedData, setSavedData] = useState<SavedData>({
    bestScore: 0,
    lastDaily: '',
    lastDailyScore: 0,
  });

  const [undoStack, setUndoStack] = useState<GameState[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const randRef = useRef<() => number>(() => Math.random());
  const tokenIdRef = useRef(0);

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('anchordrift_data');
    if (saved) {
      setSavedData(JSON.parse(saved));
    }
  }, []);

  const startGame = useCallback((mode: 'daily' | 'practice') => {
    const seed = mode === 'daily' ? getDateSeed() : `practice-${Date.now()}`;
    randRef.current = seededRandom(seed);
    tokenIdRef.current = 0;

    // Spawn initial token
    const initialPos = findEmptyPerimeterCell([], new Set(), randRef.current);
    const initialToken: Token = {
      id: tokenIdRef.current++,
      type: Math.floor(randRef.current() * 3) as TokenType,
      r: initialPos![0],
      c: initialPos![1],
    };

    setGameState({
      screen: 'playing',
      tokens: [initialToken],
      junkBlocks: new Set(),
      turn: 0,
      score: 0,
      mode,
      seed,
    });
    setUndoStack([]);
  }, []);

  const handleCellClick = useCallback((anchorR: number, anchorC: number) => {
    if (gameState.screen !== 'playing') return;

    // Save state for undo
    setUndoStack(prev => [...prev, {
      ...gameState,
      junkBlocks: new Set(gameState.junkBlocks),
    }]);

    const { tokens, junkBlocks } = gameState;
    const newJunkBlocks = new Set(junkBlocks);
    let newScore = gameState.score;

    // Compute proposed moves for all tokens
    const proposals: Map<string, Token[]> = new Map();

    for (const token of tokens) {
      const [newR, newC] = computeMove(token.r, token.c, anchorR, anchorC);
      const targetKey = `${newR}-${newC}`;

      // If target is junk, token stays
      if (newJunkBlocks.has(targetKey)) {
        const stayKey = `${token.r}-${token.c}`;
        if (!proposals.has(stayKey)) proposals.set(stayKey, []);
        proposals.get(stayKey)!.push({ ...token });
      } else {
        if (!proposals.has(targetKey)) proposals.set(targetKey, []);
        proposals.get(targetKey)!.push({ ...token, r: newR, c: newC });
      }
    }

    // Resolve collisions
    const newTokens: Token[] = [];

    for (const [key, tokensAtCell] of proposals) {
      if (tokensAtCell.length === 1) {
        newTokens.push(tokensAtCell[0]);
      } else {
        // Multiple tokens at same cell
        const allSameType = tokensAtCell.every(t => t.type === tokensAtCell[0].type);

        if (allSameType) {
          // Annihilate - all disappear, score increases
          newScore += 5 * tokensAtCell.length;
        } else {
          // Mixed types - create junk block
          newJunkBlocks.add(key);
          newScore += 1;
        }
      }
    }

    // Check lose condition: too many junk blocks
    let isGameOver = newJunkBlocks.size >= MAX_JUNK;

    // Spawn new token
    if (!isGameOver) {
      const spawnPos = findEmptyPerimeterCell(newTokens, newJunkBlocks, randRef.current);
      if (spawnPos === null) {
        isGameOver = true;
      } else {
        const newToken: Token = {
          id: tokenIdRef.current++,
          type: Math.floor(randRef.current() * 3) as TokenType,
          r: spawnPos[0],
          c: spawnPos[1],
        };
        newTokens.push(newToken);
      }
    }

    const newState: GameState = {
      ...gameState,
      tokens: newTokens,
      junkBlocks: newJunkBlocks,
      turn: gameState.turn + 1,
      score: newScore,
      screen: isGameOver ? 'gameover' : 'playing',
    };

    setGameState(newState);

    // Save on game over
    if (isGameOver) {
      const newSavedData = { ...savedData };
      if (newScore > savedData.bestScore) {
        newSavedData.bestScore = newScore;
      }
      if (gameState.mode === 'daily') {
        newSavedData.lastDaily = gameState.seed;
        newSavedData.lastDailyScore = newScore;
      }
      setSavedData(newSavedData);
      localStorage.setItem('anchordrift_data', JSON.stringify(newSavedData));
    }
  }, [gameState, savedData]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prevState = undoStack[undoStack.length - 1];
    setGameState(prevState);
    setUndoStack(prev => prev.slice(0, -1));
  }, [undoStack]);

  const copyShare = useCallback(() => {
    const { seed, score, turn, junkBlocks } = gameState;
    const text = `AnchorDrift ${seed}\nScore: ${score}\nTurns: ${turn}\nJunk: ${junkBlocks.size}`;
    navigator.clipboard.writeText(text);
  }, [gameState]);

  const renderGrid = () => {
    const { tokens, junkBlocks } = gameState;
    const cellSize = 40;
    const gap = 2;

    // Create token map for quick lookup
    const tokenMap = new Map<string, Token>();
    for (const token of tokens) {
      tokenMap.set(`${token.r}-${token.c}`, token);
    }

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
        {Array.from({ length: GRID_SIZE }, (_, r) =>
          Array.from({ length: GRID_SIZE }, (_, c) => {
            const key = `${r}-${c}`;
            const token = tokenMap.get(key);
            const isJunk = junkBlocks.has(key);
            const isPerimeter = r === 0 || r === GRID_SIZE - 1 || c === 0 || c === GRID_SIZE - 1;

            return (
              <button
                key={key}
                onClick={() => handleCellClick(r, c)}
                className={`flex items-center justify-center font-medium transition-all cursor-pointer ${
                  isJunk
                    ? 'bg-[var(--muted)]'
                    : token
                    ? `${TOKEN_COLORS[token.type]} border-2 border-[var(--foreground)]`
                    : isPerimeter
                    ? 'bg-[var(--border)] hover:bg-[var(--muted)]'
                    : 'bg-[var(--background)] border border-[var(--border)] hover:bg-[var(--border)]'
                }`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  fontSize: 14,
                  color: token && token.type === 0 ? 'var(--background)' : 'var(--foreground)',
                }}
              >
                {token && TOKEN_LABELS[token.type]}
                {isJunk && '×'}
              </button>
            );
          })
        )}
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
              Gravity Point
            </p>
            <h1 className="text-3xl font-medium tracking-tight text-[var(--foreground)] mb-8">
              Anchor Drift
            </h1>

            <div className="mb-8 text-center">
              <p className="text-[var(--muted)] text-sm mb-2">
                Click to set gravity anchor
              </p>
              <p className="text-[var(--muted)] text-xs">
                All tokens drift one step toward it
              </p>
              <p className="text-[var(--muted)] text-xs">
                Same types colliding = annihilate (score!)
              </p>
              <p className="text-[var(--muted)] text-xs">
                Different types = junk block
              </p>
              <p className="text-[var(--muted)] text-xs">
                Too much junk ends the game
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
                  {gameState.tokens.length} tokens
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[var(--muted)]">
                  junk {gameState.junkBlocks.size}/{MAX_JUNK}
                </p>
              </div>
            </div>

            {/* Junk meter */}
            <div className="w-full h-2 bg-[var(--border)] mb-4">
              <div
                className="h-full bg-[var(--muted)] transition-all duration-200"
                style={{ width: `${(gameState.junkBlocks.size / MAX_JUNK) * 100}%` }}
              />
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

            <p className="mt-4 text-xs text-[var(--muted)]">
              Click any cell to set anchor point
            </p>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState.screen === 'gameover' && (
          <div className="flex flex-col items-center text-center">
            <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-3">
              Too Much Junk
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
                  {gameState.junkBlocks.size}
                </p>
                <p className="text-xs text-[var(--muted)]">Junk</p>
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
                <p>Each turn, a new token spawns on the edge.</p>
                <p>Click any cell to set the anchor point.</p>
                <p>All tokens move one step toward the anchor.</p>
                <p>Same type collision = annihilate (+5 each)</p>
                <p>Mixed type collision = junk block (+1)</p>
                <p>Game ends at {MAX_JUNK} junk blocks or no spawn room.</p>
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
