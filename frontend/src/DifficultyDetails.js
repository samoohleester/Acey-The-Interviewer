import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DifficultyDetails.css';

const detailsMap = {
  easy: {
    questionType: 'Common Questions',
    timeLimit: 'No time Limit',
    curveballs: 'None',
  },
  medium: {
    questionType: 'behavioral & situational',
    timeLimit: '15 seconds per answer',
    curveballs: 'Ask to clarify',
  },
  hard: {
    questionType: 'All + Technical',
    timeLimit: '5 second per answer',
    curveballs: 'In depth clarification',
  },
};

const DifficultyDetails = ({ difficulty, chatName, onChatNameChange }) => {
  const [inputValue, setInputValue] = useState('');
  const navigate = useNavigate();
  const details = detailsMap[difficulty];

  useEffect(() => {
    // Only set input value if there's a saved chatName (when card is reselected)
    if (chatName) {
      setInputValue(chatName);
    }
  }, [chatName]);
  
  if (!details) return null;

  const handleContinue = () => {
    onChatNameChange(difficulty, inputValue);
    navigate('/demo/conversation', { state: { difficulty: difficulty } });
  };

  return (
    <div className="difficulty-details" onClick={(e) => e.stopPropagation()}>
      <div className="form-row">
        <label htmlFor={`sessionName-${difficulty}`}>Session Name:</label>
        <input 
          type="text" 
          id={`sessionName-${difficulty}`} 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter session name..."
        />
      </div>
      <div className="form-row">
        <label>Question type:</label>
        <button className="option-btn">{details.questionType}</button>
      </div>
      <div className="form-row">
        <label>Time Limit:</label>
        <button className="option-btn">{details.timeLimit}</button>
      </div>
      <div className="form-row">
        <label>Curveballs:</label>
        <button className="option-btn">{details.curveballs}</button>
      </div>
      {inputValue.trim() && <button className="continue-btn" onClick={handleContinue}>Continue</button>}
    </div>
  );
};

export default DifficultyDetails; 