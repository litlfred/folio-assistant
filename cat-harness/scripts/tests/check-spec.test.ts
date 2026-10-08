import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import {
  extractClarificationMarkers,
  extractH2Sections,
  isStatusAdjudicated,
  loadDeclaredSpecTemplate,
  validateSpec,
} from "../../schemas/spec-template.ts";
import { DEFAULT_TEMPLATE_PATH } from "../check-spec.ts";

describe("spec-template — declared artefact and section extraction", () => {
  test("loadDeclaredSpecTemplate loads mandatory sections from declared template markdown", () => {
    const templatePath = resolve(DEFAULT_TEMPLATE_PATH);
    const declared = loadDeclaredSpecTemplate(templatePath);
    expect(declared.mandatorySections).toContain("User Scenarios & Testing");
    expect(declared.mandatorySections).toContain("Requirements");
    expect(declared.mandatorySections).toContain("Success Criteria");
    expect(declared.metadataFields).toContain("Feature Branch");
    expect(declared.metadataFields).toContain("Status");
  });

  test("extractH2Sections extracts clean section titles without markdown decorations", () => {
    const text = `
# Feature Specification: Test Feature

## User Scenarios & Testing *(mandatory)*
Content here.

## Edge Cases
Content here.

## Requirements *(mandatory)*
Content here.
`;
    const sections = extractH2Sections(text);
    expect(sections).toEqual([
      "User Scenarios & Testing",
      "Edge Cases",
      "Requirements",
    ]);
  });
});

describe("validateSpec — mandatory sections and naming missing ones (SC-003)", () => {
  const completeSpec = `
# Feature Specification: Example Feature

**Feature Branch**: \`claude/example\`
**Created**: 2026-10-07
**Status**: Draft
**Issue**: #100

## User Scenarios & Testing *(mandatory)*

### P1 — Core journey
Given x, When y, Then z.

## Edge Cases
None.

## Requirements *(mandatory)*
- FR-001: System must work.

## Success Criteria *(mandatory)*
- SC-001: 100% of tests pass.

## Assumptions
Assumption 1.
`;

  test("a spec containing all mandatory sections passes validation", () => {
    const result = validateSpec(completeSpec);
    expect(result.state).toBe("pass");
    expect(result.findings).toEqual([]);
    expect(result.missingSections).toEqual([]);
    expect(result.status).toBe("Draft");
  });

  test("a spec missing 'Success Criteria' fails and explicitly names the missing section", () => {
    const missingSc = `
# Feature Specification: Example Feature

**Feature Branch**: \`claude/example\`
**Created**: 2026-10-07
**Status**: Draft
**Issue**: #100

## User Scenarios & Testing *(mandatory)*
Given x, When y, Then z.

## Requirements *(mandatory)*
- FR-001: System must work.
`;
    const result = validateSpec(missingSc);
    expect(result.state).toBe("fail");
    expect(result.missingSections).toContain("Success Criteria");
    expect(result.findings.some((f) => f.includes('missing mandatory section: "Success Criteria"'))).toBe(true);
  });

  test("a spec missing 'Requirements' fails and explicitly names the missing section", () => {
    const missingReq = `
# Feature Specification: Example Feature

**Feature Branch**: \`claude/example\`
**Created**: 2026-10-07
**Status**: Draft

## User Scenarios & Testing *(mandatory)*
Given x, When y, Then z.

## Success Criteria *(mandatory)*
- SC-001: Pass.
`;
    const result = validateSpec(missingReq);
    expect(result.state).toBe("fail");
    expect(result.missingSections).toContain("Requirements");
  });

  test("a spec missing 'User Scenarios & Testing' fails and explicitly names it", () => {
    const missingScenarios = `
# Feature Specification: Example Feature

**Status**: Draft

## Requirements *(mandatory)*
- FR-001: Pass.

## Success Criteria *(mandatory)*
- SC-001: Pass.
`;
    const result = validateSpec(missingScenarios);
    expect(result.state).toBe("fail");
    expect(result.missingSections).toContain("User Scenarios & Testing");
  });
});

describe("validateSpec — unresolved [NEEDS CLARIFICATION] markers (SC-004)", () => {
  test("extractClarificationMarkers extracts all clarification markers", () => {
    const text = `
Some text with [NEEDS CLARIFICATION: threshold value] and another [NEEDS CLARIFICATION].
`;
    const markers = extractClarificationMarkers(text);
    expect(markers.length).toBe(2);
    expect(markers[0]).toBe("[NEEDS CLARIFICATION: threshold value]");
    expect(markers[1]).toBe("[NEEDS CLARIFICATION]");
  });

  test("unresolved clarification markers are permitted in Draft status", () => {
    const draftWithMarker = `
# Feature Specification: Example Feature

**Status**: Draft

## User Scenarios & Testing *(mandatory)*
Test.

## Requirements *(mandatory)*
FR-001: Do something [NEEDS CLARIFICATION: what to do].

## Success Criteria *(mandatory)*
SC-001: Done.
`;
    const result = validateSpec(draftWithMarker);
    expect(result.state).toBe("pass");
    expect(result.unresolvedClarifications.length).toBe(1);
    expect(result.isAdjudicated).toBe(false);
  });

  test("unresolved clarification markers BLOCK reaching Adjudicated status (SC-004)", () => {
    const adjudicatedWithMarker = `
# Feature Specification: Example Feature

**Status**: Adjudicated

## User Scenarios & Testing *(mandatory)*
Test.

## Requirements *(mandatory)*
FR-001: Do something [NEEDS CLARIFICATION: what to do].

## Success Criteria *(mandatory)*
SC-001: Done.
`;
    const result = validateSpec(adjudicatedWithMarker);
    expect(result.state).toBe("fail");
    expect(result.isAdjudicated).toBe(true);
    expect(result.findings.some((f) => f.includes("unresolved [NEEDS CLARIFICATION] marker(s)"))).toBe(true);
  });

  test("requireAdjudicated option enforces that markers are resolved even if status is not explicit", () => {
    const spec = `
# Feature Specification: Example Feature

**Status**: WIP

## User Scenarios & Testing *(mandatory)*
Test.

## Requirements *(mandatory)*
FR-001: Do something [NEEDS CLARIFICATION: pending decision].

## Success Criteria *(mandatory)*
SC-001: Done.
`;
    const result = validateSpec(spec, { requireAdjudicated: true });
    expect(result.state).toBe("fail");
    expect(result.findings.some((f) => f.includes("unresolved [NEEDS CLARIFICATION] marker(s)"))).toBe(true);
  });
});

describe("isStatusAdjudicated", () => {
  test("recognizes adjudicated status keywords", () => {
    expect(isStatusAdjudicated("Adjudicated")).toBe(true);
    expect(isStatusAdjudicated("Approved")).toBe(true);
    expect(isStatusAdjudicated("Accepted by BA")).toBe(true);
    expect(isStatusAdjudicated("Completed")).toBe(true);
  });

  test("recognizes non-adjudicated status keywords", () => {
    expect(isStatusAdjudicated("Draft")).toBe(false);
    expect(isStatusAdjudicated("WIP")).toBe(false);
    expect(isStatusAdjudicated("Under Review")).toBe(false);
    expect(isStatusAdjudicated(undefined)).toBe(false);
  });
});
