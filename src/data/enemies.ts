// src/data/enemies.ts
import { Enemy } from '../types';

export const enemiesData: {
  [key: string]: {
    baseHealth: number;
    healthIncrement: number;
    damage: number;
    radius: number;
    experienceValue: number;
    color: string;
    behavior: (enemy: Enemy, deltaTime: number) => void;
  };
} = {
  common: {
    baseHealth: 50,
    healthIncrement: 5,
    damage: 10,
    radius: 20,
    experienceValue: 20,
    color: 'green',
    behavior: () => {},
  },
  elite: {
    baseHealth: 150,
    healthIncrement: 10,
    damage: 20,
    radius: 30,
    experienceValue: 50,
    color: 'purple',
    behavior: () => {},
  },
  boss: {
    baseHealth: 500,
    healthIncrement: 20,
    damage: 30,
    radius: 50,
    experienceValue: 200,
    color: 'red',
    behavior: () => {},
  },
};
