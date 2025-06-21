import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Note: The backend runs on port 5000 by default.
    fetch('http://127.0.0.1:5000/api/data')
      .then(res => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then(data => setData(data.message))
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
        setData('Failed to load data from backend.');
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Acey-The-Interviewer</h1>
        <p>{data ? data : 'Loading from backend...'}</p>
      </header>
    </div>
  );
}

export default App;
