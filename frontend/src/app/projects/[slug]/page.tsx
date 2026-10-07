import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Github,
  ExternalLink,
  BotMessageSquare,
  Clock,
  Target,
  Lightbulb,
  Shield,
  AlertTriangle,
  Trophy,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { getProjectBySlug, getAllProjectSlugs } from "@/data/projects";
import { ArchitectureDiagram } from "@/components/ui/architecture-diagram";
import { ProjectCaseStudyActions } from "./project-actions";

export function generateStaticParams() {
  return getAllProjectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: "Project Not Found" };

  return {
    title: `${project.title} | Mohammed Habib Qureshi`,
    description: project.short_description,
    openGraph: {
      title: project.title,
      description: project.short_description,
      type: "article",
      ...(project.github_url && { url: project.github_url }),
    },
  };
}

function parseObjectives(objectives: string): string[] {
  return objectives
    .split("\n")
    .map((line) => line.replace(/^- /, "").trim())
    .filter((line) => line.length > 0);
}

function extractArchitectureComponents(
  architecture: string
): { name: string; role?: string }[] {
  const components: { name: string; role?: string }[] = [];
  const knownPatterns = [
    { pattern: /FastAPI/i, name: "FastAPI", role: "Backend API" },
    { pattern: /React/i, name: "React", role: "Frontend UI" },
    { pattern: /PostgreSQL/i, name: "PostgreSQL", role: "Database" },
    { pattern: /Redis/i, name: "Redis", role: "Cache / Task Queue" },
    { pattern: /Celery/i, name: "Celery", role: "Background Tasks" },
    { pattern: /WebSocket/i, name: "WebSocket", role: "Real-time Updates" },
    { pattern: /AWS Lambda/i, name: "AWS Lambda", role: "Serverless Compute" },
    { pattern: /Terraform/i, name: "Terraform", role: "Infrastructure as Code" },
    { pattern: /DynamoDB/i, name: "DynamoDB", role: "NoSQL Database" },
    { pattern: /CloudWatch/i, name: "CloudWatch", role: "Monitoring" },
    { pattern: /SNS/i, name: "SNS", role: "Alerting" },
    { pattern: /EventBridge/i, name: "EventBridge", role: "Event Scheduling" },
    { pattern: /Boto3/i, name: "Boto3", role: "AWS SDK" },
    { pattern: /ESP32/i, name: "ESP32", role: "Microcontroller" },
    { pattern: /DHT22|DHT/i, name: "DHT22", role: "Temp/Humidity Sensor" },
    { pattern: /MQ135/i, name: "MQ135", role: "Air Quality Sensor" },
    { pattern: /BMP280/i, name: "BMP280", role: "Pressure Sensor" },
    { pattern: /ThingSpeak/i, name: "ThingSpeak", role: "Cloud Dashboard" },
    { pattern: /OpenCV/i, name: "OpenCV", role: "Computer Vision" },
    { pattern: /Arduino/i, name: "Arduino", role: "Microcontroller" },
    { pattern: /Servo/i, name: "Servo Motors", role: "Motor Control" },
    { pattern: /Raspberry Pi/i, name: "Raspberry Pi", role: "Single-Board Computer" },
    { pattern: /MagicMirror/i, name: "MagicMirror", role: "Display Framework" },
    { pattern: /ESP32/i, name: "ESP32", role: "Sensor Interface" },
    { pattern: /STM32/i, name: "STM32", role: "Microcontroller" },
    { pattern: /OLED|SSD1306/i, name: "OLED Display", role: "Visual Output" },
    { pattern: /I2C/i, name: "I2C", role: "Communication Protocol" },
    { pattern: /Smoke Sensors?/i, name: "Smoke Sensors", role: "Fire Detection" },
    { pattern: /Buzzer/i, name: "Buzzer", role: "Audio Alert" },
    { pattern: /LED/i, name: "LED Indicators", role: "Visual Guidance" },
  ];

  for (const { pattern, name, role } of knownPatterns) {
    if (pattern.test(architecture) && !components.some((c) => c.name === name)) {
      components.push({ name, role });
    }
  }

  return components;
}

