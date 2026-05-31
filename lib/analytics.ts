import { ChatMessage, ChatStats, ParticipantStats } from "../types";

export async function computeAnalytics(messages: ChatMessage[], onProgress: (progress: number) => void): Promise<ChatStats> {
  const stats: ChatStats = {
    totalMessages: messages.length,
    totalParticipants: 0,
    startDate: messages.length > 0 ? messages[0].date : null,
    endDate: messages.length > 0 ? messages[messages.length - 1].date : null,
    totalDurationDays: 0,
    avgMessagesPerDay: 0,
    totalMediaMessages: 0,
    totalLinks: 0,
    totalWords: 0,
    mostActiveParticipant: null,
    participants: {},
    messagesByDay: {},
    messagesByHour: {},
    messagesByWeekday: {},
    messagesByMonth: {},
    topWords: [],
    topEmojis: [],
    firstMessage: null,
    lastMessage: null,
  };

  if (messages.length === 0) return stats;

  const firstDate = messages[0].date;
  const lastDate = messages[messages.length - 1].date;
  stats.totalDurationDays = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
  stats.avgMessagesPerDay = stats.totalMessages / stats.totalDurationDays;

  const wordCounts: Record<string, number> = {};
  const emojiCounts: Record<string, number> = {};

  const emojiRegex = /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu;

  const CHUNK_SIZE = 10000;

  for (let i = 0; i < messages.length; i++) {
    if (i % CHUNK_SIZE === 0) {
      onProgress(Math.floor((i / messages.length) * 100));
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    const msg = messages[i];
    
    stats.totalWords += msg.wordCount;
    if (msg.isMedia) stats.totalMediaMessages++;
    if (msg.isLink) stats.totalLinks++;

    // Time stats
    const yyyy_mm_dd = `${msg.date.getFullYear()}-${String(msg.date.getMonth() + 1).padStart(2, '0')}-${String(msg.date.getDate()).padStart(2, '0')}`;
    const hh = msg.date.getHours();
    const weekday = msg.date.toLocaleDateString("en-US", { weekday: 'long' });
    const yy_mm = `${msg.date.getFullYear()}-${String(msg.date.getMonth() + 1).padStart(2, '0')}`;

    stats.messagesByDay[yyyy_mm_dd] = (stats.messagesByDay[yyyy_mm_dd] || 0) + 1;
    stats.messagesByHour[hh] = (stats.messagesByHour[hh] || 0) + 1;
    stats.messagesByWeekday[weekday] = (stats.messagesByWeekday[weekday] || 0) + 1;
    stats.messagesByMonth[yy_mm] = (stats.messagesByMonth[yy_mm] || 0) + 1;

    // Emojis
    const emojis = msg.content.match(emojiRegex);
    if (emojis) {
      for (const e of emojis) {
        emojiCounts[e] = (emojiCounts[e] || 0) + 1;
      }
    }

    if (!msg.isSystem && msg.sender) {
      if (!stats.participants[msg.sender]) {
        stats.participants[msg.sender] = {
          name: msg.sender,
          totalMessages: 0,
          totalWords: 0,
          totalMedia: 0,
          totalLinks: 0,
          longestMessage: "",
          longestMessageLength: 0,
          messagesByHour: {},
          messagesByWeekday: {},
          emojisUsed: {},
        };
      }

      const pStats = stats.participants[msg.sender];
      pStats.totalMessages++;
      pStats.totalWords += msg.wordCount;
      if (msg.isMedia) pStats.totalMedia++;
      if (msg.isLink) pStats.totalLinks++;

      if (msg.content.length > pStats.longestMessageLength) {
        pStats.longestMessageLength = msg.content.length;
        pStats.longestMessage = msg.content;
      }

      pStats.messagesByHour[hh] = (pStats.messagesByHour[hh] || 0) + 1;
      pStats.messagesByWeekday[weekday] = (pStats.messagesByWeekday[weekday] || 0) + 1;

      if (emojis) {
        for (const e of emojis) {
          pStats.emojisUsed[e] = (pStats.emojisUsed[e] || 0) + 1;
        }
      }
    }
  }

  stats.totalParticipants = Object.keys(stats.participants).length;

  let maxMsgs = 0;
  for (const [name, p] of Object.entries(stats.participants)) {
    if (p.totalMessages > maxMsgs) {
      maxMsgs = p.totalMessages;
      stats.mostActiveParticipant = name;
    }
  }

  // Top emojis
  stats.topEmojis = Object.entries(emojiCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100)
    .map(([emoji, count]) => ({ emoji, count }));

  onProgress(100);
  return stats;
}
