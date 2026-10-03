/**
 * Named subgraphs (bean `c1m4`): one IRI, two files, framed from one graph.
 *
 * The oracle for "exactly the sdlc nodes" is computed here from kg-export's
 * graph by source path, NOT from the generator's own plan — a test that reads
 * the membership back from the thing that decided it can only agree with it.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import {
  SUBGRAPH_CONTEXT_PATH,
  auditPayloadTree,
  generateSubgraphs,
  planPayloads,
  planSubgraphs,
  renderPayloadFiles,
  type PayloadPlan,
  type SubgraphPlan,
} from "../gen-subgraph-jsonld.js";
import { termIri } from "../../schemas/namespaces.js";
import {
  PAYLOAD_PATH,
  PAYLOAD_SIDECAR_SUFFIX,
  PayloadLinkSchema,
  PayloadSidecarSchema,
  SUBGRAPH_HYDRATED_FILE,
  SUBGRAPH_INDEX_FILE,
  SubgraphHydratedSchema,
  SubgraphIndexSchema,
  type PayloadLink,
} from "../../schemas/subgraph-manifest.js";

const ROOT = resolve(import.meta.dir, "..", "..");

let plan: SubgraphPlan;
let files: Map<string, string>;
let harness: string;
let outDir: string;

let payloadPlan: PayloadPlan;
let payloadFiles: Map<string, Buffer | string>;
let payloadDir: string;

beforeAll(async () => {
  ({ plan, files, harness, outDir, payloadPlan, payloadFiles, payloadDir } = await generateSubgraphs());
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
      expect(Object.keys(m).every((k) => ["@id", "@type", "name", "title", "payload"].includes(k))).toBe(true);
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

  test("subgraph membership and structural containment stay two properties (bean 3f5f)", () => {
    const ctx = JSON.parse(files.get(SUBGRAPH_CONTEXT_PATH)!)["@context"];
    expect(ctx.inSubgraph["@id"]).not.toBe(ctx.partOf["@id"]);
    // A ProcessNode is part of its diagram AND in the processes subgraph;
    // compaction must keep both, not fold one into the other.
    let both = 0;
    const walk = (o: unknown): void => {
      if (Array.isArray(o)) return o.forEach(walk);
      if (o === null || typeof o !== "object") return;
      const r = o as Record<string, unknown>;
      if ("partOf" in r && "inSubgraph" in r) both += 1;
      Object.values(r).forEach(walk);
    };
    walk(read("processes/", SUBGRAPH_HYDRATED_FILE));
    expect(both).toBeGreaterThan(0);
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

  test("an overlaid instance heads its own tree, and the repository index lists every root (bean ax6r)", () => {
    const repo = JSON.parse(files.get(join(outDir, SUBGRAPH_INDEX_FILE))!) as Record<string, unknown>;
    expect(repo["@id"]).toBe(plan.repoIri);
    expect(SubgraphIndexSchema.safeParse(repo).success).toBe(true);
    expect(repo.hasSubgraph).toEqual(plan.harnessRoots);
    expect(plan.harnessRoots[0]).toBe(plan.rootIri);
    // folio-assistant-core's processes are nodes of THIS graph (kg-export's
    // corpus), and they sit in that instance's tree — not in this root.
    const core = `${plan.repoIri}folio-assistant-core/`;
    expect(plan.harnessRoots).toContain(core);
    const hyd = JSON.parse(files.get(join(outDir, "folio-assistant-core", "processes", SUBGRAPH_HYDRATED_FILE))!) as Record<string, unknown>;
    const members = hydratedMembers(hyd);
    const lifecycle = [...plan.nodes.values()].find((n) => String(n.sourcePath ?? "").endsWith("content-lifecycle.bpmn"))!;
    expect(members.has(lifecycle["@id"])).toBe(true);
    const root = read("", SUBGRAPH_INDEX_FILE);
    expect(((root.hasMember ?? []) as Array<{ "@id": string }>).some((m) => m["@id"] === lifecycle["@id"])).toBe(false);
    // No tree for bootstrap: pve3 keeps its processes out of this graph.
    expect(plan.harnessRoots.some((r) => /\/subgraph\/bootstrap(-tools)?\/$/.test(r))).toBe(false);
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

/**
 * Payloads (bean `f233`): heavy content by content address. The digest oracle
 * is computed here from the source file, not read back from the plan.
 */
