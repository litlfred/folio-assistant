/**
 * `gen-l1-extraction-pages.ts`: the `l1-extraction` viewer's pages, written
 * into a site.
 *
 * A scratch checkout of two instances. `lib` declares the visualiser and a
 * library entry with an `l1-extraction/` holding one of each document the
 * page reads: an L1 graph, a candidate work list, an L2 scenario graph, a
 * curation, and a file that does not parse. `remote` declares an
 * `l1-extraction` directory that is not on disk — the page must call it
 * unknown, not zero. The extraction's own typology node is copied into the
 * fixture, so the kind is known there as it is in a real checkout.
 *
 * Calibrated: making `readExtraction` return an empty extraction for a
 * missing directory fails the "unknown, not zero" test; dropping
 * `render_with_liquid: false` from `page` fails the Liquid test.
 *
 * @module smart-base/scripts/gen-l1-extraction-pages.test
 */
import { afterAll, describe, expect, it } from "bun:test";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { readExtraction } from "./gen-l1-extraction-pages.ts";

const INSTANCE = resolve(import.meta.dir, "..");
const CHECKOUT = resolve(INSTANCE, "..");
const SCRIPT = join(import.meta.dir, "gen-l1-extraction-pages.ts");

const write = (p: string, v: unknown): void => {
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, typeof v === "string" ? v : JSON.stringify(v, null, 2));
};

function scratchCheckout(): string {
  const root = mkdtempSync(join(tmpdir(), "smart-base-l1x-"));
  mkdirSync(join(root, "lib", "typologies"), { recursive: true });
  copyFileSync(join(INSTANCE, "typologies", "l1-extraction.json"), join(root, "lib", "typologies", "l1-extraction.json"));
  write(join(root, "lib", "lib.json"), {
    name: "lib",
    version: "0.0.0",
    description: "Scratch instance holding an L1 extraction inside a library entry.",
    directories: [
      { id: "lib-typologies", path: "typologies/", graphTypologies: ["typologies"] },
      { id: "library", path: "library/", graphTypologies: ["library"] },
      { id: "lib-l1x", path: "library/entry-1/l1-extraction/", graphTypologies: ["l1-extraction"] },
    ],
    visualisers: [{ id: "l1-extraction", renderedBy: "l1-extraction-pages", coversKinds: ["l1-extraction"], subgraphs: "instance", title: "L1 extraction" }],
  });
  const x = join(root, "lib", "library", "entry-1", "l1-extraction");
  write(join(x, "l1.json"), {
    "@context": "http://example.org/l1.context.jsonld",
    id: "http://example.org/graph",
    nodes: [
      { id: "http://example.org/pub", type: "publication", label: "A handbook" },
      { id: "http://example.org/r1", type: "recommendation", label: "R1", properties: { identifier: "R1", statement: "Use {{ site.title }} rarely." }, evidence: { location: "sections/page-001.md" } },
      { id: "http://example.org/r2", type: "recommendation", label: "R2", properties: { identifier: "R2", statement: "Use <b>bold</b> never." } },
    ],
    edges: [{ type: "Statement", predicate: "definedIn", source: "http://example.org/r1", target: "http://example.org/pub" }],
  });
  write(join(x, "recommendation-candidates.json"), {
    $schema: "l1-recommendation-candidates/v1",
    publication: { title: "A handbook" },
    counts: { recommendations: 2, excluded: 1 },
    coverage: { normative: 3, captured: 2, capturedPct: 66.7 },
    candidates: [
      { location: "p1:s1", text: "Use it rarely.", decision: "recommendation", keys: ["R1"] },
      { location: "p1:s2", text: "Use bold never.", decision: "recommendation", keys: ["R2"] },
      { location: "p2:s1", text: "Licence text.", decision: "exclude" },
    ],
  });
  write(join(x, "scenarios", "scenario-candidates.l2.json"), {
    "@context": "http://example.org/l2.context.jsonld",
    nodes: [{ id: "s1", type: "user-scenario" }, { id: "s2", type: "user-scenario" }, { id: "p1", type: "persona" }],
    edges: [{ predicate: "implementedBy" }, { predicate: "implementedBy" }, { predicate: "involves" }],
  });
  write(join(x, "curation.yaml"), "$schema: l1-recommendation-curation/v1\ndecisions:\n  p2:s1:\n    as: exclude\n    reason: editorial\n");
  write(join(x, "broken.json"), "{ not json");
  write(join(x, "warnings.md"), "# Warnings\n");
  write(join(root, "remote", "remote.json"), {
    name: "remote",
    version: "0.0.0",
    description: "Scratch instance whose L1 extraction is not in the build.",
    directories: [{ id: "remote-l1x", path: "examples/l1/", graphTypologies: ["l1-extraction"] }],
  });
  return root;
}

