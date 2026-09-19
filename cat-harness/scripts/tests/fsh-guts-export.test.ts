/**
 * `<base>/fsh-guts.jsonld` — the trashcan reachable by name.
 *
 * Owner, 2026-09-19: *"jsonld accessible via `<base-url>/fsh-guts.jsonld`"*,
 * and on the activity log that lives inside that tree: *"dont get
 * published"*.
 *
 * Bean `folio-assistant-t0i3`.
 *
 * @module scripts/tests/fsh-guts-export.test
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { readFshGutsNode } from "../../schemas/fsh-guts.ts";
import { buildFshGutsExport, fshGutsDirs } from "../fsh-guts-export.ts";
import { buildExport } from "../kg-export.js";
import { repoRootFor } from "../../schemas/cat-harness.js";

const ROOT = resolve(import.meta.dir, "../..");

/** A throwaway instance that declares a trashcan. */
function instance(declare = true): string {
  const root = mkdtempSync(join(tmpdir(), "fsh-guts-export-"));
  mkdirSync(join(repoRootFor(root), "fsh-guts"), { recursive: true });
  writeFileSync(
    join(root, "harness.json"),
    JSON.stringify({
      name: "t",
      stub: "t",
      canonicalUrl: "https://example.invalid/t",
      directories: declare
        ? [{ id: "fsh-guts", path: "fsh-guts/", description: "trashcan", graphs: ["fsh-guts"] }]
        : [],
    }),
  );
  return root;
}

function node(over: Record<string, string> = {}): string {
  const fm = { $schema: "folio-fsh-guts/v1", title: "A discarded thing", kind: "proposal", ...over };
  return `---\n${Object.entries(fm)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n")}\n---\n\n# body\n`;
}

describe("the real corpus", () => {
  const doc = buildFshGutsExport(ROOT);

  test("every committed node is in the document", () => {
    // The vacuity guard first: everything below filters this graph, and a
    // filter over nothing passes.
    expect(doc.nodeCount).toBeGreaterThan(0);
    expect(doc["@graph"]).toHaveLength(doc.nodeCount);
    expect(doc.scans).toContain("fsh-guts");
  });

  test("nothing was skipped for a reason that means a defect", () => {
    // A file declaring another schema is data. A file declaring THIS one and
    // failing it is a broken node, and would otherwise vanish silently.
    const broken = doc.skipped.filter((s) => s.reason.includes("does not satisfy"));
    expect(broken.map((s) => `${s.path}: ${s.reason}`)).toEqual([]);
  });

  test("the @id names where it is actually served", () => {
    expect(doc["@id"]).toBe("https://litlfred.github.io/folio-assistant/fsh-guts.jsonld");
    expect(buildFshGutsExport(ROOT, "https://example.invalid/preview")["@id"]).toBe(
      "https://example.invalid/preview/fsh-guts.jsonld",
    );
  });

  test("the directory is resolved from the declaration, not spelled", () => {
    expect(fshGutsDirs(ROOT)).toEqual([join(repoRootFor(ROOT), "fsh-guts")]);
    expect(fshGutsDirs(instance(false))).toEqual([]);
  });
});

describe("reachable BY NAME, and by no edge", () => {
  test("the main graph still does not mention fsh-guts at all", async () => {
    // The converse of the strip test, and the property this whole document
    // depends on: it exists so the content stays reachable DELIBERATELY. If
    // the main graph ever linked here, a crawler would arrive and the strip
    // would have been undone by the thing built on top of it.
    const main = await buildExport();
    expect(JSON.stringify(main)).not.toContain("fsh-guts");
  });

  test("and this document is a separate one, not a subgraph", () => {
    const doc = buildFshGutsExport(ROOT);
    expect(doc["@id"]).not.toBe("https://litlfred.github.io/folio-assistant/folio-assistant.jsonld");
  });
});

