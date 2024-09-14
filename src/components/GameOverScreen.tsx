// src/components/GameOverScreen.tsx
import React from 'react';

interface GameOverScreenProps {
  gameStatistics: {
    enemiesKilled: number;
    timeSurvived: number;
  };
  onRestartGame: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  gameStatistics,
  onRestartGame,
}) => {
  return (
    <div className="game-over-screen">
      <h1>Game Over</h1>
      <p>Enemies Killed: {gameStatistics.enemiesKilled}</p>
      <p>
        Time Survived: {(gameStatistics.timeSurvived / 1000).toFixed(2)} seconds
      </p>
      <button onClick={onRestartGame} className="restart-button">
        Restart
      </button>
    </div>
  );
};

export default GameOverScreen;
