// src/components/StartScreen.tsx
import React from 'react';
import { characterOptions } from '../data/characters';

interface StartScreenProps {
  onStartGame: (characterIndex: number) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStartGame }) => {
  return (
    <div className="start-screen">
      <h1>Select Your Character</h1>
      <div className="character-options">
        {characterOptions.map((char, index) => (
          <div
            key={index}
            className="character-card"
            onClick={() => onStartGame(index)}
          >
            <h2>
              {char.shape === 'rectangle'
                ? 'Tank'
                : char.shape === 'triangle'
                ? 'Scout'
                : 'Balanced'}
            </h2>
            <p>Health: {char.maxHealth}</p>
            <p>Armor: {char.maxArmor}</p>
            <p>Speed: {char.speed}</p>
            <p>
              Weapon: {char.weapons.length > 0 ? char.weapons[0].name : 'N/A'}
            </p>
            <p>Shape: {char.shape.charAt(0).toUpperCase() + char.shape.slice(1)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StartScreen;
