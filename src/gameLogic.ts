// src/gameLogic.ts
import {
  Player,
  Enemy,
  Projectile,
  Particle,
  ExperiencePill,
  Explosion,
  Weapon,
} from './types';
import {
  createParticles,
  createExperiencePill,
  createExplosion,
} from './utilities';
import { enemiesData } from './data/enemies';

// Handle player movement
export const handlePlayerMovement = (
  player: Player,
  keys: { [key: string]: boolean },
  canvasWidth: number,
  canvasHeight: number
) => {
  if (keys['ArrowUp'] || keys['KeyW']) player.y -= player.speed;
  if (keys['ArrowDown'] || keys['KeyS']) player.y += player.speed;
  if (keys['ArrowLeft'] || keys['KeyA']) player.x -= player.speed;
  if (keys['ArrowRight'] || keys['KeyD']) player.x += player.speed;

  // Keep player within canvas bounds
  player.x = Math.max(player.radius, Math.min(canvasWidth - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(canvasHeight - player.radius, player.y));
};

// Update weapons (for orbiting)
export const updateWeapons = (player: Player, deltaTime: number) => {
  const angularSpeed = 0.002; // radians per millisecond
  player.weapons.forEach((weapon) => {
    weapon.angle += angularSpeed * deltaTime;
  });
};

// Update weapon angles to be evenly spaced
export const updateWeaponAngles = (player: Player) => {
  const weaponCount = player.weapons.length;
  player.weapons.forEach((weapon, index) => {
    weapon.angle = (index / weaponCount) * Math.PI * 2;
  });
};

// Handle auto-attack
export const handleAutoAttack = (
  player: Player,
  attackCooldownRef: { current: number },
  deltaTime: number,
  fireWeapons: () => void
) => {
  attackCooldownRef.current -= deltaTime;
  if (attackCooldownRef.current <= 0) {
    const primaryWeapon = player.weapons[0];
    attackCooldownRef.current = primaryWeapon.fireRate; // Use weapon's fire rate

    fireWeapons();
  }
};

// Update projectiles
export const updateProjectiles = (
  projectiles: Projectile[],
  deltaTime: number,
  canvasWidth: number,
  canvasHeight: number
) => {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];
    if (proj.type === 'railgun') {
      proj.life! -= deltaTime;
      if (proj.life! <= 0) {
        projectiles.splice(i, 1);
      }
    } else {
      proj.x += proj.vx;
      proj.y += proj.vy;

      // Remove projectiles that are off-screen
      if (
        proj.x < 0 ||
        proj.x > canvasWidth ||
        proj.y < 0 ||
        proj.y > canvasHeight
      ) {
        projectiles.splice(i, 1);
      }
    }
  }
};

// Update enemies
export const updateEnemies = (
  enemies: Enemy[],
  player: Player,
  deltaTime: number,
  canvasWidth: number,
  canvasHeight: number
) => {
  enemies.forEach((enemy, index) => {
    // Enemy movement towards player
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const angleToPlayer = Math.atan2(dy, dx);

    enemy.vx = Math.cos(angleToPlayer) * enemy.speed;
    enemy.vy = Math.sin(angleToPlayer) * enemy.speed;

    // Collision avoidance with other enemies
    enemies.forEach((otherEnemy, otherIndex) => {
      if (index !== otherIndex) {
        const dx = enemy.x - otherEnemy.x;
        const dy = enemy.y - otherEnemy.y;
        const distance = Math.hypot(dx, dy);
        if (distance < enemy.radius + otherEnemy.radius) {
          // Simple collision resolution by moving enemies apart
          const overlap = enemy.radius + otherEnemy.radius - distance;
          const angle = Math.atan2(dy, dx);
          enemy.vx += Math.cos(angle) * overlap * 0.05;
          enemy.vy += Math.sin(angle) * overlap * 0.05;
        }
      }
    });

    enemy.x += enemy.vx;
    enemy.y += enemy.vy;

    // Keep enemies within canvas bounds
    enemy.x = Math.max(enemy.radius, Math.min(canvasWidth - enemy.radius, enemy.x));
    enemy.y = Math.max(enemy.radius, Math.min(canvasHeight - enemy.radius, enemy.y));
  });
};

