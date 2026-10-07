"use client";

import ReactMarkdown from "react-markdown";
import { Terminal, ShieldCheck, Link2 } from "lucide-react";

interface Citation {
  title: string;
  url: string;
}

interface ChatBubbleProps {
  text: string;
  sender: "user" | "assistant" | "system";
  confidence?: number;
  citations?: Citation[];
  isTyping?: boolean;
}

export function ChatBubble({ text, sender, confidence, citations, isTyping }: ChatBubbleProps) {
  const isUser = sender === "user";

  if (isTyping) {
    return (
      <div className="flex gap-4 items-start py-4">
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border border-border bg-muted">
          <Terminal className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col gap-1 w-full max-w-lg">
          <span className="text-xs font-semibold text-muted-foreground">Habib</span>
          <div className="flex items-center gap-1.5 p-3 rounded-lg bg-secondary/40 border border-border w-max">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-4 items-start py-4 ${isUser ? "justify-end" : "justify-start"}`}>
      {/* Bot Avatar */}
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border border-border bg-muted">
          <Terminal className="h-4 w-4 text-primary" />
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col gap-1 max-w-xl w-full ${isUser ? "items-end" : "items-start"}`}>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          {isUser ? "You" : "Habib"}
        </span>
        
        <div className={`w-full p-4 rounded-xl border text-sm leading-relaxed ${
          isUser 
            ? "bg-primary text-primary-foreground border-primary/20" 
            : "bg-card text-foreground border-border"
        }`}>
          {/* Markdown Content */}
          <div className="prose prose-sm dark:prose-invert max-w-none break-words">
            <ReactMarkdown
              components={{
                pre: ({ ...props }) => (
                  <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto border border-border my-2 text-foreground font-mono" {...props} />
                ),
                code: ({ ...props }) => (
                  <code className="px-1 py-0.5 bg-muted/60 rounded text-xs font-mono text-primary font-semibold" {...props} />
                ),
                table: ({ ...props }) => (
                  <div className="overflow-x-auto my-2">
                    <table className="min-w-full divide-y divide-border border border-border rounded text-xs" {...props} />
                  </div>
                ),
                th: ({ ...props }) => <th className="px-3 py-2 bg-muted text-left font-semibold border-b border-border" {...props} />,
                td: ({ ...props }) => <td className="px-3 py-2 border-b border-border" {...props} />,
              }}
            >
              {text}
            </ReactMarkdown>
          </div>

          {/* Citations & Confidence (Only for Assistant) */}
          {!isUser && (confidence !== undefined || (citations && citations.length > 0)) && (
            <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
              {/* Confidence Badge (subtle, secondary) */}
              {confidence !== undefined && confidence > 0.6 && (
                <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Verified</span>
                </div>
              )}

              {/* Citations list */}
              {citations && citations.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Sources:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {citations.map((cite, index) => (
                      <a
                        key={index}
                        href={cite.url}
                        className="flex items-center gap-0.5 bg-secondary hover:text-foreground hover:bg-secondary-foreground/10 px-1.5 py-0.5 rounded transition-all"
                      >
                        <Link2 className="h-2.5 w-2.5" />
                        <span>{cite.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border border-primary/20 bg-primary/10">
          <span className="text-xs font-semibold text-primary">U</span>
        </div>
      )}
    </div>
  );
}
