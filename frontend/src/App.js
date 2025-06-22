import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Vapi from '@vapi-ai/web';
import Webcam from 'react-webcam';
import './App.css';

// Initialize Vapi with your Public Key
// IMPORTANT: Replace this with your actual Vapi Public Key
const vapi = new Vapi('03ddb274-4754-43a9-a48f-edce472b1f4c');

function App() {
  const [callStatus, setCallStatus] = useState('inactive');
  const [transcript, setTranscript] = useState('');
  const [report, setReport] = useState(null);
  const webcamRef = useRef(null);
  const captureIntervalRef = useRef(null);
  const navigate = useNavigate();

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
            // If we hit a rate limit, stop sending frames.
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
        body: JSON.stringify({ transcript: finalTranscript }),
      });
      const data = await reviewResponse.json();
      if (reviewResponse.ok) {
        setReport(data);
      } else {
        setReport({ summary: data.review?.error || 'Failed to generate report.' });
      }
    } catch (error) {
      console.error('Error fetching review:', error);
      setReport({ summary: 'Failed to fetch review.' });
    }
  }, []);

  useEffect(() => {
    const handleCallStart = () => {
      setCallStatus('active');
      setTranscript('');
      console.log('Call has started');
      sendFrameForAnalysis();
      captureIntervalRef.current = setInterval(sendFrameForAnalysis, 30000);
    };

    const handleCallEnd = () => {
      setCallStatus('inactive');
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
      }
    };

    const handleError = (e) => {
      setCallStatus('inactive');
      console.error('Call error:', e);
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
    };
  }, [sendFrameForAnalysis, fetchReview]);

  // Function to start a new call
  const startCall = async () => {
    setCallStatus('loading');
    setReport(null);
    try {
      const response = await fetch('http://127.0.0.1:5001/api/vapi-assistant');
      if (!response.ok) throw new Error(`Backend error: ${response.statusText}`);
      const { assistantId } = await response.json();
      if (!assistantId) throw new Error('Assistant ID not received from backend.');
      
      vapi.start(assistantId);
    } catch (error) {
      console.error('Failed to start call:', error);
      setCallStatus('inactive');
    }
  };

  // Function to stop the call
  const stopCall = () => {
    vapi.stop();
  };

  const viewReport = () => {
    if (report) {
      navigate('/report', { state: { report } });
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Acey-The-Interviewer</h1>
        <div className="main-content">
          <div className="conversation-container">
            <div className="status-container">
              <p>Call Status: {callStatus}</p>
            </div>
            <div className="button-container">
              {callStatus !== 'active' ? (
                <button onClick={startCall} disabled={callStatus === 'loading'}>
                  {callStatus === 'loading' ? 'Connecting...' : 'Start Conversation'}
                </button>
              ) : (
                <button onClick={stopCall}>
                  Stop Conversation
                </button>
              )}
            </div>
            <div className="transcript-container">
              <h2>Transcript</h2>
              <textarea
                value={transcript}
                readOnly
                placeholder="Conversation will appear here..."
              />
            </div>
          </div>
          <div className="video-container">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
            />
            <div className="review-container">
              {report && report.status === 'loading' && (
                  <p>Generating your report...</p>
              )}
              {report && report.overallScore != null && (
                  <button onClick={viewReport} className="report-button">
                    View Your Interview Report
                  </button>
              )}
               {report && report.summary && report.overallScore == null && (
                  <p>{report.summary}</p>
              )}
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