describe("logs are excluded by DECLARATION, not by the gitignore", () => {
  test("a log entry sitting in the tree is not in the document", () => {
    // The gitignore keeps logs out of a CI checkout, which is a property of
    // the build and not of this exporter — it would stop being true the
    // moment somebody exported from a working tree. This is the actual
    // guarantee.
    const root = instance();
    const logs = join(repoRootFor(root), "fsh-guts", "logs");
    mkdirSync(logs, { recursive: true });
    writeFileSync(join(repoRootFor(root), "fsh-guts", "kept.md"), node({ title: "Kept" }));
    writeFileSync(
      join(logs, "entry.json"),
      JSON.stringify({ $schema: "folio-log/v1", id: "x", summary: "a secret-ish trace" }),
    );

    const doc = buildFshGutsExport(root);
    expect(doc.nodeCount).toBe(1);
    expect(JSON.stringify(doc["@graph"])).not.toContain("secret-ish");
  });

  test("the skip reason names what the file actually declares", () => {
    // It excluded a log entry while reporting "declares no $schema", which
    // is FALSE — a log entry declares emphatically, just in JSON rather than
    // YAML front matter. The outcome was right and the reason would have
    // sent the next reader looking for a tag that is there.
    const r = readFshGutsNode(JSON.stringify({ $schema: "folio-log/v1", id: "x" }));
    expect(r.node).toBeUndefined();
    const reason = "reason" in r ? r.reason : "";
    expect(reason).toContain("folio-log/v1");
    expect(reason).not.toContain("declares no $schema");
  });

  test("a file that genuinely declares nothing says so", () => {
    const r = readFshGutsNode("# just a note somebody dropped in\n");
    expect("reason" in r ? r.reason : "").toContain("declares no $schema");
  });
});

describe("what was not included is reported", () => {
  test("a node declaring this schema but failing it is a defect, not a skip", () => {
    const root = instance();
    writeFileSync(join(repoRootFor(root), "fsh-guts", "broken.md"), "---\n$schema: folio-fsh-guts/v1\nkind: x\n---\n");
    const doc = buildFshGutsExport(root);
    expect(doc.nodeCount).toBe(0);
    expect(doc.skipped[0]!.reason).toContain("does not satisfy");
  });

  test("an instance with no declared trashcan is distinguishable from an empty one", () => {
    // Third state. `nodeCount: 0` alone cannot tell them apart, and the two
    // want different responses.
    expect(buildFshGutsExport(instance(false)).scans).toEqual([]);
    expect(buildFshGutsExport(instance()).scans).toEqual(["fsh-guts"]);
    expect(buildFshGutsExport(instance()).nodeCount).toBe(0);
  });
});

describe("the site build publishes it, with the media-type alias", () => {
  const wf = readFileSync(join(repoRootFor(ROOT), ".github/workflows/docs-site.yml"), "utf8");

  test("the document is written into the site", () => {
    expect(wf).toContain("scripts/fsh-guts-export.ts");
    expect(wf).toContain('"./_site/fsh-guts.jsonld"');
  });

  test("and the .json alias, since Pages serves .jsonld as octet-stream", () => {
    // Every other rendering here carries the alias for this reason; one that
    // did not would download instead of render, and nothing else would say
    // so.
    expect(wf).toContain('cp "./_site/fsh-guts.jsonld" "./_site/fsh-guts.json"');
  });
});

describe("the folded block scalar the corpus actually uses", () => {
  test("`summary: >-` is read as prose, not as the literal `>-`", () => {
    // The reason the front-matter reader was extracted rather than copied:
    // the memory parser has no block-scalar support and would have set
    // summary to ">-", dropping every summary in the trashcan silently.
    const r = readFshGutsNode(
      "---\n$schema: folio-fsh-guts/v1\ntitle: T\nkind: proposal\nsummary: >-\n  one line\n  and another\n---\n",
    );
    expect(r.node?.summary).toBe("one line and another");
  });

  test("every real node's summary survived the parse", () => {
    const withSummary = buildFshGutsExport(ROOT)["@graph"].filter((n) => n.description);
    expect(withSummary.length).toBeGreaterThan(0);
    for (const n of withSummary) expect(String(n.description)).not.toBe(">-");
  });
});
