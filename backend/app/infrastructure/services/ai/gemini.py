import json
import logging
from typing import Any, AsyncGenerator, Dict, List

import google.generativeai as genai

from app.core.config import settings
from app.domain.repositories.ai_provider import AIProvider

logger = logging.getLogger("app.infrastructure.services.ai.gemini")

class GeminiProvider(AIProvider):
    """Google Gemini implementation of the AIProvider contract."""

    def __init__(self):
        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY is not set. GeminiProvider operations will fail.")
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model_name = "gemini-1.5-flash"

    async def generate(self, prompt: str, system_instruction: str) -> Dict[str, Any]:
        """Generate static text response."""
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "mockkey":
            return {"text": "API Key is set to mock value.", "confidence": 0.95}

        try:
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_instruction
            )
            response = model.generate_content(prompt)
            return {"text": response.text, "confidence": 0.95}
        except Exception as e:
            logger.error(f"Gemini generate error: {e}")
            return {"text": f"Error: {str(e)}", "confidence": 0.0}

    async def stream(
        self, 
        prompt: str, 
        history: List[Dict[str, Any]], 
        system_instruction: str
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream chunks of response containing text segments."""
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "mockkey":
            import asyncio
            logger.info("Using local mock AI stream fallback")
            
            # Simple simulation of grounded twin persona streaming
            reply_text = ""
            if "FEATURED PROJECTS DETAILS" in system_instruction:
                reply_text = (
                    "Based on my verified database records, here are the main projects I've built:\n\n"
                    "1. **AI-Driven Web Application Security Suite (WAF + Scanner)**: Real-time security monitor and custom WAF with FastAPI and React.\n"
                    "2. **AWS Cloud Security Posture Monitoring System**: Continuous compliance auditor built on AWS Lambdas, DynamoDB, and Terraform IaC.\n"
                    "3. **IoT Multi Parameter Environmental Monitoring System**: Real-time DHT/MQ sensor tracking network using ESP32 microcontrollers over MQTT.\n"
                    "4. **Gesture-Driven Robotic Control using OpenCV**: Touchless hand gesture tracking system using computer vision pipelines.\n"
                    "5. **IoT Smart Mirror using Personal Assistant**: Pi-powered smart display with DHT/gas hazard sensors.\n"
                    "6. **Heart Rate Monitoring Using OLED Display and STM32**: Bare-metal pulse tracking firmware developed in C.\n"
                    "7. **Wildlife Protection And Forest Fires**: Early fire hazard alert system utilizing smoke sensors and sirens.\n\n"
                    "Let me know if you would like to explore any of these in detail!"
                )
            elif "PROFESSIONAL EXPERIENCE CHECKPOINTS" in system_instruction:
                reply_text = (
                    "I am currently studying for my **Bachelor of Technology in IoT (Specialization in Security)** at **KL University** (2023 - 2027). "
                    "I completed hands-on training as an **IoT & Embedded Programming Trainee** at **Taras Systems and Solutions** (Nov 2024 - May 2025)."
                )
            elif "PORTFOLIO TIMELINE & ACHIEVEMENTS" in system_instruction:
                reply_text = (
                    "Here are my verified timeline milestones and achievements:\n\n"
                    "- **Oracle Certified Agentic AI Foundational Associate** (Jul 2026): Certified in AI Agents, LangChain, and MCP.\n"
                    "- **AWS Certified Cloud Practitioner** (Mar 2026): Certified in core AWS services.\n"
                    "- **Coursera Computer Forensics Certification** (Mar 2026): Hardening networks and forensics controls.\n"
                    "- **Embedded System & IoT Programming Certificate** (May 2025): Taras Systems training completion.\n"
                    "- **IBM Introduction to AI** (Dec 2024) & **NPTEL Introduction to IoT** (Oct 2024).\n"
                    "- **Started B-Tech in IoT at KL University** (Aug 2023)."
                )
            elif "CORE PROFESSIONAL SKILLS" in system_instruction:
                reply_text = (
                    "My core competencies cover:\n"
                    "- **IoT & Embedded Systems**: ESP32, STM32, Raspberry Pi, Arduino, Embedded C, Hardware Interfacing, WSN Protocols\n"
                    "- **Cloud & IaC**: Amazon Web Services (AWS), AWS Lambda, Terraform (IaC), Boto3, CloudWatch, DynamoDB\n"
                    "- **AI & Software**: AI Agents, LangChain, Model Context Protocol (MCP), Python, OpenCV Computer Vision, C\n"
                    "- **Security & Networking**: Cybersecurity & WAF, Computer Forensics, and Google Computer Networking."
                )
            elif "contact" in system_instruction.lower():
                reply_text = (
                    "You can reach out to me directly through the form on the **Contact** page, "
                    "or connect via LinkedIn (md-habib-qureshi) and GitHub. I am open to internships in Hyderabad, Bangalore, Pune, or Remote!"
                )
            else:
                reply_text = (
                    "I am Mohammed Habib Qureshi's AI Twin, grounded in his verified portfolio database. "
                    "I can only answer questions related to my projects, embedded firmware skills, AWS certifications, or academic timeline. Please ask a question related to my background."
                )

            words = reply_text.split(" ")
            for i in range(0, len(words), 3):
                chunk_words = " ".join(words[i:i+3]) + " "
                yield {
                    "chunk": chunk_words,
                    "confidence": 0.95,
                    "citations": []
                }
                await asyncio.sleep(0.02)
            return

        try:
            contents = []
            for msg in history:
                role = "user" if msg.get("sender") == "user" else "model"
                contents.append({
                    "role": role,
                    "parts": [msg.get("text", "")]
                })
            
            contents.append({
                "role": "user",
                "parts": [prompt]
            })

            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_instruction
            )

            # Synchronous streaming client called in iterable
            response = model.generate_content(contents, stream=True)
            confidence = 0.95
            
            for chunk in response:
                text_chunk = chunk.text
                
                # Simple heuristic detection for fallback responses
                lower_text = text_chunk.lower()
                if "don't have verified info" in lower_text or "sorry" in lower_text or "i don't know" in lower_text:
                    confidence = 0.2

                yield {
                    "chunk": text_chunk,
                    "confidence": confidence,
                    "citations": []
                }
        except Exception as e:
            logger.error(f"Gemini streaming error: {e}")
            yield {"chunk": f"\n[Streaming Exception: {str(e)}]", "confidence": 0.0, "citations": []}

    async def summarize(self, text: str) -> str:
        """Utility task summarizing large text chunks."""
        instruction = "You are a summarizing utility. Condense the text provided, preserving essential technical terms."
        res = await self.generate(prompt=f"Summarize the following text:\n\n{text}", system_instruction=instruction)
        return res.get("text", "")

    async def classify(self, text: str, categories: List[str]) -> str:
        """Classify input query intent into a target category classification."""
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "mockkey":
            text_lower = text.lower()
            if "project" in text_lower or "portfolio" in text_lower:
                return "projects"
            elif "experience" in text_lower or "career" in text_lower or "work" in text_lower or "job" in text_lower:
                return "experience"
            elif "skill" in text_lower or "tech" in text_lower or "language" in text_lower:
                return "skills"
            elif "timeline" in text_lower or "milestone" in text_lower or "history" in text_lower or "achieve" in text_lower or "award" in text_lower or "certif" in text_lower or "won" in text_lower:
                return "timeline"
            elif "contact" in text_lower or "email" in text_lower or "hire" in text_lower or "reach" in text_lower:
                return "contact"
            elif "hi" in text_lower or "hello" in text_lower or "hey" in text_lower or "greet" in text_lower:
                return "greeting"
            return "other"

        instruction = (
            "You are an intent classification routing engine. "
            f"Classify the input text into exactly one of these categories: {', '.join(categories)}. "
            "Respond ONLY with the category name, no extra characters."
        )
        res = await self.generate(prompt=text, system_instruction=instruction)
        return res.get("text", "unknown").strip().lower()

    async def extract(self, text: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Extract structured JSON maps matching specified validation schemas."""
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "mockkey":
            logger.info("Using local mock AI extract fallback")
            return {
                "match_percentage": 85,
                "relevant_projects": [
                    {"title": "AI-Driven Web Application Security Suite (WAF & Scanner)", "reason": "Uses FastAPI, React and Gemini AI to intercept request threats."}
                ],
                "relevant_skills": ["Python", "FastAPI", "React & Next.js", "PostgreSQL & Redis"],
                "gaps": ["Kubernetes"],
                "recommendation": "Strong fit for Full Stack AI Engineer. Solid experience with FastAPI and React."
            }

        instruction = (
            "You are a structured parser. Extract data from the provided text according to this JSON Schema:\n"
            f"{json.dumps(schema)}\n"
            "Return ONLY valid JSON content."
        )
        try:
            model = genai.GenerativeModel(self.model_name)
            response = model.generate_content(
                f"Extract data from:\n\n{text}",
                generation_config={
                    "response_mime_type": "application/json",
                    "system_instruction": instruction
                }
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Gemini structured extract error: {e}")
            return {}
