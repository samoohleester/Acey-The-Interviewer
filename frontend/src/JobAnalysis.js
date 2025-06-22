import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './JobAnalysis.css';

const questionTypes = [
    'Common Questions',
    'Behavioral & Situational',
    'Technical Questions',
    'All Types',
    'Leadership & Management',
    'Problem Solving',
    'Communication Skills',
    'Team Collaboration'
];

const timeLimits = [
    'No Time Limit',
    '5 seconds per answer',
    '10 seconds per answer',
    '15 seconds per answer',
    '30 seconds per answer',
    '1 minute per answer',
    '2 minutes per answer'
];

const curveballs = [
    'None',
    'Ask to clarify',
    'In-depth clarification',
    'Follow-up questions',
    'Role-play scenarios',
    'Stress testing',
    'Hypothetical situations',
    'Past experience validation'
];

const JobAnalysis = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { jobAnalysis, jobDescription } = location.state || {};

    const [config, setConfig] = useState({
        sessionName: '',
        questionType: 'Common Questions',
        timeLimit: 'No Time Limit',
        curveballs: 'None'
    });
    const [inputJobDescription, setInputJobDescription] = useState(jobDescription || '');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(jobAnalysis || null);
    const [error, setError] = useState('');

    const handleConfigChange = (e) => {
        const { name, value } = e.target;
        setConfig(prevConfig => ({ ...prevConfig, [name]: value }));
    };

    const analyzeJobDescription = async (description) => {
        setIsAnalyzing(true);
        setError('');
        setAnalysisResult(null);

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
                setAnalysisResult(data);
            } else {
                console.error('Failed to analyze job description');
                setError(data.error || 'Failed to analyze job description');
            }
        } catch (error) {
            console.error('Error analyzing job description:', error);
            setError('Error analyzing job description. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAnalyze = () => {
        if (inputJobDescription.trim()) {
            analyzeJobDescription(inputJobDescription);
        } else {
            setError('Please enter a job description to analyze.');
        }
    };

    const handleStartAnalysisInterview = () => {
        navigate('/demo/conversation', {
            state: {
                difficulty: 'custom',
                customConfig: {
                    ...config,
                    difficulty: 'custom',
                },
                jobAnalysis: analysisResult,
            }
        });
    };

    const handleBackToSelection = () => {
        navigate('/demo', {
            state: {
                jobDescription: inputJobDescription,
                jobAnalysis: analysisResult
            }
        });
    };

    // If we have analysis results, show them
    if (analysisResult) {
        return (
            <div className="job-analysis-container">
                <div className="job-analysis-header">
                    <button onClick={() => setAnalysisResult(null)} className="back-btn">
                        ← Back to Job Description
                    </button>
                    <h1>Job Analysis Results</h1>
                    <button onClick={handleStartAnalysisInterview} className="start-interview-btn">
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
                            <p>{analysisResult.role || 'Not specified'}</p>
                        </div>

                        <div className="job-detail-card primary">
                            <h3>🏢 Company</h3>
                            <p>{analysisResult.company || 'Not specified'}</p>
                        </div>

                        <div className="job-detail-card">
                            <h3>📋 Key Responsibilities</h3>
                            <p>{analysisResult.keyResponsibilities || 'Responsibilities will be assessed during the interview'}</p>
                        </div>

                        <div className="job-detail-card">
                            <h3>🛠️ Required Skills</h3>
                            <p>{analysisResult.requiredSkills || 'Skills will be evaluated during the interview'}</p>
                        </div>

                        <div className="job-detail-card">
                            <h3>📊 Experience Level</h3>
                            <p>{analysisResult.experienceLevel || 'Not specified'}</p>
                        </div>

                        <div className="job-detail-card">
                            <h3>🏭 Industry</h3>
                            <p>{analysisResult.industry || 'Not specified'}</p>
                        </div>
                    </div>

                    <div className="interview-focus-section">
                        <h3>🎯 Interview Focus</h3>
                        <div className="focus-content">
                            <p>{analysisResult.interviewFocus || 'Focus on general interview skills and experience'}</p>
                        </div>
                    </div>

                    <div className="interview-preview">
                        <h3>📝 What to Expect</h3>
                        <div className="preview-content">
                            <ul>
                                <li><strong>Role-Specific Questions:</strong> Questions tailored to {analysisResult.role || 'this position'}</li>
                                <li><strong>Behavioral Scenarios:</strong> Situations relevant to {analysisResult.industry || 'the industry'}</li>
                                <li><strong>Skill Assessment:</strong> Evaluation of {analysisResult.requiredSkills ? 'required skills' : 'relevant skills'}</li>
                                <li><strong>Experience Validation:</strong> Verification of {analysisResult.experienceLevel || 'appropriate'} level experience</li>
                            </ul>
                        </div>
                    </div>

                    <div className="action-buttons">
                        <button onClick={() => setAnalysisResult(null)} className="secondary-btn">
                            ← Back to Job Description
                        </button>
                        <button onClick={handleStartAnalysisInterview} className="primary-btn">
                            🚀 Start Role-Specific Interview
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Show job description input form
    return (
        <div className="job-analysis-container">
            <div className="job-analysis-header">
                <button onClick={handleBackToSelection} className="back-btn">
                    ← Back to Selection
                </button>
                <h1>Job Analysis Interview</h1>
            </div>

            <div className="job-analysis-content">
                <div className="session-config-section">
                    <h2>Session Configuration</h2>
                    <div className="config-grid">
                        <div className="config-item">
                            <label htmlFor="sessionName">Session Name:</label>
                            <input
                                type="text"
                                id="sessionName"
                                name="sessionName"
                                value={config.sessionName}
                                onChange={handleConfigChange}
                                placeholder="Enter session name..."
                            />
                        </div>
                        <div className="config-item">
                            <label htmlFor="questionType">Question type:</label>
                            <div className="custom-select">
                                <select
                                    id="questionType"
                                    name="questionType"
                                    value={config.questionType}
                                    onChange={handleConfigChange}
                                >
                                    {questionTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="config-item">
                            <label htmlFor="timeLimit">Time Limit:</label>
                            <div className="custom-select">
                                <select
                                    id="timeLimit"
                                    name="timeLimit"
                                    value={config.timeLimit}
                                    onChange={handleConfigChange}
                                >
                                    {timeLimits.map(limit => <option key={limit} value={limit}>{limit}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="config-item">
                            <label htmlFor="curveballs">Curveballs:</label>
                            <div className="custom-select">
                                <select
                                    id="curveballs"
                                    name="curveballs"
                                    value={config.curveballs}
                                    onChange={handleConfigChange}
                                >
                                    {curveballs.map(cb => <option key={cb} value={cb}>{cb}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="job-description-section">
                    <h2>Add Job Description</h2>

                    <div className="job-description-input-container">
                        <textarea
                            value={inputJobDescription}
                            onChange={(e) => setInputJobDescription(e.target.value)}
                            placeholder="Paste your job description here... Include details about the role, responsibilities, required skills, and company information."
                            className="job-description-textarea"
                            rows="12"
                        />

                        {error && <div className="error-message">{error}</div>}

                        <div className="input-actions">
                            <button
                                onClick={handleAnalyze}
                                className="analyze-btn"
                                disabled={isAnalyzing || !inputJobDescription.trim()}
                            >
                                {isAnalyzing ? 'Analyzing...' : 'Analyze Job Description'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="analysis-benefits">
                    <h3>🎯 What You'll Get</h3>
                    <div className="benefits-grid">
                        <div className="benefit-card">
                            <h4>📋 Role-Specific Questions</h4>
                            <p>Questions tailored to the exact position and responsibilities</p>
                        </div>
                        <div className="benefit-card">
                            <h4>🏢 Industry Context</h4>
                            <p>Scenarios relevant to the company's industry and culture</p>
                        </div>
                        <div className="benefit-card">
                            <h4>🛠️ Skill Assessment</h4>
                            <p>Evaluation focused on the required skills and experience</p>
                        </div>
                        <div className="benefit-card">
                            <h4>📊 Personalized Experience</h4>
                            <p>Interview questions that match your target role level</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobAnalysis; 