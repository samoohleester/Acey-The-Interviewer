import React from 'react';
import { useOutletContext } from 'react-router-dom';
import DifficultyDetails from './DifficultyDetails';
import './Demo.css';

const DifficultySelection = () => {
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
        className={`difficulty-selection ${effectiveSelection ? `hover-${effectiveSelection}` : ''} ${selection ? `selected-${selection}` : ''}`}
      >
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
      </div>
    </>
  );
};

export default DifficultySelection; 