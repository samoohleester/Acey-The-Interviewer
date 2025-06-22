import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css'; // We will create this file for styling

const LandingPage = () => {
  return (
    <div className="App">
      <header className="App-header">
        <nav className="App-nav">
          <div className="logo">
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
            <span>Acey</span>
          </div>
          <a href="/pitch">Pitch</a>
          <a href="/about">About</a>
        </nav>
        <div className="auth-buttons">
          <Link to="/login" className="login-btn">Log in</Link>
          <Link to="/signup" className="signup-btn">Sign up</Link>
        </div>
      </header>
      <main className="main-content">
        <h1>Ace every interview with <strong>Acey</strong>.</h1>
        <p>Level up your interviews with AI</p>
        <Link to="/demo" className="demo-btn">Try Acey!</Link>
      </main>
    </div>
  );
};

export default LandingPage; 