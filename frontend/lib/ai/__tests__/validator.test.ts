import { describe, expect, it } from "vitest";
import { getKnowledgeService } from "../knowledge";
import { ResponseValidator } from "../validator";

describe("ResponseValidator", () => {
  it("flags unknown entities as unsupported claims", () => {
    const snapshot = getKnowledgeService().snapshot();
    const validator = new ResponseValidator(snapshot.vocabulary());
    const result = validator.validate(
      "I worked at a completely fictional company called Zephyrion Labs on Planet X."
    );
    expect(result.supported).toBe(false);
    expect(result.confidence_penalty).toBeGreaterThan(0);
    expect(result.caveat).toContain("may not be verified");
  });

  it("passes grounded text", () => {
    const snapshot = getKnowledgeService().snapshot();
    const validator = new ResponseValidator(snapshot.vocabulary());
    const result = validator.validate(
      "My projects include an AWS Cloud Security Posture Monitoring System using Terraform."
    );
    expect(result.supported).toBe(true);
  });
});
