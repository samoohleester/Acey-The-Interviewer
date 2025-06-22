import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import DifficultyDetails from './DifficultyDetails';
import CustomDifficultyDetails from './CustomDifficultyDetails';
import './Demo.css';

const DifficultySelection = () => {
  const navigate = useNavigate();
  const {
    selection,
    hovered,
    sessionName,
    handleSelect,
    handleMouseEnter,
    handleMouseLeave,
    handleSessionNameChange,
    jobDescription,
    setJobDescription,
    isAnalyzingJob,
    analyzeJobDescription,
    jobAnalysis,
  } = useOutletContext();

  const effectiveSelection = selection || hovered;

  const handleJobDescriptionChange = (e) => {
    setJobDescription(e.target.value);
  };

  const handleAnalyzeJob = async () => {
    if (jobDescription.trim()) {
      await analyzeJobDescription(jobDescription);
    }
  };

  const handleViewAnalysis = () => {
    navigate('/job-analysis', {
      state: {
        jobAnalysis,
        jobDescription,
        difficulty: selection,
        sessionName
      }
    });
  };

  return (
    <>
      <header>
        <h1>Select Interview Difficulty</h1>
      </header>
      <div
        className={`difficulty-selection ${effectiveSelection ? `hover-${effectiveSelection}` : ''} ${selection ? `selected-${effectiveSelection}` : ''}`}
      >
        <div
          className="difficulty-card"
          onMouseEnter={() => handleMouseEnter('easy')}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleSelect('easy')}
        >
          <h2>Easy</h2>
          {effectiveSelection === 'easy' &&
            <DifficultyDetails
              difficulty="easy"
              chatName={sessionName}
              onChatNameChange={handleSessionNameChange}
            />
          }
        </div>
        <div
          className="difficulty-card"
          onMouseEnter={() => handleMouseEnter('medium')}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleSelect('medium')}
        >
          <h2>Medium</h2>
          {effectiveSelection === 'medium' &&
            <DifficultyDetails
              difficulty="medium"
              chatName={sessionName}
              onChatNameChange={handleSessionNameChange}
            />
          }
        </div>
        <div
          className="difficulty-card"
          onMouseEnter={() => handleMouseEnter('hard')}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleSelect('hard')}
        >
          <h2>Hard</h2>
          {effectiveSelection === 'hard' &&
            <DifficultyDetails
              difficulty="hard"
              chatName={sessionName}
              onChatNameChange={handleSessionNameChange}
            />
          }
        </div>
        <div
          className="difficulty-card"
          onMouseEnter={() => handleMouseEnter('custom')}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleSelect('custom')}
        >
          <h2>Custom</h2>
          {effectiveSelection === 'custom' &&
            <CustomDifficultyDetails
              chatName={sessionName}
              onChatNameChange={handleSessionNameChange}
            />
          }
        </div>
      </div>

      {/* Job Description Section */}
      <div className="job-description-section">
        <h3>Add Job Description (Optional)</h3>
        <p className="job-description-hint">
          Paste a LinkedIn job URL or enter a job description to get role-specific interview questions
        </p>
        <div className="job-description-input-container">
          <textarea
            className="job-description-input"
            placeholder="Paste LinkedIn URL or job description here..."
            value={jobDescription}
            onChange={handleJobDescriptionChange}
            rows={4}
          />
          {!jobAnalysis || jobAnalysis.error ? (
            <button
              className="analyze-job-btn"
              onClick={handleAnalyzeJob}
              disabled={!jobDescription.trim() || isAnalyzingJob}
            >
              {isAnalyzingJob ? 'Analyzing...' : 'Analyze Job Description'}
            </button>
          ) : (
            <button
              className="view-analysis-btn"
              onClick={handleViewAnalysis}
            >
              📊 View Detailed Analysis
            </button>
          )}
        </div>

        {/* Job Analysis Results */}
        {jobAnalysis && !jobAnalysis.error && (
          <div className="job-analysis-results">
            <h4>Job Analysis Summary</h4>
            <p>The AI has analyzed your job description and will generate role-specific interview questions.</p>

            <div className="job-details">
              {jobAnalysis.role && (
                <div className="job-detail-item">
                  <h5>Role</h5>
                  <p>{jobAnalysis.role}</p>
                </div>
              )}
              {jobAnalysis.company && (
                <div className="job-detail-item">
                  <h5>Company</h5>
                  <p>{jobAnalysis.company}</p>
                </div>
              )}
              {jobAnalysis.keyResponsibilities && (
                <div className="job-detail-item">
                  <h5>Key Responsibilities</h5>
                  <p>{jobAnalysis.keyResponsibilities}</p>
                </div>
              )}
              {jobAnalysis.requiredSkills && (
                <div className="job-detail-item">
                  <h5>Required Skills</h5>
                  <p>{jobAnalysis.requiredSkills}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {jobAnalysis && jobAnalysis.error && (
          <div className="job-analysis-results">
            <h4>Analysis Error</h4>
            <div className="error-message">
              <p>{jobAnalysis.error}</p>
              <p style={{ marginTop: '10px', fontSize: '12px', color: '#aaa' }}>
                Tip: Try copying the job description text directly instead of using the LinkedIn URL, or check if the URL is accessible.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DifficultySelection; 