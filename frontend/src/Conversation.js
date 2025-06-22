import React, { useState, useRef, useCallback, useEffect } from 'react';
import Draggable from 'react-draggable';
import { useLocation, useOutletContext, useNavigate } from 'react-router-dom';
import Vapi from '@vapi-ai/web';
import Webcam from 'react-webcam';
import CatAnimation from './CatAnimation';
import { checkAndAwardBadge } from './placeholders';
import './Conversation.css';

const vapi = new Vapi('9ef2dad6-738e-4ba5-830b-a7c5f87dfd2d');

const Conversation = () => {
  const { clearSessionName, selection } = useOutletContext();
  const location = useLocation();
  const navigate = useNavigate();
  const { difficulty } = location.state || {};
  
  // Interview state
  const [callStatus, setCallStatus] = useState('inactive');
  const [transcript, setTranscript] = useState('');
  const [report, setReport] = useState(null);
  const [interviewMode, setInterviewMode] = useState(difficulty || 'easy');
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const webcamRef = useRef(null);
  const captureIntervalRef = useRef(null);
  const nodeRef = useRef(null);
  const speechTimeoutRef = useRef(null);
  const aiActivityRef = useRef(false); // Track if AI is actively responding

  // Use a ref to hold the transcript to avoid stale closures in event handlers
  const transcriptRef = useRef('');
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const sendFrameForAnalysis = useCallback(async () => {
    if (webcamRef.current) {
      console.log('Attempting to capture frame...');
      const frame = webcamRef.current.getScreenshot();
      if (frame) {
        console.log('Frame captured successfully, sending to backend...');
        try {
          const response = await fetch('http://127.0.0.1:5001/api/analyze-frame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ frame }),
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('Frame analysis successful:', result);
          } else {
            console.error('Frame analysis failed with status:', response.status);
            if (response.status === 429) {
              console.log('Rate limit hit. Halting frame analysis for this call.');
              clearInterval(captureIntervalRef.current);
            }
            const errorText = await response.text();
            console.error('Error response:', errorText);
          }
        } catch (error) {
          console.error('Error sending frame for analysis:', error);
        }
      } else {
        console.error('Failed to capture frame from webcam');
      }
    } else {
      console.error('Webcam ref is not available');
    }
  }, []);

  const fetchReview = useCallback(async (finalTranscript) => {
    setReport({ status: 'loading' });
    try {
      const reviewResponse = await fetch('http://127.0.0.1:5001/api/get-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcript: finalTranscript,
          mode: interviewMode 
        }),
      });
      const data = await reviewResponse.json();
      if (reviewResponse.ok) {
        setReport(data);
        
        // Save the completed interview to chat history
        const interviewData = {
          id: Date.now().toString(),
          title: `Interview - ${interviewMode.charAt(0).toUpperCase() + interviewMode.slice(1)} Mode`,
          difficulty: interviewMode,
          score: data.overallScore || 0,
          duration: '15-20 min', // You can calculate actual duration if needed
          date: new Date().toISOString(),
          transcript: finalTranscript,
          report: data
        };
        
        const savedInterviews = JSON.parse(localStorage.getItem('savedInterviews') || '[]');
        savedInterviews.unshift(interviewData); // Add to beginning of array
        localStorage.setItem('savedInterviews', JSON.stringify(savedInterviews));
        
        // Check for badge award
        if (data.overallScore >= 70) {
          checkAndAwardBadge(interviewMode, data.overallScore);
        }
        
      } else {
        setReport({ summary: data.review?.error || 'Failed to generate report.' });
      }
    } catch (error) {
      console.error('Error fetching review:', error);
      setReport({ summary: 'Failed to fetch review.' });
    }
  }, [interviewMode]);

  useEffect(() => {
    const handleCallStart = () => {
      setCallStatus('active');
      setTranscript('');
      setIsAISpeaking(false);
      console.log('Call has started');
      sendFrameForAnalysis();
      captureIntervalRef.current = setInterval(sendFrameForAnalysis, 30000);
    };

    const handleCallEnd = () => {
      setCallStatus('inactive');
      setIsAISpeaking(false);
      aiActivityRef.current = false;
      console.log('Call has ended');
      clearInterval(captureIntervalRef.current);
      fetchReview(transcriptRef.current);
    };

    const handleMessage = (message) => {
      if (
        message.type === 'transcript' &&
        message.transcriptType === 'final' &&
        message.transcript
      ) {
        setTranscript((prev) => `${prev}\n${message.role}: ${message.transcript}`);
        
        if (message.role === 'assistant') {
          aiActivityRef.current = true;
          if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
          }
       
          const timeoutDuration = interviewMode === 'medium' ? 3000 : 2000;
          speechTimeoutRef.current = setTimeout(() => {
            setIsAISpeaking(false);
            aiActivityRef.current = false;
          }, timeoutDuration);
        } else if (message.role === 'user') {

          setIsAISpeaking(true);
          aiActivityRef.current = false;
          if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
          }
   
          const timeoutDuration = interviewMode === 'medium' ? 8000 : 6000;
          speechTimeoutRef.current = setTimeout(() => {
            if (!aiActivityRef.current) {
              setIsAISpeaking(false);
            }
          }, timeoutDuration);
        }
      }
    };

    const handleError = (e) => {
      setCallStatus('inactive');
      setIsAISpeaking(false);
      aiActivityRef.current = false;
      console.error('Call error:', e);
      console.error('Error response details:', e.error);
      console.error('Error status:', e.status);
      console.error('Full error object:', JSON.stringify(e, null, 2));
      console.error('Error message:', e.error?.message);
      console.error('Error type:', typeof e.error);
      clearInterval(captureIntervalRef.current);
    };

    vapi.on('call-start', handleCallStart);
    vapi.on('call-end', handleCallEnd);
    vapi.on('message', handleMessage);
    vapi.on('error', handleError);

    return () => {
      vapi.off('call-start', handleCallStart);
      vapi.off('call-end', handleCallEnd);
      vapi.off('message', handleMessage);
      vapi.off('error', handleError);
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };
  }, [sendFrameForAnalysis, fetchReview]);

  // Function to start a new call
  const startCall = async () => {
    setCallStatus('loading');
    setReport(null);
    try {
      const response = await fetch(`http://127.0.0.1:5001/api/vapi-assistant?mode=${interviewMode}`);
      if (!response.ok) throw new Error(`Backend error: ${response.statusText}`);
      const { assistantId } = await response.json();
      if (!assistantId) throw new Error('Assistant ID not received from backend.');
      
      console.log('Starting VAPI call with assistant ID:', assistantId);
      console.log('Interview mode:', interviewMode);
      
      vapi.start(assistantId);
    } catch (error) {
      console.error('Failed to start call:', error);
      console.error('Error details:', error.message);
      setCallStatus('inactive');
    }
  };
  const stopCall = () => {
    vapi.stop();
  };

  const viewReport = () => {
    if (report) {
      localStorage.setItem('currentReport', JSON.stringify(report));
      window.open('/report', '_blank');
    }
  };

  const saveToHistory = () => {
    if (transcript && report && report.overallScore != null) {
      const interviewData = {
        id: Date.now().toString(),
        title: `Interview - ${interviewMode.charAt(0).toUpperCase() + interviewMode.slice(1)} Mode`,
        difficulty: interviewMode,
        score: report.overallScore,
        duration: '15-20 min',
        date: new Date().toISOString(),
        transcript: transcript,
        report: report
      };
      
      const savedInterviews = JSON.parse(localStorage.getItem('savedInterviews') || '[]');
      savedInterviews.unshift(interviewData);
      localStorage.setItem('savedInterviews', JSON.stringify(savedInterviews));
      
      // Show a brief success message
      alert('Interview saved to history!');
    }
  };

  useEffect(() => {
    if (difficulty) {
      setInterviewMode(difficulty);
      clearSessionName();
    }
  }, [difficulty, clearSessionName]);

  return (
    <div className="conversation-container">
      <div className="video-panel">
        <div className="main-video-view">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="webcam-video"
          />
          <div className="video-overlay">
            <div className="status-indicator">
              <span className={`status-dot ${callStatus}`}></span>
              <span className="status-text">
                {callStatus === 'inactive' && 'Ready to Start'}
                {callStatus === 'loading' && 'Connecting...'}
                {callStatus === 'active' && 'Interview Active'}
              </span>
            </div>
            <div className="mode-indicator">
              Mode: {interviewMode.toUpperCase()}
            </div>
          </div>
        </div>
        
        <Draggable nodeRef={nodeRef} bounds="parent">
          <div ref={nodeRef} className="mini-video-view">
            <CatAnimation 
              isSpeaking={isAISpeaking} 
              callStatus={callStatus}
              interviewMode={interviewMode}
            />
          </div>
        </Draggable>
        
        <div className="start-conversation-wrapper">
          {callStatus !== 'active' ? (
            <button 
              className="start-conversation-btn"
              onClick={startCall} 
              disabled={callStatus === 'loading'}
            >
              {callStatus === 'loading' ? 'Connecting...' : 'Start Conversation'}
            </button>
          ) : (
            <button 
              className="stop-conversation-btn"
              onClick={stopCall}
            >
              Stop Conversation
            </button>
          )}
        </div>
      </div>
      
      <div className="transcript-panel">
        <div className="transcript-header">
          <h3>Interview Transcript</h3>
          <div className="transcript-controls">
            {report && report.status === 'loading' && (
              <span className="loading-indicator">Generating report...</span>
            )}
            {report && report.overallScore != null && (
              <>
                <button onClick={viewReport} className="view-report-btn">
                  View Report
                </button>
                <button onClick={saveToHistory} className="save-history-btn">
                  Save to History
                </button>
              </>
            )}
          </div>
        </div>
        <div className="transcript-content">
          {transcript ? (
            <div className="transcript-text">
              {transcript.split('\n').map((line, index) => (
                <div key={index} className="transcript-line">
                  {line}
                </div>
              ))}
            </div>
          ) : (
            <div className="transcript-placeholder">
              <p>Your conversation will appear here...</p>
            </div>
          )}
        </div>
        {report && report.summary && report.overallScore == null && (
          <div className="error-message">
            <p>{report.summary}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversation; 