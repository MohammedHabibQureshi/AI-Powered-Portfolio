export interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  employment_type: string;
  start_date: string;
  end_date: string;
  description: string;
  technologies: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  major: string;
  cgpa: number;
  start_year: number;
  end_year: number;
}

export interface TimelineEvent {
  id: string;
  event_date: string;
  title: string;
  description: string;
  category: string;
}

export const experiences: Experience[] = [
  {
    id: "exp-1",
    company: "Taras Systems and Solutions",
    position: "IoT & Embedded Programming Trainee",
    location: "Hyderabad, India (Remote)",
    employment_type: "Internship",
    start_date: "2024-11-01",
    end_date: "2025-05-01",
    description:
      "Completed rigorous hands-on industrial training on Embedded Systems, STM32 firmware architecture, and hardware-software sensor interfacing.",
    technologies: ["Embedded Systems", "IoT", "STM32", "Embedded C"],
  },
];

export const education: Education[] = [
  {
    id: "edu-1",
    institution: "KL University",
    degree: "Bachelor of Technology (B-Tech)",
    major: "Internet of Things (IoT) & Specialization in Security",
    cgpa: 9.12,
    start_year: 2023,
    end_year: 2027,
  },
  {
    id: "edu-2",
    institution: "Life Academy",
    degree: "Intermediate (12th)",
    major: "MPC (Mathematics, Physics, Chemistry)",
    cgpa: 8.85,
    start_year: 2021,
    end_year: 2022,
  },
];

export const timelineEvents: TimelineEvent[] = [
  {
    id: "evt-1",
    event_date: "2026-07-01",
    title: "Oracle Certified Agentic AI Foundational Associate",
    description:
      "Earned certification validating core competencies in AI Agents, LangChain, and Model Context Protocol (MCP).",
    category: "achievement",
  },
  {
    id: "evt-2",
    event_date: "2026-03-15",
    title: "AWS Certified Cloud Practitioner",
    description:
      "Completed official certification validating foundational knowledge of the AWS cloud platform and core services.",
    category: "achievement",
  },
  {
    id: "evt-3",
    event_date: "2026-03-01",
    title: "Coursera Computer Forensics Certification",
    description:
      "Certified in basic network forensics, analysis techniques, and computer security hardening.",
    category: "achievement",
  },
  {
    id: "evt-4",
    event_date: "2025-05-30",
    title: "Embedded System Application and IoT Programming Certificate",
    description:
      "Issued by Taras Systems and Solutions for completion of advanced microcontroller firmware interfacing.",
    category: "achievement",
  },
  {
    id: "evt-5",
    event_date: "2024-12-10",
    title: "IBM Introduction to Artificial Intelligence",
    description:
      "Earned fundamental validation in core machine learning modules and introductory neural nets.",
    category: "achievement",
  },
  {
    id: "evt-6",
    event_date: "2024-10-01",
    title: "NPTEL Introduction to Internet of Things Certification",
    description:
      "Awarded for theoretical and practical assessment in WSN protocols and hardware integrations.",
    category: "achievement",
  },
  {
    id: "evt-7",
    event_date: "2023-08-01",
    title: "Started B-Tech in IoT at KL University",
    description:
      "Began undergraduate studies specializing in Internet of Things, Embedded Systems, and Security.",
    category: "education",
  },
];
