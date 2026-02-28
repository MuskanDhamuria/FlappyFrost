import { useEffect, useRef, useState } from 'react';

interface Bird { x: number; y: number; velocity: number; rotation: number; }
interface Pipe { x: number; top: number; bottom: number; scored: boolean; }
interface Cloud { x: number; y: number; speed: number; }


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
    wingFlap: 0,
    pipeTimer: 0,
  });

  const CANVAS_WIDTH = canvasSize.width;
  const CANVAS_HEIGHT = canvasSize.height;
  const GRAVITY = 0.6;
  const JUMP_STRENGTH = -10;
  const BIRD_SIZE = 34;
  const PIPE_WIDTH = 70;
  const PIPE_GAP = 180;
  const PIPE_SPEED = 2.5;

  // Resize handler
  useEffect(() => {
    const handleResize = () => setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize clouds
    if (!gameState.current.clouds.length) {
      for (let i = 0; i < 8; i++) {
        gameState.current.clouds.push({
          x: (CANVAS_WIDTH / 8) * i + Math.random() * 100,
          y: Math.random() * 200 + 50,
          speed: Math.random() * 0.3 + 0.2,
        });
      }
    }

    let animationId: number;
    let lastTime = 0;

    const drawCloud = (cloud: Cloud) => {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
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

      const floatOffset = Math.sin(wingFlap * 0.15) * 2;
      ctx.translate(0, floatOffset);

      ctx.rotate((bird.rotation * Math.PI) / 180);

      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(0, BIRD_SIZE / 1.2, BIRD_SIZE / 1.6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "#FF8C00";
      ctx.beginPath();
      ctx.ellipse(-8, BIRD_SIZE / 2, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(8, BIRD_SIZE / 2, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      const bodyGradient = ctx.createRadialGradient(
        -5, -8, 5,
        0, 0, BIRD_SIZE
      );
      bodyGradient.addColorStop(0, "#2b2b2b");
      bodyGradient.addColorStop(1, "#0f0f0f");

      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, BIRD_SIZE / 1.6, BIRD_SIZE / 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      const bellyGradient = ctx.createRadialGradient(
        0, 4, 2,
        0, 4, BIRD_SIZE / 1.2
      );
      bellyGradient.addColorStop(0, "#ffffff");
      bellyGradient.addColorStop(1, "#eaeaea");

      ctx.fillStyle = bellyGradient;
      ctx.beginPath();
      ctx.ellipse(0, 4, BIRD_SIZE / 2.2, BIRD_SIZE / 1.8, 0, 0, Math.PI * 2);
      ctx.fill();

      const wingAngle = Math.sin(wingFlap * 0.35) * 35;

      const drawWing = (side: number) => {
        ctx.save();
        ctx.translate((BIRD_SIZE / 2) * side, 0);
        ctx.rotate((wingAngle * side * Math.PI) / 180);

        const wingGradient = ctx.createLinearGradient(0, -10, 0, 10);
        wingGradient.addColorStop(0, "#2b2b2b");
        wingGradient.addColorStop(1, "#111");

        ctx.fillStyle = wingGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 16, side > 0 ? -Math.PI / 10 : Math.PI / 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      };

      drawWing(-1);
      drawWing(1);

      ctx.fillStyle = "rgba(255,120,120,0.25)";
      ctx.beginPath();
      ctx.arc(-10, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(10, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(-7, -8, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(7, -8, 6, 0, Math.PI * 2); ctx.fill();

      const pupilOffsetX = Math.min(Math.max(bird.velocity * 0.2, -2), 2);
      const pupilOffsetY = Math.min(Math.max(bird.velocity * 0.1, -2), 2);

      ctx.fillStyle = "#000";
      ctx.beginPath(); ctx.arc(-7 + pupilOffsetX, -8 + pupilOffsetY, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(7 + pupilOffsetX, -8 + pupilOffsetY, 3, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(-9, -10, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(5, -10, 1.5, 0, Math.PI * 2); ctx.fill();

      const beakGradient = ctx.createLinearGradient(-5, -2, 5, 4);
      beakGradient.addColorStop(0, "#FFA500");
      beakGradient.addColorStop(1, "#FF7A00");

      ctx.fillStyle = beakGradient;
      ctx.beginPath();
      ctx.moveTo(-6, -2);
      ctx.quadraticCurveTo(0, 5, 6, -2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.ellipse(0, -1, 3, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawPipe = (pipe: Pipe) => {
      const topHeight = pipe.top - 30;
      const bottomY = CANVAS_HEIGHT - pipe.bottom;
      const bottomHeight = pipe.bottom - 35;

      const pipeGradient = ctx.createLinearGradient(
        pipe.x,
        0,
        pipe.x + PIPE_WIDTH,
        0
      );
      pipeGradient.addColorStop(0, '#7EC8E3');
      pipeGradient.addColorStop(0.25, '#BEE9F7');
      pipeGradient.addColorStop(0.5, '#EAFBFF');
      pipeGradient.addColorStop(0.75, '#BEE9F7');
      pipeGradient.addColorStop(1, '#5DB7DA');

      ctx.fillStyle = pipeGradient;

      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, topHeight);

      ctx.beginPath();
      ctx.roundRect(pipe.x - 6, topHeight - 20, PIPE_WIDTH + 12, 30, 14);
      ctx.fill();

      ctx.fillRect(pipe.x, bottomY + 35, PIPE_WIDTH, bottomHeight);

      ctx.beginPath();
      ctx.roundRect(pipe.x - 6, bottomY + 25, PIPE_WIDTH + 12, 30, 14);
      ctx.fill();

      const shadowGradient = ctx.createLinearGradient(
        pipe.x,
        0,
        pipe.x + PIPE_WIDTH,
        0
      );
      shadowGradient.addColorStop(0, 'rgba(0,0,0,0.15)');
      shadowGradient.addColorStop(0.5, 'rgba(0,0,0,0)');
      shadowGradient.addColorStop(1, 'rgba(0,0,0,0.2)');

      ctx.fillStyle = shadowGradient;
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, topHeight);
      ctx.fillRect(pipe.x, bottomY + 35, PIPE_WIDTH, bottomHeight);

      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(pipe.x + 6, 0, 4, topHeight);
      ctx.fillRect(pipe.x + 6, bottomY + 35, 4, bottomHeight);

      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      for (let i = 0; i < 20; i++) {
        const frostX = pipe.x + Math.random() * PIPE_WIDTH;
        const frostYTop = Math.random() * topHeight;
        const frostYBottom = bottomY + 35 + Math.random() * bottomHeight;

        ctx.fillRect(frostX, frostYTop, 2, 2);
        ctx.fillRect(frostX, frostYBottom, 2, 2);
      }
    };

    const drawBackground = () => {
      const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      sky.addColorStop(0, '#B8D8E8');
      sky.addColorStop(0.5, '#D4E8F0');
      sky.addColorStop(1, '#E8F4F8');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      gameState.current.clouds.forEach(c => {
        drawCloud(c);
        c.x -= c.speed;
        if (c.x < -60) { c.x = CANVAS_WIDTH + 60; c.y = Math.random() * 200 + 50; }
      });

      // Ground
      const groundY = CANVAS_HEIGHT - 80;

      // Base ice gradient 
      const iceGradient = ctx.createLinearGradient(0, groundY, 0, CANVAS_HEIGHT);
      iceGradient.addColorStop(0, '#F0FBFF');  
      iceGradient.addColorStop(0.25, '#CDEFFD');
      iceGradient.addColorStop(0.6, '#8FD3F4');
      iceGradient.addColorStop(1, '#4FC3F7');   
      ctx.fillStyle = iceGradient;
      ctx.fillRect(0, groundY, CANVAS_WIDTH, 80);

      // Top glossy edge highlight
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(0, groundY, CANVAS_WIDTH, 4);

      

      // Ice shine streaks
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 2;
        const x = (CANVAS_WIDTH / 6) * i + 40;
        ctx.moveTo(x, groundY + 10);
        ctx.lineTo(x + 60, groundY + 40);
        ctx.stroke();
      }

      // Subtle cracks
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1.5;

      for (let i = 0; i < 8; i++) {
        const startX = Math.random() * CANVAS_WIDTH;
        const startY = groundY + Math.random() * 40 + 10;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + Math.random() * 40 - 20, startY + Math.random() * 20);
        ctx.stroke();
      }

      // Frost texture overlay
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let i = 0; i < 150; i++) {
        ctx.fillRect(
          Math.random() * CANVAS_WIDTH,
          groundY + Math.random() * 80,
          2,
          2
        );
      }
    };

    const checkCollision = (bird: Bird, pipes: Pipe[]) => {
      if (bird.y + BIRD_SIZE / 2 > CANVAS_HEIGHT - 80 || bird.y - BIRD_SIZE / 2 < 0) return true;
      for (const pipe of pipes) {
        if (bird.x + BIRD_SIZE / 2.5 > pipe.x && bird.x - BIRD_SIZE / 2.5 < pipe.x + PIPE_WIDTH) {
          if (bird.y - BIRD_SIZE / 2.5 < pipe.top - 35 || bird.y + BIRD_SIZE / 2.5 > CANVAS_HEIGHT - pipe.bottom)
            return true;
        }
      }
      return false;
    };

    const gameLoop = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      const { bird, pipes } = gameState.current;

      if (!gameStarted || gameOver) {
        drawBackground();
        if (!gameStarted) drawBird(bird, gameState.current.wingFlap);
        gameState.current.wingFlap += 60 * delta;
        animationId = requestAnimationFrame(gameLoop);
        return;
      }

      // Bird physics
      bird.velocity += GRAVITY * 60 * delta;
      bird.y += bird.velocity * 60 * delta;
      bird.rotation = Math.min(Math.max(bird.velocity * 3, -30), 90);
      gameState.current.wingFlap += 60 * delta;

      // Pipes
      gameState.current.pipeTimer += delta;
      if (gameState.current.pipeTimer > 1.6) {
        gameState.current.pipeTimer = 0;
        const minTop = 150;
        const maxTop = CANVAS_HEIGHT - 80 - PIPE_GAP - 100;
        const top = Math.random() * (maxTop - minTop) + minTop;
        const bottom = CANVAS_HEIGHT - 80 - top - PIPE_GAP;
        pipes.push({ x: CANVAS_WIDTH, top, bottom, scored: false });
      }

      // Move pipes


      for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED * 60 * delta;
        if (!pipes[i].scored && pipes[i].x + PIPE_WIDTH < bird.x) {
          pipes[i].scored = true;
          setScore(prev => { const newScore = prev + 1; setHighScore(h => Math.max(h, newScore)); return newScore; });
        }
        if (pipes[i].x + PIPE_WIDTH < 0) pipes.splice(i, 1);
      }

      if (checkCollision(bird, pipes)) setGameOver(true);

      drawBackground();
      pipes.forEach(drawPipe);
      drawBird(bird, gameState.current.wingFlap);

      // Score display
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(score.toString(), CANVAS_WIDTH / 2, 70);
      ctx.shadowBlur = 0;

      animationId = requestAnimationFrame(gameLoop);
    };

    requestAnimationFrame(t => { lastTime = t; animationId = requestAnimationFrame(gameLoop); });
    return () => cancelAnimationFrame(animationId);
  }, [gameStarted, gameOver, score]);

  const handleJump = () => {
    if (!gameStarted) {
      setGameStarted(true); setGameOver(false); setScore(0);
      gameState.current = { bird: { x:100,y:250,velocity:0,rotation:0 }, pipes:[], clouds:gameState.current.clouds, wingFlap:0, pipeTimer:0 };
    } else if (!gameOver) gameState.current.bird.velocity = JUMP_STRENGTH;
  };

  const handleRestart = () => {
    setGameStarted(false); setGameOver(false); setScore(0);
    gameState.current = { bird: { x:100,y:250,velocity:0,rotation:0 }, pipes:[], clouds:gameState.current.clouds, wingFlap:0, pipeTimer:0 };
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if(e.code==='Space'){ e.preventDefault(); handleJump(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameStarted, gameOver]);

  return (
    <div className="w-full h-screen overflow-hidden font-sans select-none">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleJump}
        className="w-full h-full cursor-pointer touch-none"
      />

      {/* Start Screen Overlay */}
      {!gameStarted && !gameOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="bg-white/90 p-12 rounded-[3rem] shadow-2xl text-center max-w-lg border-4 border-white">
            <h1 className="text-7xl font-black bg-gradient-to-b from-blue-500 to-sky-600 bg-clip-text text-transparent mb-4 tracking-tighter italic">
              FLAPPY FROST
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] mb-8">Tap or Space to Fly</p>
            
            <button
              onClick={handleJump}
              className="group relative inline-flex items-center justify-center px-16 py-6 font-black text-white transition-all duration-200 bg-blue-600 rounded-2xl hover:bg-blue-700 active:scale-95 shadow-[0_8px_0_rgb(29,78,216)] active:shadow-none active:translate-y-[4px]"
            >
              <span className="text-3xl uppercase tracking-wider">Start Game</span>
            </button>

            {highScore > 0 && (
              <div className="mt-10 pt-6 border-t border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Best</p>
                <p className="text-3xl font-black text-slate-700">{highScore}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md animate-in zoom-in-95 duration-300">
          <div className="relative bg-white p-1 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div className="bg-slate-50 px-12 py-10 rounded-[2.8rem] text-center border-b-8 border-slate-200">
              <h2 className="text-5xl font-black bg-gradient-to-b from-slate-800 to-slate-500 bg-clip-text text-transparent mb-8 tracking-tight">
                GAME OVER
              </h2>

              <div className="flex flex-col gap-6 mb-10">
                <div className="relative bg-white p-8 rounded-3xl shadow-inner border border-slate-100 min-w-[240px]">
                  {score >= highScore && score > 0 && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-[10px] font-black px-3 py-1 rounded-full shadow-sm uppercase tracking-tighter border-2 border-white">
                      New Best!
                    </span>
                  )}
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Final Score</p>
                  <p className="text-7xl font-black text-blue-600 drop-shadow-sm">{score}</p>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <span className="h-[2px] w-8 bg-slate-200"></span>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                    Best: <span className="text-slate-800">{highScore}</span>
                  </p>
                  <span className="h-[2px] w-8 bg-slate-200"></span>
                </div>
              </div>

              <button
                onClick={handleRestart}
                className="group relative inline-flex items-center justify-center px-12 py-5 font-black text-white transition-all duration-200 bg-blue-600 rounded-2xl hover:bg-blue-700 active:scale-95 shadow-[0_8px_0_rgb(29,78,216)] active:shadow-none active:translate-y-[4px]"
              >
                <span className="text-2xl uppercase tracking-wider">Play Again</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}