import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from './firebaseConfig';
import { signOut } from 'firebase/auth';
import './Demo.css';

const Demo = () => {
  const [sessionName, setSessionName] = useState('');
  const [selection, setSelection] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [recentlyDeselected, setRecentlyDeselected] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [jobAnalysis, setJobAnalysis] = useState(null);
  const [isAnalyzingJob, setIsAnalyzingJob] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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

  const analyzeJobDescription = async (description) => {
    setIsAnalyzingJob(true);
    try {
      const response = await fetch('http://127.0.0.1:5001/api/analyze-job-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobDescription: description }),
      });

      if (response.ok) {
        const analysis = await response.json();
        setJobAnalysis(analysis);
      } else {
        console.error('Failed to analyze job description');
        setJobAnalysis({ error: 'Failed to analyze job description' });
      }
    } catch (error) {
      console.error('Error analyzing job description:', error);
      setJobAnalysis({ error: 'Error analyzing job description' });
    } finally {
      setIsAnalyzingJob(false);
    }
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

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
    jobAnalysis,
    setJobAnalysis,
    isAnalyzingJob,
    analyzeJobDescription,
  };

  return (
    <div className="demo-container">
      <div className="top-bar">
        <div className="logo-container">
          <div className="logo-icon">
            <img
              src="/logo/acey-logo.png"
              alt="Acey Logo"
              className="logo-image"
              onError={(e) => {
                // Hide image and show fallback if logo doesn't load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="logo-fallback"></div>
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
            <button onClick={handleSignOut} className="sign-out-btn">Sign Out</button>
          </div>
        </div>
        <div className="main-content">
          <Outlet context={selectionState} />
        </div>
      </div>

      {/* Confirmation Modal */}
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