import React, { useState, useRef, useCallback, useEffect } from 'react';
import Vapi from '@vapi-ai/web';
import Webcam from 'react-webcam';
import './App.css';

// Initialize Vapi with your Public Key
// IMPORTANT: Replace this with your actual Vapi Public Key
const vapi = new Vapi('03ddb274-4754-43a9-a48f-edce472b1f4c');

function App() {
  const [callStatus, setCallStatus] = useState('inactive');
  const [transcript, setTranscript] = useState('');
  const [review, setReview] = useState('');
  const webcamRef = useRef(null);
  const captureIntervalRef = useRef(null);

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

  useEffect(() => {
    // --- Set up Vapi event listeners once ---
    vapi.on('call-start', () => {
      setCallStatus('active');
      setTranscript('');
      console.log('Call has started');
      
      // Capture the first frame immediately, then start the interval.
      sendFrameForAnalysis(); 
      captureIntervalRef.current = setInterval(sendFrameForAnalysis, 15000); // Capture every 15 seconds
    });

    vapi.on('call-end', async () => {
      setCallStatus('inactive');
      console.log('Call has ended');
      clearInterval(captureIntervalRef.current);
      try {
        const reviewResponse = await fetch('http://127.0.0.1:5001/api/get-review');
        const data = await reviewResponse.json();
        setReview(data.review || 'No review was generated.');
      } catch (error) {
        console.error('Error fetching review:', error);
        setReview('Failed to fetch review.');
      }
    });

    vapi.on('message', (message) => {
      if (message.type === 'transcript' && message.transcript) {
        setTranscript((prev) => `${prev}\n${message.role}: ${message.transcript}`);
      }
    });

    vapi.on('error', (e) => {
      setCallStatus('inactive');
      console.error('Call error:', e);
      clearInterval(captureIntervalRef.current);
    });

    // --- Cleanup listeners on component unmount ---
    return () => {
      vapi.removeAllListeners();
    };
  }, [sendFrameForAnalysis]);


  // Function to start a new call
  const startCall = async () => {
    setCallStatus('loading');
    setReview(''); // Clear previous review
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
  const stopCall = async () => {
    vapi.stop();
    // Trigger review generation when manually stopping
    try {
      const reviewResponse = await fetch('http://127.0.0.1:5001/api/trigger-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await reviewResponse.json();
      setReview(data.review || 'No review was generated.');
    } catch (error) {
      console.error('Error fetching review:', error);
      setReview('Failed to fetch review.');
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
            {review && (
              <div className="review-container">
                <h2>Post-Call Review</h2>
                <p>{review}</p>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
