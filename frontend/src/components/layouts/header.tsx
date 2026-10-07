"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Menu, X, Github, Linkedin, MessageSquare, Terminal } from "lucide-react";

export function StickyHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "About", href: "/about" },
    { label: "Projects", href: "/projects" },
    { label: "Blogs", href: "/blogs" },
    { label: "Timeline", href: "/timeline" },
    { label: "Contact", href: "/contact" }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo / Brand */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-foreground hover:opacity-90">
            <Terminal className="h-5 w-5 text-primary" />
            <span>Habib Qureshi</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="https://github.com/MohammedHabibQureshi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground p-2"
          >
            <Github className="h-5 w-5" />
          </a>
          <a
            href="https://www.linkedin.com/in/md-habib-qureshi/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground p-2"
          >
            <Linkedin className="h-5 w-5" />
          </a>
          <ThemeToggle />
          
          <Link
            href="/?chat=true"
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Talk to AI</span>
          </Link>
        </div>

        {/* Mobile Hamburguer */}
        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-muted-foreground hover:text-foreground"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-background border-t border-border flex flex-col p-6 animate-in fade-in-50 md:hidden">
          <nav className="flex flex-col gap-4 mb-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          
          <div className="flex flex-col gap-4 mt-auto">
            <Link
              href="/?chat=true"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground p-3 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Talk to AI</span>
            </Link>
            
            <div className="flex justify-center gap-6 mt-4 border-t border-border pt-4">
              <a href="https://github.com/MohammedHabibQureshi" target="_blank" rel="noopener noreferrer" className="text-muted-foreground">
                <Github className="h-6 w-6" />
              </a>
              <a href="https://www.linkedin.com/in/md-habib-qureshi/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground">
                <Linkedin className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
