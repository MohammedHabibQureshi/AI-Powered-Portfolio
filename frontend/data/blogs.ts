export interface BlogPost {
  slug: string;
  title: string;
  content: string;
  summary: string;
  reading_time: number;
  published: boolean;
  tags: string[];
}

export const blogs: BlogPost[] = [
  {
    slug: "secure-iot-systems",
    title: "Designing Secure Embedded & IoT Systems",
    content:
      "Internet of Things (IoT) devices often represent the soft underbelly of network security. In this post, we discuss hardware integration safety, custom firmware implementation using ESP32, and how to run security posture audits on connected cloud backends.",
    summary: "An overview of building secure, hardened firmware and checking cloud integrations.",
    reading_time: 6,
    published: true,
    tags: ["IoT", "Embedded Systems", "Cybersecurity"],
  },
  {
    slug: "aws-cloud-security-automation",
    title: "Automating AWS Cloud Security Audits with Lambda & EventBridge",
    content:
      "Continuous monitoring of cloud configurations is key to maintaining a strong security posture. In this post, we explore how to leverage AWS Lambda, EventBridge rules, and Boto3 script libraries to run automated daily checks for publicly exposed S3 buckets, open security group ports, and inactive IAM credentials.",
    summary: "A step-by-step guide to automating infrastructure compliance and security checks on AWS using serverless triggers.",
    reading_time: 8,
    published: true,
    tags: ["AWS", "Cloud Security", "DevOps", "Serverless"],
  },
  {
    slug: "mcp-ai-agents-iot",
    title: "Connecting AI Agents to Local Hardware: Introducing MCP for IoT",
    content:
      "Model Context Protocol (MCP) bridges the gap between LLMs and local development environments. This post details how to write a custom MCP server in Python/FastAPI that allows an AI Agent to interface directly with connected microcontroller debuggers, read serial port telemetry from STM32 chips, and compile firmware binaries.",
    summary: "How to use Model Context Protocol (MCP) to let AI Agents interact with hardware sensors and compile microcontroller firmware.",
    reading_time: 7,
    published: true,
    tags: ["AI Agents", "MCP", "IoT", "FastAPI"],
  },
  {
    slug: "gesture-recognition-opencv",
    title: "Real-time Gesture Recognition with OpenCV and Python",
    content:
      "Implementing touchless human-machine interfaces requires robust spatial calculations. Here, we break down hand tracking algorithms using OpenCV's contour detection and Convex Hull techniques to translate raw camera frames into precise control directives for mechanical actuators.",
    summary: "Building a gesture control module from scratch using Python, OpenCV contour maps, and camera frames.",
    reading_time: 5,
    published: true,
    tags: ["Computer Vision", "OpenCV", "Python", "Robotics"],
  },
];

export function getBlogBySlug(slug: string): BlogPost | undefined {
  return blogs.find((b) => b.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return blogs.map((b) => b.slug);
}
