import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import DifficultyDetails from './DifficultyDetails';
import CustomDifficultyDetails from './CustomDifficultyDetails';
import './Demo.css';

const DifficultySelection = () => {
  const navigate = useNavigate();
  const {
    selection,
    hovered,
    sessionName,
    handleSelect,
    handleMouseEnter,
    handleMouseLeave,
    handleSessionNameChange,
  } = useOutletContext();

  const effectiveSelection = selection || hovered;

  return (
    <>
      <header>
        <h1>Select Interview Difficulty</h1>
      </header>
      <div
        className={`difficulty-selection ${effectiveSelection ? `hover-${effectiveSelection}` : ''} ${selection ? `selected-${effectiveSelection}` : ''}`}
      >
        <div className="difficulty-row">
          <div
            className="difficulty-card"
            onMouseEnter={() => handleMouseEnter('easy')}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleSelect('easy')}
          >
            <h2>Easy</h2>
            {effectiveSelection === 'easy' &&
              <DifficultyDetails
                difficulty="easy"
                chatName={sessionName}
                onChatNameChange={handleSessionNameChange}
              />
            }
          </div>
          <div
            className="difficulty-card"
            onMouseEnter={() => handleMouseEnter('medium')}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleSelect('medium')}
          >
            <h2>Medium</h2>
            {effectiveSelection === 'medium' &&
              <DifficultyDetails
                difficulty="medium"
                chatName={sessionName}
                onChatNameChange={handleSessionNameChange}
              />
            }
          </div>
          <div
            className="difficulty-card"
            onMouseEnter={() => handleMouseEnter('hard')}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleSelect('hard')}
          >
            <h2>Hard</h2>
            {effectiveSelection === 'hard' &&
              <DifficultyDetails
                difficulty="hard"
                chatName={sessionName}
                onChatNameChange={handleSessionNameChange}
              />
            }
          </div>
          <div
            className="difficulty-card"
            onMouseEnter={() => handleMouseEnter('custom')}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleSelect('custom')}
          >
            <h2>Custom</h2>
            {effectiveSelection === 'custom' &&
              <CustomDifficultyDetails
                chatName={sessionName}
                onChatNameChange={handleSessionNameChange}
              />
            }
          </div>
        </div>
      </div>
    </>
  );
};

export default DifficultySelection; 