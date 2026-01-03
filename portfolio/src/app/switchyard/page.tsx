'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

type TrainColor = 'R' | 'G' | 'B';

interface Train {
  id: number;
  color: TrainColor;
  progress: number; // Position along the track path (0-100)
  // Track which path the train locked into at each switch
  pathAtSwitch0: boolean | null; // true = upper, false = lower, null = not yet decided
  pathAtSwitch1: boolean | null; // true = to exit, false = to merge
  pathAtSwitch2: boolean | null; // true = to exit, false = to merge
}

interface GameState {
  screen: 'home' | 'playing' | 'gameover';
  switches: [boolean, boolean, boolean]; // 3 switches
  trains: Train[];
  score: number;
  delivered: number;
  streak: number;
  bestStreak: number;
  lives: number;
  tickMs: number;
  mode: 'daily' | 'practice';
  seed: string;
  spawnCounter: number;
}

interface SavedData {
  bestScore: number;
  lastDaily: string;
  lastDailyScore: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const INITIAL_TICK_MS = 300;
const MIN_TICK_MS = 100;
const INITIAL_LIVES = 3;
const GRID_WIDTH = 400;
const GRID_HEIGHT = 300;

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
// COMPONENT
// ============================================================================

export default function SwitchyardGame() {
  const [gameState, setGameState] = useState<GameState>({
    screen: 'home',
    switches: [false, false, false],
    trains: [],
    score: 0,
    delivered: 0,
    streak: 0,
    bestStreak: 0,
    lives: INITIAL_LIVES,
    tickMs: INITIAL_TICK_MS,
    mode: 'daily',
    seed: '',
    spawnCounter: 0,
  });

  const [savedData, setSavedData] = useState<SavedData>({
    bestScore: 0,
    lastDaily: '',
    lastDailyScore: 0,
  });

  const [showHelp, setShowHelp] = useState(false);
  const [lastSwitchTime, setLastSwitchTime] = useState(0);
  const randRef = useRef<() => number>(() => Math.random());
  const tickRef = useRef<NodeJS.Timeout | null>(null);
  const trainIdRef = useRef(0);

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('switchyard_data');
    if (saved) {
      setSavedData(JSON.parse(saved));
    }
  }, []);

  const spawnTrain = useCallback((rand: () => number): Train => {
    const colors: TrainColor[] = ['R', 'G', 'B'];
    const color = colors[Math.floor(rand() * 3)];
    trainIdRef.current++;

    return {
      id: trainIdRef.current,
      color,
      progress: 0,
      pathAtSwitch0: null,
      pathAtSwitch1: null,
      pathAtSwitch2: null,
    };
  }, []);

  // Get train position based on progress and its locked-in path choices
  const getTrainPosition = useCallback((train: Train): { x: number; y: number } => {
    const progress = train.progress;

    // Track segments:
    // 0-25: Entry (left side) - before switch 0
    // 25-50: After switch 0 - upper or lower track
    // 50-75: After switch 1/2 - to exit or to merge
    // 75-100: Final approach to exits

    if (progress <= 25) {
      // Entry from left (before first switch)
      const t = progress / 25;
      return { x: 20 + t * 80, y: 150 };
    }

    // After switch 0
    const onUpper = train.pathAtSwitch0 === true;

    if (progress <= 50) {
      const t = (progress - 25) / 25;
      if (onUpper) {
        return { x: 100 + t * 80, y: 150 - t * 70 };
      } else {
        return { x: 100 + t * 80, y: 150 + t * 70 };
      }
    }

    if (progress <= 75) {
      const t = (progress - 50) / 25;
      if (onUpper) {
        const toExit = train.pathAtSwitch1 === true;
        if (toExit) {
          return { x: 180 + t * 100, y: 80 - t * 30 };
        } else {
          return { x: 180 + t * 80, y: 80 + t * 70 };
        }
      } else {
        const toExit = train.pathAtSwitch2 === true;
        if (toExit) {
          return { x: 180 + t * 100, y: 220 + t * 30 };
        } else {
          return { x: 180 + t * 80, y: 220 - t * 70 };
        }
      }
    }

    // Final approach
    const t = (progress - 75) / 25;
    if (onUpper && train.pathAtSwitch1 === true) {
      return { x: 280 + t * 100, y: 50 };
    } else if (!onUpper && train.pathAtSwitch2 === true) {
      return { x: 280 + t * 100, y: 250 };
    } else {
      return { x: 260 + t * 120, y: 150 };
    }
  }, []);

  // Determine which exit a train will reach based on its locked paths
  const getTrainDestination = useCallback((train: Train): TrainColor => {
    if (train.pathAtSwitch0 === true && train.pathAtSwitch1 === true) return 'R';
    if (train.pathAtSwitch0 === false && train.pathAtSwitch2 === true) return 'G';
    return 'B';
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
      localStorage.setItem('switchyard_data', JSON.stringify(newData));
      return newData;
    });
  }, []);

  const gameLoop = useCallback(() => {
    setGameState(prev => {
      if (prev.screen !== 'playing') return prev;

      let newTrains = prev.trains.map(train => {
        const newTrain = { ...train, progress: train.progress + 4 };

        // Lock in path choices at switch points
        if (newTrain.progress >= 25 && newTrain.pathAtSwitch0 === null) {
          newTrain.pathAtSwitch0 = prev.switches[0];
        }
        if (newTrain.progress >= 50) {
          if (newTrain.pathAtSwitch0 === true && newTrain.pathAtSwitch1 === null) {
            newTrain.pathAtSwitch1 = prev.switches[1];
          }
          if (newTrain.pathAtSwitch0 === false && newTrain.pathAtSwitch2 === null) {
            newTrain.pathAtSwitch2 = prev.switches[2];
          }
        }

        return newTrain;
      });

      let newScore = prev.score;
      let newDelivered = prev.delivered;
      let newStreak = prev.streak;
      let newBestStreak = prev.bestStreak;
      let newLives = prev.lives;
      let newTickMs = prev.tickMs;

      // Check for deliveries
      const deliveredTrains: number[] = [];
      newTrains.forEach((train, idx) => {
        if (train.progress >= 100) {
          deliveredTrains.push(idx);
          const destination = getTrainDestination(train);
          if (destination === train.color) {
            // Correct delivery
            newScore += 10 + newStreak * 2;
            newDelivered++;
            newStreak++;
            if (newStreak > newBestStreak) newBestStreak = newStreak;

            // Speed up every 5 deliveries
            if (newDelivered % 5 === 0) {
              newTickMs = Math.max(MIN_TICK_MS, newTickMs - 15);
            }
          } else {
            // Wrong exit
            newLives--;
            newStreak = 0;
          }
        }
      });

      newTrains = newTrains.filter((_, idx) => !deliveredTrains.includes(idx));

      // Check for collisions (trains at similar positions)
      let collision = false;
      for (let i = 0; i < newTrains.length && !collision; i++) {
        for (let j = i + 1; j < newTrains.length && !collision; j++) {
          const pos1 = getTrainPosition(newTrains[i]);
          const pos2 = getTrainPosition(newTrains[j]);
          const dist = Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2);
          if (dist < 20) {
            collision = true;
          }
        }
      }

      if (collision || newLives <= 0) {
        saveScore(newScore, prev.mode, prev.seed);
        return { ...prev, screen: 'gameover', score: newScore, bestStreak: newBestStreak, trains: newTrains };
      }

      // Spawn new trains
      let newSpawnCounter = prev.spawnCounter + 1;
      const maxTrains = Math.min(4, 2 + Math.floor(newDelivered / 10));
      if (newSpawnCounter >= 12 && newTrains.length < maxTrains) {
        newTrains.push(spawnTrain(randRef.current));
        newSpawnCounter = 0;
      }

      return {
        ...prev,
        trains: newTrains,
        score: newScore,
        delivered: newDelivered,
        streak: newStreak,
        bestStreak: newBestStreak,
        lives: newLives,
        tickMs: newTickMs,
        spawnCounter: newSpawnCounter,
      };
    });
  }, [getTrainPosition, getTrainDestination, spawnTrain, saveScore]);

  // Game tick
  useEffect(() => {
    if (gameState.screen !== 'playing') return;

    tickRef.current = setInterval(gameLoop, gameState.tickMs);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [gameState.screen, gameState.tickMs, gameLoop]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.screen !== 'playing') return;
      if (e.key === '1') toggleSwitch(0);
      else if (e.key === '2') toggleSwitch(1);
      else if (e.key === '3') toggleSwitch(2);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.screen]);

  const startGame = useCallback((mode: 'daily' | 'practice') => {
    const seed = mode === 'daily' ? getDateSeed() : `practice-${Date.now()}`;
    randRef.current = seededRandom(seed);
    trainIdRef.current = 0;

    setGameState({
      screen: 'playing',
      switches: [false, false, false],
      trains: [spawnTrain(randRef.current)],
      score: 0,
      delivered: 0,
      streak: 0,
      bestStreak: 0,
      lives: INITIAL_LIVES,
      tickMs: INITIAL_TICK_MS,
      mode,
      seed,
      spawnCounter: 0,
    });
  }, [spawnTrain]);

  const toggleSwitch = useCallback((index: number) => {
    const now = Date.now();
    if (now - lastSwitchTime < 100) return;
    setLastSwitchTime(now);

    setGameState(prev => {
      if (prev.screen !== 'playing') return prev;
      const newSwitches = [...prev.switches] as [boolean, boolean, boolean];
      newSwitches[index] = !newSwitches[index];
      return { ...prev, switches: newSwitches };
    });
  }, [lastSwitchTime]);

  const copyShare = useCallback(() => {
    const { seed, score, delivered, bestStreak, tickMs } = gameState;
    const text = `Switchyard ${seed}\nScore: ${score}\nDelivered: ${delivered} (Streak ${bestStreak})\nSpeed: ${tickMs}ms`;
    navigator.clipboard.writeText(text);
  }, [gameState]);

  const renderTrack = () => {
    const { switches, trains } = gameState;

    return (
      <div className="relative border border-[var(--border)]" style={{ width: GRID_WIDTH, height: GRID_HEIGHT }}>
        {/* Track lines */}
        <svg className="absolute inset-0" width={GRID_WIDTH} height={GRID_HEIGHT}>
          {/* Entry */}
          <line x1="20" y1="150" x2="100" y2="150" stroke="var(--muted)" strokeWidth="3" />

          {/* First split */}
          <line x1="100" y1="150" x2="180" y2="80" stroke="var(--muted)" strokeWidth="3" strokeOpacity={switches[0] ? 1 : 0.3} />
          <line x1="100" y1="150" x2="180" y2="220" stroke="var(--muted)" strokeWidth="3" strokeOpacity={switches[0] ? 0.3 : 1} />

          {/* Upper horizontal */}
          <line x1="180" y1="80" x2="180" y2="80" stroke="var(--muted)" strokeWidth="3" />

          {/* Upper split - to Red or merge */}
          <line x1="180" y1="80" x2="280" y2="50" stroke="var(--muted)" strokeWidth="3" strokeOpacity={switches[1] ? 1 : 0.3} />
          <line x1="180" y1="80" x2="260" y2="150" stroke="var(--muted)" strokeWidth="3" strokeOpacity={switches[1] ? 0.3 : 1} />

          {/* Lower split - to Green or merge */}
          <line x1="180" y1="220" x2="280" y2="250" stroke="var(--muted)" strokeWidth="3" strokeOpacity={switches[2] ? 1 : 0.3} />
          <line x1="180" y1="220" x2="260" y2="150" stroke="var(--muted)" strokeWidth="3" strokeOpacity={switches[2] ? 0.3 : 1} />

          {/* Final to exits */}
          <line x1="280" y1="50" x2="380" y2="50" stroke="var(--muted)" strokeWidth="3" />
          <line x1="280" y1="250" x2="380" y2="250" stroke="var(--muted)" strokeWidth="3" />
          <line x1="260" y1="150" x2="380" y2="150" stroke="var(--muted)" strokeWidth="3" />
        </svg>

        {/* Exits */}
        <div className="absolute right-2 top-[35px] text-sm font-bold border-2 border-[var(--foreground)] px-3 py-1 bg-[var(--background)]">R</div>
        <div className="absolute right-2 top-[135px] text-sm font-bold border-2 border-[var(--foreground)] px-3 py-1 bg-[var(--background)]">B</div>
        <div className="absolute right-2 top-[235px] text-sm font-bold border-2 border-[var(--foreground)] px-3 py-1 bg-[var(--background)]">G</div>

        {/* Entry */}
        <div className="absolute left-1 top-[138px] text-xs text-[var(--muted)]">IN</div>

        {/* Switches */}
        <button
          onClick={() => toggleSwitch(0)}
          className={`absolute w-8 h-8 flex items-center justify-center text-sm font-bold border-2 transition-all ${
            switches[0]
              ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]'
              : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--foreground)]'
          }`}
          style={{ left: 84, top: 134 }}
        >
          1
        </button>
        <button
          onClick={() => toggleSwitch(1)}
          className={`absolute w-8 h-8 flex items-center justify-center text-sm font-bold border-2 transition-all ${
            switches[1]
              ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]'
              : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--foreground)]'
          }`}
          style={{ left: 164, top: 64 }}
        >
          2
        </button>
        <button
          onClick={() => toggleSwitch(2)}
          className={`absolute w-8 h-8 flex items-center justify-center text-sm font-bold border-2 transition-all ${
            switches[2]
              ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]'
              : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--foreground)]'
          }`}
          style={{ left: 164, top: 204 }}
        >
          3
        </button>

        {/* Trains */}
        {trains.map(train => {
          const pos = getTrainPosition(train);
          return (
            <div
              key={train.id}
              className="absolute w-6 h-6 flex items-center justify-center text-xs font-bold border-2 border-[var(--foreground)] bg-[var(--background)] transition-all duration-75 rounded-full"
              style={{
                left: pos.x - 12,
                top: pos.y - 12,
              }}
            >
              {train.color}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-[var(--background)]">
      <div className="w-full max-w-md">
        {/* Home Screen */}
        {gameState.screen === 'home' && (
          <div className="flex flex-col items-center text-center">
            <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-3">
              One-Click Routing
            </p>
            <h1 className="text-3xl font-medium tracking-tight text-[var(--foreground)] mb-8">
              Switchyard
            </h1>

            <div className="mb-8 text-center">
              <p className="text-[var(--muted)] text-sm mb-2">
                Route trains to matching exits
              </p>
              <p className="text-[var(--muted)] text-xs">
                Toggle switches before trains pass them
              </p>
              <p className="text-[var(--muted)] text-xs">
                R→Red (top), G→Green (bottom), B→Blue (middle)
              </p>
              <p className="text-[var(--muted)] text-xs">
                Collisions or wrong exits cost lives
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
                  {'♥'.repeat(gameState.lives)}{'♡'.repeat(INITIAL_LIVES - gameState.lives)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-medium text-[var(--foreground)]">
                  {gameState.streak}
                </p>
                <p className="text-xs text-[var(--muted)]">streak</p>
              </div>
            </div>

            {renderTrack()}

            <div className="mt-4 flex items-center gap-4">
              <p className="text-xs text-[var(--muted)]">
                Press 1/2/3 or click switches
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
              Derailed
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
                  {gameState.delivered}
                </p>
                <p className="text-xs text-[var(--muted)]">Delivered</p>
              </div>
              <div>
                <p className="text-lg font-medium text-[var(--foreground)]">
                  {gameState.bestStreak}
                </p>
                <p className="text-xs text-[var(--muted)]">Best Streak</p>
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
                <p>Trains spawn at the left and travel right.</p>
                <p>Toggle switches BEFORE trains reach them.</p>
                <p>Once a train passes a switch, its path is locked.</p>
                <p>Route to matching exits: R→Red, G→Green, B→Blue</p>
                <p>Wrong exits cost 1 life. Collisions end the game.</p>
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
