import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  isError?: boolean;
  toolCalls?: string[];
  toolResults?: any[];
}

interface ChatState {
  messages: ChatMessage[];
  sessionId: string;
  setSessionId: (id: string) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  sessionId: "anon",
  setSessionId: (id) => set({ sessionId: id }),
  setMessages: (msgs) => set({ messages: msgs }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
  })),
  clearMessages: () => set({ messages: [] }),
}));
