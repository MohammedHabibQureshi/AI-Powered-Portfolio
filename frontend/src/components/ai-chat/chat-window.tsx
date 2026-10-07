"use client";

import { useState, useRef, useEffect } from "react";
import { ChatBubble } from "./chat-bubble";
import { PromptSuggestions } from "./prompt-suggestions";
import { SendHorizontal, Trash2 } from "lucide-react";
import { useToast } from "@/providers/toast-provider";
import type { KnowledgeDebug } from "@/lib/ai/constants";

interface Message {
  id: string;
  sender: "user" | "assistant" | "system";
  text: string;
  confidence?: number;
  citations?: { title: string; url: string }[];
}

export function AIChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "I can help you explore his projects, technical skills, experience, research and GitHub work."
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<KnowledgeDebug | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 11));

  const handleSendRef = useRef<(text: string) => void>(() => {});

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    // 1. Add user message
    const userMessage: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: textToSend
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const botMessageId = Math.random().toString();
    const botMessage: Message = {
      id: botMessageId,
      sender: "assistant",
      text: "",
      confidence: 0.95,
      citations: []
    };
    setMessages(prev => [...prev, botMessage]);

    try {
      const history = messages
        .slice(-10)
        .filter((m) => m.sender === "user" || m.sender === "assistant")
        .map((m) => ({ sender: m.sender, text: m.text }));

      const response = await fetch(`/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: textToSend, history })
      });

      if (!response.ok) throw new Error("Network response was not ok");
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("ReadableStream not supported");

      let partialText = "";
      setIsLoading(false);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunkText = decoder.decode(value);
        const lines = chunkText.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;
              const parsed = JSON.parse(jsonStr);
              
              if (parsed.debug) {
                setDebugInfo(parsed.debug);
              }
              
              if (parsed.chunk !== undefined) {
                partialText += parsed.chunk;
                setMessages(prev => prev.map(m => m.id === botMessageId ? {
                  ...m,
                  text: partialText,
                  confidence: parsed.confidence !== undefined ? parsed.confidence : m.confidence,
                  citations: parsed.citations && parsed.citations.length > 0 ? parsed.citations : m.citations
                } : m));
              }
            } catch (e) {
              console.error("SSE parsing error", e);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to connect to AI chat service:", err);
      setMessages(prev => prev.map(m => m.id === botMessageId ? {
        ...m,
        text: "I'm having trouble connecting to my backend AI service. Please make sure the backend is active.",
        confidence: 0.0
      } : m));
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSendRef.current = handleSend;
  });

  useEffect(() => {
    const handleOpenAiChat = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.initialQuery) {
        handleSendRef.current(customEvent.detail.initialQuery);
      }
    };
    
    window.addEventListener('open-ai-chat', handleOpenAiChat);
    return () => window.removeEventListener('open-ai-chat', handleOpenAiChat);
  }, []);

  const handleClear = () => {
    setMessages([
      {
        id: "welcome",
        sender: "assistant",
        text: "History cleared \u2014 I can help you explore Habib\u2019s projects, technical skills, experience, and GitHub work."
      }
    ]);
    toast("Chat history cleared.", "info");
  };

  return (
    <div id="ai-chat-window" className="flex flex-col h-[550px] border border-border bg-card rounded-xl shadow-md overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-foreground">Habib&apos;s AI Recruiter Assistant</span>
        </div>
        <button
          onClick={handleClear}
          className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-secondary transition-colors"
          title="Clear Chat History"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Messages viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            text={msg.text}
            sender={msg.sender}
            confidence={msg.confidence}
            citations={msg.citations}
          />
        ))}
        {isLoading && <ChatBubble text="" sender="assistant" isTyping />}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions and input footer */}
      <div className="p-4 border-t border-border bg-muted/10 space-y-3">
        {debugInfo && (
          <details className="text-xs text-muted-foreground border border-dashed border-border rounded-lg p-2 bg-background/60">
            <summary className="cursor-pointer select-none font-medium">
              Knowledge Debug{" "}
              <span className="font-normal">(intent: {debugInfo.intent}, entity: {debugInfo.entity ?? "none"})</span>
            </summary>
            <div className="mt-2 space-y-1 font-mono">
              <div>question: {debugInfo.question}</div>
              <div>search_terms: [{debugInfo.search_terms.join(", ")}]</div>
              <div>matched_sources:</div>
              <ul className="pl-4 list-disc">
                {debugInfo.matched_sources.map((s) => (
                  <li key={`${s.project}-${s.repo ?? ""}`}>
                    {s.project} (score {s.score})
                    {s.repo ? ` — repo: ${s.repo}` : ""}
                  </li>
                ))}
              </ul>
              <div>context_length: {debugInfo.context_length}</div>
            </div>
          </details>
        )}
        {messages.length === 1 && !isLoading && (
          <PromptSuggestions onSelectSuggestion={handleSend} />
        )}
        
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask about Habib's projects, experience, or skills..."
            className="w-full pr-12 pl-4 py-3 border border-border bg-background rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg disabled:opacity-30 transition-opacity"
          >
            <SendHorizontal className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
