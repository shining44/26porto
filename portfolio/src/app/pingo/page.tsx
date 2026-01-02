'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface Car {
  lane: number;
  targetLane: number;
  x: number;
  y: number;
  rotation: number;
  switchProgress: number;
}

interface Obstacle {
  lane: number;
  y: number;
  width: number;
  height: number;
  passed: boolean;
}

interface Coin {
  lane: number;
  y: number;
  collected: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

interface GameState {
  screen: 'home' | 'playing' | 'gameover';
  score: number;
  coins: number;
  combo: number;
  maxCombo: number;
  distance: number;
  speed: number;
  nearMisses: number;
  boostCharge: number;
  boostActive: boolean;
  boostTime: number;
  boostsTriggered: number;
}

interface HighScore {
  score: number;
  coins: number;
  maxCombo: number;
  date: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LANE_COUNT = 3;
const LANE_WIDTH = 70;
const CAR_WIDTH = 32;
const CAR_HEIGHT = 56;
const SWITCH_DURATION = 140;
const BASE_SPEED = 4.5;
const MAX_SPEED = 11;
const SPEED_INCREMENT = 0.0008;
const MIN_OBSTACLE_GAP = 220;
const COIN_SPAWN_DISTANCE = 160;
const BOOST_CHARGE_MAX = 100;
const BOOST_COIN_GAIN = 22;
const BOOST_NEAR_MISS_GAIN = 14;
const BOOST_DURATION = 4.5;
const BOOST_SCORE_MULTIPLIER = 2;
const BOOST_SPEED_BONUS = 2.2;

// ============================================================================
// GAME COMPONENT
// ============================================================================

export default function PingoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Theme colors (will be read from CSS variables)
  const colorsRef = useRef({
    background: '#fafafa',
    foreground: '#171717',
    muted: '#737373',
    border: '#e5e5e5',
  });

  const gameStateRef = useRef<GameState>({
    screen: 'home',
    score: 0,
    coins: 0,
    combo: 0,
    maxCombo: 0,
    distance: 0,
    speed: BASE_SPEED,
    nearMisses: 0,
    boostCharge: 0,
    boostActive: false,
    boostTime: 0,
    boostsTriggered: 0,
  });

  const carRef = useRef<Car>({
    lane: 1,
    targetLane: 1,
    x: 0,
    y: 0,
    rotation: 0,
    switchProgress: 1,
  });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastObstacleYRef = useRef<number>(0);
  const lastCoinYRef = useRef<number>(0);
  const patternIndexRef = useRef<number>(0);

  const [gameState, setGameState] = useState<GameState>(gameStateRef.current);
  const [highScore, setHighScore] = useState<HighScore | null>(null);
  const [dimensions, setDimensions] = useState({ width: 340, height: 600 });

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getLaneX = useCallback((lane: number): number => {
    const centerX = dimensions.width / 2;
    const totalWidth = LANE_COUNT * LANE_WIDTH;
    const startX = centerX - totalWidth / 2;
    return startX + lane * LANE_WIDTH + LANE_WIDTH / 2;
  }, [dimensions.width]);

  const easeOutQuad = (t: number): number => t * (2 - t);
  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
  const getStreakMultiplier = useCallback(
    (combo: number): number => 1 + Math.min(3, Math.floor(combo / 4)),
    [],
  );
  const getTotalMultiplier = useCallback((state: GameState): number => {
    const streakMultiplier = getStreakMultiplier(state.combo);
    return state.boostActive ? streakMultiplier * BOOST_SCORE_MULTIPLIER : streakMultiplier;
  }, [getStreakMultiplier]);

  // Read CSS variables for theme colors
  const updateColors = useCallback(() => {
    if (typeof window !== 'undefined') {
      const styles = getComputedStyle(document.documentElement);
      colorsRef.current = {
        background: styles.getPropertyValue('--background').trim() || '#fafafa',
        foreground: styles.getPropertyValue('--foreground').trim() || '#171717',
        muted: styles.getPropertyValue('--muted').trim() || '#737373',
        border: styles.getPropertyValue('--border').trim() || '#e5e5e5',
      };
    }
  }, []);

  // ============================================================================
  // SPAWN PATTERNS
  // ============================================================================

  const patterns = [
    [{ lane: 0 }],
    [{ lane: 1 }],
    [{ lane: 2 }],
    [{ lane: 0 }, { lane: 1 }],
    [{ lane: 1 }, { lane: 2 }],
    [{ lane: 0 }, { lane: 2 }],
  ];

