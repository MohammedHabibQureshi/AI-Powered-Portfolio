"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { 
  Search, Terminal, User, FolderGit2, BookOpen, 
  History, Mail, Moon, Sun, Laptop, ArrowRight 
} from "lucide-react";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { setTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const commandItems = [
    { id: "go-home", title: "Go to Home", category: "Navigation", icon: Terminal, action: () => router.push("/") },
    { id: "go-about", title: "View About Me", category: "Navigation", icon: User, action: () => router.push("/about") },
    { id: "go-projects", title: "View Projects", category: "Navigation", icon: FolderGit2, action: () => router.push("/projects") },
    { id: "go-blogs", title: "Read Blogs", category: "Navigation", icon: BookOpen, action: () => router.push("/blogs") },
    { id: "go-timeline", title: "View Timeline", category: "Navigation", icon: History, action: () => router.push("/timeline") },
    { id: "go-contact", title: "Get in Touch", category: "Navigation", icon: Mail, action: () => router.push("/contact") },
    { id: "theme-dark", title: "Switch to Dark Mode", category: "Theme", icon: Moon, action: () => setTheme("dark") },
    { id: "theme-light", title: "Switch to Light Mode", category: "Theme", icon: Sun, action: () => setTheme("light") },
    { id: "theme-system", title: "Use System Theme", category: "Theme", icon: Laptop, action: () => setTheme("system") }
  ];

  const filteredItems = commandItems.filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase()) || 
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  // Monitor keyboard triggers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Set initial focus
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const focusTimer = setTimeout(() => {
        inputRef.current?.focus();
        setSelectedIndex(0);
      }, 50);
      return () => clearTimeout(focusTimer);
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  // Handle arrows and select
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        setIsOpen(false);
        setQuery("");
      }
    }
  };

  // Close when clicking overlay
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={containerRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 backdrop-blur-sm p-4 pt-[15vh] transition-all duration-200"
    >
      <div 
        className="w-full max-w-lg border border-border bg-card rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[50vh] animate-in slide-in-from-top-4 duration-200"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input wrapper */}
        <div className="flex items-center px-4 border-b border-border">
          <Search className="h-4 w-4 mr-3 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full h-12 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none border-none focus:ring-0"
          />
        </div>

        {/* Action Items List */}
        <div className="overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No commands found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    setIsOpen(false);
                    setQuery("");
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-all duration-150 ${
                    isSelected 
                      ? "bg-secondary text-foreground" 
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <span>{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{item.category}</span>
                    {isSelected && <ArrowRight className="h-3.5 w-3.5 text-primary" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
        
        {/* Keyboard Footer */}
        <div className="border-t border-border px-4 py-2 flex items-center justify-between bg-muted/40 text-[10px] text-muted-foreground">
          <div className="flex gap-2">
            <span>Use <kbd className="bg-background px-1 border border-border rounded">↑↓</kbd> to navigate</span>
            <span><kbd className="bg-background px-1 border border-border rounded">Enter</kbd> to select</span>
          </div>
          <span><kbd className="bg-background px-1 border border-border rounded">ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
