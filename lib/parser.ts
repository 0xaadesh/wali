import { ChatMessage } from "../types";
import { parse as parseDate } from "date-fns";

const androidRegex = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2}(?:\s?[aApP][mM])?)\s-\s(?:([^:]+):\s)?(.*)$/;
const iosRegex = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2}:\d{2}(?:\s?[aApP][mM])?)\]\s(?:([^:]+):\s)?(.*)$/;

function parseDateHeader(dateStr: string, timeStr: string): Date | null {
  // Try to parse using common formats. date-fns parsing needs format strings.
  // We'll normalize things first or just use new Date() which can be surprisingly good,
  // but let's try some manual normalization.
  
  // Date is typically dd/mm/yy or mm/dd/yy or dd/mm/yyyy
  // Let's rely on standard Date construction for simplicity, but adjust for dd/mm
  const [dayOrMonth, monthOrDay, yearStr] = dateStr.split(/[\/\.]/);
  
  let year = parseInt(yearStr);
  if (year < 100) {
    year += 2000;
  }
  
  const m1 = parseInt(dayOrMonth);
  const m2 = parseInt(monthOrDay);
  
  // Usually WhatsApp is DD/MM/YY depending on locale.
  // We will assume DD/MM/YYYY if m2 is <= 12 and m1 > 12. If both <=12, default to DD/MM.
  let day = m1;
  let month = m2;
  if (m1 <= 12 && m2 > 12) {
    month = m1;
    day = m2;
  }
  
  // Parse time
  let [time, modifier] = timeStr.trim().split(/\s+/);
  if (!modifier) {
    if (time.toLowerCase().endsWith('am') || time.toLowerCase().endsWith('pm')) {
      modifier = time.slice(-2);
      time = time.slice(0, -2);
    }
  }
  
  let [hoursStr, minutesStr, secondsStr] = time.split(':');
  let hours = parseInt(hoursStr);
  let minutes = parseInt(minutesStr);
  let seconds = secondsStr ? parseInt(secondsStr) : 0;
  
  if (modifier) {
    if (modifier.toLowerCase() === 'pm' && hours < 12) {
      hours += 12;
    }
    if (modifier.toLowerCase() === 'am' && hours === 12) {
      hours = 0;
    }
  }
  
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

const mediaOmittedList = [
  "<Media omitted>",
  "<media omitted>",
  "image omitted",
  "video omitted",
  "sticker omitted",
  "audio omitted",
  "GIF omitted"
];

const deletedList = [
  "This message was deleted",
  "You deleted this message"
];

function isMediaMessage(content: string) {
  return mediaOmittedList.some(m => content.includes(m));
}

function isDeletedMessage(content: string) {
  return deletedList.some(m => content.includes(m));
}

function hasLink(content: string) {
  return /https?:\/\/[^\s]+/.test(content);
}

export async function parseWhatsAppFile(fileText: string, onProgress: (progress: number) => void): Promise<ChatMessage[]> {
  const lines = fileText.split("\n");
  const messages: ChatMessage[] = [];
  
  let currentMessage: ChatMessage | null = null;
  
  const CHUNK_SIZE = 5000;
  
  for (let i = 0; i < lines.length; i++) {
    if (i % CHUNK_SIZE === 0) {
      onProgress(Math.floor((i / lines.length) * 100));
      await new Promise(resolve => setTimeout(resolve, 0)); // Yield to event loop
    }
    
    let line = lines[i];
    // Remove carriage returns
    if (line.endsWith('\r')) line = line.substring(0, line.length - 1);
    if (!line.trim()) continue;
    
    // Try to match Android or iOS format
    let match = line.match(androidRegex) || line.match(iosRegex);
    
    if (match) {
      // New message
      const [, dateStr, timeStr, sender, content] = match;
      
      const parsedDate = parseDateHeader(dateStr, timeStr);
      if (!parsedDate || isNaN(parsedDate.getTime())) {
        if (currentMessage) {
            currentMessage.content += "\n" + line;
            currentMessage.wordCount += line.split(/\s+/).filter(Boolean).length;
            currentMessage.isLink = currentMessage.isLink || hasLink(line);
        }
        continue;
      }
      
      const isSystem = !sender;
      const actualContent = content || "";
      
      currentMessage = {
        id: `msg-${Date.now()}-${i}`,
        date: parsedDate,
        sender: isSystem ? null : sender.trim(),
        content: actualContent,
        isMedia: isMediaMessage(actualContent),
        isLink: hasLink(actualContent),
        isDeleted: isDeletedMessage(actualContent),
        isSystem: isSystem,
        wordCount: actualContent.split(/\s+/).filter(Boolean).length
      };
      
      messages.push(currentMessage);
      
    } else {
      // Continuation of previous message
      if (currentMessage) {
        currentMessage.content += "\n" + line;
        currentMessage.wordCount += line.split(/\s+/).filter(Boolean).length;
        currentMessage.isLink = currentMessage.isLink || hasLink(line);
      }
    }
  }
  
  onProgress(100);
  return messages;
}
