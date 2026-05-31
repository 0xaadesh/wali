"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "../store";
import { UploadArea } from "../components/UploadArea";
import { Dashboard } from "../components/Dashboard";
import { ChatView } from "../components/ChatView";
import { ModeToggle } from "../components/ModeToggle";

export default function Home() {
  const { messages, stats } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'analytics' | 'chat'>('analytics');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!messages.length || !stats) {
      setViewMode('analytics');
    }
  }, [messages.length, stats]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-pulse font-semibold text-lg">Loading Wali...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10 w-full">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black dark:bg-white rounded flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white dark:text-black">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <h1 className="font-bold text-lg tracking-tight">Wali</h1>
          </div>

          {messages.length > 0 && stats && (
            <div className="flex items-center bg-muted p-1 rounded-lg border border-border">
              <button
                onClick={() => setViewMode('analytics')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  viewMode === 'analytics'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                Analytics
              </button>
              <button
                onClick={() => setViewMode('chat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  viewMode === 'chat'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Chat Inspector
              </button>
            </div>
          )}

          <div className="text-sm text-muted-foreground flex items-center gap-4">
            <span className="hidden md:inline-block">100% Private, Local processing</span>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl flex-1 flex flex-col justify-center">
        {(!messages.length || !stats) ? (
          <div className="flex-1 flex flex-col items-center justify-center -mt-16 w-full">
            <UploadArea />
          </div>
        ) : (
          viewMode === 'analytics' ? <Dashboard /> : <ChatView />
        )}
      </main>
      
      <footer className="border-t py-6 text-center text-sm text-muted-foreground mt-auto">
        Generated instantly in browser. No chat data leaves your device.
      </footer>
    </div>
  );
}
