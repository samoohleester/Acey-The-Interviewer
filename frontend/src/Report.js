import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './Report.css';

const Report = () => {
  const location = useLocation();
  const [report, setReport] = useState(null);

  useEffect(() => {
    // Try to get report data from multiple sources
    let reportData = null;
    
    // First, try to get from location state (existing navigation)
    if (location.state && location.state.report) {
      reportData = location.state.report;
    }
    // Then, try to get from window object (new tab approach)
    else if (window.reportData) {
      reportData = window.reportData;
    }
    // Finally, try to get from localStorage (fallback)
    else {
      const savedReport = localStorage.getItem('currentReport');
      if (savedReport) {
        reportData = JSON.parse(savedReport);
      }
    }

    setReport(reportData);
  }, [location.state]);

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
          <span className="score-label">/ 100</span>
        </div>
        <h2>Overall Score</h2>
        {report.scoreExplanation && (
          <p className="score-explanation">{report.scoreExplanation}</p>
        )}
      </div>

      {report.scoringBreakdown && (
        <div className="scoring-breakdown">
          <h3>Score Breakdown</h3>
          <div className="breakdown-container">
            <div className="breakdown-section">
              <h4>Base Score</h4>
              <p className="base-score">{report.scoringBreakdown.baseScore} points</p>
            </div>
            
            {report.scoringBreakdown.bonuses && report.scoringBreakdown.bonuses.length > 0 && (
              <div className="breakdown-section bonuses">
                <h4>Points Earned</h4>
                <ul>
                  {report.scoringBreakdown.bonuses.map((bonus, index) => (
                    <li key={index} className="bonus-item">{bonus}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {report.scoringBreakdown.deductions && report.scoringBreakdown.deductions.length > 0 && (
              <div className="breakdown-section deductions">
                <h4>Points Lost</h4>
                <ul>
                  {report.scoringBreakdown.deductions.map((deduction, index) => (
                    <li key={index} className="deduction-item">{deduction}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="breakdown-section final">
              <h4>Final Score</h4>
              <p className="final-score">{report.scoringBreakdown.finalScore || report.overallScore} / 100</p>
            </div>
          </div>
        </div>
      )}

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