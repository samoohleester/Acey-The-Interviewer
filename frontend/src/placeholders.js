import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChatHistory.css';

export const Trash = () => {
  const [deletedInterviews, setDeletedInterviews] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('deletedInterviews');
    if (saved) {
      setDeletedInterviews(JSON.parse(saved));
    }
  }, []);

  const permanentlyDelete = (id) => {
    const updated = deletedInterviews.filter(interview => interview.id !== id);
    setDeletedInterviews(updated);
    localStorage.setItem('deletedInterviews', JSON.stringify(updated));
  };

  const restore = (interview) => {
    // Remove from trash
    const updatedTrash = deletedInterviews.filter(item => item.id !== interview.id);
    setDeletedInterviews(updatedTrash);
    localStorage.setItem('deletedInterviews', JSON.stringify(updatedTrash));

    // Add back to history
    const savedInterviews = JSON.parse(localStorage.getItem('savedInterviews') || '[]');
    savedInterviews.push(interview);
    localStorage.setItem('savedInterviews', JSON.stringify(savedInterviews));
  };

  return (
    <div className="chat-history-container">
      <div className="chat-history-header">
        <h1>Trash</h1>
        <p>Deleted interviews will be permanently removed after 30 days</p>
      </div>
      
      {deletedInterviews.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗑️</div>
          <h3>No deleted interviews</h3>
          <p>Interviews you delete will appear here</p>
        </div>
      ) : (
        <div className="interviews-grid">
          {deletedInterviews.map((interview) => (
            <div key={interview.id} className="interview-card deleted">
              <div className="interview-header">
                <h3>{interview.title}</h3>
                <div className="interview-meta">
                  <span className="difficulty-badge">{interview.difficulty}</span>
                  <span className="date">{new Date(interview.date).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="interview-stats">
                <div className="stat">
                  <span className="stat-label">Score</span>
                  <span className="stat-value">{interview.score}/100</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Duration</span>
                  <span className="stat-value">{interview.duration}</span>
                </div>
              </div>
              
              <div className="interview-actions">
                <button 
                  onClick={() => restore(interview)}
                  className="restore-btn"
                >
                  Restore
                </button>
                <button 
                  onClick={() => permanentlyDelete(interview.id)}
                  className="delete-permanent-btn"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ChatHistory = () => {
  const [savedInterviews, setSavedInterviews] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('savedInterviews');
    if (saved) {
      setSavedInterviews(JSON.parse(saved));
    }
  }, []);

  const deleteInterview = (id) => {
    const interviewToDelete = savedInterviews.find(interview => interview.id === id);
    if (interviewToDelete) {
      // Remove from saved interviews
      const updatedInterviews = savedInterviews.filter(interview => interview.id !== id);
      setSavedInterviews(updatedInterviews);
      localStorage.setItem('savedInterviews', JSON.stringify(updatedInterviews));

      // Add to trash
      const deletedInterviews = JSON.parse(localStorage.getItem('deletedInterviews') || '[]');
      deletedInterviews.push(interviewToDelete);
      localStorage.setItem('deletedInterviews', JSON.stringify(deletedInterviews));
    }
  };

  const viewInterview = (interview) => {
    // Store report data in localStorage for the new tab
    localStorage.setItem('currentReport', JSON.stringify(interview.report));
    
    // Open report in a new tab
    window.open('/report', '_blank');
  };

  return (
    <div className="chat-history-container">
      <div className="chat-history-header">
        <h1>Chat History</h1>
        <p>Your completed interview sessions</p>
      </div>
      
      {savedInterviews.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No interview history</h3>
          <p>Complete your first interview to see it here</p>
        </div>
      ) : (
        <div className="interviews-grid">
          {savedInterviews.map((interview) => (
            <div key={interview.id} className="interview-card">
              <div className="interview-header">
                <h3>{interview.title}</h3>
                <div className="interview-meta">
                  <span className="difficulty-badge">{interview.difficulty}</span>
                  <span className="date">{new Date(interview.date).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="interview-stats">
                <div className="stat">
                  <span className="stat-label">Score</span>
                  <span className="stat-value">{interview.score}/100</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Duration</span>
                  <span className="stat-value">{interview.duration}</span>
                </div>
              </div>
              
              <div className="interview-actions">
                <button 
                  onClick={() => viewInterview(interview)}
                  className="view-btn"
                >
                  View Report
                </button>
                <button 
                  onClick={() => deleteInterview(interview.id)}
                  className="delete-btn"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const Profile = () => <h1>Profile</h1>;
export const Support = () => <h1>Support</h1>; 