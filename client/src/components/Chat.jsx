import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';

export default function Chat({ messages, sendMessage, isLoading }) {
  const [input, setInput] = useState('');
  const endOfMessagesRef = useRef(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-900 relative">
      <div className="flex-1 overflow-y-auto p-8 pt-12 pb-32">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          {messages.length === 0 ? (
            <div className="mt-32 text-center text-gray-500">
              <h2 className="text-2xl font-light mb-2">How can I help you today?</h2>
              <p>Ask about your documents, tasks, or recent emails.</p>
            </div>
          ) : (
            <div className="w-full flex flex-col space-y-4">
              {messages.map((msg, idx) => (
                <Message key={idx} role={msg.role} content={msg.content} />
              ))}
              <div ref={endOfMessagesRef} />
            </div>
          )}
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Personal Life OS..."
              className="w-full bg-gray-800 border border-gray-700 rounded-full py-4 pl-6 pr-16 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-gray-100 shadow-lg"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 bg-[var(--color-accent)] hover:bg-teal-600 text-gray-900 rounded-full px-6 font-semibold transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
