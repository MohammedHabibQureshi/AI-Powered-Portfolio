"use client";

import { Sparkles } from "lucide-react";

interface PromptSuggestionsProps {
  onSelectSuggestion: (text: string) => void;
}

export function PromptSuggestions({ onSelectSuggestion }: PromptSuggestionsProps) {
  const suggestions = [
    "Tell me about Habib's technical background",
    "What are his strongest projects?",
    "Which project demonstrates his AWS skills?",
    "What cybersecurity projects has he built?",
    "What IoT experience does he have?",
    "What technologies did he use in AWS CSPM?",
    "Which GitHub repository should I view first?",
    "What makes his projects different?",
  ];

  return (
    <div className="flex flex-col gap-2.5 w-full">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span>Ask about Habib:</span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {suggestions.map((sug, index) => (
          <button
            key={index}
            onClick={() => onSelectSuggestion(sug)}
            className="p-3 text-left text-xs text-muted-foreground border border-border bg-card rounded-lg hover:border-primary hover:text-foreground hover:bg-secondary/40 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {sug}
          </button>
        ))}
      </div>
    </div>
  );
}
