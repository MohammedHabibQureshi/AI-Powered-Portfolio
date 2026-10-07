import { COMMON_ENGLISH } from "@/lib/ai/classifier";
import { getKnowledgeService } from "@/lib/ai/knowledge";

export const dynamic = "force-dynamic";

interface JobMatchRequest {
  job_description: string;
}

interface JobMatchResult {
  match_percentage: number;
  relevant_projects: Array<{ title: string; reason: string }>;
  relevant_skills: string[];
  gaps: string[];
  recommendation: string;
}

function tokenize(text: string): Set<string> {
  const tokens = text.toLowerCase().match(/[a-z0-9][a-z0-9_.+-]{2,}/g) || [];
  return new Set(tokens.filter((t) => !COMMON_ENGLISH.has(t)));
}

function properNounTokens(text: string): Set<string> {
  const tokens = text.match(/\b[A-Z][A-Za-z0-9+&.-]{2,}\b/g) || [];
  return new Set(tokens.map((t) => t.toLowerCase()));
}

export async function POST(request: Request) {
  let body: JobMatchRequest;
  try {
    body = (await request.json()) as JobMatchRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.job_description || body.job_description.trim().length < 10) {
    return Response.json(
      { error: "job_description must be at least 10 characters." },
      { status: 400 }
    );
  }

  const snapshot = getKnowledgeService().snapshot();
  const profile = snapshot.profile;
  const vocabulary = snapshot.vocabulary();
  const lowerVocab = new Set([...vocabulary].map((v) => v.toLowerCase()));

  const jobTokens = tokenize(body.job_description);
  const jobNounTokens = properNounTokens(body.job_description);

  const skills = profile.skills;
  const projects = profile.projects;

  // Skills whose name appears in the job description.
  const relevantSkills = skills.filter((skill) => {
    const lower = skill.toLowerCase();
    if (jobTokens.has(lower)) return true;
    const skillTokens = lower.match(/[a-z0-9][a-z0-9_.+-]{2,}/g) || [];
    return skillTokens.some((token) => jobTokens.has(token));
  });

  // Projects whose tech/skills/description overlap the job description.
  const relevantProjects: Array<{ title: string; reason: string }> = [];
  for (const project of projects) {
    const title = project.title ?? "";
    const techText = (project.technologies ?? []).join(" ");
    const skillText = (project.skills ?? []).join(" ");
    const descText = project.description ?? "";
    const projectTokens = tokenize(`${title} ${techText} ${skillText} ${descText}`);
    const overlap = [...projectTokens].filter((t) => jobTokens.has(t));
    if (overlap.length > 0) {
      relevantProjects.push({
        title,
        reason: `Uses technologies/skills matching the job: ${overlap.slice(0, 6).join(", ")}.`,
      });
    }
  }

  // Token overlap as a grounded match score.
  const matchedTokens = [...jobTokens].filter((t) => {
    if (lowerVocab.has(t)) return true;
    for (const entry of lowerVocab) {
      if (entry.includes(t) || t.includes(entry)) return true;
    }
    return false;
  });
  const matchPercentage =
    jobTokens.size > 0 ? Math.round((matchedTokens.length / jobTokens.size) * 100) : 0;

  // Gaps: proper-noun terms in the job description that are not part of the
  // verified profile vocabulary (never invent missing skills).
  const gaps = [...jobNounTokens]
    .filter((t) => {
      if (COMMON_ENGLISH.has(t)) return false;
      if (lowerVocab.has(t)) return false;
      for (const entry of lowerVocab) {
        if (entry.includes(t) || t.includes(entry)) return false;
      }
      return true;
    })
    .slice(0, 12)
    .map((t) => t.replace(/[.+_]/g, " ").trim());

  let recommendation: string;
  if (matchPercentage >= 70) {
    recommendation = `Strong overall fit (${matchPercentage}% token match). ${relevantProjects.length > 0 ? "Relevant projects directly exercise the technologies the job asks for." : "A good portion of the required vocabulary maps to the verified skill set."}`;
  } else if (matchPercentage >= 40) {
    recommendation = `Moderate fit (${matchPercentage}% token match). Several required skills map to the profile, with some gaps that would need training or evidence.`;
  } else {
    recommendation = `Limited direct match (${matchPercentage}% token match). Consider reviewing whether the role aligns with the verified portfolio experience.`;
  }

  const result: JobMatchResult = {
    match_percentage: matchPercentage,
    relevant_projects: relevantProjects,
    relevant_skills: relevantSkills,
    gaps,
    recommendation,
  };

  return Response.json(result);
}