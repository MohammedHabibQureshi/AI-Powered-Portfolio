import { AIChatWindow } from "@/components/ai-chat/chat-window";
import { ChatScrollTrigger } from "@/components/ai-chat/chat-scroll-trigger";
import Link from "next/link";
import { ArrowRight, Github, Linkedin, FileText, Sparkles, Code2 } from "lucide-react";

export default function Home() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[calc(100vh-10rem)]">
      <ChatScrollTrigger />
      
      {/* Left Column: Hero & Introduction */}
      <div className="lg:col-span-5 flex flex-col gap-6 text-left">
        
        {/* Sparkle Tag */}
        <div className="flex items-center gap-2 px-3 py-1.5 border border-primary/20 rounded-full bg-primary/5 text-primary text-xs font-medium w-fit">
          <Sparkles className="h-3.5 w-3.5" />
          <span>AI-Powered Technical Portfolio</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
          Hi, I am <span className="text-primary">Mohammed Habib Qureshi</span>.
        </h1>

        {/* TAGLINE */}
        <p className="text-base text-muted-foreground leading-relaxed">
          Welcome to my personal platform. Instead of browsing a static resume, you can query my verified professional database directly using the RAG-grounded AI Assistant.
        </p>

        {/* Status Indicators */}
        <div className="flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Code2 className="h-4 w-4 text-primary" />
            <span>Active Stack: Next.js + Gemini AI</span>
          </div>
        </div>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <Link
            href="/projects"
            className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-6 py-3 rounded-lg text-sm font-medium transition-all"
          >
            <span>View Projects</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/resume"
            className="flex items-center justify-center gap-2 border border-border hover:bg-secondary px-6 py-3 rounded-lg text-sm font-medium transition-all"
          >
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>Download Resume</span>
          </Link>
        </div>

        {/* Social Connects */}
        <div className="flex items-center gap-6 mt-4 pt-6 border-t border-border w-fit text-sm text-muted-foreground">
          <span className="font-semibold text-foreground/80">Connect:</span>
          <a
            href="https://github.com/MohammedHabibQureshi"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </a>
          <a
            href="https://www.linkedin.com/in/md-habib-qureshi/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Linkedin className="h-4 w-4" />
            <span>LinkedIn</span>
          </a>
        </div>

      </div>

      {/* Right Column: Immersive AI Chat Window */}
      <div className="lg:col-span-7 flex flex-col justify-center">
        <AIChatWindow />
      </div>

    </div>
  );
}
