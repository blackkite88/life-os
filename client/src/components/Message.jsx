import React from 'react';

export default function Message({ role, content }) {
  const isUser = role === 'user';
  
  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] rounded-lg p-4 ${isUser ? 'bg-[var(--color-accent)] text-gray-900' : 'bg-gray-800 text-gray-100'} shadow-md`}>
        <div className="text-xs font-semibold mb-1 opacity-70">
          {isUser ? 'You' : 'OS'}
        </div>
        <div className="whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
      </div>
    </div>
  );
}