export default async function ProjectCaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Project not found.</h2>
        <Link href="/projects" className="text-primary hover:underline">
          Return to Projects
        </Link>
      </div>
    );
  }

  const objectives = project.objectives ? parseObjectives(project.objectives) : [];
  const archComponents = project.architecture
    ? extractArchitectureComponents(project.architecture)
    : [];

  return (
    <article className="max-w-4xl mx-auto space-y-16 pb-20 pt-8 animate-in fade-in duration-500">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </Link>

      {/* Hero Section */}
      <header className="space-y-6 pb-8 border-b border-border">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 rounded-full">
            {project.category}
          </span>
          {project.estimated_duration && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-muted-foreground bg-muted/30 border border-border rounded-full">
              <Clock className="w-3 h-3" />
              {project.estimated_duration}
            </span>
          )}
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
          {project.title}
        </h1>

        <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
          {project.short_description}
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          {project.tech_names.map((tech) => (
            <span
              key={tech}
              className="px-2.5 py-1 text-xs font-medium text-foreground bg-secondary/50 border border-border rounded-md"
            >
              {tech}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4">
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <Github className="w-4 h-4" />
              View Repository
            </a>
          )}
          {project.demo_url && (
            <a
              href={project.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-foreground hover:bg-secondary/80 rounded-lg text-sm font-semibold border border-border transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Live Demo
            </a>
          )}
        </div>
      </header>

      {/* Overview */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Overview
        </h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
          <p>
            {project.full_description || "A comprehensive technical project."}
          </p>
        </div>
      </section>

      {/* Problem */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground border-l-4 border-primary pl-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-primary" />
          The Problem
        </h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed bg-muted/10 p-5 rounded-lg border border-border">
          <p>
            {project.problem_statement ||
              "Addressing complex engineering requirements through robust software design."}
          </p>
        </div>
      </section>

      {/* Solution / Implementation */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          Solution &amp; Implementation
        </h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
          <p>
            {project.solution ||
              "Implementation details to be documented."}
          </p>
        </div>
      </section>

      {/* Technical Objectives */}
      {objectives.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Technical Objectives
          </h2>
          <ul className="space-y-2">
            {objectives.map((obj, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Architecture */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          Architecture
        </h2>

        {project.architecture_diagrams &&
        project.architecture_diagrams.length > 0 ? (
          <>
            {(() => {
              const primary =
                project.architecture_diagrams!.find(
                  (d) => d.type === "primary"
                ) || project.architecture_diagrams![0];
              return (
                <ArchitectureDiagram
                  imageUrl={primary.src}
                  altText={primary.alt}
                  caption={primary.caption}
                  components={archComponents}
                  description={project.architecture}
                />
              );
            })()}
            {project.architecture_diagrams!.length > 1 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-muted-foreground">
                  Additional Diagrams
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {project
                    .architecture_diagrams!.filter(
                      (d) =>
                        d.type !== "primary" &&
                        d.type !==
                          project.architecture_diagrams!.find(
                            (x) => x.type === "primary"
                          )?.type
                    )
                    .map((diag, idx) => (
                      <ArchitectureDiagram
                        key={idx}
                        imageUrl={diag.src}
                        altText={diag.alt}
                        caption={diag.caption}
                      />
                    ))}
                </div>
              </div>
            )}
          </>
        ) : project.ascii_diagram ? (
          <ArchitectureDiagram
            altText={`${project.title} Architecture Diagram`}
            caption="Architecture diagram from project GitHub repository"
            components={archComponents}
            description={project.architecture}
            codeDiagram={project.ascii_diagram}
          />
        ) : (
          <ArchitectureDiagram
            imageUrl={project.cover_image}
            altText={`${project.title} Architecture Diagram`}
            caption="System design and component interactions"
            components={archComponents}
            description={project.architecture}
          />
        )}

        {project.github_url && (
          <p className="text-xs text-muted-foreground text-center">
            Architecture diagram from project{" "}
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              GitHub repository
            </a>
          </p>
        )}
      </section>

      {/* Security Model */}
      {project.security_model && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Security Model
          </h2>
          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed bg-primary/5 p-5 rounded-lg border border-primary/20">
            <p>{project.security_model}</p>
          </div>
        </section>
      )}

      {/* Challenges */}
      {project.challenges && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Challenges
          </h2>
          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
            <p>{project.challenges}</p>
          </div>
        </section>
      )}

      {/* What I Learned */}
      {project.learning && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            What I Learned
          </h2>
          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
            <p>{project.learning}</p>
          </div>
        </section>
      )}

      {/* Results & Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
        {project.results && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Results
            </h2>
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
              <p>{project.results}</p>
            </div>
          </section>
        )}

        {project.highlights && project.highlights.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Technical Highlights
            </h2>
            <ul className="space-y-2">
              {project.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="text-primary font-bold mt-0.5">&#10003;</span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* AI Assistant CTA */}
      <section className="mt-16 pt-10 border-t border-border flex flex-col items-center text-center space-y-6 bg-muted/10 rounded-2xl p-8">
        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary">
          <BotMessageSquare className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            Want to know more about this project?
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            My AI recruiter assistant can answer specific technical questions
            about the architecture, code, and implementation details.
          </p>
        </div>
        <ProjectCaseStudyActions projectTitle={project.title} />
      </section>
    </article>
  );
}
