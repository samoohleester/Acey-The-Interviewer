import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomDifficultyDetails.css';

const questionTypeOptions = [
    'Common Questions',
    'Behavioral & Situational',
    'Technical Questions',
    'All Types',
    'Leadership & Management',
    'Problem Solving',
    'Communication Skills',
    'Team Collaboration'
];

const timeLimitOptions = [
    'No Time Limit',
    '30 seconds per answer',
    '15 seconds per answer',
    '10 seconds per answer',
    '5 seconds per answer',
    '2 minutes per answer',
    '1 minute per answer'
];

const curveballOptions = [
    'None',
    'Ask to clarify',
    'In-depth clarification',
    'Follow-up questions',
    'Role-play scenarios',
    'Stress testing',
    'Hypothetical situations',
    'Past experience validation'
];

const CustomDifficultyDetails = ({ difficulty, chatName, onChatNameChange }) => {
    const [inputValue, setInputValue] = useState('');
    const [selectedQuestionType, setSelectedQuestionType] = useState('Common Questions');
    const [selectedTimeLimit, setSelectedTimeLimit] = useState('No Time Limit');
    const [selectedCurveball, setSelectedCurveball] = useState('None');
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [jobDescription, setJobDescription] = useState('');
    const [jobDescriptionInput, setJobDescriptionInput] = useState('');
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [isLoadingJob, setIsLoadingJob] = useState(false);
    const [jobDescriptionSource, setJobDescriptionSource] = useState('none'); // 'none', 'text', 'linkedin'
    const navigate = useNavigate();

    useEffect(() => {
        if (chatName) {
            setInputValue(chatName);
        }
    }, [chatName]);

    const handleContinue = () => {
        const customConfig = {
            difficulty: 'custom',
            questionType: selectedQuestionType,
            timeLimit: selectedTimeLimit,
            curveballs: selectedCurveball,
            sessionName: inputValue,
            jobDescription: jobDescription,
            jobDescriptionSource: jobDescriptionSource
        };

        onChatNameChange(difficulty, inputValue, customConfig);
        navigate('/demo/conversation', {
            state: {
                difficulty: difficulty,
                customConfig: customConfig
            }
        });
    };

    const toggleDropdown = (dropdownType) => {
        setActiveDropdown(activeDropdown === dropdownType ? null : dropdownType);
    };

    const handleOptionSelect = (type, value) => {
        switch (type) {
            case 'questionType':
                setSelectedQuestionType(value);
                break;
            case 'timeLimit':
                setSelectedTimeLimit(value);
                break;
            case 'curveball':
                setSelectedCurveball(value);
                break;
            default:
                break;
        }
        setActiveDropdown(null);
    };

    const handleLinkedinUrlSubmit = async () => {
        if (!linkedinUrl.trim()) return;

        setIsLoadingJob(true);
        try {
            const response = await fetch('http://127.0.0.1:5001/api/parse-linkedin-job', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: linkedinUrl })
            });

            if (response.ok) {
                const data = await response.json();
                setJobDescription(data.jobDescription);
                setJobDescriptionSource('linkedin');
                setLinkedinUrl('');
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to parse LinkedIn job posting. Please try copying the job description manually.');
            }
        } catch (error) {
            console.error('Error parsing LinkedIn URL:', error);
            alert('Failed to parse LinkedIn job posting. Please try copying the job description manually.');
        } finally {
            setIsLoadingJob(false);
        }
    };

    const handleJobDescriptionChange = (e) => {
        setJobDescriptionInput(e.target.value);
    };

    const handleJobDescriptionSubmit = () => {
        if (jobDescriptionInput.trim()) {
            setJobDescription(jobDescriptionInput);
            setJobDescriptionSource('text');
            setJobDescriptionInput('');
        }
    };

    const clearJobDescription = () => {
        setJobDescription('');
        setJobDescriptionInput('');
        setLinkedinUrl('');
        setJobDescriptionSource('none');
    };

    return (
        <div className="custom-difficulty-details" onClick={(e) => e.stopPropagation()}>
            <div className="form-row">
                <label htmlFor={`sessionName-${difficulty}`}>Session Name:</label>
                <input
                    type="text"
                    id={`sessionName-${difficulty}`}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter session name..."
                />
            </div>

            <div className="form-row">
                <label>Question type:</label>
                <div className="dropdown-container">
                    <button
                        className="option-btn dropdown-btn"
                        onClick={() => toggleDropdown('questionType')}
                    >
                        {selectedQuestionType}
                        <span className="dropdown-arrow">▼</span>
                    </button>
                    {activeDropdown === 'questionType' && (
                        <div className="dropdown-menu">
                            {questionTypeOptions.map((option) => (
                                <div
                                    key={option}
                                    className="dropdown-item"
                                    onClick={() => handleOptionSelect('questionType', option)}
                                >
                                    {option}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="form-row">
                <label>Time Limit:</label>
                <div className="dropdown-container">
                    <button
                        className="option-btn dropdown-btn"
                        onClick={() => toggleDropdown('timeLimit')}
                    >
                        {selectedTimeLimit}
                        <span className="dropdown-arrow">▼</span>
                    </button>
                    {activeDropdown === 'timeLimit' && (
                        <div className="dropdown-menu">
                            {timeLimitOptions.map((option) => (
                                <div
                                    key={option}
                                    className="dropdown-item"
                                    onClick={() => handleOptionSelect('timeLimit', option)}
                                >
                                    {option}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="form-row">
                <label>Curveballs:</label>
                <div className="dropdown-container">
                    <button
                        className="option-btn dropdown-btn"
                        onClick={() => toggleDropdown('curveball')}
                    >
                        {selectedCurveball}
                        <span className="dropdown-arrow">▼</span>
                    </button>
                    {activeDropdown === 'curveball' && (
                        <div className="dropdown-menu">
                            {curveballOptions.map((option) => (
                                <div
                                    key={option}
                                    className="dropdown-item"
                                    onClick={() => handleOptionSelect('curveball', option)}
                                >
                                    {option}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Job Description Section */}
            <div className="job-description-section">
                <div className="section-header">
                    <label>Job Description (Optional):</label>
                    {jobDescription && (
                        <button
                            className="clear-btn"
                            onClick={clearJobDescription}
                            title="Clear job description"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {!jobDescription && (
                    <div className="job-input-methods">
                        <div className="linkedin-input">
                            <input
                                type="url"
                                value={linkedinUrl}
                                onChange={(e) => setLinkedinUrl(e.target.value)}
                                placeholder="Paste LinkedIn job URL..."
                                className="linkedin-url-input"
                            />
                            <button
                                className="parse-btn"
                                onClick={handleLinkedinUrlSubmit}
                                disabled={isLoadingJob || !linkedinUrl.trim()}
                            >
                                {isLoadingJob ? 'Loading...' : 'Parse'}
                            </button>
                        </div>
                        <div className="or-divider">OR</div>
                        <div className="manual-input">
                            <textarea
                                value={jobDescriptionInput}
                                onChange={handleJobDescriptionChange}
                                placeholder="Paste job description here..."
                                className="job-description-textarea"
                                rows="3"
                            />
                            <button
                                className="submit-btn"
                                onClick={handleJobDescriptionSubmit}
                                disabled={!jobDescriptionInput.trim()}
                            >
                                Add Description
                            </button>
                        </div>
                    </div>
                )}

                {jobDescription && (
                    <div className="job-description-display">
                        <div className="job-source-indicator">
                            {jobDescriptionSource === 'linkedin' ? '📄 LinkedIn Job' : '📝 Manual Input'}
                        </div>
                        <div className="job-description-content">
                            {jobDescription.length > 200
                                ? `${jobDescription.substring(0, 200)}...`
                                : jobDescription
                            }
                        </div>
                        <button
                            className="view-full-btn"
                            onClick={() => alert(jobDescription)}
                        >
                            View Full Description
                        </button>
                    </div>
                )}
            </div>

            {inputValue.trim() && (
                <button className="continue-btn" onClick={handleContinue}>
                    Start Custom Interview
                </button>
            )}
        </div>
    );
};

export default CustomDifficultyDetails; 