// Update particles
export const updateParticles = (particles: Particle[], deltaTime: number) => {
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life -= deltaTime;
    if (particle.life <= 0) {
      particles.splice(i, 1);
    }
  }
};

// Update experience pills
export const updateExperiencePills = (experiencePills: ExperiencePill[], deltaTime: number) => {
  // Experience pills are stationary; add any desired effects here
};

// Update explosions
export const updateExplosions = (explosions: Explosion[], deltaTime: number) => {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const explosion = explosions[i];
    explosion.radius += (explosion.maxRadius / explosion.life) * deltaTime;
    explosion.life -= deltaTime;
    if (explosion.life <= 0) {
      explosions.splice(i, 1);
    }
  }
};

// Handle collisions
export const handleCollisions = (
  player: Player,
  enemies: Enemy[],
  projectiles: Projectile[],
  particles: Particle[],
  experiencePills: ExperiencePill[],
  explosions: Explosion[],
  gameTime: number,
  setShowGameOverScreen: React.Dispatch<React.SetStateAction<boolean>>,
  setGameStatistics: React.Dispatch<
    React.SetStateAction<{
      enemiesKilled: number;
      timeSurvived: number;
    }>
  >,
  totalGameTime: number
) => {
  // Projectile-enemy collisions
  for (let pIndex = projectiles.length - 1; pIndex >= 0; pIndex--) {
    const proj = projectiles[pIndex];
    if (proj.type === 'railgun') {
      // Railgun damages all enemies along its path
      for (let eIndex = enemies.length - 1; eIndex >= 0; eIndex--) {
        const enemy = enemies[eIndex];
        const dx = enemy.x - proj.x;
        const dy = enemy.y - proj.y;
        const distance = Math.abs(
          Math.sin(proj.angle! - Math.atan2(dy, dx)) * Math.hypot(dx, dy)
        );
        if (distance < enemy.radius + proj.radius) {
          enemy.health -= proj.damage * 0.01; // Adjust damage over time
          createParticles(enemy.x, enemy.y, 'cyan', particles);
          if (enemy.health <= 0) {
            createExperiencePill(
              enemy.x,
              enemy.y,
              enemy.experienceValue,
              experiencePills
            );
            enemies.splice(eIndex, 1);
            player.enemiesKilled += 1;
          }
        }
      }
    } else {
      for (let eIndex = enemies.length - 1; eIndex >= 0; eIndex--) {
        const enemy = enemies[eIndex];
        const dx = proj.x - enemy.x;
        const dy = proj.y - enemy.y;
        const distance = Math.hypot(dx, dy);

        if (distance < proj.radius + enemy.radius) {
          // Collision detected
          if (proj.type === 'missile') {
            // Create explosion
            createExplosion(
              proj.x,
              proj.y,
              proj.damage,
              explosions,
              enemies,
              player,
              particles,
              experiencePills
            );
            createParticles(proj.x, proj.y, 'orange', particles);
          } else {
            enemy.health -= proj.damage;
            createParticles(enemy.x, enemy.y, 'orange', particles);
            if (enemy.health <= 0) {
              createExperiencePill(
                enemy.x,
                enemy.y,
                enemy.experienceValue,
                experiencePills
              );
              enemies.splice(eIndex, 1);
              player.enemiesKilled += 1;
            }
          }
          projectiles.splice(pIndex, 1);
          break;
        }
      }
    }
  }

  // Enemy-player collisions
  enemies.forEach((enemy) => {
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance = Math.hypot(dx, dy);

    if (distance < enemy.radius + player.radius) {
      // Collision detected
      const damage = enemy.damage;
      applyDamageToPlayer(
        player,
        damage,
        gameTime,
        setShowGameOverScreen,
        setGameStatistics,
        totalGameTime
      );
      createParticles(player.x, player.y, 'red', particles);
    }
  });

  // Player-experience pill collisions
  for (let index = experiencePills.length - 1; index >= 0; index--) {
    const pill = experiencePills[index];
    const dx = pill.x - player.x;
    const dy = pill.y - player.y;
    const distance = Math.hypot(dx, dy);

    if (distance < pill.radius + player.radius) {
      // Player collects the experience pill
      player.experience += pill.value;
      experiencePills.splice(index, 1);
    }
  }
};

