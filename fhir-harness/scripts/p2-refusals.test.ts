/**
 * P2's refusal record (`p2-refusals.ts`): "publishes no Turtle" and "we
 * ignored its Turtle" must stay distinguishable (bean `ntyj`).
 */
import { describe, expect, it } from "bun:test";
import { publisherViewPage, refusals } from "./p2-refusals.ts";
import type { FhirArtifactIndex } from "../schemas/fhir-artifact-index.js";

const ix = {
  id: "x",
  packageId: "example.ig",
  artifacts: [
    { key: "ValueSet/a", resourceType: "ValueSet", id: "a", published: { xml: { url: "https://p/ValueSet-a.xml" }, ttl: { url: "https://p/ValueSet-a.ttl" } } },
    { key: "StructureDefinition/m", resourceType: "StructureDefinition", id: "m", published: { xml: { url: "https://p/StructureDefinition-m.xml" } } },
    { key: "ImplementationGuide/x", resourceType: "ImplementationGuide", id: "x", published: { xml: { url: "https://p/ImplementationGuide-x.xml" }, ttl: { url: "https://p/ImplementationGuide-x.ttl" } } },
  ],
} as unknown as FhirArtifactIndex;

describe("P2 refusal record", () => {
  const r = refusals(ix, "fhir-harness/scripts/p2-refusals.ts");

  it("refuses every published XML and Turtle representation, citing the ruling", () => {
    expect(r.families.xml!.count).toBe(3);
    expect(r.families.ttl!.count).toBe(2);
    expect(r.total).toBe(5);
    expect((r.families.xml!.entries[0] as { reason: string }).reason).toContain("P2");
  });

  it("keeps an unpublished representation apart from a refused one", () => {
    expect(r.families["not-published"]!.entries).toEqual([{ artifact: "StructureDefinition/m", missing: ["ttl"] }]);
  });

  it("names the Publisher's view page: .profile for StructureDefinitions, none for the IG", () => {
    expect(publisherViewPage({ resourceType: "ValueSet", id: "a" }, "xml")).toBe("ValueSet-a.xml.html");
    expect(publisherViewPage({ resourceType: "StructureDefinition", id: "m" }, "xml")).toBe("StructureDefinition-m.profile.xml.html");
    expect(publisherViewPage({ resourceType: "ImplementationGuide", id: "x" }, "ttl")).toBeUndefined();
  });
});
