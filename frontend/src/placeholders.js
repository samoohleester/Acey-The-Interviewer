import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChatHistory.css';

// Badge definitions
const BADGES = {
  easy: {
    id: 'easy_master',
    name: 'Easy Master',
    description: 'Scored 70% or higher on Easy mode',
    icon: '🌟',
    color: '#4CAF50',
    logo: '/badges/easy-badge.png' // Custom badge logo path
  },
  medium: {
    id: 'medium_master', 
    name: 'Medium Master',
    description: 'Scored 70% or higher on Medium mode',
    icon: '⭐',
    color: '#FF9800',
    logo: '/badges/medium-badge.png' // Custom badge logo path
  },
  hard: {
    id: 'hard_master',
    name: 'Hard Master', 
    description: 'Scored 70% or higher on Hard mode',
    icon: '💎',
    color: '#E91E63',
    logo: '/badges/hard-badge.png' // Custom badge logo path
  }
};

// Badge management functions
const getBadges = () => {
  const saved = localStorage.getItem('userBadges');
  return saved ? JSON.parse(saved) : [];
};

const saveBadges = (badges) => {
  localStorage.setItem('userBadges', JSON.stringify(badges));
};

const checkAndAwardBadge = (difficulty, score) => {
  if (score >= 70) {
    const badge = BADGES[difficulty];
    if (badge) {
      const currentBadges = getBadges();
      const alreadyEarned = currentBadges.find(b => b.id === badge.id);
      
      if (!alreadyEarned) {
        const newBadge = {
          ...badge,
          earnedAt: new Date().toISOString(),
          difficulty: difficulty,
          score: score
        };
        
        const updatedBadges = [...currentBadges, newBadge];
        saveBadges(updatedBadges);
        
        // Show notification
        showBadgeNotification(newBadge);
        
        return newBadge;
      }
    }
  }
  return null;
};

