export const STORAGE_KEYS = {
  CHAT_HISTORY: 'app_chat_history',
};

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
}

export const saveChatHistory = (history: ChatSession[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
};

export const getChatHistory = (): ChatSession[] => {
  try {
    const history = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to get chat history:', error);
    return [];
  }
};

