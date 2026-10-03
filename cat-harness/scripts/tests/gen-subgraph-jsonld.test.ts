/**
 * Named subgraphs (bean `c1m4`): one IRI, two files, framed from one graph.
 *
 * The oracle for "exactly the sdlc nodes" is computed here from kg-export's
 * graph by source path, NOT from the generator's own plan — a test that reads
 * the membership back from the thing that decided it can only agree with it.
 */
import { describe, test, expect, beforeAll } from "bun:test";
import { join, resolve } from "node:path";
import {
  SUBGRAPH_CONTEXT_PATH,
  generateSubgraphs,
  planSubgraphs,
  type SubgraphPlan,
} from "../gen-subgraph-jsonld.js";
import {
  SUBGRAPH_HYDRATED_FILE,
  SUBGRAPH_INDEX_FILE,
  SubgraphHydratedSchema,
  SubgraphIndexSchema,
} from "../../schemas/subgraph-manifest.js";

const ROOT = resolve(import.meta.dir, "..", "..");

let plan: SubgraphPlan;
let files: Map<string, string>;
let harness: string;
let outDir: string;

beforeAll(async () => {
  ({ plan, files, harness, outDir } = await generateSubgraphs());
}, 120_000);

const fileFor = (rel: string, name: string): string => join(outDir, harness, rel, name);
const read = (rel: string, name: string): Record<string, unknown> => {
  const t = files.get(fileFor(rel, name));
  if (t === undefined) throw new Error(`not generated: ${fileFor(rel, name)}`);
  return JSON.parse(t) as Record<string, unknown>;
};
const iriOf = (rel: string): string => `${plan.rootIri}${rel}`;

/** The sdlc nodes, by source path — independent of the generator's placement. */
function expectedSdlc(): Set<string> {
  const out = new Set<string>();
  for (const n of plan.nodes.values()) {
    for (const k of ["instructionsPath", "module", "sourcePath", "path"]) {
      const v = n[k];
      if (typeof v !== "string" || v.length === 0) continue;
      if (`${v.replace(/\/$/, "")}/`.startsWith("skills/sdlc/")) out.add(n["@id"]);
      break;
    }
  }
  return out;
}

/** Follow index files down through `hasSubgraph`, collecting member IRIs. */
function indexMembers(rel: string): Set<string> {
  const doc = read(rel, SUBGRAPH_INDEX_FILE);
  const out = new Set<string>();
  for (const m of (doc.hasMember ?? []) as Array<{ "@id": string }>) out.add(m["@id"]);
  for (const c of (doc.hasSubgraph ?? []) as string[]) {
    for (const id of indexMembers(c.slice(plan.rootIri.length))) out.add(id);
  }
  return out;
}

function hydratedMembers(node: Record<string, unknown>): Set<string> {
  const out = new Set<string>();
  for (const m of (node.hasMember ?? []) as Array<{ "@id": string }>) out.add(m["@id"]);
  for (const c of (node.hasSubgraph ?? []) as Array<Record<string, unknown>>) {
    for (const id of hydratedMembers(c)) out.add(id);
  }
  return out;
}

