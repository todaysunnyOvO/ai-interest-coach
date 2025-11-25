import React, { useEffect, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import { Sidebar } from './Sidebar';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import styles from './chat.module.css';

export const Chat = () => {
  const {
    sessions,
    currentSessionId,
    messages,
    isLoading,
    sendMessage,
    createNewSession,
    switchSession,
    deleteSession
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className={styles.container}>
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={switchSession}
        onNewSession={createNewSession}
        onDeleteSession={deleteSession}
      />
      <main className={styles.main}>
        <div className={styles.messageList}>
          {messages.length === 0 && (
            <div style={{
              textAlign: 'center',
              color: '#9ca3af',
              marginTop: 'auto',
              marginBottom: 'auto'
            }}>
              <h2>Welcome to Chat AI</h2>
              <p>Start a conversation by typing a message below.</p>
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </main>
    </div>
  );
};
