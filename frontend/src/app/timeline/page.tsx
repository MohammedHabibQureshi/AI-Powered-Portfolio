"use client";

import { Calendar, Briefcase, GraduationCap, Trophy } from "lucide-react";
import { experiences, education, timelineEvents } from "@/data/timeline";

interface TimelineItem {
  id: string;
  year: string;
  title: string;
  institution: string;
  description: string;
  type: "work" | "education" | "achievement";
  dateObj: Date;
}

const combined: TimelineItem[] = [];

experiences.forEach((exp) => {
  const startYear = new Date(exp.start_date).getFullYear();
  const endYear = exp.end_date
    ? new Date(exp.end_date).getFullYear()
    : "Present";
  combined.push({
    id: exp.id,
    year: `${startYear} - ${endYear}`,
    title: exp.position,
    institution: exp.company,
    description: exp.description || "",
    type: "work",
    dateObj: new Date(exp.start_date),
  });
});

education.forEach((edu) => {
  combined.push({
    id: edu.id,
    year: `${edu.start_year} - ${edu.end_year || "Present"}`,
    title: `${edu.degree} in ${edu.major}`,
    institution: edu.institution,
    description: edu.cgpa ? `Graduated with a CGPA of ${edu.cgpa}` : "",
    type: "education",
    dateObj: new Date(edu.start_year, 0, 1),
  });
});

timelineEvents.forEach((evt) => {
  const type =
    evt.category === "work"
      ? "work"
      : evt.category === "education"
      ? "education"
      : "achievement";
  combined.push({
    id: evt.id,
    year: new Date(evt.event_date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    }),
    title: evt.title,
    institution: evt.category ? evt.category.toUpperCase() : "EVENT",
    description: evt.description || "",
    type,
    dateObj: new Date(evt.event_date),
  });
});

combined.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

const IconMap = {
  work: Briefcase,
  education: GraduationCap,
  achievement: Trophy,
};

const ColorMap = {
  work: "text-primary border-primary/20 bg-primary/5",
  education: "text-emerald-500 border-emerald-500/20 bg-emerald-500/5",
  achievement: "text-amber-500 border-amber-500/20 bg-amber-500/5",
};

export default function TimelinePage() {
  return (
    <div className="space-y-10 min-h-[calc(100vh-12rem)] max-w-4xl mx-auto">
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Career Timeline
        </h1>
        <p className="text-sm text-muted-foreground">
          A chronological trace of professional milestones, academic degrees, and major technical
          awards.
        </p>
      </div>

      <div className="relative border-l border-border pl-6 ml-4 space-y-10 py-4">
        {combined.map((item) => {
          const Icon = IconMap[item.type];
          return (
            <div key={item.id} className="relative group">
              <span
                className={`absolute -left-[43px] top-1 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm ${ColorMap[item.type]}`}
              >
                <Icon className="h-4 w-4" />
              </span>

              <div className="p-6 bg-card border border-border rounded-xl shadow-sm hover:border-primary/40 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="space-y-0.5">
                    <h3 className="font-extrabold text-lg text-foreground">{item.title}</h3>
                    <p className="text-xs text-primary font-semibold">{item.institution}</p>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full w-fit">
                    <Calendar className="h-3 w-3" />
                    <span>{item.year}</span>
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
