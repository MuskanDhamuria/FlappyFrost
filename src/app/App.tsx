import { useEffect, useRef, useState } from 'react';

interface Bird {
  x: number;
  y: number;
  velocity: number;
  rotation: number;
}

interface Pipe {
  x: number;
  top: number;
  bottom: number;
  scored: boolean;
}

interface Cloud {
  x: number;
  y: number;
  speed: number;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const gameState = useRef({
    bird: { x: 100, y: 250, velocity: 0, rotation: 0 } as Bird,
    pipes: [] as Pipe[],
    clouds: [] as Cloud[],
    frame: 0,
    wingFlap: 0,
  });

  const CANVAS_WIDTH = canvasSize.width;
  const CANVAS_HEIGHT = canvasSize.height;
  const GRAVITY = 0.6;
  const JUMP_STRENGTH = -10;
  const BIRD_SIZE = 34;
  const PIPE_WIDTH = 70;
  const PIPE_GAP = 180;
  const PIPE_SPEED = 2.5;

  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize clouds
    if (!gameState.current.clouds || gameState.current.clouds.length === 0) {
      gameState.current.clouds = [];
      for (let i = 0; i < 8; i++) {
        gameState.current.clouds.push({
          x: (CANVAS_WIDTH / 8) * i + Math.random() * 100,
          y: Math.random() * 200 + 50,
          speed: Math.random() * 0.3 + 0.2,
        });
      }
    }

    let animationId: number;

