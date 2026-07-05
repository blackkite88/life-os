import React from 'react';

export default function Sidebar({ onReviewClick, chats = [], activeChatId, createNewChat, switchChat, deleteChat }) {
  const [syncing, setSyncing] = React.useState(false);
  const [progressMsg, setProgressMsg] = React.useState("");
  const [progressPercent, setProgressPercent] = React.useState(0);

  const handleIngest = async () => {
    setSyncing(true);
    setProgressMsg("Starting sync...");
    setProgressPercent(0);
    
    try {
      const res = await fetch('http://localhost:3001/api/ingest', { method: 'POST' });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            if (dataStr === '[DONE]') continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'progress') {
                setProgressMsg(data.message);
                setProgressPercent(data.progress);
              } else if (data.type === 'done') {
                setProgressMsg(`Success: ${data.ingested} chunks!`);
                setProgressPercent(100);
                setTimeout(() => setSyncing(false), 4000);
              } else if (data.type === 'error') {
                setProgressMsg("Error: " + data.error);
                setTimeout(() => setSyncing(false), 4000);
              }
            } catch (e) {
              // Ignore partial chunks if they break JSON parse
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setProgressMsg("Sync failed");
      setTimeout(() => setSyncing(false), 3000);
    }
  };

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
          onClick={handleIngest}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium mb-3"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Sync Google Drive
        </button>
        
        {syncing && (
          <div className="mb-3 bg-gray-900 rounded-lg p-3 shadow-inner border border-gray-700">
            <div className="text-xs text-gray-300 mb-2 flex justify-between font-medium">
              <span className="truncate pr-2">{progressMsg}</span>
              <span className="shrink-0">{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}

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
