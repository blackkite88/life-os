import React from 'react';

export default function Sidebar({ onReviewClick, chats = [], activeChatId, createNewChat, switchChat, deleteChat }) {


  return (
    <div className="w-64 bg-gray-800 p-4 flex flex-col h-full border-r border-gray-700">
      <div className="flex justify-between items-center mb-6 mt-2">
        <h1 className="text-xl font-bold text-[var(--color-accent)]">Life OS</h1>
        <button 
          onClick={createNewChat}
          className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors"
          title="New Chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 scrollbar-thin">
        <h2 className="text-xs uppercase text-gray-400 font-semibold mb-3 px-2">Recent Chats</h2>
        <ul className="space-y-1">
          {chats.map(chat => (
            <li key={chat.id} className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeChatId === chat.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`} onClick={() => switchChat(chat.id)}>
              <span className="truncate text-sm flex-1">{chat.title}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                title="Delete Chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>

        <button
          onClick={onReviewClick}
          className="w-full bg-[var(--color-accent)] hover:bg-teal-600 text-gray-900 font-bold py-2 px-4 rounded-lg transition-colors text-sm"
        >
          Weekly Review
        </button>
      </div>
    </div>
  );
}
