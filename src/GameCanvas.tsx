// src/GameCanvas.tsx
import React, { useRef, useEffect, useState } from 'react';

interface Player {
  x: number;
  y: number;
  speed: number;
  radius: number;
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  armorRegenCooldown: number;
  armorRegenRate: number;
  lastDamageTime: number;
  experience: number;
  level: number;
  weapons: Weapon[];
  abilities: any[];
  color: string;
}

interface Weapon {
  name: string;
  type: string;
  damage: number;
  fireRate: number;
  color: string;
  angle: number; // Angle in radians for orbiting
}

interface Enemy {
  x: number;
  y: number;
  speed: number;
  radius: number;
  health: number;
  maxHealth: number;
  damage: number;
  experienceValue: number;
  color: string;
  behavior: (enemy: Enemy, deltaTime: number) => void;
  type: string;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  type: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeOptions, setUpgradeOptions] = useState<string[]>([]);

  let canvasWidth = window.innerWidth;
  let canvasHeight = window.innerHeight;

  // Game state variables
  const player: Player = {
    x: canvasWidth / 2,
    y: canvasHeight / 2,
    speed: 4,
    radius: 30,
    health: 100,
    maxHealth: 100,
    armor: 50,
    maxArmor: 50,
    armorRegenCooldown: 3000, // in ms
    armorRegenRate: 10, // per second
    lastDamageTime: 0,
    experience: 0,
    level: 1,
    weapons: [],
    abilities: [],
    color: 'blue',
  };

  const keys: { [key: string]: boolean } = {};
  const enemies: Enemy[] = [];
  const projectiles: Projectile[] = [];
  const particles: Particle[] = [];
  let lastTime = 0;
  let attackCooldown = 0;
  let enemySpawnCooldown = 0;
  let gameTime = 0;

  useEffect(() => {
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

    // Initialize default weapon
    player.weapons.push({
      name: 'Basic Gun',
      type: 'gun',
      damage: 20, // Initial damage
      fireRate: 500,
      color: 'yellow',
      angle: 0,
    });

    // Set initial weapon angles
    updateWeaponAngles();

    let animationFrameId: number;

    const gameLoop = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      if (!showUpgradeModal) {
        gameTime += deltaTime;

        updateGame(deltaTime);
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
  }, [showUpgradeModal]);

  // Update game state
  const updateGame = (deltaTime: number) => {
    handlePlayerMovement();
    updateWeapons(deltaTime);
    updateProjectiles(deltaTime);
    updateEnemies(deltaTime);
    updateParticles(deltaTime);
    handleCollisions(deltaTime);
    handleLevelUp();
    handleEnemySpawning(deltaTime);
    handleAutoAttack(deltaTime);
    regenerateArmor(deltaTime);
  };

  // Render game
  const renderGame = (ctx: CanvasRenderingContext2D | null) => {
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw background
    drawBackground(ctx);

    // Draw player
    drawPlayer(ctx);

    // Draw weapons orbiting player
    drawWeapons(ctx);

    // Draw projectiles
    drawProjectiles(ctx);

    // Draw enemies
    drawEnemies(ctx);

    // Draw particles
    drawParticles(ctx);

    // Draw UI
    drawUI(ctx);
  };

  // Handle player movement
  const handlePlayerMovement = () => {
    if (keys['ArrowUp'] || keys['KeyW']) player.y -= player.speed;
    if (keys['ArrowDown'] || keys['KeyS']) player.y += player.speed;
    if (keys['ArrowLeft'] || keys['KeyA']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['KeyD']) player.x += player.speed;

    // Keep player within canvas bounds
    player.x = Math.max(player.radius, Math.min(canvasWidth - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvasHeight - player.radius, player.y));
  };

  // Update weapons (for orbiting)
  const updateWeapons = (deltaTime: number) => {
    const angularSpeed = 0.002; // radians per millisecond
    player.weapons.forEach((weapon) => {
      weapon.angle += angularSpeed * deltaTime;
    });
  };

  // Update weapon angles to be evenly spaced
  const updateWeaponAngles = () => {
    const weaponCount = player.weapons.length;
    player.weapons.forEach((weapon, index) => {
      weapon.angle = (index / weaponCount) * Math.PI * 2 + 2;
    });
  };

  // Handle auto-attack
  const handleAutoAttack = (deltaTime: number) => {
    attackCooldown -= deltaTime;
    if (attackCooldown <= 0) {
      const primaryWeapon = player.weapons[0];
      attackCooldown = primaryWeapon.fireRate; // Use weapon's fire rate

      fireWeapons();
    }
  };

  // Fire weapons
  const fireWeapons = () => {
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

        // Fire projectile from weapon's position
        const speed = 8;
        projectiles.push({
          x: weaponX,
          y: weaponY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 5,
          damage: weapon.damage,
          type: weapon.type,
          color: weapon.color,
        });
      }
    });
  };

  // Update projectiles
  const updateProjectiles = (deltaTime: number) => {
    projectiles.forEach((proj, index) => {
      proj.x += proj.vx;
      proj.y += proj.vy;

      // Remove projectiles that are off-screen
      if (
        proj.x < 0 ||
        proj.x > canvasWidth ||
        proj.y < 0 ||
        proj.y > canvasHeight
      ) {
        projectiles.splice(index, 1);
      }
    });
  };

  // Update enemies
  const updateEnemies = (deltaTime: number) => {
    enemies.forEach((enemy) => {
      enemy.behavior(enemy, deltaTime);
    });
  };

  // Enemy behaviors
  const enemyBehaviors = {
    common: (enemy: Enemy, deltaTime: number) => {
      // Move towards the player
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const distance = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      enemy.x += Math.cos(angle) * enemy.speed;
      enemy.y += Math.sin(angle) * enemy.speed;
    },
    elite: (enemy: Enemy, deltaTime: number) => {
      // Similar to common but stronger and maybe ranged attacks
      enemyBehaviors.common(enemy, deltaTime);
      // Additional behavior can be added here
    },
    boss: (enemy: Enemy, deltaTime: number) => {
      // Complex patterns
      enemyBehaviors.common(enemy, deltaTime);
      // Additional boss-specific behaviors
    },
  };

  // Update particles
  const updateParticles = (deltaTime: number) => {
    particles.forEach((particle, index) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= deltaTime;
      if (particle.life <= 0) {
        particles.splice(index, 1);
      }
    });
  };

  // Handle collisions
  const handleCollisions = (deltaTime: number) => {
    // Projectile-enemy collisions
    projectiles.forEach((proj, pIndex) => {
      enemies.forEach((enemy, eIndex) => {
        const dx = proj.x - enemy.x;
        const dy = proj.y - enemy.y;
        const distance = Math.hypot(dx, dy);

        if (distance < proj.radius + enemy.radius) {
          // Collision detected
          enemy.health -= proj.damage;
          createParticles(enemy.x, enemy.y, 'orange');
          projectiles.splice(pIndex, 1);

          if (enemy.health <= 0) {
            enemies.splice(eIndex, 1);
            player.experience += enemy.experienceValue;
          }
        }
      });
    });

    // Enemy-player collisions
    enemies.forEach((enemy) => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.hypot(dx, dy);

      if (distance < enemy.radius + player.radius) {
        // Collision detected
        const damage = enemy.damage * (deltaTime / 1000); // Damage over time
        applyDamageToPlayer(damage);
        createParticles(player.x, player.y, 'red');
      }
    });
  };

  // Apply damage to player
  const applyDamageToPlayer = (damage: number) => {
    player.lastDamageTime = gameTime;
    if (player.armor > 0) {
      player.armor -= damage;
      if (player.armor < 0) {
        player.health += player.armor; // Subtract the remaining damage from health
        player.armor = 0;
      }
    } else {
      player.health -= damage;
    }

    if (player.health <= 0) {
      alert('Game Over!');
      // Reset game or handle game over state
      player.health = player.maxHealth;
      player.armor = player.maxArmor;
      player.experience = 0;
      player.level = 1;
      enemies.length = 0;
      projectiles.length = 0;
      player.weapons = [];
      // Re-initialize default weapon
      player.weapons.push({
        name: 'Basic Gun',
        type: 'gun',
        damage: 20,
        fireRate: 500,
        color: 'yellow',
        angle: 0,
      });
      updateWeaponAngles();
    }
  };

  // Handle leveling up
  const handleLevelUp = () => {
    const experienceToLevelUp = player.level * 100;
    if (player.experience >= experienceToLevelUp) {
      player.level += 1;
      player.experience -= experienceToLevelUp;
      // Show upgrade options
      generateUpgradeOptions();
      setShowUpgradeModal(true);
    }
  };

  // Generate upgrade options
  const generateUpgradeOptions = () => {
    const options = ['Increase Damage', 'Increase Fire Rate', 'Increase Speed', 'Add New Weapon'];
    // Randomly select three options
    const shuffled = options.sort(() => 0.5 - Math.random());
    setUpgradeOptions(shuffled.slice(0, 3));
  };

  // Apply upgrade
  const applyUpgrade = (choice: string) => {
    switch (choice) {
      case 'Increase Damage':
        player.weapons.forEach((weapon) => {
          weapon.damage += 5;
        });
        break;
      case 'Increase Fire Rate':
        player.weapons.forEach((weapon) => (weapon.fireRate *= 0.9));
        break;
      case 'Increase Armor':
        player.maxArmor += 20;
        player.armor = player.maxArmor;
        break;
      case 'Increase Speed':
        player.speed += 0.5;
        break;
      case 'Add New Weapon':
        addNewWeapon();
        break;
      default:
        break;
    }
    setShowUpgradeModal(false);
  };

  // Add new weapon
  const addNewWeapon = () => {
    const weaponTypes = [
      {
        name: 'Railgun',
        type: 'railgun',
        damage: 30,
        fireRate: 800,
        color: 'cyan',
      },
      {
        name: 'Missile Launcher',
        type: 'missile',
        damage: 25,
        fireRate: 1000,
        color: 'orange',
      },
      {
        name: 'Shotgun',
        type: 'shotgun',
        damage: 15,
        fireRate: 600,
        color: 'purple',
      },
    ];

    // Randomly select a weapon
    const newWeapon = {
      ...weaponTypes[Math.floor(Math.random() * weaponTypes.length)],
      angle: 0, // Will be set later
    };
    player.weapons.push(newWeapon);

    // Recalculate weapon angles to be evenly spaced
    updateWeaponAngles();
  };

  // Handle enemy spawning
  const handleEnemySpawning = (deltaTime: number) => {
    enemySpawnCooldown -= deltaTime;
    if (enemySpawnCooldown <= 0) {
      enemySpawnCooldown = 2000; // Spawn an enemy every 2 seconds

      // Decide enemy type based on game time or player level
      let enemyType = 'common';
      if (player.level >= 5) {
        enemyType = 'elite';
      }
      if (player.level >= 10) {
        enemyType = 'boss';
      }

      spawnEnemy(enemyType);
    }
  };

  // Spawn enemy
  const spawnEnemy = (type: string) => {
    let x, y;
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
      case 0: // Top
        x = Math.random() * canvasWidth;
        y = 0;
        break;
      case 1: // Right
        x = canvasWidth;
        y = Math.random() * canvasHeight;
        break;
      case 2: // Bottom
        x = Math.random() * canvasWidth;
        y = canvasHeight;
        break;
      case 3: // Left
        x = 0;
        y = Math.random() * canvasHeight;
        break;
    }

    const enemyStats: { [key: string]: Partial<Enemy> } = {
      common: {
        health: 50 + player.level * 5,
        speed: 1 + Math.random() * 0.5 + player.level * 0.1,
        damage: 10,
        radius: 20,
        experienceValue: 20,
        color: 'green',
        behavior: enemyBehaviors.common,
      },
      elite: {
        health: 150 + player.level * 10,
        speed: 1 + Math.random() * 0.5 + player.level * 0.1,
        damage: 20,
        radius: 30,
        experienceValue: 50,
        color: 'purple',
        behavior: enemyBehaviors.elite,
      },
      boss: {
        health: 500 + player.level * 20,
        speed: 0.5 + player.level * 0.05,
        damage: 30,
        radius: 50,
        experienceValue: 200,
        color: 'red',
        behavior: enemyBehaviors.boss,
      },
    };

    const enemy: Enemy = {
      x,
      y,
      ...enemyStats[type],
      type,
      maxHealth: enemyStats[type].health!,
      behavior: enemyStats[type].behavior!,
    } as Enemy;

    enemies.push(enemy);
  };

  // Regenerate armor
  const regenerateArmor = (deltaTime: number) => {
    if (gameTime - player.lastDamageTime >= player.armorRegenCooldown) {
      player.armor += (player.armorRegenRate * deltaTime) / 1000;
      if (player.armor > player.maxArmor) {
        player.armor = player.maxArmor;
      }
    }
  };

  // Create particles
  const createParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 10; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 500 + Math.random() * 500,
        color,
      });
    }
  };

  // Draw background
  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  };

  // Draw player
  const drawPlayer = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(0, -player.radius);
    ctx.lineTo(player.radius / 2, player.radius);
    ctx.lineTo(-player.radius / 2, player.radius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    drawHealthBar(ctx, player);
  };

  // Draw weapons orbiting player
  const drawWeapons = (ctx: CanvasRenderingContext2D) => {
    player.weapons.forEach((weapon) => {
      const orbitRadius = player.radius + 20;
      const weaponX = player.x + Math.cos(weapon.angle) * orbitRadius;
      const weaponY = player.y + Math.sin(weapon.angle) * orbitRadius;

      ctx.fillStyle = weapon.color;
      ctx.beginPath();
      ctx.arc(weaponX, weaponY, 10, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // Draw enemies
  const drawEnemies = (ctx: CanvasRenderingContext2D) => {
    enemies.forEach((enemy) => {
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();

      drawHealthBar(ctx, enemy);
    });
  };

  // Draw projectiles
  const drawProjectiles = (ctx: CanvasRenderingContext2D) => {
    projectiles.forEach((proj) => {
      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // Draw particles
  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    particles.forEach((particle) => {
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, 2, 2);
    });
  };

  // Draw health bar
  const drawHealthBar = (ctx: CanvasRenderingContext2D, entity: any) => {
    const barWidth = entity.radius * 2;
    const barHeight = 5;

    // Health Bar
    ctx.fillStyle = 'red';
    ctx.fillRect(
      entity.x - entity.radius,
      entity.y - entity.radius - 20,
      barWidth,
      barHeight
    );
    ctx.fillStyle = 'green';
    ctx.fillRect(
      entity.x - entity.radius,
      entity.y - entity.radius - 20,
      (entity.health / entity.maxHealth) * barWidth,
      barHeight
    );

    // Armor Bar (if entity is player)
    if (entity === player) {
      ctx.fillStyle = 'gray';
      ctx.fillRect(
        entity.x - entity.radius,
        entity.y - entity.radius - 30,
        barWidth,
        barHeight
      );
      ctx.fillStyle = 'blue';
      ctx.fillRect(
        entity.x - entity.radius,
        entity.y - entity.radius - 30,
        (entity.armor / entity.maxArmor) * barWidth,
        barHeight
      );
    }
  };

  // Draw UI
  const drawUI = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Health: ${Math.floor(player.health)}/${player.maxHealth}`, 10, 30);
    ctx.fillText(`Armor: ${Math.floor(player.armor)}/${player.maxArmor}`, 10, 60);
    ctx.fillText(`Level: ${player.level}`, 10, 90);
    ctx.fillText(`Experience: ${player.experience}/${player.level * 100}`, 10, 120);
    ctx.fillText(`Speed: ${player.speed.toFixed(1)}`, 10, 150);
    ctx.fillText(`Damage: ${player.weapons[0].damage}`, 10, 180);
  };

  // Handle upgrade selection
  const handleUpgradeSelection = (choice: string) => {
    applyUpgrade(choice);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', cursor: 'none' }}
        id="gameCanvas"
      />
      {showUpgradeModal && (
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '30%',
            width: '40%',
            height: '40%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            border: '2px solid white',
            borderRadius: '10px',
            textAlign: 'center',
            padding: '20px',
          }}
        >
          <h2>Level Up!</h2>
          <p>Choose an upgrade:</p>
          {upgradeOptions.map((option) => (
            <button
              key={option}
              onClick={() => handleUpgradeSelection(option)}
              style={{
                display: 'block',
                width: '80%',
                margin: '10px auto',
                padding: '10px',
                fontSize: '16px',
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default GameCanvas;