const applyDamageToPlayer = (
  player: Player,
  damage: number,
  gameTime: number,
  setShowGameOverScreen: React.Dispatch<React.SetStateAction<boolean>>,
  setGameStatistics: React.Dispatch<
    React.SetStateAction<{
      enemiesKilled: number;
      timeSurvived: number;
    }>
  >,
  totalGameTime: number
) => {
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
    // Game Over
    setShowGameOverScreen(true);
    setGameStatistics({
      enemiesKilled: player.enemiesKilled,
      timeSurvived: totalGameTime,
    });
  }
};

// Handle leveling up
export const handleLevelUp = (
  player: Player,
  setShowUpgradeModal: React.Dispatch<React.SetStateAction<boolean>>,
  generateUpgradeOptions: () => void,
  enemies: Enemy[]
) => {
  const experienceToLevelUp = 100 + (player.level - 1) * 50;
  if (player.experience >= experienceToLevelUp) {
    player.level += 1;
    player.experience -= experienceToLevelUp;
    // Show upgrade options
    generateUpgradeOptions();
    setShowUpgradeModal(true);
    // Clear enemies
    enemies.length = 0;
  }
};

// Regenerate armor
export const regenerateArmor = (player: Player, deltaTime: number, gameTime: number) => {
  if (gameTime - player.lastDamageTime >= player.armorRegenCooldown) {
    player.armor += (player.armorRegenRate * deltaTime) / 1000;
    if (player.armor > player.maxArmor) {
      player.armor = player.maxArmor;
    }
  }
};

// Handle enemy spawning
export const handleEnemySpawning = (
  enemies: Enemy[],
  player: Player,
  enemySpawnCooldownRef: { current: number },
  enemySpawnRateRef: { current: number },
  deltaTime: number,
  canvasWidth: number,
  canvasHeight: number
) => {
  enemySpawnCooldownRef.current -= deltaTime;
  if (enemySpawnCooldownRef.current <= 0) {
    // Decrease spawn rate over time
    enemySpawnRateRef.current = Math.max(500, enemySpawnRateRef.current - 10); // Minimum spawn rate is 500 ms
    enemySpawnCooldownRef.current = enemySpawnRateRef.current;

    // Decide enemy type based on player level
    let enemyType = 'common';
    if (player.level >= 5) {
      enemyType = 'elite';
    }
    if (player.level >= 10) {
      enemyType = 'boss';
    }

    // Spawn 3-5 enemies at a time
    const enemiesToSpawn = Math.floor(Math.random() * 3) + 3;

    // Limit total enemies to 40
    if (enemies.length < 40) {
      for (let i = 0; i < enemiesToSpawn; i++) {
        if (enemies.length < 40) {
          spawnEnemy(enemyType, enemies, player, canvasWidth, canvasHeight);
        }
      }
    }
  }
};

