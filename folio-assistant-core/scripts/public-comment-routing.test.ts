import { describe, expect, test } from "bun:test";

import { changeSetRouting, commentRouting, twgGroup } from "./public-comment-routing.js";

const AI = "TWG consideration? AI categorisation";
const HU = "Consider by TWG? Human categorisation";

describe("public-comment-routing", () => {
  test("only the eight fixed categories, and unambiguous aliases, name a group", () => {
    expect(twgGroup(" core  architects ")).toBe("Core architects");
    expect(twgGroup("Metadata")).toBe("Metadata registries");
    expect(twgGroup("HWF team")).toBeUndefined();
    expect(twgGroup("Maybe - editorial?")).toBeUndefined();
  });

  test("a human categorisation overrides the AI one", () => {
    expect(commentRouting({ [AI]: "Clinical", [HU]: "No" })).toEqual({ group: "No", secondary: [], source: "human", raw: "No" });
    expect(commentRouting({ [AI]: "Clinical" })).toMatchObject({ group: "Clinical", source: "ai" });
    expect(commentRouting({ "Comment type": "P1" })).toBeUndefined();
    expect(commentRouting(undefined)).toBeUndefined();
  });

  test("'A/ B' is a primary and a secondary; a value naming no category is kept raw", () => {
    expect(commentRouting({ [HU]: "Core architects/ WHO" })).toMatchObject({ group: "Core architects", secondary: ["WHO"] });
    const odd = commentRouting({ [HU]: "HWF team" })!;
    expect(odd.group).toBeUndefined();
    expect(odd.raw).toBe("HWF team");
  });

  test("a change-set takes its comments' plurality; ties go to the more specific domain", () => {
    const by = new Map([
      ["a", commentRouting({ [AI]: "Core architects" })],
      ["b", commentRouting({ [AI]: "Financial systems" })],
      ["c", commentRouting({ [HU]: "HWF team" })],
    ]);
    const x = changeSetRouting(["a", "b", "c", "d"], by);
    expect(x.group).toBe("Financial systems");
    expect(x.derived).toBe("Financial systems");
    expect(x).toMatchObject({ routed: 2, unmapped: 1, total: 4 });
    expect(changeSetRouting(["d"], by).group).toBeUndefined();
    // A person's manual override sets the change-set's committee while keeping the derived plurality.
    const overridden = changeSetRouting(["a", "b", "c", "d"], by, "Clinical");
    expect(overridden.group).toBe("Clinical");
    expect(overridden.derived).toBe("Financial systems");
  });
  test("routing.json fills what the log left uncategorised; a person's entry beats the log's AI column", () => {
    const agent = { category: "Supply chain", by: "claude-agent", confidence: "medium" as const, rationale: "Product Registry." };
    expect(commentRouting(undefined, agent)).toMatchObject({ group: "Supply chain", source: "agent", confidence: "medium", rationale: "Product Registry." });
    // The log's AI column wins over an agent's entry ...
    expect(commentRouting({ [AI]: "Clinical" }, agent)).toMatchObject({ group: "Clinical", source: "ai" });
    // ... a person's entry wins over the AI column ...
    expect(commentRouting({ [AI]: "Clinical" }, { category: "WHO", by: "litlfred" })).toMatchObject({ group: "WHO", source: "human", by: "litlfred" });
    // ... and the log's human column wins over everything.
    expect(commentRouting({ [HU]: "No" }, { category: "WHO", by: "litlfred" })).toMatchObject({ group: "No", source: "human" });
  });

  test("a person's entry rules on a human label that names no category", () => {
    const ruling = { category: "Metadata registries", by: "litlfred" };
    expect(commentRouting({ [AI]: "Core architects", [HU]: "HWF team" }, ruling)).toMatchObject({ group: "Metadata registries", source: "human", by: "litlfred" });
    // An agent's entry does not rule: the label stays unmapped.
    expect(commentRouting({ [HU]: "HWF team" }, { ...ruling, by: "claude-agent" })!.group).toBeUndefined();
  });
});
