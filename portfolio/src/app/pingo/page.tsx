'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface Position {
  x: number;
  y: number;
}

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
  type: 'crate' | 'cone' | 'barrier';
  passed: boolean;
}

interface Coin {
  lane: number;
  y: number;
  collected: boolean;
  pulsePhase: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
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
const LANE_WIDTH = 80;
const CAR_WIDTH = 40;
const CAR_HEIGHT = 70;
const SWITCH_DURATION = 150; // ms
const BASE_SPEED = 5;
const MAX_SPEED = 12;
const SPEED_INCREMENT = 0.001;

const OBSTACLE_SPAWN_DISTANCE = 300;
const MIN_OBSTACLE_GAP = 200;
const COIN_SPAWN_DISTANCE = 150;

const COLORS = {
  background: '#0a0a0a',
  lane: '#1a1a2e',
  laneGlow: '#00f5ff',
  laneLine: '#16213e',
  car: '#00f5ff',
  carGlow: '#00f5ff',
  obstacle: '#ff0055',
  obstacleGlow: '#ff0055',
  coin: '#ffd700',
  coinGlow: '#ffee00',
  text: '#ffffff',
  textMuted: '#888888',
  accent: '#00f5ff',
  comboGlow: '#00ff88',
};

// ============================================================================
// GAME COMPONENT
// ============================================================================

export default function PingoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Game state refs (for animation loop access)
  const gameStateRef = useRef<GameState>({
    screen: 'home',
    score: 0,
    coins: 0,
    combo: 0,
    maxCombo: 0,
    distance: 0,
    speed: BASE_SPEED,
    nearMisses: 0,
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

  // React state for UI updates
  const [gameState, setGameState] = useState<GameState>(gameStateRef.current);
  const [highScore, setHighScore] = useState<HighScore | null>(null);
  const [screenShake, setScreenShake] = useState({ x: 0, y: 0 });

  // Canvas dimensions
  const [dimensions, setDimensions] = useState({ width: 400, height: 700 });

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

  // ============================================================================
  // SPAWN PATTERNS
  // ============================================================================

  const patterns = [
    // Single blocker
    [{ lane: 0 }],
    [{ lane: 1 }],
    [{ lane: 2 }],
    // Double blocker (force specific lane)
    [{ lane: 0 }, { lane: 1 }],
    [{ lane: 1 }, { lane: 2 }],
    [{ lane: 0 }, { lane: 2 }],
    // Zigzag setup (single)
    [{ lane: 0 }],
    [{ lane: 2 }],
  ];

  const spawnObstaclePattern = useCallback(() => {
    const state = gameStateRef.current;
    if (state.screen !== 'playing') return;

    const pattern = patterns[patternIndexRef.current % patterns.length];
    patternIndexRef.current++;

    const obstacleTypes: ('crate' | 'cone' | 'barrier')[] = ['crate', 'cone', 'barrier'];
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

    pattern.forEach(({ lane }) => {
      obstaclesRef.current.push({
        lane,
        y: -100,
        width: lane === 1 ? 50 : 45,
        height: type === 'cone' ? 30 : 50,
        type,
        passed: false,
      });
    });

    lastObstacleYRef.current = -100;
  }, []);

  const spawnCoin = useCallback(() => {
    const state = gameStateRef.current;
    if (state.screen !== 'playing') return;

    // Spawn coins in safe lanes (not blocked by recent obstacles)
    const recentObstacles = obstaclesRef.current.filter(o => o.y < 0 && o.y > -200);
    const blockedLanes = new Set(recentObstacles.map(o => o.lane));
    const safeLanes = [0, 1, 2].filter(l => !blockedLanes.has(l));

    if (safeLanes.length > 0) {
      const lane = safeLanes[Math.floor(Math.random() * safeLanes.length)];
      coinsRef.current.push({
        lane,
        y: -50,
        collected: false,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    lastCoinYRef.current = -50;
  }, []);

  // ============================================================================
  // PARTICLE EFFECTS
  // ============================================================================

  const spawnParticles = useCallback((x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color,
        size: 3 + Math.random() * 3,
      });
    }
  }, []);

  const spawnDriftTrail = useCallback((x: number, y: number) => {
    particlesRef.current.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + CAR_HEIGHT / 2,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 2 + Math.random(),
      life: 0.5,
      maxLife: 0.5,
      color: 'rgba(100, 100, 100, 0.5)',
      size: 4 + Math.random() * 4,
    });
  }, []);

