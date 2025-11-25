import { useState, useEffect, useCallback, useRef } from 'react';
import { Message, ChatSession, saveChatHistory, getChatHistory } from '../utils/storage';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useChat = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Ref to track current session ID in async callbacks
  const currentSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  // 初始化加载历史记录
  useEffect(() => {
    const history = getChatHistory();
    if (history.length > 0) {
      setSessions(history);
      setCurrentSessionId(history[0].id);
    } else {
      createNewSession();
    }
  }, []);

  // 保存历史记录
  useEffect(() => {
    // 注意：这里需要处理 sessions 变空的情况，可能也需要保存空数组到 storage
    if (sessions.length > 0) {
      saveChatHistory(sessions);
    } else {
      // 如果 sessions 为空，也要更新 storage
       saveChatHistory([]);
    }
  }, [sessions]);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  }, []);

  const switchSession = useCallback((id: string) => {
    setCurrentSessionId(id);
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const newSessions = prev.filter(s => s.id !== id);

      // 如果删除的是当前会话，需要切换到其他会话
      if (id === currentSessionIdRef.current) {
        if (newSessions.length > 0) {
          // 切换到第一个会话
          setCurrentSessionId(newSessions[0].id);
        } else {
          // 如果没有会话了，创建一个新的（这会在下次渲染周期触发，或者我们可以立即创建并返回）
          // 为了简单起见，我们先设置为空，然后通过 useEffect 或直接在这里调用 createNewSession
          // 但 createNewSession 依赖 setSessions，这里我们在 setSessions 回调中
          // 更好的做法是：如果为空，在这里构造一个新会话
          const newSession: ChatSession = {
            id: generateId(),
            title: 'New Chat',
            messages: [],
            createdAt: Date.now(),
          };
          setCurrentSessionId(newSession.id);
          return [newSession];
        }
      }
      return newSessions;
    });
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const sessionId = currentSessionIdRef.current;
    if (!sessionId) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      createdAt: Date.now(),
    };

    // 乐观更新：添加用户消息和空的助手消息
    const assistantMessageId = generateId();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    };

    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          messages: [...session.messages, userMessage, assistantMessage]
        };
      }
      return session;
    }));

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      console.log('Frontend: Start reading stream');

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
            console.log('Frontend: Stream done');
            break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log('Frontend: Received chunk:', chunk);

        // 直接追加内容
        // 后端已经处理好了 <think> 标签和纯文本流
        assistantContent += chunk;

        // 使用函数式更新来确保拿到最新的 session 状态，避免闭包陷阱
        // 并且我们只需要更新当前正在流式输出的那条消息
        setSessions(prevSessions => {
          return prevSessions.map(session => {
            if (session.id === sessionId) {
              return {
                ...session,
                messages: session.messages.map(msg => {
                  if (msg.id === assistantMessageId) {
                     // 这里的 assistantContent 是累加的局部变量，是正确的全量内容
                     return { ...msg, content: assistantContent };
                  }
                  return msg;
                })
              };
            }
            return session;
          });
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      // Error handling: maybe update the assistant message to show error
      setSessions(prev => prev.map(session => {
          if (session.id === sessionId) {
            const newMsgs = session.messages.map(msg => {
              if (msg.id === assistantMessageId) {
                return { ...msg, content: 'Error: Failed to get response.' };
              }
              return msg;
            });
            return { ...session, messages: newMsgs };
          }
          return session;
        }));
    } finally {
      setIsLoading(false);
    }

  }, []);

  return {
    sessions,
    currentSessionId,
    currentSession,
    messages,
    isLoading,
    sendMessage,
    createNewSession,
    switchSession,
    deleteSession,
  };
};
