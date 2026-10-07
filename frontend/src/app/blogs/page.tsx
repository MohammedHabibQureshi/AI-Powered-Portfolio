"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Calendar, Clock, ArrowRight } from "lucide-react";
import { blogs } from "@/data/blogs";

interface BlogCard {
  slug: string;
  title: string;
  publishedAt: string;
  readingTime: string;
  excerpt: string;
  tags: string[];
}

const mapped: BlogCard[] = blogs
  .filter((b) => b.published)
  .map((b) => ({
    slug: b.slug,
    title: b.title,
    publishedAt: "Recently",
    readingTime: `${b.reading_time} min read`,
    excerpt: b.summary,
    tags: b.tags,
  }));

export default function BlogsPage() {
  const [query, setQuery] = useState("");

  const filteredBlogs = mapped.filter(
    (blog) =>
      blog.title.toLowerCase().includes(query.toLowerCase()) ||
      blog.excerpt.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-10 min-h-[calc(100vh-12rem)]">
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Technical Writing &amp; Insights
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Articles documenting design choices, RAG experiments, local testing loops, and code
          architecture lessons.
        </p>
      </div>

      <div className="flex items-center border-b border-border pb-6">
        <div className="relative w-full max-w-xs flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search article title, tag..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {filteredBlogs.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
          No articles found.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBlogs.map((blog) => (
            <article
              key={blog.slug}
              className="p-6 bg-card border border-border rounded-xl shadow-sm hover:border-primary/50 transition-colors flex flex-col gap-4"
            >
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-semibold">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{blog.publishedAt}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{blog.readingTime}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-xl text-foreground hover:text-primary transition-colors">
                  <Link href={`/blogs/${blog.slug}`}>{blog.title}</Link>
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                  {blog.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
                <div className="flex gap-2">
                  {blog.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 border border-border bg-muted/30 rounded text-[10px] text-muted-foreground font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/blogs/${blog.slug}`}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:translate-x-1 transition-transform"
                >
                  <span>Read Article</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