  // ============================================================================
  // COLLISION DETECTION
  // ============================================================================

  const checkCollisions = useCallback(() => {
    const car = carRef.current;
    const state = gameStateRef.current;

    // Car hitbox (slightly smaller for forgiveness)
    const carLeft = car.x - CAR_WIDTH / 2 + 5;
    const carRight = car.x + CAR_WIDTH / 2 - 5;
    const carTop = car.y - CAR_HEIGHT / 2 + 10;
    const carBottom = car.y + CAR_HEIGHT / 2 - 5;

    // Check obstacle collisions
    for (const obstacle of obstaclesRef.current) {
      if (obstacle.passed) continue;

      const obsLeft = getLaneX(obstacle.lane) - obstacle.width / 2;
      const obsRight = getLaneX(obstacle.lane) + obstacle.width / 2;
      const obsTop = obstacle.y - obstacle.height / 2;
      const obsBottom = obstacle.y + obstacle.height / 2;

      // Check if obstacle passed car
      if (obsTop > carBottom && !obstacle.passed) {
        obstacle.passed = true;

        // Check for near miss
        if (car.lane === obstacle.lane || Math.abs(car.x - getLaneX(obstacle.lane)) < LANE_WIDTH) {
          // Near miss bonus!
          state.score += 15;
          state.nearMisses++;
          state.combo++;
          if (state.combo > state.maxCombo) state.maxCombo = state.combo;
          spawnParticles(car.x, car.y, COLORS.comboGlow, 5);
        }
        continue;
      }

      // Check collision
      if (carRight > obsLeft && carLeft < obsRight && carBottom > obsTop && carTop < obsBottom) {
        // Collision!
        return true;
      }
    }

    // Check coin collection
    for (const coin of coinsRef.current) {
      if (coin.collected) continue;

      const coinX = getLaneX(coin.lane);
      const coinY = coin.y;
      const distance = Math.sqrt((car.x - coinX) ** 2 + (car.y - coinY) ** 2);

      if (distance < 35) {
        coin.collected = true;
        state.coins++;
        state.score += 10;
        state.combo++;
        if (state.combo > state.maxCombo) state.maxCombo = state.combo;
        spawnParticles(coinX, coinY, COLORS.coin, 8);
      }
    }

    return false;
  }, [getLaneX, spawnParticles]);

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

