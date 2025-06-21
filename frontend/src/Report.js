import React from 'react';
import { useLocation } from 'react-router-dom';
import './Report.css';

const Report = () => {
  const location = useLocation();
  const { report } = location.state || {}; // Fallback for direct navigation

  if (!report) {
    return (
      <div className="report-container">
        <h1>No Report Data</h1>
        <p>There is no report data to display. Please complete an interview first.</p>
        <a href="/">Go Back</a>
      </div>
    );
  }

  return (
    <div className="report-container">
      <header className="report-header">
        <h1>Your Interview Report</h1>
        <p className="report-summary">{report.summary}</p>
      </header>

      <div className="score-container">
        <div className="score-circle">
          <span className="score-number">{report.overallScore}</span>
          <span className="score-label">/ 10</span>
        </div>
        <h2>Overall Score</h2>
      </div>

      <div className="feedback-section">
        <div className="feedback-card good">
          <h3>What You Did Well</h3>
          <ul>
            {report.whatYouDidWell.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>

        <div className="feedback-card improve">
          <h3>Areas for Improvement</h3>
          <ul>
            {report.areasForImprovement.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>
      </div>
       <a href="/" className="home-button">Try Again</a>
    </div>
  );
};

export default Report; 