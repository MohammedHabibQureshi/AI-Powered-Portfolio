import {
  Award,
  Briefcase,
  ChevronRight,
  FolderGit2,
  Github,
  GraduationCap,
  Linkedin,
  Mail,
  MapPin,
  Wrench,
} from "lucide-react";
import Link from "next/link";

const skills = [
  { name: "ESP32 Microcontrollers", level: "Expert" },
  { name: "STM32 Microcontroller", level: "Advanced" },
  { name: "Raspberry Pi", level: "Advanced" },
  { name: "Embedded C / Hardware Integration", level: "Expert" },
  { name: "AI Agents & Model Context Protocol (MCP)", level: "Advanced" },
  { name: "OpenCV & Computer Vision", level: "Advanced" },
  { name: "Python & C", level: "Expert" },
  { name: "Amazon Web Services (AWS)", level: "Advanced" },
  { name: "Cybersecurity & WAF", level: "Advanced" },
];

const experience = [
  {
    role: "IoT & Embedded Programming Trainee",
    company: "Taras Systems and Solutions",
    period: "Nov 2024 - May 2025",
    details:
      "Completed hands-on industrial training on Embedded Systems, STM32 Blue Pill microcontroller architecture, and firmware-hardware sensor integration pipelines.",
  },
];

const education = [
  {
    degree:
      "Bachelor of Technology in IoT (Specialization in IoT, Embedded & Security)",
    institution: "KL University",
    period: "Aug 2023 - Present (Graduation May 2027)",
    details:
      "Focusing on hardware programming, wireless sensor networks, cloud deployments, and cybersecurity checks.",
  },
  {
    degree: "Intermediate (12th), MPC",
    institution: "Life Academy",
    period: "2021 - 2022",
    details: "Mathematics, Physics, Chemistry.",
  },
];

const featuredProjects = [
  "AI-Driven Web Application Security Suite (WAF + Scanner)",
  "AWS Cloud Security Posture Monitoring System",
  "IoT Multi Parameter Environmental Monitoring System",
  "Gesture-Driven Robotic Control using OpenCV",
  "IoT Smart Mirror using Personal Assistant",
  "Heart Rate Monitoring Using OLED Display and STM32",
  "Wildlife Protection And Forest Fires Using Forest Water",
];

export default function ResumePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10 min-h-[calc(100vh-12rem)]">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Resume</span>
        </div>

        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Mohammed Habib Qureshi
            </h1>
            <p className="text-lg text-muted-foreground font-medium">
              Embedded Systems & IoT Engineer | Specializing in Security &
              Connected Systems
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Kanker, Chhattisgarh, India
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-primary" />
                mdhabib.qureshi786@gmail.com
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href="https://github.com/MohammedHabibQureshi"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 border border-border bg-card px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </a>
            <a
              href="https://www.linkedin.com/in/md-habib-qureshi/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 border border-border bg-card px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <Linkedin className="h-4 w-4" />
              <span>LinkedIn</span>
            </a>
          </div>
        </div>
      </div>

      {/* Summary */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Wrench className="h-5 w-5 text-primary" />
          Professional Summary
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          I’m an IoT and Embedded Systems engineer focused on building
          real-world smart solutions using ESP32, STM32, and Raspberry Pi. I
          have hands-on experience developing systems such as environmental
          sensor networks, gesture-controlled robotics, and cloud-integrated
          smart mirrors, coupled with active certification in AWS and Agentic
          AI.
        </p>
      </section>

      {/* Skills */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Wrench className="h-5 w-5 text-primary" />
          Core Skills
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {skills.map((skill) => (
            <div
              key={skill.name}
              className="flex items-center justify-between p-3 border border-border rounded-lg bg-card"
            >
              <span className="text-xs font-semibold text-foreground">
                {skill.name}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">
                {skill.level}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Experience */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Briefcase className="h-5 w-5 text-primary" />
          Experience
        </h2>
        <div className="space-y-4">
          {experience.map((exp) => (
            <div
              key={exp.role}
              className="p-4 border border-border rounded-lg bg-card"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-foreground">
                    {exp.role}
                  </h3>
                  <p className="text-xs text-primary font-semibold">
                    {exp.company}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full w-fit">
                  {exp.period}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {exp.details}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Education */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <GraduationCap className="h-5 w-5 text-primary" />
          Education
        </h2>
        <div className="space-y-4">
          {education.map((edu) => (
            <div
              key={edu.degree}
              className="p-4 border border-border rounded-lg bg-card"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-foreground">
                    {edu.degree}
                  </h3>
                  <p className="text-xs text-primary font-semibold">
                    {edu.institution}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full w-fit">
                  {edu.period}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {edu.details}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <FolderGit2 className="h-5 w-5 text-primary" />
          Selected Projects
        </h2>
        <ul className="space-y-2">
          {featuredProjects.map((project) => (
            <li
              key={project}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Award className="h-4 w-4 text-primary shrink-0" />
              <span>{project}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="border-t border-border pt-6">
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Mail className="h-4 w-4" />
          <span>Get in Touch</span>
        </Link>
      </div>
    </div>
  );
}
