import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function Message({ role, content }) {
  const isUser = role === 'user';
  
  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] rounded-lg p-4 ${isUser ? 'bg-[var(--color-accent)] text-gray-900' : 'bg-gray-800 text-gray-100'} shadow-md`}>
        <div className="text-xs font-semibold mb-1 opacity-70">
          {isUser ? 'You' : 'OS'}
        </div>
        <div className="whitespace-pre-wrap leading-relaxed markdown-body">
          {content === '' && !isUser ? (
            <span className="animate-pulse text-[var(--color-accent)] text-lg">● ● ●</span>
          ) : (
            <ReactMarkdown>{content}</ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}
