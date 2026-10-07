export interface Skill {
  name: string;
  category: string;
  level: number;
}

export const skills: Skill[] = [
  { name: "ESP32 Microcontrollers", category: "IoT & Embedded", level: 5 },
  { name: "STM32 Microcontroller", category: "IoT & Embedded", level: 4 },
  { name: "Raspberry Pi", category: "IoT & Embedded", level: 4 },
  { name: "Embedded C", category: "IoT & Embedded", level: 4 },
  { name: "Hardware Integration", category: "IoT & Embedded", level: 5 },
  { name: "AI Agents & LangChain", category: "AI & Software", level: 4 },
  { name: "Model Context Protocol (MCP)", category: "AI & Software", level: 4 },
  { name: "OpenCV & Computer Vision", category: "AI & Software", level: 4 },
  { name: "Python", category: "AI & Software", level: 5 },
  { name: "Amazon Web Services (AWS)", category: "Cloud & DevOps", level: 4 },
  { name: "AWS Lambda", category: "Cloud & DevOps", level: 4 },
  { name: "Terraform", category: "Cloud & DevOps", level: 4 },
  { name: "Boto3 & DynamoDB", category: "Cloud & DevOps", level: 4 },
  { name: "Cybersecurity & WAF", category: "Security & Networking", level: 4 },
  { name: "Computer Forensics", category: "Security & Networking", level: 4 },
  { name: "Computer Networking", category: "Security & Networking", level: 5 },
  { name: "FastAPI", category: "Backend Systems", level: 5 },
  { name: "React", category: "Frontend Development", level: 4 },
];
