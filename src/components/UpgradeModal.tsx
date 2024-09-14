import React from 'react';

interface UpgradeModalProps {
  upgradeOptions: string[];
  onUpgradeSelection: (choice: string) => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  upgradeOptions,
  onUpgradeSelection,
}) => {
  return (
    <div className="upgrade-modal">
      <h2>Level Up!</h2>
      <p>Choose an upgrade:</p>
      {upgradeOptions.map((option) => (
        <button
          key={option}
          onClick={() => onUpgradeSelection(option)}
          className="upgrade-button"
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default UpgradeModal;