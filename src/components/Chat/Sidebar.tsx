import React from 'react';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import styles from './chat.module.css';
import { ChatSession } from '../../utils/storage';

interface Props {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
}

export const Sidebar: React.FC<Props> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession
}) => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <button className={styles.newChatBtn} onClick={onNewSession}>
          <Plus size={18} />
          New Chat
        </button>
      </div>
      <div className={styles.sessionList}>
        {sessions.map(session => (
          <div
            key={session.id}
            className={`${styles.sessionItem} ${session.id === currentSessionId ? styles.active : ''}`}
            onClick={() => onSelectSession(session.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, overflow: 'hidden' }}>
              <MessageSquare size={16} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {session.title || 'New Chat'}
              </span>
            </div>
            <button
              className={styles.deleteBtn}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(session.id);
              }}
              title="Delete Chat"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
