import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import './Demo.css';

const Demo = () => {
  const [sessionName, setSessionName] = useState('');
  const [selection, setSelection] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [recentlyDeselected, setRecentlyDeselected] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzingJob, setIsAnalyzingJob] = useState(false);
  const [jobAnalysis, setJobAnalysis] = useState(null);
  const [jobDescriptionHovered, setJobDescriptionHovered] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const analyzeJobDescription = async (description) => {
    setIsAnalyzingJob(true);
    setJobAnalysis(null);
    
    try {
      const response = await fetch('http://127.0.0.1:5001/api/analyze-job-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobDescription: description }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setJobAnalysis(data);
      } else {
        console.error('Failed to analyze job description');
        setJobAnalysis({ error: data.error || 'Failed to analyze job description' });
      }
    } catch (error) {
      console.error('Error analyzing job description:', error);
      setJobAnalysis({ error: 'Error analyzing job description. Please try again.' });
    } finally {
      setIsAnalyzingJob(false);
    }
  };

  const handleSelect = (difficulty) => {
    if (selection === difficulty) {
      setSelection(null);
      setRecentlyDeselected(difficulty);
    } else {
      setSelection(difficulty);
      setRecentlyDeselected(null);
    }
  };

  const handleMouseEnter = (difficulty) => {
    if (recentlyDeselected !== difficulty) {
      setHovered(difficulty);
    }
  };

  const handleMouseLeave = () => {
    setHovered(null);
    setRecentlyDeselected(null);
  };

  const handleSessionNameChange = (difficulty, value) => {
    setSessionName(value);
    if (value && selection !== difficulty) {
      setSelection(difficulty);
      setRecentlyDeselected(null);
    }
  };

  const clearSessionName = () => {
    setSessionName('');
  };

  const handleLinkClick = (e, path) => {
    if (location.pathname === '/demo/conversation') {
      e.preventDefault();
      setPendingNavigation(path);
      setShowConfirmModal(true);
    } else {
      e.preventDefault();
      navigate(path);
    }
  };

  const confirmNavigation = () => {
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
    setShowConfirmModal(false);
    setPendingNavigation(null);
  };

  const cancelNavigation = () => {
    setShowConfirmModal(false);
    setPendingNavigation(null);
  };

  const selectionState = {
    sessionName,
    setSessionName,
    selection,
    setSelection,
    hovered,
    setHovered,
    recentlyDeselected,
    setRecentlyDeselected,
    handleSelect,
    handleMouseEnter,
    handleMouseLeave,
    handleSessionNameChange,
    clearSessionName,
    jobDescription,
    setJobDescription,
    isAnalyzingJob,
    analyzeJobDescription,
    jobAnalysis,
    jobDescriptionHovered,
    setJobDescriptionHovered,
  };

  return (
    <div className="demo-container">
      <div className="top-bar">
        <div className="logo-container">
          <div className="logo-icon">
            <img src="/logo/acey-logo.png" alt="Acey Logo" className="logo-image" />
          </div>
          <span className="logo-text">Acey</span>
        </div>
      </div>
      <div className="content-area">
        <div className="sidebar">
          <div className="sidebar-top">
            <Link 
              to="/demo" 
              className="new-chat-button"
              onClick={(e) => handleLinkClick(e, '/demo')}
            >
              New Chat
            </Link>
            <nav>
              <Link to="/demo/history" onClick={(e) => handleLinkClick(e, '/demo/history')} className={location.pathname === '/demo/history' ? 'active' : ''}>Chat History</Link>
              <Link to="/demo/trash" onClick={(e) => handleLinkClick(e, '/demo/trash')} className={location.pathname === '/demo/trash' ? 'active' : ''}>Trash</Link>
            </nav>
          </div>
          <div className="sidebar-bottom">
            <div className="sidebar-separator"></div>
            <nav>
              <Link to="/demo/profile" onClick={(e) => handleLinkClick(e, '/demo/profile')} className={location.pathname === '/demo/profile' ? 'active' : ''}>Profile</Link>
              <Link to="/demo/support" onClick={(e) => handleLinkClick(e, '/demo/support')} className={location.pathname === '/demo/support' ? 'active' : ''}>Support</Link>
            </nav>
            <div className="sidebar-separator"></div>
            <a href="/logout" className="sign-out-btn">Sign Out</a>
          </div>
        </div>
        <div className="main-content">
          <Outlet context={selectionState} />
        </div>
      </div>
      
   
      {showConfirmModal && (
        <div className="modal-overlay" onClick={cancelNavigation}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Exit Conversation?</h3>
            <p>Are you sure you want to exit the current conversation? Your progress may be lost.</p>
            <div className="modal-buttons">
              <button onClick={cancelNavigation} className="cancel-btn">Cancel</button>
              <button onClick={confirmNavigation} className="confirm-btn">Exit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Demo; 