    const drawCloud = (cloud: Cloud) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cloud.x + 20, cloud.y, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cloud.x + 45, cloud.y, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cloud.x + 30, cloud.y - 15, 25, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawBird = (bird: Bird, wingFlap: number) => {
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate((bird.rotation * Math.PI) / 180);

      // Penguin body - black oval
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.ellipse(0, 0, BIRD_SIZE / 1.8, BIRD_SIZE / 1.6, 0, 0, Math.PI * 2);
      ctx.fill();

      // White belly
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(2, 2, BIRD_SIZE / 2.5, BIRD_SIZE / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flippers/Wings with animated flapping
      const wingAngle = Math.sin(wingFlap * 0.3) * 25;
      
      // Left flipper
      ctx.save();
      ctx.rotate((wingAngle * Math.PI) / 180);
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.ellipse(-10, 0, 8, 16, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Flipper highlight
      ctx.fillStyle = '#333333';
      ctx.beginPath();
      ctx.ellipse(-11, -2, 5, 10, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      // Right flipper
      ctx.save();
      ctx.rotate((-wingAngle * Math.PI) / 180);
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.ellipse(10, 0, 8, 16, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Flipper highlight
      ctx.fillStyle = '#333333';
      ctx.beginPath();
      ctx.ellipse(11, -2, 5, 10, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Orange beak
      ctx.fillStyle = '#FF8C00';
      ctx.beginPath();
      ctx.moveTo(BIRD_SIZE / 2.5, -2);
      ctx.lineTo(BIRD_SIZE / 2 + 10, 0);
      ctx.lineTo(BIRD_SIZE / 2.5, 2);
      ctx.closePath();
      ctx.fill();

      // Beak highlight
      ctx.fillStyle = '#FFA500';
      ctx.beginPath();
      ctx.moveTo(BIRD_SIZE / 2.5, -1);
      ctx.lineTo(BIRD_SIZE / 2 + 6, 0);
      ctx.lineTo(BIRD_SIZE / 2.5, 1);
      ctx.closePath();
      ctx.fill();

      // Eyes - big and round
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(6, -8, 6, 0, Math.PI * 2);
      ctx.fill();

      // Eye outline
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Eye pupil
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(8, -7, 3, 0, Math.PI * 2);
      ctx.fill();

      // Eye sparkle
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(9, -8, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Second eye (slightly visible)
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(-2, -8, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Orange feet
      ctx.fillStyle = '#FF8C00';
      ctx.beginPath();
      ctx.ellipse(-4, BIRD_SIZE / 2 + 2, 4, 2.5, -Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.ellipse(2, BIRD_SIZE / 2 + 2, 4, 2.5, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

      // Cheek blush (optional cute touch)
      ctx.fillStyle = 'rgba(255, 200, 200, 0.4)';
      ctx.beginPath();
      ctx.ellipse(4, 1, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawPipe = (pipe: Pipe) => {
      // Ice stalactites/stalagmites - icy blue colors
      // Top ice formation
      const iceGradient1 = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
      iceGradient1.addColorStop(0, '#B3E5FC');
      iceGradient1.addColorStop(0.5, '#E1F5FE');
      iceGradient1.addColorStop(1, '#B3E5FC');
      ctx.fillStyle = iceGradient1;
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top - 30);

      // 
      
      // Ice highlight
      const capGradient1 = ctx.createLinearGradient(pipe.x - 5, 0, pipe.x + PIPE_WIDTH + 5, 0);
      capGradient1.addColorStop(0, '#E1F5FE');
      capGradient1.addColorStop(0.5, '#FFFFFF');
      capGradient1.addColorStop(1, '#E1F5FE');
      ctx.fillStyle = capGradient1;
      ctx.fillRect(pipe.x, pipe.top - 32, PIPE_WIDTH, 5);

      // Bottom ice formation
      const pipeBottomY = CANVAS_HEIGHT - pipe.bottom;
      
     
      // Ice highlight
      const capGradient2 = ctx.createLinearGradient(pipe.x - 5, 0, pipe.x + PIPE_WIDTH + 5, 0);
      capGradient2.addColorStop(0, '#E1F5FE');
      capGradient2.addColorStop(0.5, '#FFFFFF');
      capGradient2.addColorStop(1, '#E1F5FE');
      ctx.fillStyle = capGradient2;
      ctx.fillRect(pipe.x, pipeBottomY + 30, PIPE_WIDTH, 5);

      // Ice body
      const iceGradient2 = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
      iceGradient2.addColorStop(0, '#B3E5FC');
      iceGradient2.addColorStop(0.5, '#E1F5FE');
      iceGradient2.addColorStop(1, '#B3E5FC');
      ctx.fillStyle = iceGradient2;
      ctx.fillRect(pipe.x, pipeBottomY + 35, PIPE_WIDTH, pipe.bottom - 35);
      
      // Add icy texture lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      for (let i = 0; i < pipe.top - 30; i += 20) {
        ctx.beginPath();
        ctx.moveTo(pipe.x + 10, i);
        ctx.lineTo(pipe.x + PIPE_WIDTH - 10, i + 5);
        ctx.stroke();
      }
    };

    const drawBackground = () => {
      // Antarctic sky gradient - cold blues
      const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGradient.addColorStop(0, '#B8D8E8');
      skyGradient.addColorStop(0.5, '#D4E8F0');
      skyGradient.addColorStop(1, '#E8F4F8');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw clouds - more white and fluffy for arctic
      gameState.current.clouds.forEach((cloud) => {
        drawCloud(cloud);
        cloud.x -= cloud.speed;
        if (cloud.x < -60) {
          cloud.x = CANVAS_WIDTH + 60;
          cloud.y = Math.random() * 200 + 50;
        }
      });

      // Falling snow
      const time = gameState.current.frame * 0.05;
      for (let i = 0; i < 50; i++) {
        const snowX = (i * 60 + time * 20) % CANVAS_WIDTH;
        const snowY = (i * 30 + time * 30) % (CANVAS_HEIGHT - 80);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(snowX, snowY, 2 + Math.sin(time + i) * 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ice/Snow ground - layered ice effect
      const iceGradient = ctx.createLinearGradient(0, CANVAS_HEIGHT - 80, 0, CANVAS_HEIGHT);
      iceGradient.addColorStop(0, '#E0F2F7');
      iceGradient.addColorStop(0.3, '#B3E5FC');
      iceGradient.addColorStop(0.7, '#81D4FA');
      iceGradient.addColorStop(1, '#4FC3F7');
      ctx.fillStyle = iceGradient;
      ctx.fillRect(0, CANVAS_HEIGHT - 80, CANVAS_WIDTH, 80);

      // Ice chunks and cracks
      // ctx.strokeStyle = 'rgba(100, 181, 246, 0.4)';
      // ctx.lineWidth = 2;
      // for (let i = 0; i < CANVAS_WIDTH; i += 60) {
      //   const offset = (gameState.current.frame + i) % 120;
      //   // Crack lines
      //   ctx.beginPath();
      //   ctx.moveTo(i - offset, CANVAS_HEIGHT - 80);
      //   ctx.lineTo(i - offset + 15, CANVAS_HEIGHT - 60);
      //   ctx.lineTo(i - offset + 10, CANVAS_HEIGHT - 40);
      //   ctx.stroke();
      // }

      // // Snow mounds on ice
      // ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      // for (let i = 0; i < CANVAS_WIDTH; i += 80) {
      //   const moundX = i + Math.sin(time * 0.1 + i) * 5;
      //   ctx.beginPath();
      //   ctx.ellipse(moundX, CANVAS_HEIGHT - 80, 30, 15, 0, 0, Math.PI * 2);
      //   ctx.fill();
      // }

      // Icicles hanging effect at top of ice
      // ctx.fillStyle = 'rgba(200, 230, 255, 0.7)';
      // for (let i = 20; i < CANVAS_WIDTH; i += 40) {
      //   ctx.beginPath();
      //   ctx.moveTo(i, CANVAS_HEIGHT - 80);
      //   ctx.lineTo(i - 5, CANVAS_HEIGHT - 85);
      //   ctx.lineTo(i + 5, CANVAS_HEIGHT - 85);
      //   ctx.closePath();
      //   ctx.fill();
      // }

      // Shimmer effect on ice
      const shimmerOffset = Math.sin(time * 0.5) * 20;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      for (let i = 0; i < CANVAS_WIDTH; i += 100) {
        ctx.beginPath();
        ctx.ellipse(i + shimmerOffset, CANVAS_HEIGHT - 50, 40, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const checkCollision = (bird: Bird, pipes: Pipe[]): boolean => {
      // Ground and ceiling collision
      if (bird.y + BIRD_SIZE / 2 > CANVAS_HEIGHT - 80 || bird.y - BIRD_SIZE / 2 < 0) {
        return true;
      }

      // Pipe collision
      for (const pipe of pipes) {
        if (
          bird.x + BIRD_SIZE / 2.5 > pipe.x &&
          bird.x - BIRD_SIZE / 2.5 < pipe.x + PIPE_WIDTH
        ) {
          if (bird.y - BIRD_SIZE / 2.5 < pipe.top - 35 || bird.y + BIRD_SIZE / 2.5 > CANVAS_HEIGHT - pipe.bottom) {
            return true;
          }
        }
      }

      return false;
    };

    const gameLoop = () => {
      if (!gameStarted || gameOver) {
        drawBackground();
        if (!gameStarted) {
          drawBird(gameState.current.bird, gameState.current.wingFlap);
          gameState.current.wingFlap++;
        }
        animationId = requestAnimationFrame(gameLoop);
        return;
      }

      const { bird, pipes, frame } = gameState.current;

      // Update bird
      bird.velocity += GRAVITY;
      bird.y += bird.velocity;
      
      // Bird rotation based on velocity
      bird.rotation = Math.min(Math.max(bird.velocity * 3, -30), 90);

      // Wing flap animation
      gameState.current.wingFlap++;

      // Generate pipes
      if (frame % 100 === 0) {
        const minTop = 150;
        const maxTop = CANVAS_HEIGHT - 80 - PIPE_GAP - 100;
        const top = Math.random() * (maxTop - minTop) + minTop;
        const bottom = CANVAS_HEIGHT - 80 - top - PIPE_GAP;
        
        pipes.push({
          x: CANVAS_WIDTH,
          top,
          bottom,
          scored: false,
        });
      }

      // Update pipes
      for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED;

        // Score when passing pipe
        if (!pipes[i].scored && pipes[i].x + PIPE_WIDTH < bird.x) {
          pipes[i].scored = true;
          setScore((prev) => {
            const newScore = prev + 1;
            setHighScore((high) => Math.max(high, newScore));
            return newScore;
          });
        }

        // Remove off-screen pipes
        if (pipes[i].x + PIPE_WIDTH < 0) {
          pipes.splice(i, 1);
        }
      }

      // Check collision
      if (checkCollision(bird, pipes)) {
        setGameOver(true);
      }

      // Draw
      drawBackground();
      pipes.forEach(drawPipe);
      drawBird(bird, gameState.current.wingFlap);

      // Draw score with better styling
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(score.toString(), CANVAS_WIDTH / 2, 70);
      
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      gameState.current.frame++;
      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [gameStarted, gameOver, score]);

  const handleJump = () => {
    if (!gameStarted) {
      setGameStarted(true);
      setGameOver(false);
      setScore(0);
      gameState.current = {
        ...gameState.current,
        bird: { x: 100, y: 250, velocity: 0, rotation: 0 },
        pipes: [],
        frame: 0,
      };
    } else if (!gameOver) {
      gameState.current.bird.velocity = JUMP_STRENGTH;
    }
  };

  const handleRestart = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    gameState.current = {
      ...gameState.current,
      bird: { x: 100, y: 250, velocity: 0, rotation: 0 },
      pipes: [],
      frame: 0,
    };
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleJump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, gameOver]);

  return (
    <div className="w-full h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleJump}
        className="w-full h-full cursor-pointer"
      />
      
      {!gameStarted && !gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-sky-200 px-12 py-8 rounded-3xl shadow-2xl text-center">
            <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-500 to-sky-500 mb-6">
              Flappy Frost
            </h1>
            <div className="space-y-4">
              <p className="text-2xl font-semibold text-gray-700">
                Press Space to start. Click or press <span className="px-3 py-1 bg-sky-300 rounded-lg font-mono">SPACE</span> to jump!
              </p>
            </div>
            {highScore > 0 && (
              <div className="mt-6 pt-6 border-t-2">
                <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">High Score</p>
                <p className="text-4xl font-black text-blue-500">{highScore}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-sky-200 px-12 py-10 rounded-3xl shadow-2xl text-center transform">
            <h2 className="text-6xl font-black text-sky-500 mb-6">Game Over!</h2>
            <div className="space-y-4 mb-8">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Your Score</p>
                <p className="text-5xl font-black text-gray-800">{score}</p>
              </div>
              <div className="pt-4 border-t-2">
                <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Best Score</p>
                <p className="text-4xl font-black text-gray-800">{highScore}</p>
              </div>
            </div>
            <button
              onClick={handleRestart}
              className="px-10 py-4 bg-gradient-to-r from-blue-400 via-cyan-500 to-sky-500 text-white font-black text-2xl rounded-2xl shadow-lg transition-all transform hover:scale-105 active:scale-95"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}