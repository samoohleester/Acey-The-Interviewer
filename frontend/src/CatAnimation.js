import React, { useState, useEffect, useRef } from 'react';
import './CatAnimation.css';

const CatAnimation = ({ isSpeaking, callStatus, interviewMode }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isIdle, setIsIdle] = useState(false);
  const animationRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const idleIntervalRef = useRef(null);

  // Animation frames - you'll need to add your cat images to the public folder
  const catFrames = [
    '/cat-frame1.png', // Closed mouth
    '/cat-frame2.png'  // Open mouth
  ];

  const idleFrames = [
    '/cat-idle1.png', // Idle frame 1
    '/cat-idle2.png'  // Idle frame 2
  ];

  useEffect(() => {
    if (isSpeaking && callStatus === 'active') {
      // Stop idle animation
      setIsIdle(false);
      if (idleIntervalRef.current) {
        clearInterval(idleIntervalRef.current);
        idleIntervalRef.current = null;
      }
      
      // Start speaking animation when AI is speaking
      frameIntervalRef.current = setInterval(() => {
        setCurrentFrame(prev => (prev === 0 ? 1 : 0));
      }, 150); // Switch frames every 150ms for natural mouth movement
    } else if (callStatus === 'active' && !isSpeaking) {
      // Stop speaking animation
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
      setCurrentFrame(0); // Reset to closed mouth
      
      // Start idle animation
      setIsIdle(true);
      idleIntervalRef.current = setInterval(() => {
        setCurrentFrame(prev => (prev === 0 ? 1 : 0));
      }, 800); // Slower idle animation
    } else {
      // Stop all animations
      setIsIdle(false);
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
      if (idleIntervalRef.current) {
        clearInterval(idleIntervalRef.current);
        idleIntervalRef.current = null;
      }
      setCurrentFrame(0); // Reset to closed mouth
    }

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
      if (idleIntervalRef.current) {
        clearInterval(idleIntervalRef.current);
      }
    };
  }, [isSpeaking, callStatus]);

  if (callStatus === 'inactive') {
    return (
      <div className="cat-animation-container">
        <div className="cat-animation">
          <img 
            src="/cat-idle1.png" 
            alt="Cat Ready"
            className="cat-frame"
            onError={(e) => {
              // Fallback to emoji if images don't load
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <div className="cat-fallback" style={{ display: 'none' }}>
            <span className="cat-emoji">✅</span>
          </div>
        </div>
        <div className="cat-status">
          Ready to Interview
        </div>
      </div>
    );
  }

  if (callStatus === 'loading') {
    return (
      <div className="cat-animation-container">
        <div className="cat-animation">
          <img 
            src="/cat-idle1.png" 
            alt="Cat Connecting"
            className="cat-frame"
            onError={(e) => {
              // Fallback to emoji if images don't load
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <div className="cat-fallback" style={{ display: 'none' }}>
            <span className="cat-emoji">🔄</span>
          </div>
        </div>
        <div className="cat-status">
          Connecting...
        </div>
      </div>
    );
  }

  return (
    <div className="cat-animation-container">
      <div className="cat-animation">
        <img 
          src={isIdle ? idleFrames[currentFrame] : catFrames[currentFrame]} 
          alt="Talking Cat"
          className="cat-frame"
          onError={(e) => {
            // Fallback to emoji if images don't load
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
        <div className="cat-fallback" style={{ display: 'none' }}>
          <span className="cat-emoji">🐱</span>
          {isSpeaking && <span className="speaking-indicator">🗣️</span>}
          {isIdle && <span className="idle-indicator">👂</span>}
        </div>
      </div>
      {interviewMode !== 'medium' && (
        <div className="cat-status">
          {isSpeaking ? 'AI Speaking...' : isIdle ? 'Listening...' : 'Ready...'}
        </div>
      )}
    </div>
  );
};

export default CatAnimation; 