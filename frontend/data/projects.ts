export interface ArchitectureDiagramEntry {
  src: string;
  alt: string;
  caption?: string;
  type: "primary" | "hardware" | "sequence" | "flowchart";
}

export interface ProjectCaseStudy {
  slug: string;
  title: string;
  short_description: string;
  full_description: string;
  problem_statement: string;
  solution: string;
  architecture?: string;
  objectives?: string;
  learning?: string;
  results?: string;
  security_model?: string;
  challenges?: string;
  highlights?: string[];
  tech_names: string[];
  category: string;
  github_url?: string;
  demo_url?: string;
  estimated_duration?: string;
  cover_image?: string;
  architecture_diagrams?: ArchitectureDiagramEntry[];
  ascii_diagram?: string;
}

export const projects: ProjectCaseStudy[] = [
  {
    slug: "ai-driven-web-security-suite",
    title: "AI-Driven Web Application Security Suite (WAF + Scanner)",
    short_description: "Integrated Google Gemini AI to deliver intelligent vulnerability analysis, remediation guidance, and automated security reporting.",
    full_description: "Full-stack AI-driven Web Security Suite for automated vulnerability scanning, Web Application Firewall (WAF), and real-time security monitoring using FastAPI and React.",
    problem_statement: "Standard signature-based Web Application Firewalls (WAF) rely on static regular expressions and fail to detect zero-day exploits, SQL injections, and custom LLM prompt injections.",
    solution: "Developed the complete application architecture\u2014including backend APIs, database integration, background task processing, WebSocket communication, and an interactive security dashboard.",
    architecture: "Microservices architecture with FastAPI backend, React frontend, PostgreSQL for persistent storage, Redis for caching and task queues, Celery for background scan processing, and WebSocket connections for real-time dashboard updates.",
    objectives: "- Automate security scanning for web applications.\n- Implement a robust WAF using FastAPI middleware.\n- Provide real-time dashboards for monitoring security events.\n- Detect both known signatures and zero-day threats using AI models.",
    learning: "Developed deep understanding of WebSockets for real-time streaming of security alerts. Gained experience with Gemini API integration for prompt-based security analysis of suspicious payloads. Improved FastAPI performance profiling skills.",
    results: "Achieved a 99% detection rate on OWASP Top 10 vulnerabilities during tests. Maintained sub-50ms latency overhead on intercepted requests. Deployed the solution successfully in a staging environment.",
    security_model: "The system utilizes JWT for authenticated access to the dashboard. All external API communications are TLS encrypted. The WAF itself blocks malicious payloads at the ASGI middleware level before they reach application endpoints.",
    highlights: ["AI-Powered Threat Detection", "Real-time WebSocket Dashboard", "Low-latency WAF Middleware", "Automated Vulnerability Scanning"],
    tech_names: ["FastAPI", "React", "Python", "PostgreSQL", "Redis", "Celery", "Gemini AI"],
    category: "Security",
    github_url: "https://github.com/MohammedHabibQureshi/AI-Driven-Web-Application-Security-Suite-WAF-Scanner-",
    estimated_duration: "3 Months",
    architecture_diagrams: [
      {
        src: "/projects/ai-web-security/system-architecture.png",
        alt: "AI-Driven Web Application Security Suite system architecture showing FastAPI backend, React frontend, PostgreSQL database, Redis cache, Celery workers, and Gemini AI integration",
        caption: "Full-stack security platform with AI-powered vulnerability analysis",
        type: "primary",
      },
    ],
  },
  {
    slug: "aws-cloud-security-posture-monitor",
    title: "AWS Cloud Security Posture Monitoring System",
    short_description: "Implemented real-time monitoring, automated security assessments, and alerting for IAM, S3, EC2, and CloudTrail using Boto3, CloudWatch, SNS, and DynamoDB.",
    full_description: "Automated AWS Cloud Security Posture Monitoring (CSPM) system using AWS Lambda to continuously scan cloud resources for security misconfigurations and compliance risks.",
    problem_statement: "Cloud resource configurations change constantly, and manual posture audits are slow, error-prone, and fail to prevent security policy drifts in real-time.",
    solution: "Led end-to-end development \u2014 infrastructure provisioning with Terraform, serverless automation, security scanning, and cloud monitoring.",
    architecture: "Event-driven serverless architecture using AWS Lambda functions triggered by EventBridge rules on a schedule. Lambda functions use Boto3 to scan IAM policies, S3 bucket permissions, security groups, and CloudTrail logging status. Results are stored in DynamoDB and alerts are published via SNS.",
    objectives: "- Continuously evaluate AWS resources for misconfigurations.\n- Provide immediate alerting on security risks.\n- Automate compliance checks across multiple AWS accounts.",
    learning: "Deepened knowledge of Terraform state management and AWS Boto3 APIs. Learned how to build serverless event-driven architectures efficiently.",
    results: "Successfully identified 15+ common misconfigurations in test environments within 5 minutes of their creation.",
    security_model: "Relies heavily on IAM least privilege principles for Lambda execution roles. All logs are securely shipped to CloudWatch with encryption at rest.",
    highlights: ["Serverless Architecture", "Infrastructure as Code", "Event-driven Security", "Continuous Monitoring"],
    tech_names: ["AWS Lambda", "Terraform", "Boto3", "DynamoDB", "CloudWatch", "SNS", "Python"],
    category: "Cloud/DevOps",
    github_url: "https://github.com/MohammedHabibQureshi/aws-cloud-security-posture-monitor",
    estimated_duration: "2 Months",
    architecture_diagrams: [
      {
        src: "/projects/aws-cspm/architecture.svg",
        alt: "AWS Cloud Security Posture Monitoring System architecture showing EventBridge and CloudTrail triggering a Lambda scanner with IAM, S3, EC2, and CloudTrail check modules, a risk score engine, and outputs to DynamoDB, SNS, CloudWatch, and Security Hub",
        caption: "Event-driven serverless CSPM architecture using Lambda, EventBridge, CloudTrail, DynamoDB, SNS, CloudWatch, and Security Hub",
        type: "primary",
      },
    ],
  },
  {
    slug: "iot-based-environmental-sensor-network",
    title: "IoT Multi Parameter Environmental Monitoring System",
    short_description: "Enabled continuous tracking of temperature, humidity, and air quality for smart city and industrial safety use cases.",
    full_description: "Real-time environmental monitoring system using ESP32, DHT, air quality, and pressure sensors, integrated with a cloud dashboard for remote visualization.",
    problem_statement: "Industrial and smart city environments lack high-density, real-time tracking of environmental factors, leading to delayed safety responses.",
    solution: "Led end-to-end development \u2014 sensor interfacing, firmware development, IoT communication protocols, and cloud data pipeline.",
    architecture: "ESP32 microcontroller reads DHT22 (temperature/humidity), MQ135 (air quality), and BMP280 (pressure) sensors over GPIO/I2C. Data is transmitted via Wi-Fi HTTP to ThingSpeak cloud platform for visualization and historical monitoring.",
    objectives: "- Monitor multiple environmental parameters using a single IoT device.\n- Enable remote visualization via cloud dashboards.\n- Achieve reliable wireless data transmission.",
    challenges: "Optimizing MQTT message payload sizes and transmission reliability over low-bandwidth wireless sensor networks.",
    learning: "Gained hands-on experience with ESP32 firmware development, sensor calibration, and IoT cloud integration patterns.",
    results: "Successfully deployed a working prototype that continuously monitors temperature, humidity, air quality, and atmospheric pressure with cloud visualization.",
    highlights: ["Multi-Sensor Integration", "Real-time Cloud Dashboard", "Low-Power Design", "Wi-Fi Data Pipeline"],
    tech_names: ["ESP32", "DHT22", "MQ135", "BMP280", "Arduino IDE", "ThingSpeak", "Python"],
    category: "IoT/Embedded",
    github_url: "https://github.com/MohammedHabibQureshi/oT-Multi-Parameter-Environmental-Monitoring",
    estimated_duration: "2 Months",
    architecture_diagrams: [
      {
        src: "/projects/environmental-monitoring/system-architecture.png",
        alt: "IoT Environmental Monitoring system architecture showing ESP32 microcontroller with DHT22, MQ135, and BMP280 sensors transmitting data to ThingSpeak cloud via Wi-Fi",
        caption: "System architecture: sensor-to-cloud data pipeline",
        type: "primary",
      },
      {
        src: "/projects/environmental-monitoring/hardware-block-diagram.png",
        alt: "Hardware block diagram showing ESP32 connections to DHT22 temperature sensor, MQ135 air quality sensor, and BMP280 pressure sensor",
        caption: "Hardware block diagram: sensor interfacing",
        type: "hardware",
      },
      {
        src: "/projects/environmental-monitoring/system-sequence.png",
        alt: "System sequence diagram showing data flow from sensor reading through ESP32 processing to ThingSpeak cloud upload",
        caption: "Sequence diagram: data acquisition and transmission",
        type: "sequence",
      },
      {
        src: "/projects/environmental-monitoring/system-flowchart.png",
        alt: "System flowchart showing the monitoring workflow from initialization through sensor reading, data processing, and cloud upload",
        caption: "Flowchart: system workflow",
        type: "flowchart",
      },
    ],
  },
  {
    slug: "gesture-driven-robotic-control-using-opencv",
    title: "Gesture-Driven Robotic Control using OpenCV",
    short_description: "Developed a touchless robotic control system using Python, OpenCV, and Arduino, enabling real-time hand gesture recognition for motor control.",
    full_description: "Touchless robotic motion control system utilizing computer vision gesture recognition pipelines.",
    problem_statement: "Traditional mechanical switches and joystick controllers are unsuitable for sterile, industrial, or hands-free assistive applications.",
    solution: "Implemented a gesture detection pipeline and integrated it with Arduino-based motor drivers for seamless human-machine interaction.",
    architecture: "Python application captures webcam frames, processes them through OpenCV color segmentation and contour detection, identifies hand gestures using convex hull analysis, and sends serial commands to Arduino motor drivers controlling servo motors for robotic arm movement.",
    objectives: "- Enable touchless control of robotic systems.\n- Achieve real-time gesture recognition.\n- Applicable in automation, assistive technology, and smart manufacturing.",
    challenges: "Achieving stable gesture recognition filtering under varying lighting conditions and camera frames.",
    learning: "Gained deep understanding of computer vision pipelines, OpenCV contour detection, and hardware-software integration for robotics.",
    results: "Built a working prototype that recognizes hand gestures in real-time and controls robotic arm movements with minimal latency.",
    highlights: ["Real-time Gesture Recognition", "Computer Vision Pipeline", "Hardware Integration", "Touchless Control"],
    tech_names: ["Python", "OpenCV", "Arduino", "Servo Motors", "Computer Vision"],
    category: "AI/ML",
    github_url: "https://github.com/MohammedHabibQureshi/Gesture-Driven-Robotic-Control-using-OpenCV",
    estimated_duration: "2 Months",
  },
  {
    slug: "iot-smart-mirror-using-personal-assistant",
    title: "IoT Smart Mirror using Personal Assistant",
    short_description: "Designed an IoT-powered smart mirror with integrated personal assistant and API widgets.",
    full_description: "Designed an IoT-powered smart mirror using Raspberry Pi and ESP32, integrated with APIs for real-time weather, news, and calendar updates.",
    problem_statement: "Consumer displays lack integrated hardware safety layers that warn users of environmental hazards during daily routines.",
    solution: "Implemented a safety layer with DHT and gas sensors, triggering buzzer alerts on hazard detection while handling hardware integration.",
    architecture: "Raspberry Pi runs MagicMirror framework for the mirror display UI, rendering weather, news, and calendar widgets. ESP32 interfaces with DHT temperature/humidity sensor and MQ gas sensor for environmental safety monitoring. buzzer alerts are triggered on hazard detection.",
    objectives: "- Create an interactive smart mirror display.\n- Integrate real-time API data (weather, news, calendar).\n- Implement hardware safety monitoring with sensor alerts.",
    challenges: "Configuring multi-process communication between MagicMirror JS runtime and Python sensor listeners.",
    learning: "Learned to integrate multiple hardware platforms (Raspberry Pi + ESP32) and manage inter-process communication for real-time sensor data.",
    results: "Built a functional smart mirror that displays real-time information and monitors environmental conditions with automatic hazard alerts.",
    highlights: ["Multi-Hardware Integration", "Real-time API Widgets", "Safety Monitoring System", "MagicMirror Customization"],
    tech_names: ["Raspberry Pi", "ESP32", "MagicMirror", "JavaScript", "Python", "Sensors"],
    category: "IoT/Embedded",
    github_url: "https://github.com/MohammedHabibQureshi/IoT-Smart-Mirror-using-Personal-Assistant",
    estimated_duration: "5 Months",
  },
  {
    slug: "heart-rate-monitoring-using-oled-display-and-stm32",
    title: "Heart Rate Monitoring Using OLED Display and STM32",
    short_description: "Developed firmware using STM32 HAL in STM32CubeIDE and implemented a sensor-to-display data pipeline.",
    full_description: "Portable heart rate monitoring device using STM32 (Blue Pill) and an OLED display, capturing pulse data in real time.",
    problem_statement: "Consumer heart-rate monitors often rely on heavy operating system layers, increasing power consumption and hardware costs.",
    solution: "Designed as a low-cost solution for fitness tracking and remote health monitoring.",
    architecture: "STM32 Blue Pill microcontroller reads pulse sensor data via ADC, processes the signal using embedded C firmware, and displays real-time heart rate values on an SSD1306 OLED display via I2C communication.",
    objectives: "- Build a low-cost, portable heart rate monitor.\n- Implement real-time sensor-to-display data pipeline.\n- Optimize firmware for low power consumption.",
    challenges: "Debugging low-level I2C protocol communication timing parameters for the OLED display.",
    learning: "Gained proficiency in STM32 HAL programming, I2C protocol debugging, and low-level embedded firmware development.",
    results: "Successfully built a portable heart rate monitoring device with real-time OLED display and low power consumption.",
    highlights: ["Low-Cost Hardware Design", "Real-time Sensor Pipeline", "I2C Protocol Mastery", "Low-Power Firmware"],
    tech_names: ["STM32", "Embedded C", "OLED Display", "STM32CubeIDE", "Sensors"],
    category: "IoT/Embedded",
    github_url: "https://github.com/MohammedHabibQureshi/Heart-Rate-Monitoring-Using-OLED-Display-and-STM32",
    estimated_duration: "1 Month",
  },
  {
    slug: "wildlife-protection-and-forest-fires-using-forest-water",
    title: "Wildlife Protection And Forest Fires Using Forest Water",
    short_description: "Enabled real-time alert triggering to authorities on smoke detection, improving early response to fire hazards.",
    full_description: "Developed an automated forest fire detection system using smoke sensors, buzzers, and LED-guided shelters.",
    problem_statement: "Delayed detection of forest fires causes widespread destruction to wildlife before emergency responders can locate the outbreak.",
    solution: "Contributed to hardware integration, sensor programming, and real-time detection logic.",
    architecture: "Microcontroller-based system with smoke sensors detecting fire indicators, triggering buzzer alarms and LED-guided shelter indicators for wildlife evacuation paths. Real-time detection logic processes sensor data and activates emergency response mechanisms.",
    objectives: "- Detect forest fires early using smoke sensors.\n- Trigger real-time alerts for authorities.\n- Guide wildlife to safety with LED markers.",
    challenges: "Designing low-power sleep states for microcontrollers deployed in remote wilderness grids.",
    learning: "Learned about low-power embedded design for remote deployments and sensor-driven emergency response systems.",
    results: "Built a prototype forest fire detection system with real-time smoke detection and automated alert triggering.",
    highlights: ["Early Fire Detection", "Real-time Alert System", "Wildlife Safety Guidance", "Low-Power Remote Design"],
    tech_names: ["Arduino", "Smoke Sensors", "Embedded C", "IoT", "Alert Systems"],
    category: "IoT/Embedded",
    github_url: "https://github.com/MohammedHabibQureshi/Wildlife-Protection-And-Forest-Fires-Using-Forest-Water",
    estimated_duration: "2 Months",
  },
];

export function getProjectBySlug(slug: string): ProjectCaseStudy | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getAllProjectSlugs(): string[] {
  return projects.map((p) => p.slug);
}
