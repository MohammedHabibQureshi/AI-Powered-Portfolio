"use client";

import { BotMessageSquare } from "lucide-react";

export function ProjectCaseStudyActions({ projectTitle }: { projectTitle: string }) {
  const openAIAssistant = () => {
    const chatBtn = document.getElementById("ai-chat-trigger-btn");
    if (chatBtn) chatBtn.click();

    const event = new CustomEvent("open-ai-chat", {
      detail: { initialQuery: `Tell me about the ${projectTitle} project.` },
    });
    window.dispatchEvent(event);
  };

  return (
    <button
      onClick={openAIAssistant}
      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-sm"
    >
      <BotMessageSquare className="w-4 h-4" />
      Ask AI Recruiter Assistant
    </button>
  );
}
