/**
 * PROV-JSONLD emission: the falsifier for beans `jcet` / `9y9j` is a real
 * processor — expand what we emit and see links where PROV-O says nodes.
 */
import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

import jsonld from "jsonld";

import { localLoader } from "../scripts/publish-verify.ts";
import {
  addressBook,
  heldProvJsonldContext,
  provJsonldDocument,
  PROV_JSONLD_CONTEXT_URL,
  type AddressBook,
} from "./prov-jsonld.ts";
import type { ProvActivity } from "./prov.ts";

const REPO = resolve(import.meta.dir, "..", "..");
const P = "http://www.w3.org/ns/prov#";

const activity = (agent: string, role: string, plan: string): ProvActivity =>
  ({
    "@type": "prov:Activity",
    "@id": "t--x#1",
    "prov:startedAtTime": "2026-10-01T00:00:00.000Z",
    "prov:qualifiedAssociation": { "prov:agent": agent, "prov:hadRole": role, "prov:hadPlan": plan },
    "cat-harness:underPolicy": "https://litlfred.github.io/folio-assistant/policies/folio-defaults",
  }) as ProvActivity;

async function expanded(doc: object): Promise<Record<string, unknown>[]> {
  const top = (await jsonld.expand(doc, { documentLoader: localLoader(REPO) } as never)) as Record<string, unknown>[];
  return top.flatMap((n) => (n["@graph"] as Record<string, unknown>[] | undefined) ?? [n]);
}

describe("the held PROV-JSONLD context", () => {
  test("matches its pinned sha256, and is the JSON-LD 1.1 context it claims to be", () => {
    const ctx = heldProvJsonldContext(REPO) as { "@context": Record<string, unknown> };
    expect(ctx["@context"]["@version"]).toBe(1.1);
    expect(ctx["@context"]["prov"]).toBe(P);
  });
});

describe("provJsonldDocument — a real checkout's actors, roles and plans", () => {
  const book = addressBook(REPO);

  test("agent, role and plan expand to LINKS at their release addresses, not literals", async () => {
    // cat-harness declares an iriBase; owner, authoring-agent and
    // code-change-review are all its own.
    const { document, unaddressed } = provJsonldDocument("t--x", [activity("owner", "authoring-agent", "code-change-review#Task_ClaimBean")], book);
    expect(unaddressed).toEqual([]);
    const nodes = await expanded(document);
    const assoc = nodes.find((n) => (n["@type"] as string[] | undefined)?.includes(`${P}Association`))!;
    expect(assoc[`${P}agent`]).toEqual([{ "@id": "https://litlfred.github.io/cat-harness/0.1.0/scenarios/actors/owner" }]);
    expect(assoc[`${P}hadRole`]).toEqual([{ "@id": "https://litlfred.github.io/cat-harness/0.1.0/scenarios/roles#authoring-agent" }]);
    expect(assoc[`${P}hadPlan`]).toEqual([
      { "@id": "https://litlfred.github.io/cat-harness/0.1.0/processes/code-change-review#Task_ClaimBean" },
    ]);
  });

  test("the activity is joined to its association through @reverse prov:qualifiedAssociation", async () => {
    const { document } = provJsonldDocument("t--x", [activity("owner", "authoring-agent", "code-change-review#Task_ClaimBean")], book);
    const nodes = await expanded(document);
    const act = nodes.find((n) => (n["@type"] as string[] | undefined)?.includes(`${P}Activity`))!;
    expect(act["@id"]).toBe("https://litlfred.github.io/folio/t--x#1");
    expect(act[`${P}startedAtTime`]).toBeDefined();
    const assoc = nodes.find((n) => (n["@type"] as string[] | undefined)?.includes(`${P}Association`))!;
    expect(assoc["@reverse"]).toEqual({ [`${P}qualifiedAssociation`]: [{ "@id": "https://litlfred.github.io/folio/t--x#1" }] });
  });

  test("underPolicy's IRIs are links too", async () => {
    const nodes = await expanded(provJsonldDocument("t--x", [activity("owner", "authoring-agent", "code-change-review#T")], book).document);
    const act = nodes.find((n) => (n["@type"] as string[] | undefined)?.includes(`${P}Activity`))!;
    const key = Object.keys(act).find((k) => k.endsWith("#underPolicy"))!;
    expect(act[key]).toEqual([{ "@id": "https://litlfred.github.io/folio-assistant/policies/folio-defaults" }]);
  });

  test("an owner with no iriBase keeps the value a LITERAL and says why — never a relative IRI", async () => {
    // large-datasets declares no iriBase, and holds sample-import.bpmn.
    const { document, unaddressed } = provJsonldDocument("t--x", [activity("owner", "authoring-agent", "sample-import#Task_Scope")], book);
    expect(unaddressed).toHaveLength(1);
    expect(unaddressed[0]).toMatchObject({ kind: "plan", value: "sample-import#Task_Scope" });
    expect(unaddressed[0]!.why).toContain("declares no iriBase");
    const assoc = (await expanded(document)).find((n) => (n["@type"] as string[] | undefined)?.includes(`${P}Association`))!;
    expect(assoc[`${P}hadPlan`]).toEqual([{ "@value": "sample-import#Task_Scope" }]);
  });

  test("an id nobody declares is unaddressed, with the reason", () => {
    const { unaddressed } = provJsonldDocument("t--x", [activity("nobody-at-all", "authoring-agent", "code-change-review#T")], book);
    expect(unaddressed.map((u) => [u.kind, u.why])).toEqual([["agent", 'no instance in this checkout declares actor "nobody-at-all"']]);
  });
});

describe("the context is named, never fetched", () => {
  test("documents reference the published URL and carry @base in their OWN context", () => {
    const stub: AddressBook = { resolve: () => ({ iri: "https://example.org/x" }) };
    const ctx = provJsonldDocument("t", [], stub).document["@context"] as unknown[];
    expect(ctx[0]).toBe(PROV_JSONLD_CONTEXT_URL);
    expect((ctx[1] as Record<string, unknown>)["@base"]).toBeDefined();
  });
});
