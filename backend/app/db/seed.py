import asyncio
import logging

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from datetime import date
from app.core.config import settings
from app.infrastructure.models.others import Blog
from app.infrastructure.models.portfolio import Project, ProjectTechnology, Skill, Experience, Education, TimelineEvent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app.db.seed")

async def seed_data():
    """Generates real portfolio information inside the PostgreSQL/SQLite database for Mohammed Habib Qureshi."""
    logger.info("Initializing connection engine...")
    engine = create_async_engine(settings.DATABASE_URL, echo=True)

    # Ensure tables exist
    logger.info("Ensuring database tables exist...")
    from app.infrastructure.models.base import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Force refresh for a fresh start so updates show up immediately
        logger.info("Cleaning up old mock data...")
        await session.execute(delete(ProjectTechnology))
        await session.execute(delete(Project))
        await session.execute(delete(Skill))
        await session.execute(delete(Blog))
        await session.execute(delete(Experience))
        await session.execute(delete(Education))
        await session.execute(delete(TimelineEvent))
        await session.commit()

        # 1. Seed Skills mapping Mohammed Habib Qureshi's actual LinkedIn profile
        logger.info("Seeding skills...")
        skills_data = [
          # IoT / Embedded
          Skill(name="ESP32 Microcontrollers", category="IoT & Embedded", level=5, years_of_experience=2, display_order=1),
          Skill(name="STM32 Microcontroller", category="IoT & Embedded", level=4, years_of_experience=2, display_order=2),
          Skill(name="Raspberry Pi", category="IoT & Embedded", level=4, years_of_experience=2, display_order=3),
          Skill(name="Embedded C", category="IoT & Embedded", level=4, years_of_experience=2, display_order=4),
          Skill(name="Hardware Integration", category="IoT & Embedded", level=5, years_of_experience=3, display_order=5),
          # AI & Computer Vision
          Skill(name="AI Agents & LangChain", category="AI & Software", level=4, years_of_experience=1, display_order=6),
          Skill(name="Model Context Protocol (MCP)", category="AI & Software", level=4, years_of_experience=1, display_order=7),
          Skill(name="OpenCV & Computer Vision", category="AI & Software", level=4, years_of_experience=2, display_order=8),
          Skill(name="Python (Programming Language)", category="AI & Software", level=5, years_of_experience=3, display_order=9),
          # Cloud & IaC
          Skill(name="Amazon Web Services (AWS)", category="Cloud & DevOps", level=4, years_of_experience=2, display_order=10),
          Skill(name="AWS Lambda", category="Cloud & DevOps", level=4, years_of_experience=2, display_order=11),
          Skill(name="Terraform (IaC)", category="Cloud & DevOps", level=4, years_of_experience=2, display_order=12),
          Skill(name="Boto3 & DynamoDB", category="Cloud & DevOps", level=4, years_of_experience=2, display_order=13),
          # Security & Networking
          Skill(name="Cybersecurity & WAF", category="Security & Networking", level=4, years_of_experience=2, display_order=14),
          Skill(name="Computer Forensics", category="Security & Networking", level=4, years_of_experience=1, display_order=15),
          Skill(name="Computer Networking", category="Security & Networking", level=5, years_of_experience=2, display_order=16),
          # Frontend / Backend
          Skill(name="FastAPI", category="Backend Systems", level=5, years_of_experience=2, display_order=17),
          Skill(name="React.js", category="Frontend Development", level=4, years_of_experience=2, display_order=18)
        ]
        session.add_all(skills_data)
        await session.flush()

        # Build skill map (lowercase name -> Skill object)
        skill_map = {s.name.lower(): s for s in skills_data}

        # Helper to get or create skill
        def get_or_create_skill(name: str) -> Skill:
            name_lower = name.lower()
            if name_lower in skill_map:
                return skill_map[name_lower]
            for k, s in skill_map.items():
                if name_lower in k or k in name_lower:
                    return s
            new_skill = Skill(name=name, category="Other Tools", level=3, years_of_experience=1, display_order=99)
            session.add(new_skill)
            skill_map[name_lower] = new_skill
            return new_skill

        # 2. Seed Projects from Mohammed Habib Qureshi's real projects
        logger.info("Seeding projects...")
        projects_data = [
            {
                "title": "AI-Driven Web Application Security Suite (WAF + Scanner)",
                "slug": "ai-driven-web-security-suite",
                "full_description": "Full-stack AI-driven Web Security Suite for automated vulnerability scanning, Web Application Firewall (WAF), and real-time security monitoring using FastAPI and React.",
                "short_description": "Integrated Google Gemini AI to deliver intelligent vulnerability analysis, remediation guidance, and automated security reporting.",
                "problem_statement": "Standard signature-based Web Application Firewalls (WAF) rely on static regular expressions and fail to detect zero-day exploits, SQL injections, and custom LLM prompt injections.",
                "solution": "Developed the complete application architecture—including backend APIs, database integration, background task processing, WebSocket communication, and an interactive security dashboard.",
                "challenges": "Optimizing FastAPI custom WAF middleware scanning latency to remain sub-100ms for incoming traffic analysis.",
                "objectives": "- Automate security scanning for web applications.\n- Implement a robust WAF using FastAPI middleware.\n- Provide real-time dashboards for monitoring security events.\n- Detect both known signatures and zero-day threats using AI models.",
                "learning": "Developed deep understanding of WebSockets for real-time streaming of security alerts. Gained experience with Gemini API integration for prompt-based security analysis of suspicious payloads. Improved FastAPI performance profiling skills.",
                "results": "Achieved a 99% detection rate on OWASP Top 10 vulnerabilities during tests. Maintained sub-50ms latency overhead on intercepted requests. Deployed the solution successfully in a staging environment.",
                "security_model": "The system utilizes JWT for authenticated access to the dashboard. All external API communications are TLS encrypted. The WAF itself blocks malicious payloads at the ASGI middleware level before they reach application endpoints.",
                "highlights": ["AI-Powered Threat Detection", "Real-time WebSocket Dashboard", "Low-latency WAF Middleware", "Automated Vulnerability Scanning"],
                "estimated_duration": "3 Months",
                "status": "published",
                "tech_names": ["FastAPI", "React.js", "Python (Programming Language)", "Cybersecurity & WAF"],
                "github_url": "https://github.com/MohammedHabibQureshi/AI-Driven-Web-Application-Security-Suite-WAF-Scanner-"
            },
            {
                "title": "AWS Cloud Security Posture Monitoring System",
                "slug": "aws-cloud-security-posture-monitor",
                "full_description": "Automated AWS Cloud Security Posture Monitoring (CSPM) system using AWS Lambda to continuously scan cloud resources for security misconfigurations and compliance risks.",
                "short_description": "Implemented real-time monitoring, automated security assessments, and alerting for IAM, S3, EC2, and CloudTrail using Boto3, CloudWatch, SNS, and DynamoDB.",
                "problem_statement": "Cloud resource configurations change constantly, and manual posture audits are slow, error-prone, and fail to prevent security policy drifts in real-time.",
                "solution": "Led end-to-end development — infrastructure provisioning with Terraform, serverless automation, security scanning, and cloud monitoring.",
                "challenges": "Preventing state representation gaps in DynamoDB databases during fast resource deletions.",
                "objectives": "- Continuously evaluate AWS resources for misconfigurations.\n- Provide immediate alerting on security risks.\n- Automate compliance checks across multiple AWS accounts.",
                "learning": "Deepened knowledge of Terraform state management and AWS Boto3 APIs. Learned how to build serverless event-driven architectures efficiently.",
                "results": "Successfully identified 15+ common misconfigurations in test environments within 5 minutes of their creation.",
                "security_model": "Relies heavily on IAM least privilege principles for Lambda execution roles. All logs are securely shipped to CloudWatch with encryption at rest.",
                "highlights": ["Serverless Architecture", "Infrastructure as Code", "Event-driven Security", "Continuous Monitoring"],
                "estimated_duration": "2 Months",
                "status": "published",
                "tech_names": ["AWS Lambda", "Terraform (IaC)", "Boto3 & DynamoDB", "Amazon Web Services (AWS)"],
                "github_url": "https://github.com/MohammedHabibQureshi/aws-cloud-security-posture-monitor"
            },
            {
                "title": "IoT Multi Parameter Environmental Monitoring System",
                "slug": "iot-based-environmental-sensor-network",
                "full_description": "Real-time environmental monitoring system using ESP32, DHT, air quality, and pressure sensors, integrated with a cloud dashboard for remote visualization.",
                "short_description": "Enabled continuous tracking of temperature, humidity, and air quality for smart city and industrial safety use cases.",
                "problem_statement": "Industrial and smart city environments lack high-density, real-time tracking of environmental factors, leading to delayed safety responses.",
                "solution": "Led end-to-end development — sensor interfacing, firmware development, IoT communication protocols, and cloud data pipeline.",
                "challenges": "Optimizing MQTT message payload sizes and transmission reliability over low-bandwidth wireless sensor networks.",
                "status": "published",
                "tech_names": ["ESP32 Microcontrollers", "Hardware Integration", "Python (Programming Language)"],
                "github_url": "https://github.com/MohammedHabibQureshi/oT-Multi-Parameter-Environmental-Monitoring"
            },
            {
                "title": "Gesture-Driven Robotic Control using OpenCV",
                "slug": "gesture-driven-robotic-control-using-opencv",
                "full_description": "Touchless robotic motion control system utilizing computer vision gesture recognition pipelines.",
                "short_description": "Developed a touchless robotic control system using Python, OpenCV, and Arduino, enabling real-time hand gesture recognition for motor control.",
                "problem_statement": "Traditional mechanical switches and joystick controllers are unsuitable for sterile, industrial, or hands-free assistive applications.",
                "solution": "Implemented a gesture detection pipeline and integrated it with Arduino-based motor drivers for seamless human-machine interaction.",
                "challenges": "Achieving stable gesture recognition filtering under varying lighting conditions and camera frames.",
                "status": "published",
                "tech_names": ["OpenCV & Computer Vision", "Python (Programming Language)", "Hardware Integration"],
                "github_url": "https://github.com/MohammedHabibQureshi/Gesture-Driven-Robotic-Control-using-OpenCV"
            },
            {
                "title": "IoT Smart Mirror using Personal Assistant",
                "slug": "iot-smart-mirror-using-personal-assistant",
                "full_description": "Designed an IoT-powered smart mirror using Raspberry Pi and ESP32, integrated with APIs for real-time weather, news, and calendar updates.",
                "short_description": "Designed an IoT-powered smart mirror with integrated personal assistant and API widgets.",
                "problem_statement": "Consumer displays lack integrated hardware safety layers that warn users of environmental hazards during daily routines.",
                "solution": "Implemented a safety layer with DHT and gas sensors, triggering buzzer alerts on hazard detection while handling hardware integration.",
                "challenges": "Configuring multi-process communication between MagicMirror JS runtime and Python sensor listeners.",
                "status": "published",
                "tech_names": ["Raspberry Pi", "ESP32 Microcontrollers", "Hardware Integration"],
                "github_url": "https://github.com/MohammedHabibQureshi/IoT-Smart-Mirror-using-Personal-Assistant"
            },
            {
                "title": "Heart Rate Monitoring Using OLED Display and STM32",
                "slug": "heart-rate-monitoring-using-oled-display-and-stm32",
                "full_description": "Portable heart rate monitoring device using STM32 (Blue Pill) and an OLED display, capturing pulse data in real time.",
                "short_description": "Developed firmware using STM32 HAL in STM32CubeIDE and implemented a sensor-to-display data pipeline.",
                "problem_statement": "Consumer heart-rate monitors often rely on heavy operating system layers, increasing power consumption and hardware costs.",
                "solution": "Designed as a low-cost solution for fitness tracking and remote health monitoring.",
                "challenges": "Debugging low-level I2C protocol communication timing parameters for the OLED display.",
                "status": "published",
                "tech_names": ["STM32 Microcontroller", "Embedded C", "Hardware Integration"],
                "github_url": "https://github.com/MohammedHabibQureshi/Heart-Rate-Monitoring-Using-OLED-Display-and-STM32"
            },
            {
                "title": "Wildlife Protection And Forest Fires Using Forest Water",
                "slug": "wildlife-protection-and-forest-fires-using-forest-water",
                "full_description": "Developed an automated forest fire detection system using smoke sensors, buzzers, and LED-guided shelters.",
                "short_description": "Enabled real-time alert triggering to authorities on smoke detection, improving early response to fire hazards.",
                "problem_statement": "Delayed detection of forest fires causes widespread destruction to wildlife before emergency responders can locate the outbreak.",
                "solution": "Contributed to hardware integration, sensor programming, and real-time detection logic.",
                "challenges": "Designing low-power sleep states for microcontrollers deployed in remote wilderness grids.",
                "status": "published",
                "tech_names": ["Embedded C", "Hardware Integration", "ESP32 Microcontrollers"],
                "github_url": "https://github.com/MohammedHabibQureshi/Wildlife-Protection-And-Forest-Fires-Using-Forest-Water"
            }
        ]

        for p_dict in projects_data:
            tech_names = p_dict.pop("tech_names")
            proj = Project(**p_dict)
            session.add(proj)
            await session.flush()
            
            for name in tech_names:
                sk = get_or_create_skill(name)
                await session.flush()
                proj_tech = ProjectTechnology(project_id=proj.id, skill_id=sk.id)
                session.add(proj_tech)

        # 3. Seed Blog
        logger.info("Seeding blogs...")
        blogs = [
            Blog(
                title="Designing Secure Embedded & IoT Systems",
                slug="secure-iot-systems",
                content=(
                    "Internet of Things (IoT) devices often represent the soft underbelly of network security. "
                    "In this post, we discuss hardware integration safety, custom firmware implementation using ESP32, "
                    "and how to run security posture audits on connected cloud backends."
                ),
                summary="An overview of building secure, hardened firmware and checking cloud integrations.",
                reading_time=6,
                published=True,
                tags=["IoT", "Embedded Systems", "Cybersecurity"]
            ),
            Blog(
                title="Automating AWS Cloud Security Audits with Lambda & EventBridge",
                slug="aws-cloud-security-automation",
                content=(
                    "Continuous monitoring of cloud configurations is key to maintaining a strong security posture. "
                    "In this post, we explore how to leverage AWS Lambda, EventBridge rules, and Boto3 script libraries "
                    "to run automated daily checks for publicly exposed S3 buckets, open security group ports, and inactive IAM credentials."
                ),
                summary="A step-by-step guide to automating infrastructure compliance and security checks on AWS using serverless triggers.",
                reading_time=8,
                published=True,
                tags=["AWS", "Cloud Security", "DevOps", "Serverless"]
            ),
            Blog(
                title="Connecting AI Agents to Local Hardware: Introducing MCP for IoT",
                slug="mcp-ai-agents-iot",
                content=(
                    "Model Context Protocol (MCP) bridges the gap between LLMs and local development environments. "
                    "This post details how to write a custom MCP server in Python/FastAPI that allows an AI Agent to interface "
                    "directly with connected microcontroller debuggers, read serial port telemetry from STM32 chips, and compile firmware binaries."
                ),
                summary="How to use Model Context Protocol (MCP) to let AI Agents interact with hardware sensors and compile microcontroller firmware.",
                reading_time=7,
                published=True,
                tags=["AI Agents", "MCP", "IoT", "FastAPI"]
            ),
            Blog(
                title="Real-time Gesture Recognition with OpenCV and Python",
                slug="gesture-recognition-opencv",
                content=(
                    "Implementing touchless human-machine interfaces requires robust spatial calculations. "
                    "Here, we break down hand tracking algorithms using OpenCV's contour detection and Convex Hull techniques "
                    "to translate raw camera frames into precise control directives for mechanical actuators."
                ),
                summary="Building a gesture control module from scratch using Python, OpenCV contour maps, and camera frames.",
                reading_time=5,
                published=True,
                tags=["Computer Vision", "OpenCV", "Python", "Robotics"]
            )
        ]
        session.add_all(blogs)

        # 4. Seed Experience (No formal corporate jobs; seed as open to internships or IoT training certifications)
        logger.info("Seeding experience...")
        experiences = [
            Experience(
                company="Taras Systems and Solutions",
                position="IoT & Embedded Programming Trainee",
                location="Hyderabad, India (Remote)",
                employment_type="Internship",
                start_date=date(2024, 11, 1),
                end_date=date(2025, 5, 1),
                description="Completed rigorous hands-on industrial training on Embedded Systems, STM32 firmware architecture, and hardware-software sensor interfacing.",
                technologies=["Embedded Systems", "IoT", "STM32", "Embedded C"]
            )
        ]
        session.add_all(experiences)

        # 5. Seed Education
        logger.info("Seeding education...")
        educations = [
            Education(
                institution="KL University",
                degree="Bachelor of Technology (B-Tech)",
                major="Internet of Things (IoT) & Specialization in Security",
                cgpa=9.12,
                start_year=2023,
                end_year=2027
            ),
            Education(
                institution="Life Academy",
                degree="Intermediate (12th)",
                major="MPC (Mathematics, Physics, Chemistry)",
                cgpa=8.85,
                start_year=2021,
                end_year=2022
            )
        ]
        session.add_all(educations)

        # 6. Seed Timeline Events using Certifications and key project achievements
        logger.info("Seeding timeline events...")
        events = [
            TimelineEvent(
                event_date=date(2026, 7, 1),
                title="Oracle Certified Agentic AI Foundational Associate",
                description="Earned certification validating core competencies in AI Agents, LangChain, and Model Context Protocol (MCP).",
                category="achievement"
            ),
            TimelineEvent(
                event_date=date(2026, 3, 15),
                title="AWS Certified Cloud Practitioner",
                description="Completed official certification validating foundational knowledge of the AWS cloud platform and core services.",
                category="achievement"
            ),
            TimelineEvent(
                event_date=date(2026, 3, 1),
                title="Coursera Computer Forensics Certification",
                description="Certified in basic network forensics, analysis techniques, and computer security hardening.",
                category="achievement"
            ),
            TimelineEvent(
                event_date=date(2025, 5, 30),
                title="Embedded System Application and IoT Programming Certificate",
                description="Issued by Taras Systems and Solutions for completion of advanced microcontroller firmware interfacing.",
                category="achievement"
            ),
            TimelineEvent(
                event_date=date(2024, 12, 10),
                title="IBM Introduction to Artificial Intelligence",
                description="Earned fundamental validation in core machine learning modules and introductory neural nets.",
                category="achievement"
            ),
            TimelineEvent(
                event_date=date(2024, 10, 1),
                title="NPTEL Introduction to Internet of Things Certification",
                description="Awarded for theoretical and practical assessment in WSN protocols and hardware integrations.",
                category="achievement"
            ),
            TimelineEvent(
                event_date=date(2023, 8, 1),
                title="Started B-Tech in IoT at KL University",
                description="Began undergraduate studies specializing in Internet of Things, Embedded Systems, and Security.",
                category="education"
            )
        ]
        session.add_all(events)

        await session.commit()
        logger.info("Seeding transactions committed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
