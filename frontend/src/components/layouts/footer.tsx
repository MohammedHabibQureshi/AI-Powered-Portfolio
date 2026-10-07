import Link from "next/link";
import { Github, Linkedin, FileText } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background py-8">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          
          {/* Logo & Copyright */}
          <div className="flex flex-col items-center gap-1 md:items-start">
            <p className="text-sm text-muted-foreground">
              © {currentYear} DevPortfolio. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Handcrafted in Vercel-minimal style. Version 1.0.0
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/MohammedHabibQureshi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="https://www.linkedin.com/in/md-habib-qureshi/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <Link
              href="/resume"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Resume"
            >
              <FileText className="h-5 w-5" />
            </Link>
          </div>
          
        </div>
      </div>
    </footer>
  );
}
