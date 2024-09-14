// src/types/index.ts
export interface Player {
  x: number;
  y: number;
  speed: number;
  initialSpeed: number;
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
  shape: string;
  enemiesKilled: number;
}

export interface Weapon {
  name: string;
  type: string;
  damage: number;
  fireRate: number;
  color: string;
  angle: number;
}

export interface Enemy {
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
  vx: number;
  vy: number;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  type: string;
  life?: number;
  angle?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface ExperiencePill {
  x: number;
  y: number;
  radius: number;
  value: number;
  color: string;
}

export interface Explosion {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
}
