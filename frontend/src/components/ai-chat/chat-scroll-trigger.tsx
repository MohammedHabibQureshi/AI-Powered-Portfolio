"use client";

import { useEffect } from "react";

export function ChatScrollTrigger() {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("chat") === "true") {
      const el = document.getElementById("ai-chat-window");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return null;
}
