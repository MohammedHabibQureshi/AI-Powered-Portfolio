import { describe, expect, it } from "vitest";
import { PROJECT, PROJECT_COMPARISON } from "../constants";
import { getKnowledgeService } from "../knowledge";
import {
  buildRetrieval,
  extractSearchTerms,
  findMatchingRepository,
  normalizeQuery,
  resolveProjectEntity,
  searchProjects,
} from "../retrieval";

const snapshot = getKnowledgeService().snapshot();
const projects = snapshot.profile.projects;
const repositories = snapshot.repositories;

describe("extractSearchTerms / normalizeQuery", () => {
  it("drops stop words and punctuation", () => {
    expect(extractSearchTerms("In aws cspm what he have used?")).toEqual(["aws", "cspm"]);
  });

  it("normalizes case and trailing punctuation", () => {
    expect(normalizeQuery("In aws cspm what he have used?")).toBe("in aws cspm what he have used");
  });

  it("returns an empty list for generic project questions", () => {
    expect(extractSearchTerms("what projects have he done")).toEqual([]);
  });
});

describe("resolveProjectEntity", () => {
  it("resolves the AWS CSPM alias to the portfolio project", () => {
    expect(resolveProjectEntity("In aws cspm what he have used", projects)).toBe(
      "AWS Cloud Security Posture Monitoring System"
    );
  });

  it("resolves a challenge question about cspm", () => {
    expect(resolveProjectEntity("what challenges did he face in the cspm project", projects)).toBe(
      "AWS Cloud Security Posture Monitoring System"
    );
  });

  it("resolves the WAF alias", () => {
    expect(resolveProjectEntity("what did he use in the waf scanner project", projects)).toBe(
      "AI-Driven Web Application Security Suite (WAF + Scanner)"
    );
  });

  it("returns null when no project is referenced", () => {
    expect(resolveProjectEntity("which project best demonstrates your blockchain skills", projects)).toBeNull();
  });
});

describe("searchProjects", () => {
  it("ranks the CSPM project first for a cspm question", () => {
    const results = searchProjects("In aws cspm what he have used", projects, repositories);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].project.title).toBe("AWS Cloud Security Posture Monitoring System");
  });
});

describe("findMatchingRepository (multi-source merge)", () => {
  it("merges the CSPM project with its GitHub repository", () => {
    const cspm = projects.find((p) => p.title === "AWS Cloud Security Posture Monitoring System");
    expect(cspm).toBeDefined();
    const repo = findMatchingRepository(cspm as never, repositories);
    expect(repo?.name).toBe("aws-cloud-security-posture-monitor");
  });

  it("merges the WAF project with its GitHub repository", () => {
    const waf = projects.find((p) => p.title === "AI-Driven Web Application Security Suite (WAF + Scanner)");
    expect(waf).toBeDefined();
    const repo = findMatchingRepository(waf as never, repositories);
    expect(repo?.name).toContain("AI-Driven-Web-Application-Security-Suite");
  });
});

describe("buildRetrieval - question-specific results", () => {
  it("returns a focused context + repo citation for the CSPM question", () => {
    const r = buildRetrieval("In aws cspm what he have used", PROJECT, snapshot);
    expect(r.entity).toBe("AWS Cloud Security Posture Monitoring System");
    expect(r.recommendedProject?.project.title).toBe("AWS Cloud Security Posture Monitoring System");
    expect(r.citations.some((c) => c.url.includes("aws-cloud-security-posture-monitor"))).toBe(true);
  });

  it("finds the blockchain learning repo (no documented blockchain project)", () => {
    const r = buildRetrieval("which project best demonstrates your blockchain skills", PROJECT_COMPARISON, snapshot);
    expect(r.recommendedProject).toBeUndefined();
    expect(r.matchedRepositories[0]?.name).toBe("Blockchain-Learning");
    expect(r.citations.some((c) => c.url.includes("Blockchain-Learning"))).toBe(true);
  });

  it("never invents challenges: flags them as not documented", () => {
    const r = buildRetrieval("what challenges did he face in the cspm project", PROJECT, snapshot);
    expect(r.entity).toBe("AWS Cloud Security Posture Monitoring System");
    expect(r.noChallengesDocumented).toBe(true);
  });

  it("falls back to the full project list for generic project questions", () => {
    const r = buildRetrieval("what projects have he done", PROJECT, snapshot);
    expect(r.matchedProjects.length).toBe(projects.length);
  });
});