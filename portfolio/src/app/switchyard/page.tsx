'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

type TrainColor = 'R' | 'G' | 'B';

interface Train {
  id: number;
  color: TrainColor;
  x: number;
  y: number;
  progress: number; // Position along the track path (0-100)
  path: 'upper' | 'lower' | 'merge';
  delivered: boolean;
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

const INITIAL_TICK_MS = 250;
const MIN_TICK_MS = 120;
const INITIAL_LIVES = 3;

// Track layout constants
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
      x: 0,
      y: 150,
      progress: 0,
      path: 'upper',
      delivered: false,
    };
  }, []);

  // Get train position based on progress and switches
  const getTrainPosition = useCallback((train: Train, switches: [boolean, boolean, boolean]): { x: number; y: number } => {
    const progress = train.progress;

    // Track segments:
    // 0-20: Entry (left side)
    // 20-40: First switch zone - split to upper or lower
    // 40-60: Middle section
    // 60-80: Second switch zone - upper goes to Red exit or merge, lower goes to Green exit or merge
    // 80-100: Final approach to exits

    if (progress <= 20) {
      // Entry from left
      return { x: 20 + progress * 4, y: 150 };
    }

    if (progress <= 40) {
      const t = (progress - 20) / 20;
      if (switches[0]) {
        // Going to upper path
        return { x: 100 + t * 80, y: 150 - t * 70 };
      } else {
        // Going to lower path
        return { x: 100 + t * 80, y: 150 + t * 70 };
      }
    }

    // Determine which path train is on based on where it was at switch 0
    const onUpperPath = switches[0];

    if (progress <= 60) {
      const t = (progress - 40) / 20;
      if (onUpperPath) {
        return { x: 180 + t * 60, y: 80 };
      } else {
        return { x: 180 + t * 60, y: 220 };
      }
    }

    if (progress <= 80) {
      const t = (progress - 60) / 20;
      if (onUpperPath) {
        if (switches[1]) {
          // Upper path to Red exit (top-right)
          return { x: 240 + t * 80, y: 80 - t * 30 };
        } else {
          // Upper path to merge
          return { x: 240 + t * 60, y: 80 + t * 70 };
        }
      } else {
        if (switches[2]) {
          // Lower path to Green exit (bottom-right)
          return { x: 240 + t * 80, y: 220 + t * 30 };
        } else {
          // Lower path to merge
          return { x: 240 + t * 60, y: 220 - t * 70 };
        }
      }
    }

    // Final approach
    const t = (progress - 80) / 20;
    if (onUpperPath && switches[1]) {
      // To Red exit
      return { x: 320 + t * 60, y: 50 };
    } else if (!onUpperPath && switches[2]) {
      // To Green exit
      return { x: 320 + t * 60, y: 250 };
    } else {
      // To Blue exit (merge)
      return { x: 300 + t * 80, y: 150 };
    }
  }, []);

  // Determine which exit a train will reach
  const getTrainExit = useCallback((switches: [boolean, boolean, boolean]): TrainColor => {
    if (switches[0] && switches[1]) return 'R'; // Upper path to Red
    if (!switches[0] && switches[2]) return 'G'; // Lower path to Green
    return 'B'; // Merge to Blue
  }, []);

  const gameLoop = useCallback(() => {
    setGameState(prev => {
      if (prev.screen !== 'playing') return prev;

      let newTrains = [...prev.trains];
      let newScore = prev.score;
      let newDelivered = prev.delivered;
      let newStreak = prev.streak;
      let newBestStreak = prev.bestStreak;
      let newLives = prev.lives;
      let newTickMs = prev.tickMs;
      let collision = false;

      // Move trains
      newTrains = newTrains.map(train => ({
        ...train,
        progress: train.progress + 3,
      }));

      // Check for deliveries
      newTrains = newTrains.filter(train => {
        if (train.progress >= 100) {
          const exit = getTrainExit(prev.switches);
          if (exit === train.color) {
            // Correct delivery
            newScore += 10 + newStreak * 2;
            newDelivered++;
            newStreak++;
            if (newStreak > newBestStreak) newBestStreak = newStreak;

            // Speed up every 5 deliveries
            if (newDelivered % 5 === 0) {
              newTickMs = Math.max(MIN_TICK_MS, newTickMs - 10);
            }
          } else {
            // Wrong exit
            newLives--;
            newStreak = 0;
          }
          return false;
        }
        return true;
      });

      // Check for collisions (trains at similar positions)
      for (let i = 0; i < newTrains.length; i++) {
        for (let j = i + 1; j < newTrains.length; j++) {
          const pos1 = getTrainPosition(newTrains[i], prev.switches);
          const pos2 = getTrainPosition(newTrains[j], prev.switches);
          const dist = Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2);
          if (dist < 15) {
            collision = true;
          }
        }
      }

      if (collision || newLives <= 0) {
        // Game over
        const newSavedData = { ...savedData };
        if (newScore > savedData.bestScore) {
          newSavedData.bestScore = newScore;
        }
        if (prev.mode === 'daily') {
          newSavedData.lastDaily = prev.seed;
          newSavedData.lastDailyScore = newScore;
        }
        setSavedData(newSavedData);
        localStorage.setItem('switchyard_data', JSON.stringify(newSavedData));

        return { ...prev, screen: 'gameover', score: newScore, bestStreak: newBestStreak };
      }

      // Spawn new trains
      let newSpawnCounter = prev.spawnCounter + 1;
      if (newSpawnCounter >= 15 && newTrains.length < 4) {
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
  }, [getTrainPosition, getTrainExit, spawnTrain, savedData]);

  // Game tick
  useEffect(() => {
    if (gameState.screen !== 'playing') return;

    tickRef.current = setInterval(gameLoop, gameState.tickMs);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [gameState.screen, gameState.tickMs, gameLoop]);

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
    if (now - lastSwitchTime < 150) return; // Cooldown
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
          <line x1="20" y1="150" x2="100" y2="150" stroke="var(--muted)" strokeWidth="2" />

          {/* First split */}
          <line x1="100" y1="150" x2="180" y2="80" stroke="var(--muted)" strokeWidth="2" strokeDasharray={switches[0] ? "0" : "4"} />
          <line x1="100" y1="150" x2="180" y2="220" stroke="var(--muted)" strokeWidth="2" strokeDasharray={switches[0] ? "4" : "0"} />

          {/* Upper horizontal */}
          <line x1="180" y1="80" x2="240" y2="80" stroke="var(--muted)" strokeWidth="2" />
          {/* Lower horizontal */}
          <line x1="180" y1="220" x2="240" y2="220" stroke="var(--muted)" strokeWidth="2" />

          {/* Upper split - to Red or merge */}
          <line x1="240" y1="80" x2="320" y2="50" stroke="var(--muted)" strokeWidth="2" strokeDasharray={switches[1] ? "0" : "4"} />
          <line x1="240" y1="80" x2="300" y2="150" stroke="var(--muted)" strokeWidth="2" strokeDasharray={switches[1] ? "4" : "0"} />

          {/* Lower split - to Green or merge */}
          <line x1="240" y1="220" x2="320" y2="250" stroke="var(--muted)" strokeWidth="2" strokeDasharray={switches[2] ? "0" : "4"} />
          <line x1="240" y1="220" x2="300" y2="150" stroke="var(--muted)" strokeWidth="2" strokeDasharray={switches[2] ? "4" : "0"} />

          {/* Final to exits */}
          <line x1="320" y1="50" x2="380" y2="50" stroke="var(--muted)" strokeWidth="2" />
          <line x1="320" y1="250" x2="380" y2="250" stroke="var(--muted)" strokeWidth="2" />
          <line x1="300" y1="150" x2="380" y2="150" stroke="var(--muted)" strokeWidth="2" />
        </svg>

        {/* Exits */}
        <div className="absolute right-2 top-[35px] text-xs font-medium border border-[var(--foreground)] px-2 py-1">R</div>
        <div className="absolute right-2 top-[135px] text-xs font-medium border border-[var(--foreground)] px-2 py-1">B</div>
        <div className="absolute right-2 top-[235px] text-xs font-medium border border-[var(--foreground)] px-2 py-1">G</div>

        {/* Entry */}
        <div className="absolute left-0 top-[140px] text-xs text-[var(--muted)] px-1">IN</div>

        {/* Switches */}
        <button
          onClick={() => toggleSwitch(0)}
          className={`absolute w-6 h-6 flex items-center justify-center text-xs font-bold border transition-colors ${
            switches[0]
              ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]'
              : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--foreground)]'
          }`}
          style={{ left: 87, top: 137 }}
        >
          1
        </button>
        <button
          onClick={() => toggleSwitch(1)}
          className={`absolute w-6 h-6 flex items-center justify-center text-xs font-bold border transition-colors ${
            switches[1]
              ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]'
              : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--foreground)]'
          }`}
          style={{ left: 227, top: 67 }}
        >
          2
        </button>
        <button
          onClick={() => toggleSwitch(2)}
          className={`absolute w-6 h-6 flex items-center justify-center text-xs font-bold border transition-colors ${
            switches[2]
              ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]'
              : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--foreground)]'
          }`}
          style={{ left: 227, top: 207 }}
        >
          3
        </button>

        {/* Trains */}
        {trains.map(train => {
          const pos = getTrainPosition(train, switches);
          return (
            <div
              key={train.id}
              className="absolute w-5 h-5 flex items-center justify-center text-xs font-bold border-2 border-[var(--foreground)] bg-[var(--background)] transition-all duration-75"
              style={{
                left: pos.x - 10,
                top: pos.y - 10,
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
                Toggle switches to change paths
              </p>
              <p className="text-[var(--muted)] text-xs">
                R train → Red, G train → Green, B train → Blue
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
                Click switches (1/2/3) to toggle
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
                <p>Toggle switches (numbered 1-3) to route trains.</p>
                <p>Match train colors to exits: R→Red, G→Green, B→Blue</p>
                <p>Wrong exits cost 1 life. Collisions end the game.</p>
                <p>Speed increases every 5 correct deliveries.</p>
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
