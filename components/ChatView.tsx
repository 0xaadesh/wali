"use client";

import { useAppStore } from '../store';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Users, 
  MessageSquare, 
  Filter, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ArrowDownCircle, 
  ArrowUpCircle,
  Sparkles
} from 'lucide-react';

const SENDER_COLORS = [
  'text-blue-500 dark:text-blue-400',
  'text-green-600 dark:text-green-400',
  'text-yellow-600 dark:text-yellow-400',
  'text-rose-500 dark:text-rose-400',
  'text-purple-500 dark:text-purple-400',
  'text-pink-500 dark:text-pink-400',
  'text-teal-600 dark:text-teal-400',
  'text-orange-500 dark:text-orange-400'
];

const AVATAR_COLORS = [
  'bg-blue-500 text-white',
  'bg-green-500 text-white',
  'bg-yellow-500 text-black',
  'bg-rose-500 text-white',
  'bg-purple-500 text-white',
  'bg-pink-500 text-white',
  'bg-teal-500 text-white',
  'bg-orange-500 text-white',
  'bg-indigo-500 text-white',
  'bg-cyan-500 text-black'
];

function getSenderColor(sender: string | null) {
  if (!sender) return 'text-muted-foreground';
  let hash = 0;
  for (let i = 0; i < sender.length; i++) {
    hash = sender.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0] || '')
    .join('')
    .toUpperCase();
}