describe("gen-l1-extraction-pages --site", () => {
  const checkout = scratchCheckout();
  const site = mkdtempSync(join(tmpdir(), "smart-base-l1x-site-"));
  afterAll(() => [checkout, site].forEach((d) => rmSync(d, { recursive: true, force: true })));
  const run = (...args: string[]) => Bun.spawnSync(["bun", "run", SCRIPT, "--root", checkout, "--site", site, ...args], { cwd: CHECKOUT });
  // The library publisher's copy of one file, as cat-harness's `library:viz` lays it down.
  write(join(site, "assets", "library", "jsonld", "lib", "entry-1", "l1-extraction", "l1.json"), "{}");
  const first = run();
  const files = (): string[] =>
    (readdirSync(site, { recursive: true }) as string[]).filter((f) => f.startsWith("en") && statSync(join(site, f)).isFile()).sort();
  const hub = join("en", "lib", "l1-extraction", "index.html");
  const lib = join("en", "lib", "l1-extraction", "lib", "index.html");
  const remote = join("en", "lib", "l1-extraction", "remote", "index.html");
  const read = (f: string): string => readFileSync(join(site, f), "utf8");

  it("the Tool declares the kind it renders, the site flag, and no required input", async () => {
    const { tools } = await import("../tools/index.ts");
    const t = tools().find((x) => x.id === "l1-extraction-pages")!;
    expect(t.renders).toContain("l1-extraction");
    const a = t.io?.inputs?.find((i) => i.name === "site")?.arg;
    expect(a !== undefined && "flag" in a ? a.flag : undefined).toBe("--site");
    expect(t.io?.inputs?.filter((i) => i.required) ?? []).toEqual([]);
  });

  it("writes the hub and one page per declaring instance at the declared route, and nothing else", () => {
    expect(first.stderr.toString()).not.toContain("error");
    expect(first.exitCode).toBe(0);
    expect(files()).toEqual([hub, lib, remote].sort());
    for (const f of files()) expect(read(f)).toContain("rendered-by: l1-extraction-pages");
  });

  it("shows the statements, the candidates with counts and decisions, and the graphs", () => {
    const html = read(lib);
    expect(html).toContain("L1 statements (2)");
    expect(html).toContain("<code>R1</code>");
    expect(html).toContain("<code>sections/page-001.md</code>");
    expect(html).toContain("<code>exclude</code></td><td class=\"num\">1</td>");
    expect(html).toContain("<code>capturedPct</code></td><td class=\"num\">66.7</td>");
    expect(html).toContain("Every candidate (3)");
    expect(html).toContain("<code>user-scenario</code></td><td class=\"num\">2</td>");
    expect(html).toContain("1 decision(s): 1 exclude");
    expect(html).toContain("Inside the library entry <code>entry-1</code>");
  });

  it("links a file to its published copy only where the site holds one", () => {
    const html = read(lib);
    expect(html).toContain('href="../../../../assets/library/jsonld/lib/entry-1/l1-extraction/l1.json">published</a>');
    expect(html).not.toContain("l1-extraction/recommendation-candidates.json\">published");
  });

  it("a file that does not parse says so and is not counted", () => {
    expect(read(lib)).toContain("<strong>not read</strong>: does not parse");
  });

  it("a declared directory not in the build is unknown, never zero", () => {
    expect(read(remote)).toContain("<strong>unknown</strong>, not none");
    expect(read(remote)).not.toMatch(/\b0 L1 statement/);
    expect(read(hub)).toContain("unknown — not in this build");
    expect(read(hub)).toContain("2 L1 statement(s), 3 candidate sentence(s), 2 user-scenario candidate(s)");
  });

  it("authored text is escaped and never reaches Liquid", () => {
    const html = read(lib);
    expect(html).toContain("Use &lt;b&gt;bold&lt;/b&gt; never.");
    for (const f of files()) expect(read(f)).toMatch(/^---\n[\s\S]*?render_with_liquid: false[\s\S]*?\n---\n/);
  });

  it("--check passes on what it wrote and fails on a changed or orphaned page", () => {
    expect(run("--check").exitCode).toBe(0);
    writeFileSync(join(site, lib), "changed");
    expect(run("--check").exitCode).toBe(1);
    run();
    write(join(site, "en", "lib", "l1-extraction", "gone", "index.html"), "x");
    expect(run("--check").exitCode).toBe(1);
    run();
    expect(files()).toEqual([hub, lib, remote].sort());
  });
});

describe("readExtraction", () => {
  it("is null for a directory not on disk", () => {
    expect(readExtraction(join(tmpdir(), "smart-base-l1x-absent-does-not-exist"))).toBeNull();
  });

  it("reads the committed handbook extraction: 22 statements and the candidate work list", () => {
    const x = readExtraction(join(INSTANCE, "l1-extractions", "9789240116191-eng"))!;
    expect(x.statements.length).toBe(22);
    expect(x.candidates.length).toBe(1);
    expect(x.files.some((f) => f.error !== undefined)).toBe(false);
  });
});

describe("smart-base declares the viewer it draws", () => {
  const decl = JSON.parse(readFileSync(join(INSTANCE, "smart-base.json"), "utf8")) as {
    visualisers?: { id: string; renderedBy: string; coversKinds?: string[]; subgraphs?: string }[];
    builtAtPublish?: { path: string; writer: string[] }[];
  };
  it("a visualiser rendered by l1-extraction-pages, per instance, whose pages are built at publish", () => {
    const v = decl.visualisers?.find((x) => x.renderedBy === "l1-extraction-pages");
    expect(v).toMatchObject({ id: "l1-extraction", coversKinds: ["l1-extraction"], subgraphs: "instance" });
    // Under docs/, which smart-base:pages replaces wholesale, so this writer runs after it.
    const docs = decl.builtAtPublish?.find((x) => x.path === "docs/");
    expect(docs?.writer).toEqual(["smart-base:pages", "smart-base:l1-extraction:pages"]);
    const pkg = JSON.parse(readFileSync(join(INSTANCE, "package.json"), "utf8")) as { checkoutScripts: Record<string, string> };
    expect(pkg.checkoutScripts["smart-base:l1-extraction:pages"]).toContain("gen-l1-extraction-pages.ts");
    expect(readFileSync(join(INSTANCE, ".gitignore"), "utf8").split("\n")).toContain(`/${docs!.path}`);
  });
});
