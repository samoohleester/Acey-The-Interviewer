import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomDifficultyDetails.css';

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
    '30 seconds per answer',
    '15 seconds per answer',
    '10 seconds per answer',
    '5 seconds per answer',
    '2 minutes per answer',
    '1 minute per answer'
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

const CustomDifficultyDetails = ({ chatName, onChatNameChange }) => {
    const [inputValue, setInputValue] = useState('');
    const [selectedQuestionType, setSelectedQuestionType] = useState('Common Questions');
    const [selectedTimeLimit, setSelectedTimeLimit] = useState('No Time Limit');
    const [selectedCurveballs, setSelectedCurveballs] = useState('None');
    const [showQuestionTypeDropdown, setShowQuestionTypeDropdown] = useState(false);
    const [showTimeLimitDropdown, setShowTimeLimitDropdown] = useState(false);
    const [showCurveballsDropdown, setShowCurveballsDropdown] = useState(false);
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
            curveballs: selectedCurveballs,
            sessionName: inputValue
        };

        onChatNameChange('custom', inputValue);
        navigate('/demo/conversation', {
            state: {
                difficulty: 'custom',
                customConfig: customConfig
            }
        });
    };

    const handleDropdownClick = (dropdownType, e) => {
        e.stopPropagation();
        setShowQuestionTypeDropdown(dropdownType === 'questionType');
        setShowTimeLimitDropdown(dropdownType === 'timeLimit');
        setShowCurveballsDropdown(dropdownType === 'curveballs');
    };

    const handleOptionSelect = (option, type) => {
        switch (type) {
            case 'questionType':
                setSelectedQuestionType(option);
                setShowQuestionTypeDropdown(false);
                break;
            case 'timeLimit':
                setSelectedTimeLimit(option);
                setShowTimeLimitDropdown(false);
                break;
            case 'curveballs':
                setSelectedCurveballs(option);
                setShowCurveballsDropdown(false);
                break;
            default:
                break;
        }
    };

    return (
        <div className="custom-difficulty-details" onClick={(e) => e.stopPropagation()}>
            <div className="form-row">
                <label htmlFor="sessionName-custom">Session Name:</label>
                <input
                    type="text"
                    id="sessionName-custom"
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
                        onClick={(e) => handleDropdownClick('questionType', e)}
                    >
                        {selectedQuestionType} ▼
                    </button>
                    {showQuestionTypeDropdown && (
                        <div className="dropdown-menu">
                            {questionTypes.map((type) => (
                                <div
                                    key={type}
                                    className="dropdown-item"
                                    onClick={() => handleOptionSelect(type, 'questionType')}
                                >
                                    {type}
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
                        onClick={(e) => handleDropdownClick('timeLimit', e)}
                    >
                        {selectedTimeLimit} ▼
                    </button>
                    {showTimeLimitDropdown && (
                        <div className="dropdown-menu">
                            {timeLimits.map((limit) => (
                                <div
                                    key={limit}
                                    className="dropdown-item"
                                    onClick={() => handleOptionSelect(limit, 'timeLimit')}
                                >
                                    {limit}
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
                        onClick={(e) => handleDropdownClick('curveballs', e)}
                    >
                        {selectedCurveballs} ▼
                    </button>
                    {showCurveballsDropdown && (
                        <div className="dropdown-menu">
                            {curveballs.map((curveball) => (
                                <div
                                    key={curveball}
                                    className="dropdown-item"
                                    onClick={() => handleOptionSelect(curveball, 'curveballs')}
                                >
                                    {curveball}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {inputValue.trim() && (
                <button className="continue-btn" onClick={handleContinue}>
                    Continue
                </button>
            )}
        </div>
    );
};

export default CustomDifficultyDetails; 