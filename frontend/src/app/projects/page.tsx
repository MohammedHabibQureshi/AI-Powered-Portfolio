"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, Github, ExternalLink, Sparkles } from "lucide-react";
import { projects } from "@/data/projects";

interface ProjectCard {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  tags: string[];
  githubUrl?: string;
  demoUrl?: string;
  aiSummary: string;
  estimatedDuration?: string;
}

const mapped: ProjectCard[] = projects.map((p) => ({
  slug: p.slug,
  title: p.title,
  subtitle: p.full_description,
  description: p.short_description,
  category: p.category,
  tags: p.tech_names,
  githubUrl: p.github_url,
  demoUrl: p.demo_url,
  aiSummary: p.solution || "Technical project implementation details.",
  estimatedDuration: p.estimated_duration,
}));

export default function ProjectsPage() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Security", "Cloud/DevOps", "AI/ML", "IoT/Embedded"];

  const filteredProjects = mapped.filter((proj) => {
    const matchesSearch =
      proj.title.toLowerCase().includes(query.toLowerCase()) ||
      proj.description.toLowerCase().includes(query.toLowerCase()) ||
      proj.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || proj.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-10 min-h-[calc(100vh-12rem)]">
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Projects & Case Studies
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Drill into my technical undertakings. Each project is fully cataloged, featuring system diagrams, architecture details, and project-specific AI agents.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center border-b border-border pb-6">
        <div className="relative w-full md:max-w-xs flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search stack, tags, keyword..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-muted-foreground/45 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
          No projects matching your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((proj) => (
            <div
              key={proj.slug}
              className="flex flex-col h-full bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
            >
              <div className="p-5 flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-primary bg-primary/5 px-2 py-0.5 border border-primary/25 rounded-full">
                    {proj.category}
                  </span>
                  {proj.estimatedDuration && (
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full border border-border">
                      {proj.estimatedDuration}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-bold text-lg text-foreground hover:text-primary transition-colors">
                    <Link href={`/projects/${proj.slug}`}>{proj.title}</Link>
                  </h3>
                  <p className="text-xs text-muted-foreground/80 font-medium">{proj.subtitle}</p>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {proj.description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {proj.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 border border-border bg-muted/30 rounded text-[10px] text-muted-foreground font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="px-5 py-3.5 bg-muted/20 border-t border-border flex gap-2 items-start text-[11px] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <p className="italic line-clamp-2 leading-relaxed">{proj.aiSummary}</p>
              </div>

              <div className="px-5 py-4 bg-muted/40 border-t border-border flex items-center justify-between">
                <div className="flex gap-3 text-muted-foreground">
                  {proj.githubUrl && (
                    <a
                      href={proj.githubUrl}
                      className="hover:text-foreground flex items-center gap-1 text-[11px] font-medium transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="h-3.5 w-3.5" />
                      <span>GitHub</span>
                    </a>
                  )}
                  {proj.demoUrl && (
                    <a
                      href={proj.demoUrl}
                      className="hover:text-foreground flex items-center gap-1 text-[11px] font-medium transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Live Demo</span>
                    </a>
                  )}
                </div>

                <Link
                  href={`/projects/${proj.slug}`}
                  className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform"
                >
                  <span>Case Study</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
