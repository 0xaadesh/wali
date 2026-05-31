import { create } from 'zustand';
import { ChatMessage, ChatStats } from './types';

interface AppState {
  messages: ChatMessage[];
  stats: ChatStats | null;
  isAnalyzing: boolean;
  progress: number;
  fileName: string | null;
  error: string | null;
  setMessages: (messages: ChatMessage[]) => void;
  setStats: (stats: ChatStats) => void;
  startAnalysis: (fileName: string) => void;
  setProgress: (progress: number) => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  messages: [],
  stats: null,
  isAnalyzing: false,
  progress: 0,
  fileName: null,
  error: null,
  setMessages: (messages) => set({ messages }),
  setStats: (stats) => set({ stats, isAnalyzing: false, progress: 100 }),
  startAnalysis: (fileName) => set({ isAnalyzing: true, progress: 0, fileName, error: null, messages: [], stats: null }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error, isAnalyzing: false }),
  reset: () => set({ messages: [], stats: null, isAnalyzing: false, progress: 0, fileName: null, error: null }),
}));