  const spawnObstaclePattern = useCallback(() => {
    const state = gameStateRef.current;
    if (state.screen !== 'playing') return;

    const pattern = patterns[patternIndexRef.current % patterns.length];
    patternIndexRef.current++;

    pattern.forEach(({ lane }) => {
      obstaclesRef.current.push({
        lane,
        y: -80,
        width: 38,
        height: 38,
        passed: false,
      });
    });

    lastObstacleYRef.current = -80;
  }, []);

  const spawnCoin = useCallback(() => {
    const state = gameStateRef.current;
    if (state.screen !== 'playing') return;

    const recentObstacles = obstaclesRef.current.filter(o => o.y < 0 && o.y > -180);
    const blockedLanes = new Set(recentObstacles.map(o => o.lane));
    const safeLanes = [0, 1, 2].filter(l => !blockedLanes.has(l));

    if (safeLanes.length > 0) {
      const lane = safeLanes[Math.floor(Math.random() * safeLanes.length)];
      coinsRef.current.push({
        lane,
        y: -40,
        collected: false,
      });
    }

    lastCoinYRef.current = -40;
  }, []);

  // ============================================================================
  // PARTICLE EFFECTS (subtle)
  // ============================================================================

  const spawnParticles = useCallback((x: number, y: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 1 + Math.random() * 2;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        size: 2 + Math.random() * 2,
      });
    }
  }, []);

  // ============================================================================
  // COLLISION DETECTION
  // ============================================================================

  const checkCollisions = useCallback(() => {
    const car = carRef.current;
    const state = gameStateRef.current;

    const carLeft = car.x - CAR_WIDTH / 2 + 4;
    const carRight = car.x + CAR_WIDTH / 2 - 4;
    const carTop = car.y - CAR_HEIGHT / 2 + 8;
    const carBottom = car.y + CAR_HEIGHT / 2 - 4;

    for (const obstacle of obstaclesRef.current) {
      if (obstacle.passed) continue;

      const obsLeft = getLaneX(obstacle.lane) - obstacle.width / 2;
      const obsRight = getLaneX(obstacle.lane) + obstacle.width / 2;
      const obsTop = obstacle.y - obstacle.height / 2;
      const obsBottom = obstacle.y + obstacle.height / 2;

      if (obsTop > carBottom && !obstacle.passed) {
        obstacle.passed = true;
        const closeCall = car.lane === obstacle.lane
          || Math.abs(car.x - getLaneX(obstacle.lane)) < LANE_WIDTH * 0.35;
        if (closeCall) {
          state.score += Math.round(18 * getTotalMultiplier(state));
          state.nearMisses++;
          state.combo++;
          if (state.combo > state.maxCombo) state.maxCombo = state.combo;
          state.boostCharge = Math.min(BOOST_CHARGE_MAX, state.boostCharge + BOOST_NEAR_MISS_GAIN);
        } else {
          state.combo = 0;
        }

        if (!state.boostActive && state.boostCharge >= BOOST_CHARGE_MAX) {
          state.boostActive = true;
          state.boostTime = BOOST_DURATION;
          state.boostCharge = 0;
          state.boostsTriggered++;
          spawnParticles(car.x, car.y, 12);
        }
        continue;
      }

      if (carRight > obsLeft && carLeft < obsRight && carBottom > obsTop && carTop < obsBottom) {
        return true;
      }
    }

    for (const coin of coinsRef.current) {
      if (coin.collected) continue;

      const coinX = getLaneX(coin.lane);
      const coinY = coin.y;
      const distance = Math.sqrt((car.x - coinX) ** 2 + (car.y - coinY) ** 2);

      if (distance < 28) {
        coin.collected = true;
        state.coins++;
        state.score += Math.round(20 * getTotalMultiplier(state));
        state.combo++;
        if (state.combo > state.maxCombo) state.maxCombo = state.combo;
        state.boostCharge = Math.min(BOOST_CHARGE_MAX, state.boostCharge + BOOST_COIN_GAIN);
        if (!state.boostActive && state.boostCharge >= BOOST_CHARGE_MAX) {
          state.boostActive = true;
          state.boostTime = BOOST_DURATION;
          state.boostCharge = 0;
          state.boostsTriggered++;
          spawnParticles(car.x, car.y, 14);
        }
        spawnParticles(coinX, coinY, 6);
      }
    }

    return false;
  }, [getLaneX, spawnParticles, getTotalMultiplier]);

  // ============================================================================
  // GAME LOOP
  // ============================================================================

  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0.016;
    lastTimeRef.current = timestamp;

    const state = gameStateRef.current;
    const car = carRef.current;
    const colors = colorsRef.current;

    // Clear canvas
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    if (state.screen === 'playing') {
      state.speed = Math.min(MAX_SPEED, state.speed + SPEED_INCREMENT);
      if (state.boostActive) {
        state.boostTime = Math.max(0, state.boostTime - deltaTime);
        if (state.boostTime === 0) {
          state.boostActive = false;
        }
      }

      const speedBonus = state.boostActive ? BOOST_SPEED_BONUS : 0;
      const effectiveSpeed = state.speed + speedBonus;

      state.distance += effectiveSpeed;
      state.score += Math.round((1 + state.speed * 0.08) * getTotalMultiplier(state));

      if (car.switchProgress < 1) {
        car.switchProgress = Math.min(1, car.switchProgress + deltaTime / (SWITCH_DURATION / 1000));
        const easedProgress = easeOutQuad(car.switchProgress);
        const prevLaneX = getLaneX(car.lane);
        const targetLaneX = getLaneX(car.targetLane);
        car.x = lerp(prevLaneX, targetLaneX, easedProgress);
        car.rotation = (car.targetLane - car.lane) * 12 * (1 - easedProgress);
      } else {
        car.lane = car.targetLane;
        car.x = getLaneX(car.lane);
        car.rotation = lerp(car.rotation, 0, 0.15);
      }

      obstaclesRef.current.forEach(obs => { obs.y += effectiveSpeed; });
      coinsRef.current.forEach(coin => { coin.y += effectiveSpeed; });

      if (lastObstacleYRef.current > MIN_OBSTACLE_GAP) {
        const spawnChance = 0.015 + state.speed * 0.004;
        if (Math.random() < spawnChance) {
          spawnObstaclePattern();
        }
      }
      lastObstacleYRef.current += effectiveSpeed;

      if (lastCoinYRef.current > COIN_SPAWN_DISTANCE) {
        if (Math.random() < 0.35) {
          spawnCoin();
        }
        lastCoinYRef.current = 0;
      }
      lastCoinYRef.current += effectiveSpeed;

      obstaclesRef.current = obstaclesRef.current.filter(o => o.y < dimensions.height + 100);
      coinsRef.current = coinsRef.current.filter(c => c.y < dimensions.height + 50 && !c.collected);

      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= deltaTime * 3;
      });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      if (checkCollisions()) {
        state.screen = 'gameover';
        state.combo = 0;
        state.boostActive = false;
        state.boostTime = 0;
        spawnParticles(car.x, car.y, 12);

        const newScore: HighScore = {
          score: state.score,
          coins: state.coins,
          maxCombo: state.maxCombo,
          date: new Date().toISOString(),
        };

        const savedHighScore = localStorage.getItem('pingo_highscore');
        const currentHighScore = savedHighScore ? JSON.parse(savedHighScore) : null;

        if (!currentHighScore || state.score > currentHighScore.score) {
          localStorage.setItem('pingo_highscore', JSON.stringify(newScore));
          setHighScore(newScore);
        }

        setGameState({ ...state });
        animationRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      setGameState({ ...state });
    }

    // ========================================
    // RENDERING - Minimal aesthetic
    // ========================================

    const roadWidth = LANE_COUNT * LANE_WIDTH;
    const roadX = (dimensions.width - roadWidth) / 2;

    // Road background - subtle
    ctx.fillStyle = colors.border;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(roadX, 0, roadWidth, dimensions.height);
    ctx.globalAlpha = 1;

    // Lane dividers - thin dashed lines
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.setLineDash([20, 15]);
    const lineOffset = (state.distance % 35);

    for (let i = 1; i < LANE_COUNT; i++) {
      const x = getLaneX(i) - LANE_WIDTH / 2;
      ctx.beginPath();
      ctx.moveTo(x, -35 + lineOffset);
      ctx.lineTo(x, dimensions.height);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Road edges - solid thin lines
    ctx.strokeStyle = colors.muted;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(roadX, 0);
    ctx.lineTo(roadX, dimensions.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(roadX + roadWidth, 0);
    ctx.lineTo(roadX + roadWidth, dimensions.height);
    ctx.stroke();

    // Draw coins - simple hollow circles
    coinsRef.current.forEach(coin => {
      if (coin.collected) return;
      const x = getLaneX(coin.lane);
      const y = coin.y;

      ctx.strokeStyle = colors.foreground;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.stroke();

      // Small inner dot
      ctx.fillStyle = colors.foreground;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw obstacles - simple filled squares
    obstaclesRef.current.forEach(obs => {
      const x = getLaneX(obs.lane);
      const y = obs.y;

      ctx.fillStyle = colors.foreground;
      ctx.fillRect(
        x - obs.width / 2,
        y - obs.height / 2,
        obs.width,
        obs.height
      );
    });

    // Draw particles - small fading dots
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life / p.maxLife * 0.6;
      ctx.fillStyle = colors.muted;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw car - minimal rectangle with subtle details
    if (state.screen === 'playing' || state.screen === 'gameover') {
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate((car.rotation * Math.PI) / 180);

      // Car body - hollow rectangle
      ctx.strokeStyle = colors.foreground;
      ctx.lineWidth = 2;
      ctx.strokeRect(-CAR_WIDTH / 2, -CAR_HEIGHT / 2, CAR_WIDTH, CAR_HEIGHT);

      // Front indicator line
      ctx.beginPath();
      ctx.moveTo(-CAR_WIDTH / 2 + 6, -CAR_HEIGHT / 2 + 10);
      ctx.lineTo(CAR_WIDTH / 2 - 6, -CAR_HEIGHT / 2 + 10);
      ctx.stroke();

      // Center line
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -CAR_HEIGHT / 2 + 16);
      ctx.lineTo(0, CAR_HEIGHT / 2 - 8);
      ctx.stroke();

      ctx.restore();
    }

    // HUD - minimal text
    if (state.screen === 'playing') {
      ctx.fillStyle = colors.foreground;
      ctx.font = '500 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${state.score}`, 20, 36);

      ctx.fillStyle = colors.muted;
      ctx.font = '400 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(`${state.coins} coins`, 20, 56);

      const streakMultiplier = getStreakMultiplier(state.combo);
      if (streakMultiplier > 1) {
        ctx.fillStyle = colors.foreground;
        ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`x${streakMultiplier}`, dimensions.width - 20, 36);
      }

      if (state.combo > 1) {
        ctx.fillStyle = colors.muted;
        ctx.font = '400 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${state.combo} streak`, dimensions.width - 20, 54);
      }

      const barWidth = 120;
      const barHeight = 6;
      const barX = dimensions.width / 2 - barWidth / 2;
      const barY = 18;
      const barFill = state.boostActive
        ? (state.boostTime / BOOST_DURATION)
        : Math.min(1, state.boostCharge / BOOST_CHARGE_MAX);

      ctx.strokeStyle = colors.muted;
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
      ctx.fillStyle = state.boostActive ? colors.foreground : colors.muted;
      ctx.globalAlpha = state.boostActive ? 1 : 0.7;
      ctx.fillRect(barX, barY, barWidth * barFill, barHeight);
      ctx.globalAlpha = 1;

      ctx.fillStyle = colors.muted;
      ctx.font = '400 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.boostActive ? 'BOOST!' : 'Boost', barX + barWidth / 2, barY - 4);
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [
    dimensions,
    getLaneX,
    checkCollisions,
    spawnObstaclePattern,
    spawnCoin,
    spawnParticles,
    getStreakMultiplier,
    getTotalMultiplier,
  ]);

  // ============================================================================
  // INPUT HANDLING
  // ============================================================================

  const handleInput = useCallback(() => {
    const state = gameStateRef.current;
    const car = carRef.current;

    if (state.screen === 'home') {
      startGame();
      return;
    }

    if (state.screen === 'gameover') {
      startGame();
      return;
    }

    if (state.screen === 'playing' && car.switchProgress >= 0.8) {
      car.targetLane = (car.targetLane + 1) % LANE_COUNT;
      car.switchProgress = 0;
    }
  }, []);

  const startGame = useCallback(() => {
    gameStateRef.current = {
      screen: 'playing',
      score: 0,
      coins: 0,
      combo: 0,
      maxCombo: 0,
      distance: 0,
      speed: BASE_SPEED,
      nearMisses: 0,
      boostCharge: 0,
      boostActive: false,
      boostTime: 0,
      boostsTriggered: 0,
    };

    carRef.current = {
      lane: 1,
      targetLane: 1,
      x: getLaneX(1),
      y: dimensions.height - 120,
      rotation: 0,
      switchProgress: 1,
    };

    obstaclesRef.current = [];
    coinsRef.current = [];
    particlesRef.current = [];
    lastObstacleYRef.current = 200;
    lastCoinYRef.current = 100;
    patternIndexRef.current = 0;

    setGameState(gameStateRef.current);
  }, [getLaneX, dimensions.height]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    const handleResize = () => {
      const width = Math.min(340, window.innerWidth - 40);
      const height = Math.min(600, window.innerHeight - 160);
      setDimensions({ width, height });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (gameStateRef.current.screen === 'playing') {
      carRef.current.y = dimensions.height - 120;
      carRef.current.x = getLaneX(carRef.current.lane);
    }
  }, [dimensions, getLaneX]);

  useEffect(() => {
    const saved = localStorage.getItem('pingo_highscore');
    if (saved) {
      setHighScore(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    updateColors();

    // Listen for color scheme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setTimeout(updateColors, 50);
    };
    mediaQuery.addEventListener('change', handleChange);

    carRef.current.x = getLaneX(1);
    carRef.current.y = dimensions.height - 120;

    lastTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationRef.current);
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [gameLoop, getLaneX, dimensions.height, updateColors]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        e.preventDefault();
        handleInput();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-[var(--background)]">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          onClick={handleInput}
          onTouchStart={(e) => {
            e.preventDefault();
            handleInput();
          }}
          className="cursor-pointer touch-none border border-[var(--border)]"
        />

        {/* Home Screen */}
        {gameState.screen === 'home' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--background)]/95 border border-[var(--border)]">
            <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-3">
              One-Button
            </p>
            <h1 className="text-3xl font-medium tracking-tight text-[var(--foreground)] mb-8">
              Drift
            </h1>

            <div className="mb-10 text-center">
              <p className="text-[var(--muted)] text-sm mb-1">
                Tap or press Space to switch lanes
              </p>
              <p className="text-[var(--muted)] text-xs">
                Collect coins + near misses to fill Boost
              </p>
              <p className="text-[var(--muted)] text-xs">
                Boost doubles points and adds speed
              </p>
              <p className="text-[var(--muted)] text-xs">
                Streaks raise your score multiplier
              </p>
            </div>

            <button
              onClick={handleInput}
              className="px-8 py-3 text-sm font-medium border border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
            >
              Play
            </button>

            {highScore && (
              <div className="mt-10 text-center">
                <p className="text-xs text-[var(--muted)] mb-1">Best</p>
                <p className="text-lg font-medium text-[var(--foreground)]">
                  {highScore.score}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Game Over Screen */}
        {gameState.screen === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--background)]/95 border border-[var(--border)]">
            <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-6">
              Game Over
            </p>

            <p className="text-4xl font-medium text-[var(--foreground)] mb-6">
              {gameState.score}
            </p>

            <div className="flex flex-wrap justify-center gap-10 mb-8 text-center">
              <div>
                <p className="text-lg font-medium text-[var(--foreground)]">
                  {gameState.coins}
                </p>
                <p className="text-xs text-[var(--muted)]">Coins</p>
              </div>
              <div>
                <p className="text-lg font-medium text-[var(--foreground)]">
                  {gameState.maxCombo}x
                </p>
                <p className="text-xs text-[var(--muted)]">Combo</p>
              </div>
              <div>
                <p className="text-lg font-medium text-[var(--foreground)]">
                  {gameState.nearMisses}
                </p>
                <p className="text-xs text-[var(--muted)]">Near</p>
              </div>
              <div>
                <p className="text-lg font-medium text-[var(--foreground)]">
                  {gameState.boostsTriggered}
                </p>
                <p className="text-xs text-[var(--muted)]">Boosts</p>
              </div>
            </div>

            {highScore && gameState.score >= highScore.score && (
              <p className="text-xs text-[var(--muted)] mb-6">
                New best score
              </p>
            )}

            <button
              onClick={handleInput}
              className="px-8 py-3 text-sm font-medium border border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
            >
              Play Again
            </button>

            {highScore && gameState.score < highScore.score && (
              <p className="mt-8 text-xs text-[var(--muted)]">
                Best: {highScore.score}
              </p>
            )}
          </div>
        )}

        {/* Playing indicator */}
        {gameState.screen === 'playing' && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
            <p className="text-xs text-[var(--muted)]">
              tap anywhere • build streaks
            </p>
          </div>
        )}
      </div>

      <p className="mt-8 text-xs text-[var(--muted)]">
        Space / Tap to switch lanes • Fill Boost for double points
      </p>
    </div>
  );
}
