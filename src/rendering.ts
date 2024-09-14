// src/rendering.ts
import { Player, Enemy, Projectile, Particle, ExperiencePill, Explosion } from './types';

export const drawBackground = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number
) => {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
};

export const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player) => {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = player.color;

  if (player.shape === 'circle') {
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();
  } else if (player.shape === 'rectangle') {
    ctx.fillRect(-player.radius, -player.radius, player.radius * 2, player.radius * 2);
  } else if (player.shape === 'triangle') {
    ctx.beginPath();
    ctx.moveTo(0, -player.radius);
    ctx.lineTo(player.radius, player.radius);
    ctx.lineTo(-player.radius, player.radius);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();

  drawHealthBar(ctx, player);
};

export const drawWeapons = (ctx: CanvasRenderingContext2D, player: Player) => {
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

export const drawProjectiles = (
  ctx: CanvasRenderingContext2D,
  projectiles: Projectile[],
  canvasWidth: number
) => {
  projectiles.forEach((proj) => {
    ctx.fillStyle = proj.color;
    if (proj.type === 'railgun') {
      ctx.save();
      ctx.translate(proj.x, proj.y);
      ctx.rotate(proj.angle!);
      ctx.fillRect(0, -proj.radius, canvasWidth, proj.radius * 2);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  });
};

export const drawEnemies = (ctx: CanvasRenderingContext2D, enemies: Enemy[]) => {
  enemies.forEach((enemy) => {
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();

    drawHealthBar(ctx, enemy);
  });
};

export const drawParticles = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
  particles.forEach((particle) => {
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, 2, 2);
  });
};

export const drawExplosions = (ctx: CanvasRenderingContext2D, explosions: Explosion[]) => {
  explosions.forEach((explosion) => {
    const opacity = explosion.life / 300; // Fade out effect
    ctx.fillStyle = `rgba(255, 165, 0, ${opacity})`; // Orange color with opacity
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
    ctx.fill();
  });
};

export const drawExperiencePills = (
  ctx: CanvasRenderingContext2D,
  experiencePills: ExperiencePill[]
) => {
  experiencePills.forEach((pill) => {
    ctx.fillStyle = pill.color;
    ctx.beginPath();
    ctx.arc(pill.x, pill.y, pill.radius, 0, Math.PI * 2);
    ctx.fill();
  });
};

export const drawHealthBar = (ctx: CanvasRenderingContext2D, entity: any) => {
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
  if (entity.hasOwnProperty('armor')) {
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

export const drawUI = (ctx: CanvasRenderingContext2D, player: Player) => {
  const experienceToLevelUp = 100 + (player.level - 1) * 50;
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`Health: ${Math.floor(player.health)}/${player.maxHealth}`, 10, 30);
  ctx.fillText(`Armor: ${Math.floor(player.armor)}/${player.maxArmor}`, 10, 60);
  ctx.fillText(`Level: ${player.level}`, 10, 90);
  ctx.fillText(`Experience: ${player.experience}/${experienceToLevelUp}`, 10, 120);
  ctx.fillText(`Speed: ${player.speed.toFixed(1)}`, 10, 150);
  ctx.fillText(`Damage: ${player.weapons[0].damage}`, 10, 180);
};
