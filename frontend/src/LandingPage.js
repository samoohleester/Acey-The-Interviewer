import React from 'react';

const LandingPage = () => {
  return (
    <div className="App">
      <header className="App-header">
        <nav className="App-nav">
          <div className="logo">
            <div className="logo-icon"></div>
            <span>Acey</span>
          </div>
          <a href="/pitch">Pitch</a>
          <a href="/about">About</a>
        </nav>
        <div className="auth-buttons">
          <a href="/login" className="login-btn">Log in</a>
          <a href="/signup" className="signup-btn">Sign up</a>
        </div>
      </header>
      <main className="main-content">
        <h1>Ace every interview with <strong>Acey</strong>.</h1>
        <p>Level up your interviews with AI</p>
        <a href="/demo" className="demo-btn">Demo</a>
      </main>
    </div>
  );
};

export default LandingPage; 