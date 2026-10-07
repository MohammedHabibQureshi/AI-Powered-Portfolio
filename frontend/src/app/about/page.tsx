"use client";

import Link from "next/link";
import { ArrowRight, Mail, Calendar, MapPin } from "lucide-react";
import { skills } from "@/data/skills";

export default function AboutPage() {
  const categories = Array.from(new Set(skills.map((s) => s.category)));

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <div className="flex flex-col gap-4 border-b border-border pb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">About Me</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          I am Mohammed Habib Qureshi, an Embedded Systems &amp; IoT Engineer specializing in
          building secure smart hardware systems, custom firmware, and cloud security monitoring
          platforms.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10 items-start">
        <div className="md:col-span-1 border border-border rounded-lg bg-card/30 p-6 flex flex-col gap-4 text-sm text-muted-foreground">
          <h3 className="font-semibold text-foreground text-base border-b border-border pb-2">
            Profile Overview
          </h3>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span>Kanker, Chhattisgarh, India</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary shrink-0" />
            <span>Open to Internships</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary shrink-0" />
            <span>Contact via Contact Page</span>
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col gap-6 text-base text-muted-foreground leading-relaxed">
          <p>
            I focus on developing real-world smart solutions using ESP32, STM32, and Raspberry Pi
            microcontrollers. I have hands-on experience building environmental sensor networks,
            gesture-controlled robotics using OpenCV, and cloud-integrated smart mirrors.
          </p>
          <p>
            Alongside hardware, I am actively working in cybersecurity, building network security and
            cloud compliance scanners (like my AWS CSPM tool) to understand how connected environments
            can be hardened.
          </p>
          <p>
            I am also certified in Agentic AI foundations and enjoy exploring Model Context Protocol
            (MCP) and decentralized systems to guarantee trust and data integrity.
          </p>

          <div className="flex items-center gap-4 pt-4">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-md text-sm font-medium hover:opacity-95 transition-opacity"
            >
              <span>Explore Projects</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium hover:underline text-foreground"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-10 flex flex-col gap-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Core Technical Skills</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat} className="p-5 border border-border rounded-xl bg-card/40 space-y-3">
              <h4 className="font-bold text-xs uppercase text-primary tracking-wider border-b border-border pb-1.5">
                {cat}
              </h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground font-semibold">
                {skills
                  .filter((s) => s.category === cat)
                  .map((s) => (
                    <li key={s.name} className="flex justify-between items-center">
                      <span>{s.name}</span>
                      <span className="text-[10px] text-primary/80">
                        {"\u2605".repeat(s.level)}
                        {"\u2606".repeat(5 - s.level)}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