describe("gen-subgraph-jsonld", () => {
  test("the run is clean: every node placed, nothing refused", () => {
    expect(plan.problems).toEqual([]);
  });

  test("skills/sdlc: index (followed down) and hydrated hold exactly the sdlc nodes", () => {
    const expected = [...expectedSdlc()].sort();
    expect(expected.length).toBeGreaterThan(0);
    expect([...indexMembers("skills/sdlc/")].sort()).toEqual(expected);
    const hydrated = read("skills/sdlc/", SUBGRAPH_HYDRATED_FILE);
    expect([...hydratedMembers(hydrated)].sort()).toEqual(expected);
  });

  test("the hydrated file carries whole nodes; the index carries pointers", () => {
    const hydrated = read("skills/sdlc/", SUBGRAPH_HYDRATED_FILE);
    const core = (hydrated.hasSubgraph as Array<Record<string, unknown>>).find(
      (c) => c["@id"] === iriOf("skills/sdlc/sdlc-core/"),
    )!;
    const skill = (core.hasMember as Array<Record<string, unknown>>).find((m) => "instructionsPath" in m);
    expect(skill).toBeDefined();
    const index = read("skills/sdlc/sdlc-core/", SUBGRAPH_INDEX_FILE);
    for (const m of index.hasMember as Array<Record<string, unknown>>) {
      expect(Object.keys(m).every((k) => ["@id", "@type", "name", "title"].includes(k))).toBe(true);
    }
  });

  test("the parent skills/ index lists skills/sdlc/ as a child IRI", () => {
    const parent = read("skills/", SUBGRAPH_INDEX_FILE);
    expect(parent["@id"]).toBe(iriOf("skills/"));
    expect(parent.hasSubgraph).toContain(iriOf("skills/sdlc/"));
    expect(read("skills/sdlc/", SUBGRAPH_INDEX_FILE)["@id"]).toBe(iriOf("skills/sdlc/"));
  });

  test("the root has index.jsonld and no hydrated file", () => {
    expect(files.has(fileFor("", SUBGRAPH_INDEX_FILE))).toBe(true);
    expect(files.has(fileFor("", SUBGRAPH_HYDRATED_FILE))).toBe(false);
    expect(plan.rootIri).toMatch(new RegExp(`/subgraph/${harness}/$`));
    expect(read("", SUBGRAPH_INDEX_FILE).hasSubgraph).toContain(iriOf("skills/"));
  });

  test("no file inlines its @context — every one names the shared context URL", () => {
    expect(plan.contextUrl.endsWith(SUBGRAPH_CONTEXT_PATH)).toBe(true);
    for (const [p, t] of files) {
      if (p === SUBGRAPH_CONTEXT_PATH) continue;
      expect(JSON.parse(t)["@context"]).toBe(plan.contextUrl);
    }
    const ctx = JSON.parse(files.get(SUBGRAPH_CONTEXT_PATH)!)["@context"];
    expect(typeof ctx).toBe("object");
    expect(ctx.hasMember).toBeDefined();
    expect(ctx.id).toBeUndefined(); // no keyword alias, so files say `@id`
  });

  test("round trip: every file parses back through its schema", () => {
    let n = 0;
    for (const [p, t] of files) {
      if (p.endsWith(`/${SUBGRAPH_INDEX_FILE}`)) {
        expect(SubgraphIndexSchema.safeParse(JSON.parse(t)).success).toBe(true);
        n += 1;
      } else if (p.endsWith(`/${SUBGRAPH_HYDRATED_FILE}`)) {
        expect(SubgraphHydratedSchema.safeParse(JSON.parse(t)).success).toBe(true);
        n += 1;
      }
    }
    expect(n).toBe(files.size - 1);
    // …and the schema refuses an inline context.
    const doc = read("skills/sdlc/", SUBGRAPH_INDEX_FILE);
    expect(SubgraphIndexSchema.safeParse({ ...doc, "@context": { x: "http://x/" } }).success).toBe(false);
  });

  test("an unplaceable node is a problem, never silently dropped", () => {
    const p = planSubgraphs(
      [
        { "@id": "https://x.test/doc#skill/ghost", "@type": "https://x.test/ns#Skill", instructionsPath: "skills/sdlc/no-such-skill.md" },
        { "@id": "https://x.test/doc#node/orphan", "@type": "https://x.test/ns#ProcessNode", partOf: "https://x.test/doc#process/missing" },
      ],
      { root: ROOT, harness, baseUrl: "https://x.test" },
    );
    expect(p.problems.some((s) => s.includes("#skill/ghost"))).toBe(true);
    expect(p.problems.some((s) => s.includes("#node/orphan"))).toBe(true);
  });
});