// Spawn enemy
export const spawnEnemy = (
  type: string,
  enemies: Enemy[],
  player: Player,
  canvasWidth: number,
  canvasHeight: number
) => {
  let x!: number, y!: number;

  // Spawn enemies at the edges of the canvas
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

  // Adjust enemy speed relative to player's initial speed
  const speedFactor = Math.random() * 0.2 + 0.5; // Random between 0.5 and 0.7
  const enemyStats = enemiesData[type];

  const enemy: Enemy = {
    x,
    y,
    speed: (player.initialSpeed ?? 4) * speedFactor,
    radius: enemyStats.radius,
    health: enemyStats.baseHealth + player.level * enemyStats.healthIncrement,
    maxHealth: enemyStats.baseHealth + player.level * enemyStats.healthIncrement,
    damage: enemyStats.damage,
    experienceValue: enemyStats.experienceValue,
    color: enemyStats.color,
    behavior: enemyStats.behavior,
    type,
    vx: 0,
    vy: 0,
  };

  enemies.push(enemy);
};

// Apply upgrade
export const applyUpgrade = (
  choice: string,
  player: Player,
  updateWeaponAngles: (player: Player) => void
) => {
  switch (choice) {
    case 'Increase Damage':
      player.weapons.forEach((weapon) => {
        weapon.damage += 5;
      });
      break;
    case 'Increase Fire Rate':
      player.weapons.forEach((weapon) => {
        weapon.fireRate *= 0.9; // Increase fire rate by decreasing cooldown
      });
      break;
    case 'Increase Speed':
      player.speed += 0.5;
      break;
    case 'Add Railgun':
    case 'Add Missile Launcher':
    case 'Add Shotgun':
      addNewWeapon(choice, player);
      updateWeaponAngles(player);
      break;
    default:
      break;
  }
};

// Helper function to add a new weapon to the player's arsenal
const addNewWeapon = (choice: string, player: Player) => {
  const weaponMap: { [key: string]: Weapon } = {
    'Add Railgun': {
      name: 'Railgun',
      type: 'railgun',
      damage: 30,
      fireRate: 1200,
      color: 'cyan',
      angle: 0,
    },
    'Add Missile Launcher': {
      name: 'Missile Launcher',
      type: 'missile',
      damage: 25,
      fireRate: 1500,
      color: 'orange',
      angle: 0,
    },
    'Add Shotgun': {
      name: 'Shotgun',
      type: 'shotgun',
      damage: 15,
      fireRate: 800,
      color: 'purple',
      angle: 0,
    },
  };

  const newWeapon = { ...weaponMap[choice] };
  player.weapons.push(newWeapon);
};

// Fire standard projectile
export const fireStandardProjectile = (
  weapon: Weapon,
  x: number,
  y: number,
  angle: number,
  projectiles: Projectile[]
) => {
  const speed = 8;
  projectiles.push({
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 5,
    damage: weapon.damage,
    type: 'standard',
    color: weapon.color,
  });
};

// Fire railgun
export const fireRailgun = (
  weapon: Weapon,
  x: number,
  y: number,
  angle: number,
  projectiles: Projectile[]
) => {
  projectiles.push({
    x,
    y,
    vx: 0,
    vy: 0,
    radius: 2,
    damage: weapon.damage,
    type: 'railgun',
    color: weapon.color,
    angle,
    life: 100, // Duration of the beam in milliseconds
  });
};

// Fire missile
export const fireMissile = (
  weapon: Weapon,
  x: number,
  y: number,
  angle: number,
  projectiles: Projectile[]
) => {
  const speed = 5;
  projectiles.push({
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 5,
    damage: weapon.damage,
    type: 'missile',
    color: weapon.color,
  });
};

// Fire shotgun
export const fireShotgun = (
  weapon: Weapon,
  x: number,
  y: number,
  angle: number,
  projectiles: Projectile[]
) => {
  const speed = 8;
  const spread = 0.2; // Spread angle in radians
  for (let i = -1; i <= 1; i++) {
    const bulletAngle = angle + i * spread;
    projectiles.push({
      x,
      y,
      vx: Math.cos(bulletAngle) * speed,
      vy: Math.sin(bulletAngle) * speed,
      radius: 4,
      damage: weapon.damage,
      type: 'standard',
      color: weapon.color,
    });
  }
};
