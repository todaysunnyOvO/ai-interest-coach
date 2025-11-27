import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2 } from 'lucide-react';
import styles from './chat.module.css';
import { Message } from '../../utils/storage';

interface Props {
  message: Message;
}

export const ChatMessage: React.FC<Props> = ({ message }) => {
  const isAssistant = message.role === 'assistant';

  // Simple logic to separate thinking process from content
  let thinkContent = '';
  let mainContent = message.content;
  let isSearching = false;

  if (isAssistant) {
    // 1. Extract Thinking Process
    const thinkRegex = /<think>([\s\S]*?)(?:<\/think>|$)/g;
    const matches = [...message.content.matchAll(thinkRegex)];

    if (matches.length > 0) {
      thinkContent = matches.map(m => m[1]).join('\n\n---\n\n');
      // Remove thinking blocks from main content
      mainContent = message.content.replace(thinkRegex, '').trim();
    }

    // 2. Extract Search Status
    const searchRegex = /\*正在搜索相关信息\.\.\.\*/g;
    if (searchRegex.test(mainContent)) {
      isSearching = true;
      // Remove search status text from main content
      mainContent = mainContent.replace(searchRegex, '').trim();
    }
  }

  return (
    <div className={styles.messageItem}>
      <div className={`${styles.avatar} ${isAssistant ? styles.assistant : styles.user}`}>
        {isAssistant ? 'AI' : 'Me'}
      </div>
      <div className={styles.messageContent}>
        {thinkContent && (
          <div className={styles.thinkBlock}>
            <div className={styles.thinkLabel}>Thinking Process</div>
            <ReactMarkdown>{thinkContent}</ReactMarkdown>
          </div>
        )}

        {isSearching && (
          <div className={styles.searchStatus}>
            <Loader2 className="animate-spin" size={16} />
            <span>正在联网搜索最新信息...</span>
          </div>
        )}

        {mainContent && <ReactMarkdown>{mainContent}</ReactMarkdown>}
        {!mainContent && !thinkContent && !isSearching && isAssistant && <span className="animate-pulse">...</span>}
      </div>
    </div>
  );
};
