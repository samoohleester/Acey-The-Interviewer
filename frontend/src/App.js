import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import Demo from './Demo';
import DifficultySelection from './DifficultySelection';
import Conversation from './Conversation';
import Report from './Report';
import { Trash, ChatHistory, Profile, Support } from './placeholders';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/demo" element={<Demo />}>
        <Route index element={<DifficultySelection />} />
        <Route path="conversation" element={<Conversation />} />
        <Route path="trash" element={<Trash />} />
        <Route path="history" element={<ChatHistory />} />
        <Route path="profile" element={<Profile />} />
        <Route path="support" element={<Support />} />
      </Route>
      <Route path="/report" element={<Report />} />
    </Routes>
  );
}

export default App;
