import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import LoginPage from './components/LoginPage';

import { useChat } from './hooks/useChat';
import { API_URL } from './config';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  const { chats, activeChat, createNewChat, switchChat, deleteChat, sendMessage, isLoading } = useChat();

  useEffect(() => {
    fetch(`${API_URL}/api/auth/status`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setIsAuthenticated(data.authenticated))
      .catch(err => {
        console.error("Auth check failed", err);
        setIsAuthenticated(false);
      });
  }, []);

  if (isAuthenticated === null) {
    return <div className="flex h-screen w-screen items-center justify-center bg-gray-900"><div className="animate-pulse text-gray-500">Loading...</div></div>;
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-900 text-gray-100 font-sans selection:bg-[var(--color-accent)] selection:text-gray-900">
      <Sidebar
        chats={chats}
        activeChatId={activeChat?.id}
        createNewChat={createNewChat}
        switchChat={switchChat}
        deleteChat={deleteChat}
      />

      <Chat
        messages={activeChat?.messages || []}
        sendMessage={sendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}

export default App;
