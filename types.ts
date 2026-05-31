export interface ChatMessage {
  id: string;
  date: Date;
  sender: string | null;
  content: string;
  isMedia: boolean;
  isLink: boolean;
  isDeleted: boolean;
  isSystem: boolean;
  wordCount: number;
}

export interface ParticipantStats {
  name: string;
  totalMessages: number;
  totalWords: number;
  totalMedia: number;
  totalLinks: number;
  longestMessage: string;
  longestMessageLength: number;
  messagesByHour: Record<number, number>;
  messagesByWeekday: Record<string, number>;
  emojisUsed: Record<string, number>;
}

export interface ChatStats {
  totalMessages: number;
  totalParticipants: number;
  startDate: Date | null;
  endDate: Date | null;
  totalDurationDays: number;
  avgMessagesPerDay: number;
  totalMediaMessages: number;
  totalLinks: number;
  totalWords: number;
  mostActiveParticipant: string | null;
  participants: Record<string, ParticipantStats>;
  messagesByDay: Record<string, number>;
  messagesByHour: Record<number, number>;
  messagesByWeekday: Record<string, number>;
  messagesByMonth: Record<string, number>;
  topWords: Array<{ word: string; count: number }>;
  topEmojis: Array<{ emoji: string; count: number }>;
  firstMessage: typeof Date.prototype | null;
  lastMessage: typeof Date.prototype | null;
}