function HighlightText({ text, highlight, isActive }: { text: string; highlight: string; isActive: boolean }) {
  if (!highlight.trim()) return <>{text}</>;
  
  const escaped = highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark 
            key={i} 
            className={`rounded px-0.5 transition-all ${
              isActive 
                ? 'bg-amber-400 text-black font-semibold shadow-sm ring-2 ring-amber-500' 
                : 'bg-yellow-200 dark:bg-yellow-800/60 dark:text-yellow-100'
            }`}
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export function ChatView() {
  const { messages, stats } = useAppStore();
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // States
  const [selectedSender, setSelectedSender] = useState<string | null>(null);
  const [selfSender, setSelfSender] = useState<string | null>(null);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [filterMatchesOnly, setFilterMatchesOnly] = useState(false);
  const [activeMatchIdx, setActiveMatchIdx] = useState(-1);
  const [participantSearch, setParticipantSearch] = useState('');

  // Default "Self" to the top speaker
  useEffect(() => {
    if (stats?.mostActiveParticipant && !selfSender) {
      setSelfSender(stats.mostActiveParticipant);
    } else if (stats && !selfSender) {
      const keys = Object.keys(stats.participants);
      if (keys.length > 0) {
        setSelfSender(keys[0]);
      }
    }
  }, [stats, selfSender]);

  // Compute active filtered messages
  const activeMessages = useMemo(() => {
    let list = messages;
    
    // Filter by sender
    if (selectedSender) {
      list = list.filter(m => m.sender === selectedSender);
    }
    
    // Filter by search query if enabled
    if (filterMatchesOnly && chatSearchQuery.trim()) {
      const query = chatSearchQuery.toLowerCase();
      list = list.filter(m => m.content.toLowerCase().includes(query));
    }
    
    return list;
  }, [messages, selectedSender, chatSearchQuery, filterMatchesOnly]);

  // Compute match indexes for Highlight & Jump
  const matchIndexes = useMemo(() => {
    if (!chatSearchQuery.trim() || filterMatchesOnly) return [];
    
    const query = chatSearchQuery.toLowerCase();
    const indexes: number[] = [];
    
    for (let i = 0; i < activeMessages.length; i++) {
      if (activeMessages[i].content.toLowerCase().includes(query)) {
        indexes.push(i);
      }
    }
    
    return indexes;
  }, [activeMessages, chatSearchQuery, filterMatchesOnly]);

  // Trigger scroll and update index when search terms or filter states edit
  useEffect(() => {
    setActiveMatchIdx(matchIndexes.length > 0 ? 0 : -1);
    if (matchIndexes.length > 0 && virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({
        index: matchIndexes[0],
        align: 'center',
        behavior: 'smooth'
      });
    }
  }, [chatSearchQuery, selectedSender, filterMatchesOnly, matchIndexes]);

  const handleNextMatch = () => {
    if (matchIndexes.length === 0) return;
    const nextIdx = (activeMatchIdx + 1) % matchIndexes.length;
    setActiveMatchIdx(nextIdx);
    virtuosoRef.current?.scrollToIndex({
      index: matchIndexes[nextIdx],
      align: 'center',
      behavior: 'smooth'
    });
  };

  const handlePrevMatch = () => {
    if (matchIndexes.length === 0) return;
    const prevIdx = (activeMatchIdx - 1 + matchIndexes.length) % matchIndexes.length;
    setActiveMatchIdx(prevIdx);
    virtuosoRef.current?.scrollToIndex({
      index: matchIndexes[prevIdx],
      align: 'center',
      behavior: 'smooth'
    });
  };

  // Participant list calculations
  const filteredParticipants = useMemo(() => {
    if (!stats) return [];
    const participants = Object.values(stats.participants).sort((a, b) => b.totalMessages - a.totalMessages);
    if (!participantSearch.trim()) return participants;
    const search = participantSearch.toLowerCase();
    return participants.filter(p => p.name.toLowerCase().includes(search));
  }, [stats, participantSearch]);

  const scrollToTop = useCallback(() => {
    virtuosoRef.current?.scrollToIndex({ index: 0, behavior: 'smooth' });
  }, []);

  const scrollToBottom = useCallback(() => {
    if (activeMessages.length > 0) {
      virtuosoRef.current?.scrollToIndex({ index: activeMessages.length - 1, behavior: 'smooth' });
    }
  }, [activeMessages.length]);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)] min-h-[600px] max-h-[850px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Left Sidebar: Participant Panel */}
      <div className="lg:col-span-4 flex flex-col bg-card border rounded-xl overflow-hidden shadow-sm h-full">
        {/* Sidebar Header */}
        <div className="p-4 border-b space-y-3 bg-muted/20">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Chat Members
            </h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono">
              {Object.keys(stats.participants).length} total
            </span>
          </div>
          
          {/* Search Member Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search chat members..."
              value={participantSearch}
              onChange={(e) => setParticipantSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border rounded-lg bg-background placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* All Participants Selector Button */}
          <button
            onClick={() => setSelectedSender(null)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
              selectedSender === null
                ? 'bg-primary/10 text-primary font-semibold'
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${
              selectedSender === null ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
            }`}>
              <MessageSquare className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="truncate">View Entire Chat</span>
                <span className="text-[10px] opacity-80 font-mono">
                  {stats.totalMessages.toLocaleString()} msgs
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">Show all messages chronologically</p>
            </div>
          </button>

          {/* Individual Senders */}
          {filteredParticipants.map((p) => {
            const isSelected = selectedSender === p.name;
            const initials = getInitials(p.name);
            const isSelf = selfSender === p.name;
            return (
              <button
                key={p.name}
                onClick={() => setSelectedSender(p.name)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${getAvatarColor(p.name)}`}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="truncate flex items-center gap-1.5">
                      {p.name}
                      {isSelf && (
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-1 py-0.2 rounded-full border border-emerald-500/25">
                          You
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                      {p.totalMessages.toLocaleString()} msgs
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {Math.round((p.totalMessages / stats.totalMessages) * 100)}% of chat • avg {Math.round(p.totalWords / Math.max(1, p.totalMessages))} words/msg
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Right Chat Column: WhatsApp Web View */}
      <div className="lg:col-span-8 flex flex-col bg-background border rounded-xl overflow-hidden shadow-sm h-full relative">
        
        {/* Chat Thread Header */}
        <div className="px-6 py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm truncate max-w-[250px] md:max-w-[400px]">
                {selectedSender ? `Filter: ${selectedSender}` : 'General Chat Export'}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Displaying {activeMessages.length.toLocaleString()} of {stats.totalMessages.toLocaleString()} messages
              </p>
            </div>
          </div>

          {/* Outgoing Sender Identity Selector */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
              Outgoing ("You"):
            </label>
            <select
              value={selfSender || ''}
              onChange={(e) => setSelfSender(e.target.value)}
              className="bg-card text-foreground text-xs font-medium border rounded-md px-2 py-1 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
            >
              {Object.keys(stats.participants).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Message Finder / Search Actions */}
        <div className="px-6 py-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card shadow-xs z-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Find inside these messages..."
              value={chatSearchQuery}
              onChange={(e) => setChatSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs border rounded-lg bg-background placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
            {chatSearchQuery && (
              <button 
                onClick={() => { setChatSearchQuery(''); setFilterMatchesOnly(false); }}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Toggle */}
            <label className="flex items-center gap-2 text-xs text-muted-foreground select-none cursor-pointer">
              <input
                type="checkbox"
                checked={filterMatchesOnly}
                onChange={(e) => setFilterMatchesOnly(e.target.checked)}
                className="rounded-sm border-gray-300 text-primary focus:ring-primary cursor-pointer h-3.5 w-3.5"
              />
              Filter matches only
            </label>

            {/* Jump Prev/Next Controls */}
            {chatSearchQuery.trim() && !filterMatchesOnly && (
              <div className="flex items-center bg-muted rounded-lg p-0.5 border">
                <span className="text-[10px] text-muted-foreground font-medium px-2.5 py-1">
                  {matchIndexes.length > 0 ? `${activeMatchIdx + 1} of ${matchIndexes.length}` : 'No matches'}
                </span>
                <button
                  onClick={handlePrevMatch}
                  disabled={matchIndexes.length === 0}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Previous Match"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNextMatch}
                  disabled={matchIndexes.length === 0}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Next Match"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3. Main Virtual Chat Container with WhatsApp wallpaper background */}
        <div className="flex-1 overflow-hidden bg-[#efeae2] bg-[radial-gradient(rgba(0,0,0,0.03)_1px,transparent_0)] bg-[size:16px_16px] dark:bg-[#0b141a] dark:bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_0)] relative">
          
          {activeMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 text-muted-foreground/45 mb-2" />
              <p className="font-semibold text-sm">No messages to display</p>
              <p className="text-xs text-muted-foreground/80 mt-1 max-w-sm">
                Matches could not be found. Refine your query or check your sidebar filters.
              </p>
            </div>
          ) : (
            <Virtuoso
              ref={virtuosoRef}
              className="h-full scroll-smooth"
              data={activeMessages}
              initialTopMostItemIndex={activeMessages.length - 1} // start at bottom
              itemContent={(index, msg) => {
                const isSelf = msg.sender === selfSender;
                
                // Show dynamic date separator headers
                const showDateHeader = index === 0 || 
                  format(msg.date, 'yyyy-MM-dd') !== format(activeMessages[index - 1].date, 'yyyy-MM-dd');

                // Determine if this specific item is the active matched result
                const isCurrentActiveMatch = !filterMatchesOnly && 
                  matchIndexes.length > 0 && 
                  matchIndexes[activeMatchIdx] === index;

                if (msg.isSystem) {
                  return (
                    <div className="flex flex-col items-center">
                      {showDateHeader && (
                        <div className="flex justify-center my-4 sticky top-1 z-1">
                          <span className="text-[10px] font-bold text-muted-foreground bg-background border px-3 py-1 rounded-full shadow-xs">
                            {format(msg.date, 'MMMM d, yyyy')}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-center my-2 max-w-[85%]">
                        <span className="text-[11px] text-muted-foreground bg-muted/80 backdrop-blur-xs border border-border/40 px-3 py-1 rounded-lg italic shadow-2xs">
                          {msg.content}
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col">
                    {/* Centered Date Header */}
                    {showDateHeader && (
                      <div className="flex justify-center my-4 sticky top-1 z-1">
                        <span className="text-[10px] font-bold text-muted-foreground bg-background border px-3 py-1 rounded-full shadow-xs">
                          {format(msg.date, 'MMMM d, yyyy')}
                        </span>
                      </div>
                    )}

                    {/* Chat Bubble Layout */}
                    <div className={`flex flex-col mb-2 px-6 ${isSelf ? 'items-end' : 'items-start'}`}>
                      <div className={`relative max-w-[75%] rounded-xl px-3 py-2 shadow-xs flex flex-col gap-1 border
                        ${isSelf 
                          ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-none border-[#c1ebd0] dark:border-[#02493c]' 
                          : 'bg-card text-card-foreground rounded-tl-none border-border/75'
                        }
                        ${isCurrentActiveMatch ? 'ring-3 ring-amber-500 ring-offset-2 dark:ring-offset-slate-900 shadow-md animate-pulse' : ''}
                      `}>
                        {/* Sender Display Name (only for group chats, hidden on Self bubbles) */}
                        {!isSelf && (
                          <span className={`text-[11px] font-bold ${getSenderColor(msg.sender)}`}>
                            {msg.sender || 'Unknown Sender'}
                          </span>
                        )}
                        
                        {/* Bubble Content Body */}
                        <div className="text-xs md:text-sm break-words whitespace-pre-wrap leading-relaxed">
                          {msg.isDeleted ? (
                            <span className="italic text-muted-foreground">This message was deleted</span>
                          ) : (
                            <HighlightText 
                              text={msg.content} 
                              highlight={filterMatchesOnly ? '' : chatSearchQuery} 
                              isActive={isCurrentActiveMatch} 
                            />
                          )}
                        </div>

                        {/* Timestamp Info */}
                        <span className="text-[9px] text-muted-foreground/80 self-end font-mono mt-0.5 tracking-wider">
                          {format(msg.date, 'h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          )}

          {/* Quick Floating Navigation Controls */}
          <div className="absolute bottom-5 right-6 flex flex-col gap-2 z-1">
            <button
              onClick={scrollToTop}
              className="p-2 bg-background/90 hover:bg-background border rounded-full shadow-md text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title="Scroll to Top"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
            <button
              onClick={scrollToBottom}
              className="p-2 bg-background/90 hover:bg-background border rounded-full shadow-md text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title="Scroll to Bottom"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
