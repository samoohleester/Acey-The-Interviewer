import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import Demo from './Demo';
import DifficultySelection from './DifficultySelection';
import Conversation from './Conversation';
import { Trash, ChatHistory, Profile, Support } from './placeholders';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/demo" element={<Demo />}>
          <Route index element={<DifficultySelection />} />
          <Route path="conversation" element={<Conversation />} />
          <Route path="trash" element={<Trash />} />
          <Route path="history" element={<ChatHistory />} />
          <Route path="profile" element={<Profile />} />
          <Route path="support" element={<Support />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
