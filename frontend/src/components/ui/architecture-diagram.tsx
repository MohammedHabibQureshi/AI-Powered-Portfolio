"use client";

import Image from "next/image";
import { useState } from "react";
import { Maximize2, X, Network, Layers, ArrowRight } from "lucide-react";

interface ArchitectureComponent {
  name: string;
  role?: string;
}

interface ArchitectureDiagramProps {
  imageUrl?: string;
  altText: string;
  caption?: string;
  components?: ArchitectureComponent[];
  description?: string;
  codeDiagram?: string;
}

export function ArchitectureDiagram({
  imageUrl,
  altText,
  caption,
  components,
  description,
  codeDiagram,
}: ArchitectureDiagramProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (codeDiagram) {
    return (
      <div className="w-full rounded-xl border border-border bg-card overflow-hidden">
        <div className="relative w-full overflow-hidden">
          <div className="absolute top-4 right-4 px-2 py-1 bg-primary/10 border border-primary/20 rounded text-[10px] font-semibold text-primary uppercase tracking-wider z-10">
            Architecture Diagram
          </div>
          <pre className="overflow-x-auto p-6 pt-12 text-xs sm:text-sm font-mono leading-relaxed text-foreground bg-card">
            <code>{codeDiagram}</code>
          </pre>
        </div>

        {caption && (
          <div className="px-6 py-3 border-t border-border">
            <p className="text-xs text-center text-muted-foreground italic">
              {caption}
            </p>
          </div>
        )}

        {description && (
          <div className="px-6 py-4 border-t border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        )}

        {components && components.length > 0 && (
          <div className="px-6 py-4 border-t border-border">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              System Components
            </p>
            <div className="flex flex-wrap gap-2">
              {components.map((comp) => (
                <div
                  key={comp.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 border border-border rounded-md text-xs"
                >
                  <Layers className="w-3 h-3 text-primary shrink-0" />
                  <span className="font-medium text-foreground">{comp.name}</span>
                  {comp.role && (
                    <>
                      <ArrowRight className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{comp.role}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="w-full rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex flex-col items-center justify-center py-12 px-6 bg-gradient-to-b from-muted/10 to-muted/5">
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <Network className="w-7 h-7 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">
            System Architecture
          </p>
          <p className="text-xs text-muted-foreground text-center max-w-md leading-relaxed">
            Architecture diagram coming soon.
          </p>
        </div>

        {description && (
          <div className="px-6 py-4 border-t border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        )}

        {components && components.length > 0 && (
          <div className="px-6 py-4 border-t border-border">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              System Components
            </p>
            <div className="flex flex-wrap gap-2">
              {components.map((comp) => (
                <div
                  key={comp.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 border border-border rounded-md text-xs"
                >
                  <Layers className="w-3 h-3 text-primary shrink-0" />
                  <span className="font-medium text-foreground">{comp.name}</span>
                  {comp.role && (
                    <>
                      <ArrowRight className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{comp.role}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full group">
      <div className="relative w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
        <div className="relative w-full pt-[56.25%] bg-muted/10">
          <Image
            src={imageUrl}
            alt={altText}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw"
            className="object-contain p-4"
            loading="lazy"
          />
        </div>

        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute top-4 right-4 p-2 bg-background/80 backdrop-blur-sm border border-border rounded-lg text-foreground opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
          aria-label="View full screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {caption && (
        <p className="mt-3 text-sm text-center text-muted-foreground italic">
          {caption}
        </p>
      )}

      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-200">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 p-2 bg-muted hover:bg-muted/80 rounded-full text-foreground transition-colors z-50"
            aria-label="Close full screen"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative w-full h-full max-w-6xl flex items-center justify-center">
            <Image
              src={imageUrl}
              alt={altText}
              fill
              className="object-contain"
              quality={100}
            />
          </div>
        </div>
      )}
    </div>
  );
}
