import React, { useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { useLocation, useOutletContext } from 'react-router-dom';
import './Conversation.css';

const Conversation = () => {
  const { clearSessionName } = useOutletContext();
  const location = useLocation();
  const { difficulty } = location.state || {};
  const nodeRef = useRef(null);

  useEffect(() => {
    if (difficulty) {
      clearSessionName();
    }
  }, [difficulty, clearSessionName]);

  return (
    <div className="conversation-container">
      <div className="video-panel">
        <div className="main-video-view">
          
        </div>
        <Draggable nodeRef={nodeRef} bounds="parent">
          <div ref={nodeRef} className="mini-video-view">
         
          </div>
        </Draggable>
        <div className="start-conversation-wrapper">
          <button className="start-conversation-btn">Start Conversation</button>
        </div>
      </div>
      <div className="transcript-panel">
        <div className="transcript-content">
          {/* Transcript messages will go here */}
        </div>
      </div>
    </div>
  );
};

export default Conversation; 