describe("payloads", () => {
  const hex = (b: Buffer | string): string => createHash("sha256").update(b).digest("hex");
  const SKILL = "https://x.test/ns#Skill";

  test("a skill node links to its payload in the index and the hydrated file, by its body's digest", () => {
    const index = read("skills/kg/kg-core/", SUBGRAPH_INDEX_FILE);
    const pointer = (index.hasMember as Array<Record<string, unknown>>).find((m) => m.name === "kg-export")!;
    const node = plan.nodes.get(String(pointer["@id"]))!;
    const body = readFileSync(join(ROOT, String(node.instructionsPath)));
    const link = pointer.payload as PayloadLink;
    expect(PayloadLinkSchema.safeParse(link).success).toBe(true);
    expect(link.sha256).toBe(hex(body));
    expect(link.bytes).toBe(body.length);
    expect(link["@id"]).toBe(`${plan.rootIri.replace(/\/subgraph\/.*$/, "")}/${PAYLOAD_PATH}/${hex(body)}`);

    const hydrated = read("skills/kg/kg-core/", SUBGRAPH_HYDRATED_FILE);
    const whole = (hydrated.hasMember as Array<Record<string, unknown>>).find((m) => m["@id"] === pointer["@id"])!;
    expect(whole.payload).toEqual(link);
  });

  test("the hydrated file does not inline a body — it carries the link instead", () => {
    const text = files.get(fileFor("skills/kg/kg-core/", SUBGRAPH_HYDRATED_FILE))!;
    const body = readFileSync(join(ROOT, "skills/kg/kg-core/kg-export.md"), "utf-8");
    const distinctive = "## Named subgraphs — one IRI, two files, framed from one graph";
    expect(body).toContain(distinctive);
    expect(text).not.toContain(distinctive);
    expect(text).toContain(`/${PAYLOAD_PATH}/${hex(body)}`);
  });

  test("each payload file's sha256 matches its bytes, and its sidecar names the media type", () => {
    expect(payloadPlan.problems).toEqual([]);
    expect(payloadPlan.payloads.size).toBeGreaterThan(0);
    for (const [p, b] of payloadFiles) {
      const name = basename(p);
      if (name.endsWith(PAYLOAD_SIDECAR_SUFFIX)) {
        const s = PayloadSidecarSchema.parse(JSON.parse(String(b)));
        expect(s.sha256).toBe(name.slice(0, -PAYLOAD_SIDECAR_SUFFIX.length));
        expect(s.mediaType).toBe("text/markdown; charset=utf-8");
      } else {
        expect(hex(b)).toBe(name);
      }
    }
    // …and the committed tree is that set, with no orphan either way.
    expect(auditPayloadTree(join(ROOT, payloadDir), payloadPlan.links)).toEqual([]);
  });

  describe("synthetic", () => {
    let dir: string;
    beforeAll(() => {
      dir = mkdtempSync(join(tmpdir(), "payload-"));
      mkdirSync(join(dir, "skills"), { recursive: true });
      writeFileSync(join(dir, "skills", "a.md"), "# same body\n");
      writeFileSync(join(dir, "skills", "b.md"), "# same body\n");
      writeFileSync(join(dir, "skills", "c.md"), "# another\n");
    });
    afterAll(() => rmSync(dir, { recursive: true, force: true }));

    const graph = () => [
      { "@id": "https://x.test/doc#skill/a", "@type": termIri("Skill"), instructionsPath: "skills/a.md" },
      { "@id": "https://x.test/doc#skill/b", "@type": termIri("Skill"), instructionsPath: "skills/b.md" },
      { "@id": "https://x.test/doc#skill/c", "@type": termIri("Skill"), instructionsPath: "skills/c.md" },
      { "@id": "https://x.test/doc#role/r", "@type": SKILL.replace("Skill", "Role"), instructionsPath: "skills/c.md" },
    ];

    test("identical bodies are one payload, linked from both nodes", () => {
      const pp = planPayloads(graph(), { root: dir, baseUrl: "https://x.test/" });
      expect(pp.problems).toEqual([]);
      expect(pp.payloads.size).toBe(2);
      expect(pp.links.size).toBe(3); // the Role is not a heavy class
      const a = pp.links.get("https://x.test/doc#skill/a")!;
      expect(pp.links.get("https://x.test/doc#skill/b")).toEqual(a);
      expect(a["@id"]).toBe(`https://x.test/${PAYLOAD_PATH}/${hex("# same body\n")}`);
      expect(pp.payloads.get(a.sha256)!.referencedBy).toEqual(["https://x.test/doc#skill/a", "https://x.test/doc#skill/b"]);
      expect(renderPayloadFiles(pp, "out").size).toBe(4); // two bodies, two sidecars
    });

    test("generation is deterministic", () => {
      const once = renderPayloadFiles(planPayloads(graph(), { root: dir, baseUrl: "https://x.test" }), "out");
      const twice = renderPayloadFiles(planPayloads(graph().reverse(), { root: dir, baseUrl: "https://x.test" }), "out");
      expect([...once.keys()]).toEqual([...twice.keys()]);
      for (const [k, v] of once) expect(Buffer.from(v).equals(Buffer.from(twice.get(k)!))).toBe(true);
    });

    const writeTree = (out: string, pp: PayloadPlan): void => {
      mkdirSync(out, { recursive: true });
      for (const [p, b] of renderPayloadFiles(pp, out)) writeFileSync(p, b);
    };

    test("orphan detection, both ways — and a payload that is not what it says", () => {
      const pp = planPayloads(graph(), { root: dir, baseUrl: "https://x.test" });
      const out = join(dir, "tree");
      writeTree(out, pp);
      expect(auditPayloadTree(out, pp.links)).toEqual([]);

      // A payload no node references.
      const stray = Buffer.from("nobody links here\n");
      writeFileSync(join(out, hex(stray)), stray);
      // A node that references a payload that is not there.
      const links = new Map(pp.links);
      const ghost = hex("never written\n");
      links.set("https://x.test/doc#skill/ghost", { "@id": `https://x.test/${PAYLOAD_PATH}/${ghost}`, sha256: ghost, bytes: 14 });
      const problems = auditPayloadTree(out, links);
      expect(problems.some((p) => p.startsWith(`orphan payload ${hex(stray)}`))).toBe(true);
      expect(problems.some((p) => p.includes("#skill/ghost") && p.includes("missing"))).toBe(true);

      // Bytes that do not hash to their name.
      const c = pp.links.get("https://x.test/doc#skill/c")!;
      writeFileSync(join(out, c.sha256), "# tampered\n");
      expect(auditPayloadTree(out, pp.links).some((p) => p.includes(`payload ${c.sha256}: its bytes hash to`))).toBe(true);
    });

    test("an undeclared media type is a problem, never a guess", () => {
      writeFileSync(join(dir, "skills", "d.xyz"), "?");
      const pp = planPayloads(
        [{ "@id": "https://x.test/doc#skill/d", "@type": termIri("Skill"), instructionsPath: "skills/d.xyz" }],
        { root: dir, baseUrl: "https://x.test" },
      );
      expect(pp.links.size).toBe(0);
      expect(pp.problems.some((p) => p.includes(".xyz"))).toBe(true);
    });
  });
});
