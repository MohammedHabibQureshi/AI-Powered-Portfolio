import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { KnowledgeService } from "../knowledge";

const SIMPLE_V1 = `Name: Mohammed Habib Qureshi
Role: Student

Skills:
Python
C
AWS
`;

const SIMPLE_V2 = `Name: Mohammed Habib Qureshi
Role: Software Engineering Intern

Skills:
Python
C
AWS
Terraform
Blockchain
`;

let tempDirs: string[] = [];

function makeDataDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "knowledge-test-"));
  tempDirs.push(dir);
  return dir;
}

function writeLinkedin(dir: string, content: string) {
  fs.writeFileSync(path.join(dir, "linkedin.txt"), content, "utf8");
}

afterEach(() => {
  for (const dir of tempDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
  tempDirs = [];
});

describe("KnowledgeService - LinkedIn auto-refresh", () => {
  it("updating linkedin.txt adds Terraform/Blockchain with no code change", () => {
    const dir = makeDataDir();
    writeLinkedin(dir, SIMPLE_V1);
    const knowledge = new KnowledgeService(dir);

    expect(knowledge.snapshot().profile.skills).toEqual(["Python", "C", "AWS"]);
    const versionBefore = knowledge.snapshot().version;

    writeLinkedin(dir, SIMPLE_V2);
    const changed = knowledge.refresh();

    expect(changed).toBe(true);
    expect(knowledge.snapshot().profile.skills).toEqual(["Python", "C", "AWS", "Terraform", "Blockchain"]);
    expect(knowledge.snapshot().version).not.toBe(versionBefore);
  });

  it("the AI must use the new role and stop answering with the old one", () => {
    const dir = makeDataDir();
    writeLinkedin(dir, SIMPLE_V1);
    const knowledge = new KnowledgeService(dir);

    expect(knowledge.snapshot().profile.role).toBe("Student");

    writeLinkedin(dir, SIMPLE_V2);
    knowledge.refresh();

    expect(knowledge.snapshot().profile.role).toBe("Software Engineering Intern");
  });

  it("identical content is a no-op (content hashing)", () => {
    const dir = makeDataDir();
    writeLinkedin(dir, SIMPLE_V1);
    const knowledge = new KnowledgeService(dir);
    const versionBefore = knowledge.snapshot().version;

    writeLinkedin(dir, SIMPLE_V1);
    const changed = knowledge.refresh();

    expect(changed).toBe(false);
    expect(knowledge.snapshot().version).toBe(versionBefore);
  });

  it("content hash tracks the linkedin source", () => {
    const dir = makeDataDir();
    writeLinkedin(dir, SIMPLE_V1);
    const knowledge = new KnowledgeService(dir);
    const linkedinSource = knowledge.snapshot().sources["linkedin"];
    expect(linkedinSource.loaded).toBe(true);
    expect(linkedinSource.content_hash).toBeTruthy();
    expect(knowledge.snapshot().version.startsWith(linkedinSource.content_hash)).toBe(true);
  });

  it("github repository knowledge is loaded from github.json", () => {
    const dir = makeDataDir();
    writeLinkedin(dir, SIMPLE_V1);
    fs.writeFileSync(
      path.join(dir, "github.json"),
      JSON.stringify([
        { name: "Blockchain-Learning", description: "A blockchain learning repo", readme: "# Blockchain Learning", language: "Solidity" },
      ]),
      "utf8"
    );

    const service = new KnowledgeService(dir);
    const snapshot = service.snapshot();
    expect(snapshot.repositories.length).toBe(1);
    expect(snapshot.repositories[0].name).toBe("Blockchain-Learning");
    expect(snapshot.vocabulary().has("blockchain")).toBe(true);
  });
});
