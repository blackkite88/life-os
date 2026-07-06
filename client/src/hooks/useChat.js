import { useState, useCallback, useEffect } from 'react';
import { API_URL } from '../config';

export function useChat() {
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem('life-os-chats');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) return parsed;
    }
    return [{ id: Date.now().toString(), title: 'New Chat', messages: [] }];
  });
  
  const [activeChatId, setActiveChatId] = useState(() => chats[0]?.id || Date.now().toString());
  const [isLoading, setIsLoading] = useState(false);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem('life-os-chats', JSON.stringify(chats));
  }, [chats]);

  const createNewChat = useCallback(() => {
    const newChat = { id: Date.now().toString(), title: 'New Chat', messages: [] };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  }, []);

  const switchChat = useCallback((id) => {
    setActiveChatId(id);
  }, []);

  const deleteChat = useCallback((id) => {
    setChats(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (filtered.length === 0) {
        const fallback = { id: Date.now().toString(), title: 'New Chat', messages: [] };
        setActiveChatId(fallback.id);
        return [fallback];
      }
      if (activeChatId === id) {
        setActiveChatId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeChatId]);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  const sendMessage = useCallback(async (text) => {
    // Determine title if it's the first message
    let newTitle = activeChat.title;
    if (activeChat.messages.length === 0) {
      newTitle = text.length > 30 ? text.substring(0, 30) + '...' : text;
    }

    setChats(prev => prev.map(c => 
      c.id === activeChatId 
        ? { ...c, title: newTitle, messages: [...c.messages, { role: 'user', content: text }] }
        : c
    ));
    
    setIsLoading(true);

    try {
      // Get history up to this point
      const history = activeChat.messages;
      
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: text, history })
      });

      if (!res.ok) throw new Error('Chat request failed');

      // Append empty assistant message placeholder
      setChats(prev => prev.map(c => 
        c.id === activeChatId 
          ? { ...c, messages: [...c.messages, { role: 'assistant', content: '' }] }
          : c
      ));

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });
        
        const lines = chunkValue.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              done = true;
              break;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                setChats(prev => prev.map(c => {
                  if (c.id === activeChatId) {
                    const msgs = [...c.messages];
                    const lastIdx = msgs.length - 1;
                    msgs[lastIdx] = { ...msgs[lastIdx], content: msgs[lastIdx].content + data.text };
                    return { ...c, messages: msgs };
                  }
                  return c;
                }));
              }
            } catch (e) {
              console.error('Error parsing SSE:', e);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [activeChat, activeChatId]);

  return { chats, activeChat, createNewChat, switchChat, deleteChat, sendMessage, isLoading };
}
