import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './JobAnalysis.css';

const JobAnalysis = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { jobAnalysis, jobDescription, difficulty, sessionName } = location.state || {};

    const handleStartInterview = () => {
        navigate('/demo/conversation', {
            state: {
                difficulty: difficulty || 'easy',
                customConfig: difficulty === 'custom' ? {
                    difficulty: 'custom',
                    questionType: 'Common Questions',
                    timeLimit: 'No Time Limit',
                    curveballs: 'None',
                    sessionName: sessionName || 'Custom Interview'
                } : null,
                jobAnalysis: jobAnalysis
            }
        });
    };

    const handleBackToSelection = () => {
        navigate('/demo', {
            state: {
                jobDescription: jobDescription,
                jobAnalysis: jobAnalysis
            }
        });
    };

    if (!jobAnalysis) {
        return (
            <div className="job-analysis-container">
                <div className="job-analysis-content">
                    <h2>No Job Analysis Available</h2>
                    <p>Please go back and analyze a job description first.</p>
                    <button onClick={handleBackToSelection} className="back-btn">
                        Back to Difficulty Selection
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="job-analysis-container">
            <div className="job-analysis-header">
                <button onClick={handleBackToSelection} className="back-btn">
                    ← Back to Selection
                </button>
                <h1>Job Analysis Results</h1>
                <button onClick={handleStartInterview} className="start-interview-btn">
                    Start Role-Specific Interview
                </button>
            </div>

            <div className="job-analysis-content">
                <div className="analysis-summary">
                    <h2>Analysis Summary</h2>
                    <p className="summary-description">
                        The AI has analyzed your job description and will generate role-specific interview questions based on the extracted information.
                    </p>
                </div>

                <div className="job-details-grid">
                    <div className="job-detail-card primary">
                        <h3>🎯 Target Role</h3>
                        <p>{jobAnalysis.role || 'Not specified'}</p>
                    </div>

                    <div className="job-detail-card primary">
                        <h3>🏢 Company</h3>
                        <p>{jobAnalysis.company || 'Not specified'}</p>
                    </div>

                    <div className="job-detail-card">
                        <h3>📋 Key Responsibilities</h3>
                        <p>{jobAnalysis.keyResponsibilities || 'Responsibilities will be assessed during the interview'}</p>
                    </div>

                    <div className="job-detail-card">
                        <h3>🛠️ Required Skills</h3>
                        <p>{jobAnalysis.requiredSkills || 'Skills will be evaluated during the interview'}</p>
                    </div>

                    <div className="job-detail-card">
                        <h3>📊 Experience Level</h3>
                        <p>{jobAnalysis.experienceLevel || 'Not specified'}</p>
                    </div>

                    <div className="job-detail-card">
                        <h3>🏭 Industry</h3>
                        <p>{jobAnalysis.industry || 'Not specified'}</p>
                    </div>
                </div>

                <div className="interview-focus-section">
                    <h3>🎯 Interview Focus</h3>
                    <div className="focus-content">
                        <p>{jobAnalysis.interviewFocus || 'Focus on general interview skills and experience'}</p>
                    </div>
                </div>

                <div className="interview-preview">
                    <h3>📝 What to Expect</h3>
                    <div className="preview-content">
                        <ul>
                            <li><strong>Role-Specific Questions:</strong> Questions tailored to {jobAnalysis.role || 'this position'}</li>
                            <li><strong>Behavioral Scenarios:</strong> Situations relevant to {jobAnalysis.industry || 'the industry'}</li>
                            <li><strong>Skill Assessment:</strong> Evaluation of {jobAnalysis.requiredSkills ? 'required skills' : 'relevant skills'}</li>
                            <li><strong>Experience Validation:</strong> Verification of {jobAnalysis.experienceLevel || 'appropriate'} level experience</li>
                        </ul>
                    </div>
                </div>

                <div className="action-buttons">
                    <button onClick={handleBackToSelection} className="secondary-btn">
                        ← Back to Selection
                    </button>
                    <button onClick={handleStartInterview} className="primary-btn">
                        🚀 Start Role-Specific Interview
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JobAnalysis; 