    // Clear canvas
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    if (state.screen === 'playing') {
      // Update speed
      state.speed = Math.min(MAX_SPEED, state.speed + SPEED_INCREMENT);

      // Update distance and score
      state.distance += state.speed;
      state.score += 1;

      // Update car lane switching
      if (car.switchProgress < 1) {
        car.switchProgress = Math.min(1, car.switchProgress + deltaTime / (SWITCH_DURATION / 1000));
        const easedProgress = easeOutQuad(car.switchProgress);
        const prevLaneX = getLaneX(car.lane);
        const targetLaneX = getLaneX(car.targetLane);
        car.x = lerp(prevLaneX, targetLaneX, easedProgress);
        car.rotation = (car.targetLane - car.lane) * 15 * (1 - easedProgress);

        // Drift trail
        if (Math.random() < 0.3) {
          spawnDriftTrail(car.x, car.y);
        }
      } else {
        car.lane = car.targetLane;
        car.x = getLaneX(car.lane);
        car.rotation = lerp(car.rotation, 0, 0.1);
      }

      // Move obstacles
      obstaclesRef.current.forEach(obs => {
        obs.y += state.speed;
      });

      // Move coins
      coinsRef.current.forEach(coin => {
        coin.y += state.speed;
        coin.pulsePhase += deltaTime * 5;
      });

      // Spawn obstacles
      if (lastObstacleYRef.current > MIN_OBSTACLE_GAP) {
        const spawnChance = 0.02 + state.speed * 0.005;
        if (Math.random() < spawnChance) {
          spawnObstaclePattern();
        }
      }
      lastObstacleYRef.current += state.speed;

      // Spawn coins
      if (lastCoinYRef.current > COIN_SPAWN_DISTANCE) {
        if (Math.random() < 0.4) {
          spawnCoin();
        }
        lastCoinYRef.current = 0;
      }
      lastCoinYRef.current += state.speed;

      // Clean up off-screen objects
      obstaclesRef.current = obstaclesRef.current.filter(o => o.y < dimensions.height + 100);
      coinsRef.current = coinsRef.current.filter(c => c.y < dimensions.height + 50 && !c.collected);

      // Update particles
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= deltaTime * 2;
      });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      // Check collisions
      if (checkCollisions()) {
        // Game over
        state.screen = 'gameover';
        state.combo = 0;

        // Screen shake
        setScreenShake({ x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10 });
        setTimeout(() => setScreenShake({ x: 0, y: 0 }), 100);

        // Explosion particles
        spawnParticles(car.x, car.y, COLORS.obstacle, 20);

        // Save high score
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

      // Update React state periodically
      setGameState({ ...state });
    }

    // ========================================
    // RENDERING
    // ========================================

    ctx.save();
    ctx.translate(screenShake.x, screenShake.y);

    // Draw road
    const roadWidth = LANE_COUNT * LANE_WIDTH + 40;
    const roadX = (dimensions.width - roadWidth) / 2;

    // Road background with gradient
    const roadGradient = ctx.createLinearGradient(roadX, 0, roadX + roadWidth, 0);
    roadGradient.addColorStop(0, '#0f0f1a');
    roadGradient.addColorStop(0.5, '#1a1a2e');
    roadGradient.addColorStop(1, '#0f0f1a');
    ctx.fillStyle = roadGradient;
    ctx.fillRect(roadX, 0, roadWidth, dimensions.height);

    // Lane lines (animated)
    ctx.strokeStyle = COLORS.laneLine;
    ctx.lineWidth = 2;
    ctx.setLineDash([30, 20]);
    const lineOffset = (state.distance % 50);

    for (let i = 1; i < LANE_COUNT; i++) {
      const x = getLaneX(i) - LANE_WIDTH / 2;
      ctx.beginPath();
      ctx.moveTo(x, -50 + lineOffset);
      ctx.lineTo(x, dimensions.height);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Road edge glow
    ctx.shadowColor = COLORS.laneGlow;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = COLORS.laneGlow;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.5;

    // Left edge
    ctx.beginPath();
    ctx.moveTo(roadX, 0);
    ctx.lineTo(roadX, dimensions.height);
    ctx.stroke();

    // Right edge
    ctx.beginPath();
    ctx.moveTo(roadX + roadWidth, 0);
    ctx.lineTo(roadX + roadWidth, dimensions.height);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Draw coins
    coinsRef.current.forEach(coin => {
      if (coin.collected) return;

      const x = getLaneX(coin.lane);
      const y = coin.y;
      const pulse = Math.sin(coin.pulsePhase) * 0.2 + 1;
      const size = 15 * pulse;

      // Glow
      ctx.shadowColor = COLORS.coinGlow;
      ctx.shadowBlur = 20;

      // Coin body
      ctx.fillStyle = COLORS.coin;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      // Inner highlight
      ctx.fillStyle = '#ffee88';
      ctx.beginPath();
      ctx.arc(x - 3, y - 3, size * 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
    });

    // Draw obstacles
    obstaclesRef.current.forEach(obs => {
      const x = getLaneX(obs.lane);
      const y = obs.y;

      // Glow
      ctx.shadowColor = COLORS.obstacleGlow;
      ctx.shadowBlur = 15;

      ctx.fillStyle = COLORS.obstacle;

      if (obs.type === 'cone') {
        // Triangle cone
        ctx.beginPath();
        ctx.moveTo(x, y - obs.height / 2);
        ctx.lineTo(x - obs.width / 2, y + obs.height / 2);
        ctx.lineTo(x + obs.width / 2, y + obs.height / 2);
        ctx.closePath();
        ctx.fill();
      } else if (obs.type === 'barrier') {
        // Striped barrier
        ctx.fillRect(x - obs.width / 2, y - obs.height / 2, obs.width, obs.height);
        ctx.fillStyle = '#ff6688';
        ctx.fillRect(x - obs.width / 2, y - obs.height / 4, obs.width, obs.height / 4);
      } else {
        // Crate
        ctx.fillRect(x - obs.width / 2, y - obs.height / 2, obs.width, obs.height);
        // Cross pattern
        ctx.strokeStyle = '#cc0044';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - obs.width / 2, y - obs.height / 2);
        ctx.lineTo(x + obs.width / 2, y + obs.height / 2);
        ctx.moveTo(x + obs.width / 2, y - obs.height / 2);
        ctx.lineTo(x - obs.width / 2, y + obs.height / 2);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
    });

    // Draw particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw car
    if (state.screen === 'playing' || state.screen === 'gameover') {
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate((car.rotation * Math.PI) / 180);

      // Car glow
      ctx.shadowColor = COLORS.carGlow;
      ctx.shadowBlur = 25;

      // Car body
      const carGradient = ctx.createLinearGradient(-CAR_WIDTH / 2, 0, CAR_WIDTH / 2, 0);
      carGradient.addColorStop(0, '#006688');
      carGradient.addColorStop(0.5, COLORS.car);
      carGradient.addColorStop(1, '#006688');
      ctx.fillStyle = carGradient;

      // Main body (rounded rectangle)
      ctx.beginPath();
      ctx.roundRect(-CAR_WIDTH / 2, -CAR_HEIGHT / 2, CAR_WIDTH, CAR_HEIGHT, 8);
      ctx.fill();

      // Windshield
      ctx.fillStyle = '#003344';
      ctx.beginPath();
      ctx.roundRect(-CAR_WIDTH / 2 + 6, -CAR_HEIGHT / 2 + 10, CAR_WIDTH - 12, 20, 4);
      ctx.fill();

      // Headlights
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(-CAR_WIDTH / 2 + 8, -CAR_HEIGHT / 2 + 5, 4, 0, Math.PI * 2);
      ctx.arc(CAR_WIDTH / 2 - 8, -CAR_HEIGHT / 2 + 5, 4, 0, Math.PI * 2);
      ctx.fill();

      // Taillights
      ctx.fillStyle = '#ff3366';
      ctx.shadowColor = '#ff3366';
      ctx.beginPath();
      ctx.arc(-CAR_WIDTH / 2 + 8, CAR_HEIGHT / 2 - 5, 4, 0, Math.PI * 2);
      ctx.arc(CAR_WIDTH / 2 - 8, CAR_HEIGHT / 2 - 5, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Draw HUD for playing state
    if (state.screen === 'playing') {
      // Score
      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${state.score}`, 20, 40);

      // Coins
      ctx.fillStyle = COLORS.coin;
      ctx.font = '18px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`${state.coins}`, 20, 70);

      // Combo
      if (state.combo > 1) {
        ctx.fillStyle = COLORS.comboGlow;
        ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`x${state.combo}`, dimensions.width - 20, 40);
      }

      // Speed indicator
      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.floor(state.speed * 10)} km/h`, dimensions.width - 20, 70);
    }

    ctx.restore();

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [dimensions, getLaneX, checkCollisions, spawnObstaclePattern, spawnCoin, spawnDriftTrail, spawnParticles, screenShake]);

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
      // Cyclic lane switch
      car.targetLane = (car.targetLane + 1) % LANE_COUNT;
      car.switchProgress = 0;

      // Reset combo if no near miss within a while (simplified)
      // In a real game, you'd track time since last scoring action
    }
  }, []);

  const startGame = useCallback(() => {
    // Reset game state
    gameStateRef.current = {
      screen: 'playing',
      score: 0,
      coins: 0,
      combo: 0,
      maxCombo: 0,
      distance: 0,
      speed: BASE_SPEED,
      nearMisses: 0,
    };

    // Reset car
    carRef.current = {
      lane: 1,
      targetLane: 1,
      x: getLaneX(1),
      y: dimensions.height - 150,
      rotation: 0,
      switchProgress: 1,
    };

    // Clear objects
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

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const width = Math.min(400, window.innerWidth);
      const height = Math.min(700, window.innerHeight - 100);
      setDimensions({ width, height });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update car position when dimensions change
  useEffect(() => {
    if (gameStateRef.current.screen === 'playing') {
      carRef.current.y = dimensions.height - 150;
      carRef.current.x = getLaneX(carRef.current.lane);
    }
  }, [dimensions, getLaneX]);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('pingo_highscore');
    if (saved) {
      setHighScore(JSON.parse(saved));
    }
  }, []);

  // Start game loop
  useEffect(() => {
    // Initialize car position
    carRef.current.x = getLaneX(1);
    carRef.current.y = dimensions.height - 150;

    lastTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [gameLoop, getLaneX, dimensions.height]);

  // Keyboard input
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
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: COLORS.background }}
    >
      {/* Game Container */}
      <div className="relative">
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          onClick={handleInput}
          onTouchStart={(e) => {
            e.preventDefault();
            handleInput();
          }}
          className="cursor-pointer touch-none"
          style={{
            borderRadius: '12px',
            boxShadow: `0 0 60px ${COLORS.accent}22`,
          }}
        />

        {/* Home Screen Overlay */}
        {gameState.screen === 'home' && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{
              background: 'rgba(10, 10, 10, 0.85)',
              borderRadius: '12px',
            }}
          >
            <h1
              className="text-4xl font-bold mb-2 tracking-tight"
              style={{
                color: COLORS.accent,
                textShadow: `0 0 30px ${COLORS.accent}`,
              }}
            >
              ONE-BUTTON
            </h1>
            <h2
              className="text-5xl font-black mb-8"
              style={{
                color: COLORS.text,
                textShadow: `0 0 20px ${COLORS.accent}44`,
              }}
            >
              DRIFT
            </h2>

            <div className="mb-8 text-center px-8">
              <p style={{ color: COLORS.textMuted }} className="mb-2">
                Tap or press Space to switch lanes
              </p>
              <p style={{ color: COLORS.textMuted }} className="text-sm">
                Collect coins avoid obstacles
              </p>
            </div>

            <button
              onClick={handleInput}
              className="px-12 py-4 text-xl font-bold rounded-full transition-all hover:scale-105"
              style={{
                background: COLORS.accent,
                color: COLORS.background,
                boxShadow: `0 0 30px ${COLORS.accent}66`,
              }}
            >
              PLAY
            </button>

            {highScore && (
              <div className="mt-8 text-center">
                <p style={{ color: COLORS.textMuted }} className="text-sm">
                  Best Score
                </p>
                <p style={{ color: COLORS.coin }} className="text-2xl font-bold">
                  {highScore.score}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState.screen === 'gameover' && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{
              background: 'rgba(10, 10, 10, 0.9)',
              borderRadius: '12px',
            }}
          >
            <h2
              className="text-3xl font-bold mb-6"
              style={{
                color: COLORS.obstacle,
                textShadow: `0 0 20px ${COLORS.obstacle}`,
              }}
            >
              GAME OVER
            </h2>

            <div className="mb-8 text-center">
              <p style={{ color: COLORS.textMuted }} className="text-sm mb-1">
                Score
              </p>
              <p style={{ color: COLORS.text }} className="text-4xl font-bold mb-4">
                {gameState.score}
              </p>

              <div className="flex gap-8">
                <div className="text-center">
                  <p style={{ color: COLORS.coin }}>
                    {gameState.coins}
                  </p>
                  <p style={{ color: COLORS.textMuted }} className="text-xs">
                    Coins
                  </p>
                </div>
                <div className="text-center">
                  <p style={{ color: COLORS.comboGlow }}>
                    x{gameState.maxCombo}
                  </p>
                  <p style={{ color: COLORS.textMuted }} className="text-xs">
                    Best Combo
                  </p>
                </div>
                <div className="text-center">
                  <p style={{ color: COLORS.accent }}>
                    {gameState.nearMisses}
                  </p>
                  <p style={{ color: COLORS.textMuted }} className="text-xs">
                    Near Misses
                  </p>
                </div>
              </div>
            </div>

            {highScore && gameState.score >= highScore.score && (
              <p
                className="mb-4 text-lg font-bold animate-pulse"
                style={{ color: COLORS.coin }}
              >
                NEW HIGH SCORE!
              </p>
            )}

            <button
              onClick={handleInput}
              className="px-10 py-3 text-lg font-bold rounded-full transition-all hover:scale-105"
              style={{
                background: COLORS.accent,
                color: COLORS.background,
                boxShadow: `0 0 30px ${COLORS.accent}66`,
              }}
            >
              PLAY AGAIN
            </button>

            {highScore && (
              <div className="mt-6 text-center">
                <p style={{ color: COLORS.textMuted }} className="text-xs">
                  Best: {highScore.score}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mobile Tap Zone Indicator */}
        {gameState.screen === 'playing' && (
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full"
            style={{
              background: 'rgba(0, 245, 255, 0.1)',
              border: '1px solid rgba(0, 245, 255, 0.3)',
            }}
          >
            <p style={{ color: COLORS.accent }} className="text-sm font-medium">
              TAP ANYWHERE
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <p
        className="mt-6 text-xs"
        style={{ color: COLORS.textMuted }}
      >
        Space / Tap to switch lanes
      </p>
    </div>
  );
}
