import React, { useState } from 'react';
import Vapi from '@vapi-ai/web';
import './App.css';

// Initialize Vapi with your Public Key
// IMPORTANT: Replace this with your actual Vapi Public Key
const vapi = new Vapi('03ddb274-4754-43a9-a48f-edce472b1f4c');

function App() {
  const [callStatus, setCallStatus] = useState('inactive');
  const [transcript, setTranscript] = useState('');

  // Function to start a new call
  const startCall = async () => {
    setCallStatus('loading');
    try {
      // Fetch the assistant configuration from your backend
      const response = await fetch('http://127.0.0.1:5001/api/vapi-assistant');
      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`);
      }
      const { assistantId } = await response.json();

      if (!assistantId) {
        throw new Error('Assistant ID not received from backend.');
      }
      
      // Start the call with the fetched assistant ID
      const call = vapi.start(assistantId);

      // --- Set up event listeners ---
      call.on('call-start', () => {
        setCallStatus('active');
        setTranscript('');
        console.log('Call has started');
      });

      call.on('call-end', () => {
        setCallStatus('inactive');
        console.log('Call has ended');
      });

      call.on('message', (message) => {
        if (message.type === 'transcript' && message.transcript) {
          setTranscript(prev => `${prev}\n${message.role}: ${message.transcript}`);
        }
      });
      
      call.on('error', (e) => {
        setCallStatus('inactive');
        console.error('Call error:', e);
      });

    } catch (error) {
      console.error('Failed to start call:', error);
      setCallStatus('inactive');
    }
  };

  // Function to stop the call
  const stopCall = () => {
    vapi.stop();
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Acey-The-Interviewer</h1>
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
      </header>
    </div>
  );
}

export default App;
