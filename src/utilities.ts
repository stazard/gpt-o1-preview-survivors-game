// src/utilities.ts
import {
  Particle,
  ExperiencePill,
  Explosion,
  Enemy,
  Player,
} from './types';

export const createParticles = (
  x: number,
  y: number,
  color: string,
  particles: Particle[]
) => {
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

export const createExperiencePill = (
  x: number,
  y: number,
  value: number,
  experiencePills: ExperiencePill[]
) => {
  experiencePills.push({
    x,
    y,
    radius: 10,
    value,
    color: 'gold',
  });
};

export const createExplosion = (
  x: number,
  y: number,
  damage: number,
  explosions: Explosion[],
  enemies: Enemy[],
  player: Player,
  particles: Particle[],
  experiencePills: ExperiencePill[]
) => {
  const explosionRadius = 50;
  explosions.push({
    x,
    y,
    radius: 0,
    maxRadius: explosionRadius,
    life: 300,
  });

  // Iterate backwards to safely remove enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    const dx = enemy.x - x;
    const dy = enemy.y - y;
    const distance = Math.hypot(dx, dy);
    if (distance < explosionRadius + enemy.radius) {
      enemy.health -= damage;
      createParticles(enemy.x, enemy.y, 'orange', particles);
      if (enemy.health <= 0) {
        createExperiencePill(
          enemy.x,
          enemy.y,
          enemy.experienceValue,
          experiencePills
        );
        enemies.splice(i, 1);
        player.enemiesKilled += 1;
      }
    }
  }
};
