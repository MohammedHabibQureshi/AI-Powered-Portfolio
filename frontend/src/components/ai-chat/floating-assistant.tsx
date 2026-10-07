"use client";

import { useState, useEffect } from "react";
import { BotMessageSquare, Minimize2 } from "lucide-react";
import { AIChatWindow } from "./chat-window";

export function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpenAiChat = () => setIsOpen(true);
    window.addEventListener('open-ai-chat', handleOpenAiChat);
    return () => window.removeEventListener('open-ai-chat', handleOpenAiChat);
  }, []);

  return (
    <>
      {/* Floating Button */}
      <button
        id="ai-chat-trigger-btn"
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-semibold rounded-full shadow-lg hover:shadow-xl hover:opacity-95 transition-all duration-300 ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
        aria-label="Ask about Habib"
      >
        <BotMessageSquare className="w-5 h-5" />
        <span className="hidden sm:inline">Ask about Habib</span>
      </button>

      {/* Chat Drawer/Modal */}
      <div 
        className={`fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[450px] transition-transform duration-300 origin-bottom-right shadow-2xl ${isOpen ? 'scale-100' : 'scale-0 pointer-events-none'}`}
      >
        <div className="relative bg-background sm:rounded-xl overflow-hidden flex flex-col h-[100dvh] sm:h-auto border-t sm:border border-border">
          {/* Custom Header with close button overrides */}
          <div className="absolute top-2 right-12 z-10">
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-muted-foreground hover:bg-secondary rounded-md transition-colors"
              aria-label="Close Assistant"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 sm:h-auto">
            <AIChatWindow />
          </div>
        </div>
      </div>
      
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 sm:hidden animate-in fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