const showBadgeNotification = (badge) => {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'badge-notification';
  notification.innerHTML = `
    <div class="badge-notification-content">
      <div class="badge-icon">${badge.icon}</div>
      <div class="badge-info">
        <h4>New Badge Earned!</h4>
        <p>${badge.name}</p>
        <small>${badge.description}</small>
      </div>
    </div>
  `;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
    border: 2px solid ${badge.color};
    border-radius: 12px;
    padding: 16px;
    color: white;
    z-index: 10000;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    animation: badgeSlideIn 0.5s ease-out;
    max-width: 300px;
  `;
  
  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes badgeSlideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes badgeSlideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  // Remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'badgeSlideOut 0.5s ease-out';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 500);
  }, 5000);
};

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
  const [userBadges, setUserBadges] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('savedInterviews');
    if (saved) {
      const interviews = JSON.parse(saved);
      setSavedInterviews(interviews);
      
      // Check for new badges on all interviews
      interviews.forEach(interview => {
        if (interview.score >= 70) {
          checkAndAwardBadge(interview.difficulty, interview.score);
        }
      });
    }
    
    // Load user badges
    setUserBadges(getBadges());
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

  const getInterviewBadges = (interview) => {
    return userBadges.filter(badge => 
      badge.difficulty === interview.difficulty && 
      badge.score === interview.score
    );
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
          {savedInterviews.map((interview) => {
            const interviewBadges = getInterviewBadges(interview);
            return (
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export const Profile = () => {
  const [userBadges, setUserBadges] = useState([]);
  const [savedInterviews, setSavedInterviews] = useState([]);

  useEffect(() => {
    // Load user badges and interview history
    setUserBadges(getBadges());
    const saved = localStorage.getItem('savedInterviews');
    if (saved) {
      setSavedInterviews(JSON.parse(saved));
    }
  }, []);

  const getProfileStats = () => {
    const totalInterviews = savedInterviews.length;
    const totalBadges = userBadges.length;
    const averageScore = totalInterviews > 0 
      ? Math.round(savedInterviews.reduce((sum, interview) => sum + interview.score, 0) / totalInterviews)
      : 0;
    const highestScore = totalInterviews > 0 
      ? Math.max(...savedInterviews.map(interview => interview.score))
      : 0;

    return {
      totalInterviews,
      totalBadges,
      averageScore,
      highestScore
    };
  };

  const getFavoriteDifficulty = () => {
    if (savedInterviews.length === 0) return 'None';
    
    const difficultyCounts = savedInterviews.reduce((counts, interview) => {
      counts[interview.difficulty] = (counts[interview.difficulty] || 0) + 1;
      return counts;
    }, {});
    
    return Object.keys(difficultyCounts).reduce((a, b) => 
      difficultyCounts[a] > difficultyCounts[b] ? a : b
    );
  };

  const stats = getProfileStats();
  const favoriteDifficulty = getFavoriteDifficulty();

  return (
    <div className="chat-history-container">
      <div className="chat-history-header">
        <h1>Profile</h1>
        <p>Your interview achievements and statistics</p>
      </div>

      {/* Profile Stats */}
      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.totalInterviews}</h3>
            <p>Total Interviews</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <h3>{stats.totalBadges}</h3>
            <p>Badges Earned</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>{stats.averageScore}%</h3>
            <p>Average Score</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>{stats.highestScore}%</h3>
            <p>Highest Score</p>
          </div>
        </div>
      </div>

      {/* Favorite Difficulty */}
      <div className="profile-section">
        <h2>Your Favorite Difficulty</h2>
        <div className="favorite-difficulty">
          <span className="difficulty-label">
            {favoriteDifficulty.charAt(0).toUpperCase() + favoriteDifficulty.slice(1)}
          </span>
          <p>Most practiced difficulty level</p>
        </div>
      </div>

      {/* Badges Section */}
      <div className="profile-section">
        <h2>Earned Badges</h2>
        {userBadges.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <h3>No badges yet</h3>
            <p>Complete interviews with 70% or higher to earn your first badge!</p>
          </div>
        ) : (
          <div className="badges-grid">
            {Object.values(BADGES).map((badge) => {
              const earnedBadge = userBadges.find(b => b.id === badge.id);
              const isEarned = !!earnedBadge;
              
              return (
                <div 
                  key={badge.id} 
                  className={`badge-card ${isEarned ? 'earned' : 'locked'}`}
                  style={{ borderColor: isEarned ? badge.color : '#444' }}
                >
                  <div className="badge-icon-large">
                    {isEarned ? (
                      <>
                        <img 
                          src={badge.logo}
                          alt={badge.name}
                          className="badge-logo-large"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <span className="badge-fallback-large" style={{ display: 'none' }}>
                          {badge.icon}
                        </span>
                      </>
                    ) : '🔒'}
                  </div>
                  <div className="badge-info">
                    <h3>{badge.name}</h3>
                    <p>{badge.description}</p>
                    {isEarned && (
                      <div className="badge-earned-info">
                        <small>Earned on {new Date(earnedBadge.earnedAt).toLocaleDateString()}</small>
                        <small>Score: {earnedBadge.score}/100</small>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Interviews */}
      <div className="profile-section">
        <h2>Recent Interviews</h2>
        {savedInterviews.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No interviews yet</h3>
            <p>Complete your first interview to see it here</p>
          </div>
        ) : (
          <div className="recent-interviews">
            {savedInterviews.slice(0, 5).map((interview) => {
              const interviewBadges = userBadges.filter(badge => 
                badge.difficulty === interview.difficulty && 
                badge.score === interview.score
              );
              
              return (
                <div key={interview.id} className="recent-interview-card">
                  <div className="interview-header">
                    <h3>{interview.title}</h3>
                    <div className="interview-meta">
                      <span className="difficulty-badge">{interview.difficulty}</span>
                      <span className="date">{new Date(interview.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="interview-score">
                    <span className="score-value">{interview.score}/100</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export const Support = () => {
  const teamMembers = [
    {
      name: "Chelsea Zhang",
      email: "chelseazhang2005@gmail.com",
      role: "Team Lead",
      avatar: "👩‍💻"
    },
    {
      name: "Gui Liao", 
      email: "guiliao2006@gmail.com",
      role: "Developer",
      avatar: "👨‍💻"
    },
    {
      name: "Raghav Gautam",
      email: "raghavgautam03@gmail.com", 
      role: "Developer",
      avatar: "👨‍💻"
    },
    {
      name: "Samuel",
      email: "samuel15@uci.edu",
      role: "Developer", 
      avatar: "👨‍💻"
    }
  ];

  const handleEmailClick = (email) => {
    window.open(`mailto:${email}?subject=Acey Interview App Support`, '_blank');
  };

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email);
    // You could add a toast notification here
    alert('Email copied to clipboard!');
  };

  return (
    <div className="chat-history-container">
      <div className="chat-history-header">
        <h1>Support</h1>
        <p>Get help from our development team</p>
      </div>

      {/* Contact Team Section */}
      <div className="support-section">
        <h2>Contact Our Team</h2>
        <p className="support-description">
          Need help with Acey? Our development team is here to assist you. 
          Feel free to reach out to any team member for support, bug reports, or feature requests.
        </p>
        
        <div className="team-grid">
          {teamMembers.map((member, index) => (
            <div key={index} className="team-member-card">
              <div className="member-avatar">
                {member.avatar}
              </div>
              <div className="member-info">
                <h3>{member.name}</h3>
                <p className="member-role">{member.role}</p>
                <div className="member-email">
                  <span className="email-text">{member.email}</span>
                  <div className="email-actions">
                    <button 
                      className="email-btn primary"
                      onClick={() => handleEmailClick(member.email)}
                      title="Send email"
                    >
                      📧 Email
                    </button>
                    <button 
                      className="email-btn secondary"
                      onClick={() => handleCopyEmail(member.email)}
                      title="Copy email"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="support-section">
        <h2>Frequently Asked Questions</h2>
        
        <div className="faq-list">
          <div className="faq-item">
            <h3>How do I start an interview?</h3>
            <p>Click "New Chat" in the sidebar, select your preferred difficulty level (Easy, Medium, or Hard), enter a session name, and click "Continue" to begin your interview.</p>
          </div>
          
          <div className="faq-item">
            <h3>How are scores calculated?</h3>
            <p>Scores are based on your communication skills, STAR method usage, body language, and response quality. Each difficulty level has different scoring criteria and expectations.</p>
          </div>
          
          <div className="faq-item">
            <h3>How do I earn badges?</h3>
            <p>Earn badges by scoring 70% or higher on any difficulty level. Each difficulty has its own badge: Easy Master 🌟, Medium Master ⭐, and Hard Master 💎.</p>
          </div>
          
          <div className="faq-item">
            <h3>Can I review my past interviews?</h3>
            <p>Yes! Go to "Chat History" in the sidebar to view all your completed interviews, scores, and detailed feedback reports.</p>
          </div>
          
          <div className="faq-item">
            <h3>What's the difference between difficulty levels?</h3>
            <p>
              <strong>Easy:</strong> Basic questions, no time limit, beginner-friendly<br/>
              <strong>Medium:</strong> Behavioral questions, 15-second time limit, STAR method expected<br/>
              <strong>Hard:</strong> Complex scenarios, 5-second time limit, high-pressure situations
            </p>
          </div>
          
          <div className="faq-item">
            <h3>How do I check my profile and achievements?</h3>
            <p>Click "Profile" in the sidebar to view your statistics, earned badges, favorite difficulty, and recent interview history.</p>
          </div>
        </div>
      </div>

      {/* Technical Support */}
      <div className="support-section">
        <h2>Technical Support</h2>
        <div className="tech-support">
          <div className="tech-item">
            <h3>🖥️ System Requirements</h3>
            <ul>
              <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
              <li>Microphone and camera for video interviews</li>
              <li>Stable internet connection</li>
              <li>JavaScript enabled</li>
            </ul>
          </div>
          
          <div className="tech-item">
            <h3>🔧 Troubleshooting</h3>
            <ul>
              <li>If the interview doesn't start, refresh the page and try again</li>
              <li>Ensure your microphone and camera permissions are enabled</li>
              <li>Check your internet connection if experiencing delays</li>
              <li>Clear browser cache if you encounter display issues</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="support-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          <button 
            className="action-btn"
            onClick={() => window.open('mailto:chelseazhang2005@gmail.com?subject=Acey Bug Report', '_blank')}
          >
            🐛 Report a Bug
          </button>
          <button 
            className="action-btn"
            onClick={() => window.open('mailto:chelseazhang2005@gmail.com?subject=Acey Feature Request', '_blank')}
          >
            💡 Request Feature
          </button>
          <button 
            className="action-btn"
            onClick={() => window.open('mailto:chelseazhang2005@gmail.com?subject=Acey General Support', '_blank')}
          >
            ❓ General Help
          </button>
        </div>
      </div>
    </div>
  );
};

// Badges component to display all earned badges
export const Badges = () => {
  const [userBadges, setUserBadges] = useState([]);

  useEffect(() => {
    setUserBadges(getBadges());
  }, []);

  const getBadgeProgress = () => {
    const totalBadges = Object.keys(BADGES).length;
    const earnedBadges = userBadges.length;
    return {
      earned: earnedBadges,
      total: totalBadges,
      percentage: Math.round((earnedBadges / totalBadges) * 100)
    };
  };

  const progress = getBadgeProgress();

  return (
    <div className="chat-history-container">
      <div className="chat-history-header">
        <h1>Badges</h1>
        <p>Your achievements and accomplishments</p>
        <div className="badges-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
          <span className="progress-text">
            {progress.earned} of {progress.total} badges earned ({progress.percentage}%)
          </span>
        </div>
      </div>
      
      {userBadges.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <h3>No badges yet</h3>
          <p>Score 70% or higher on any difficulty mode to earn your first badge!</p>
        </div>
      ) : (
        <div className="badges-grid">
          {Object.values(BADGES).map((badge) => {
            const earnedBadge = userBadges.find(b => b.id === badge.id);
            const isEarned = !!earnedBadge;
            
            return (
              <div 
                key={badge.id} 
                className={`badge-card ${isEarned ? 'earned' : 'locked'}`}
                style={{ borderColor: isEarned ? badge.color : '#444' }}
              >
                <div className="badge-icon-large">
                  {isEarned ? (
                    <>
                      <img 
                        src={badge.logo}
                        alt={badge.name}
                        className="badge-logo-large"
                        onError={(e) => {
                          // Show fallback emoji if logo doesn't load
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <span className="badge-fallback-large" style={{ display: 'none' }}>
                        {badge.icon}
                      </span>
                    </>
                  ) : '🔒'}
                </div>
                <div className="badge-info">
                  <h3>{badge.name}</h3>
                  <p>{badge.description}</p>
                  {isEarned && (
                    <div className="badge-earned-info">
                      <small>Earned on {new Date(earnedBadge.earnedAt).toLocaleDateString()}</small>
                      <small>Score: {earnedBadge.score}/100</small>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Export badge functions for use in other components
export { checkAndAwardBadge, getBadges, BADGES };

// Test function for development (remove in production)
export const testBadgeSystem = () => {
  console.log('Testing badge system...');
  
  // Clear existing badges
  localStorage.removeItem('userBadges');
  
  // Test awarding badges
  const badge1 = checkAndAwardBadge('easy', 85);
  const badge2 = checkAndAwardBadge('medium', 78);
  const badge3 = checkAndAwardBadge('hard', 72);
  
  console.log('Awarded badges:', { badge1, badge2, badge3 });
  console.log('All badges:', getBadges());
  
  return { badge1, badge2, badge3 };
}; 