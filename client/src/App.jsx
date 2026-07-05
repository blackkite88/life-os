import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import WeeklyReview from './components/WeeklyReview';

function App() {
  const [showReview, setShowReview] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-900 text-gray-100 font-sans selection:bg-[var(--color-accent)] selection:text-gray-900">
      <Sidebar onReviewClick={() => setShowReview(true)} />
      
      {showReview ? (
        <WeeklyReview onClose={() => setShowReview(false)} />
      ) : (
        <Chat />
      )}
    </div>
  );
}

export default App;
