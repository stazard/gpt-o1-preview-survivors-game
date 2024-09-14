// src/components/GameCanvas.tsx
import React, { useRef, useEffect, useState } from 'react';
import StartScreen from './StartScreen';
import GameOverScreen from './GameOverScreen';
import UpgradeModal from './UpgradeModal';
import {
  Player,
  Enemy,
  Projectile,
  Particle,
  ExperiencePill,
  Explosion,
  Weapon,
} from '../types';
import {
  handlePlayerMovement,
  updateWeapons,
  updateProjectiles,
  updateEnemies,
  updateParticles,
  updateExperiencePills,
  updateExplosions,
  handleCollisions,
  handleLevelUp,
  handleEnemySpawning,
  handleAutoAttack,
  regenerateArmor,
  updateWeaponAngles,
  applyUpgrade,
  fireStandardProjectile,
  fireRailgun,
  fireMissile,
  fireShotgun,
} from '../gameLogic';
import {
  drawBackground,
  drawPlayer,
  drawWeapons,
  drawProjectiles,
  drawEnemies,
  drawParticles,
  drawExplosions,
  drawExperiencePills,
  drawUI,
} from '../rendering';
import { characterOptions } from '../data/characters';

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeOptions, setUpgradeOptions] = useState<string[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [showGameOverScreen, setShowGameOverScreen] = useState(false);
  const [gameStatistics, setGameStatistics] = useState({
    enemiesKilled: 0,
    timeSurvived: 0,
  });

  let canvasWidth = window.innerWidth;
  let canvasHeight = window.innerHeight;

  const keys: { [key: string]: boolean } = {};
  const enemies: Enemy[] = [];
  const projectiles: Projectile[] = [];
  const particles: Particle[] = [];
  const experiencePills: ExperiencePill[] = [];
  const explosions: Explosion[] = [];
  const attackCooldownRef = useRef<number>(0);
  const enemySpawnCooldownRef = useRef<number>(0);
  const enemySpawnRateRef = useRef<number>(2000);
  let lastTime = 0;
  let gameTime = 0;
  let totalGameTime = 0;

  useEffect(() => {
    if (showStartScreen || !player || showGameOverScreen) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    // Set canvas dimensions
    const setCanvasSize = () => {
      if (canvas) {
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
      }
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Handle keyboard input
    const handleKeyDown = (e: KeyboardEvent) => (keys[e.code] = true);
    const handleKeyUp = (e: KeyboardEvent) => (keys[e.code] = false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationFrameId: number;

    const gameLoop = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      if (!showUpgradeModal) {
        gameTime += deltaTime;
        totalGameTime += deltaTime;

        // Update game state
        handlePlayerMovement(player, keys, canvasWidth, canvasHeight);
        updateWeapons(player, deltaTime);
        updateProjectiles(projectiles, deltaTime, canvasWidth, canvasHeight);
        updateEnemies(enemies, player, deltaTime, canvasWidth, canvasHeight);
        updateParticles(particles, deltaTime);
        updateExperiencePills(experiencePills, deltaTime);
        updateExplosions(explosions, deltaTime);
        handleCollisions(
          player,
          enemies,
          projectiles,
          particles,
          experiencePills,
          explosions,
          gameTime,
          setShowGameOverScreen,
          setGameStatistics,
          totalGameTime
        );
        handleLevelUp(player, setShowUpgradeModal, generateUpgradeOptions, enemies);
        handleEnemySpawning(
          enemies,
          player,
          enemySpawnCooldownRef,
          enemySpawnRateRef,
          deltaTime,
          canvasWidth,
          canvasHeight
        );
        handleAutoAttack(player, attackCooldownRef, deltaTime, fireWeapons);
        regenerateArmor(player, deltaTime, gameTime);

        // Render game
        renderGame(context as any);
      } else {
        // Game is paused, do not update gameTime
        // Also, reset lastTime to prevent deltaTime from accumulating
        lastTime = timestamp;
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [showStartScreen, showUpgradeModal, player, showGameOverScreen]);

  // Handle start game
  const handleStartGame = (characterIndex: number) => {
    const selectedChar = { ...characterOptions[characterIndex] };
    selectedChar.x = canvasWidth / 2;
    selectedChar.y = canvasHeight / 2;

    // Initialize weapon based on character
    let initialWeapon: Weapon = {
      name: 'Basic Gun',
      type: 'gun',
      damage: 20,
      fireRate: 500,
      color: 'yellow',
      angle: 0,
    };
    if (selectedChar.shape === 'rectangle') {
      initialWeapon = {
        name: 'Cannon',
        type: 'cannon',
        damage: 25,
        fireRate: 700,
        color: 'orange',
        angle: 0,
      };
    } else if (selectedChar.shape === 'triangle') {
      initialWeapon = {
        name: 'Laser',
        type: 'laser',
        damage: 15,
        fireRate: 300,
        color: 'lime',
        angle: 0,
      };
    }
    selectedChar.weapons = [initialWeapon];
    selectedChar.initialSpeed = selectedChar.speed; // Store initial speed
    setPlayer(selectedChar);
    updateWeaponAngles(selectedChar);
    setShowStartScreen(false);
    setShowGameOverScreen(false);
    // Reset game variables
    gameTime = 0;
    totalGameTime = 0;
    enemies.length = 0;
    projectiles.length = 0;
    experiencePills.length = 0;
    explosions.length = 0;
    setGameStatistics({ enemiesKilled: 0, timeSurvived: 0 });
  };

  // Handle restart game from Game Over screen
  const handleRestartGame = () => {
    setShowGameOverScreen(false);
    setShowStartScreen(true);
    setPlayer(null);
  };

  // Fire weapons
  const fireWeapons = () => {
    if (!player) return;

    player.weapons.forEach((weapon) => {
      // Calculate weapon position
      const orbitRadius = player.radius + 20;
      const weaponX = player.x + Math.cos(weapon.angle) * orbitRadius;
      const weaponY = player.y + Math.sin(weapon.angle) * orbitRadius;

      // Find the nearest enemy to the weapon
      let nearestEnemy!: Enemy;
      let minDistance = Infinity;
      enemies.forEach((enemy) => {
        const dx = enemy.x - weaponX;
        const dy = enemy.y - weaponY;
        const distance = Math.hypot(dx, dy);
        if (distance < minDistance) {
          minDistance = distance;
          nearestEnemy = enemy;
        }
      });

      if (nearestEnemy) {
        // Calculate angle towards the enemy
        const angle = Math.atan2(nearestEnemy.y - weaponY, nearestEnemy.x - weaponX);

        // Fire projectile from weapon's position based on weapon type
        switch (weapon.type) {
          case 'gun':
          case 'cannon':
          case 'laser':
            fireStandardProjectile(weapon, weaponX, weaponY, angle, projectiles);
            break;
          case 'railgun':
            fireRailgun(weapon, weaponX, weaponY, angle, projectiles);
            break;
          case 'missile':
            fireMissile(weapon, weaponX, weaponY, angle, projectiles);
            break;
          case 'shotgun':
            fireShotgun(weapon, weaponX, weaponY, angle, projectiles);
            break;
          default:
            break;
        }
      }
    });
  };

  // Generate upgrade options
  const generateUpgradeOptions = () => {
    const options = ['Increase Damage', 'Increase Fire Rate', 'Increase Speed'];
    // Add a specific new weapon option
    const weaponTypes = [
      'Add Railgun',
      'Add Missile Launcher',
      'Add Shotgun',
    ];
    const randomWeaponOption =
      weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
    options.push(randomWeaponOption);

    // Randomly select three options
    const shuffled = options.sort(() => 0.5 - Math.random());
    setUpgradeOptions(shuffled.slice(0, 3));
  };

  // Handle upgrade selection
  const handleUpgradeSelection = (choice: string) => {
    applyUpgrade(choice, player!, updateWeaponAngles);
    setShowUpgradeModal(false);
    // Clear enemies after choosing an upgrade
    enemies.length = 0;
  };

  // Render game
  const renderGame = (ctx: CanvasRenderingContext2D | null) => {
    if (!ctx || !player) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw background
    drawBackground(ctx, canvasWidth, canvasHeight);

    // Draw player
    drawPlayer(ctx, player);

    // Draw weapons orbiting player
    drawWeapons(ctx, player);

    // Draw projectiles
    drawProjectiles(ctx, projectiles, canvasWidth);

    // Draw enemies
    drawEnemies(ctx, enemies);

    // Draw particles
    drawParticles(ctx, particles);

    // Draw explosions
    drawExplosions(ctx, explosions);

    // Draw experience pills
    drawExperiencePills(ctx, experiencePills);

    // Draw UI
    drawUI(ctx, player);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          display: showStartScreen || showGameOverScreen ? 'none' : 'block',
          cursor: 'none',
        }}
        id="gameCanvas"
      />
      {showStartScreen && (
        <StartScreen onStartGame={handleStartGame} />
      )}
      {showGameOverScreen && (
        <GameOverScreen
          gameStatistics={gameStatistics}
          onRestartGame={handleRestartGame}
        />
      )}
      {showUpgradeModal && (
        <UpgradeModal
          upgradeOptions={upgradeOptions}
          onUpgradeSelection={handleUpgradeSelection}
        />
      )}
    </>
  );
};

export default GameCanvas;
