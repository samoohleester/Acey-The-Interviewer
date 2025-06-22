import React from 'react';
import { useOutletContext } from 'react-router-dom';
import DifficultyDetails from './DifficultyDetails';
import CustomDifficultyDetails from './CustomDifficultyDetails';
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
            {effectiveSelection === 'easy' && (
              <DifficultyDetails
                difficulty="easy"
                chatName={sessionName}
                onChatNameChange={handleSessionNameChange}
              />
            )}
          </div>

          <div
            className="difficulty-card"
            onMouseEnter={() => handleMouseEnter('medium')}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleSelect('medium')}
          >
            <h2>Medium</h2>
            {effectiveSelection === 'medium' && (
              <DifficultyDetails
                difficulty="medium"
                chatName={sessionName}
                onChatNameChange={handleSessionNameChange}
              />
            )}
          </div>

          <div
            className="difficulty-card"
            onMouseEnter={() => handleMouseEnter('hard')}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleSelect('hard')}
          >
            <h2>Hard</h2>
            {effectiveSelection === 'hard' && (
              <DifficultyDetails
                difficulty="hard"
                chatName={sessionName}
                onChatNameChange={handleSessionNameChange}
              />
            )}
          </div>

          <div
            className="difficulty-card"
            onMouseEnter={() => handleMouseEnter('custom')}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleSelect('custom')}
          >
            <h2>Custom</h2>
            {effectiveSelection === 'custom' && (
              <CustomDifficultyDetails
                chatName={sessionName}
                onChatNameChange={handleSessionNameChange}
              />
            )}
          </div>
        </div>
      </div>

      <div className="info-boxes-container">
        <div className="info-box">
          <h3>Easy</h3>
          <img
            src="/assets/green-cat.png"
            alt="Easy Mode"
            style={{ width: '64px', height: '64px', marginBottom: '12px' }}
          />
          <ul>
            <li>Good for beginners</li>
            <li>Basic behavioral questions</li>
            <li>No time pressure</li>
            <li>No follow-ups</li>
          </ul>
        </div>

        <div className="info-box">
          <h3>Medium</h3>
          <img
            src="/assets/orange-cat.png"
            alt="Medium Mode"
            style={{ width: '64px', height: '64px', marginBottom: '12px' }}
          />
          <ul>
            <li>Moderate challenge</li>
            <li>Mix of behavioral & situational</li>
            <li>15 seconds per answer</li>
            <li>Clarification follow-ups included</li>
          </ul>
        </div>

        <div className="info-box">
          <h3>Hard</h3>
          <img
            src="/assets/hard-cat.png"
            alt="Hard Mode"
            style={{ width: '64px', height: '64px', marginBottom: '12px' }}
          />
          <ul>
            <li>Full difficulty</li>
            <li>Technical + scenario questions</li>
            <li>Quick response timer (5 sec)</li>
            <li>Deep probing follow-ups</li>
          </ul>
        </div>

        <div className="info-box">
          <h3>Custom</h3>
          <img
            src="/assets/custom-cat.png"
            alt="Custom Mode"
            style={{ width: '64px', height: '64px', marginBottom: '12px' }}
          />
          <ul>
            <li>Fully configurable</li>
            <li>Choose your question types</li>
            <li>Set your time limits</li>
            <li>Optional curveball logic</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default DifficultySelection;
