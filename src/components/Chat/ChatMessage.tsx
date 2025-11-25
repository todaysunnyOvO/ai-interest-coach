import React from 'react';
import ReactMarkdown from 'react-markdown';
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

  if (isAssistant) {
    // Match <think>...</think> or <think>... (end of string)
    const thinkMatch = message.content.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
    if (thinkMatch) {
      thinkContent = thinkMatch[1];
      // 只有当 </think> 结束标签存在时，才从 mainContent 中移除 think 块
      // 否则，我们在流式传输过程中可能会丢失部分内容显示
      if (message.content.includes('</think>')) {
          mainContent = message.content.replace(/<think>[\s\S]*?<\/think>/, '').trim();
      } else {
          // 还在思考中，不显示 mainContent (或者显示为空，等待思考结束)
          mainContent = '';
      }
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
        {mainContent && <ReactMarkdown>{mainContent}</ReactMarkdown>}
        {!mainContent && !thinkContent && isAssistant && <span className="animate-pulse">...</span>}
      </div>
    </div>
  );
};

