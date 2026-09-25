/**
 * The methodologies viewer — the join, the three states, and the page a reader
 * actually gets.
 *
 * Bean `yunp`: `methodology` was one of seven declared graph kinds with no
 * published viewer, so the navbar listed it disabled and nine typed nodes
 * reached nobody.
 *
 * ## What is asserted here, and what deliberately is not
 *
 * **Not the prose.** A test that pinned the page's sentences would fail every
 * time somebody improved one, which is how a generated-artefact test becomes
 * something people delete.
 *
 * **The join, over a fixture.** Which node lands in which of the three
 * evidence states is the one piece of logic in the generator, and it is keyed
 * by node PATH rather than by name — two instances may adopt methods with
 * names one letter apart (`raci`, `rasci` already do), and a name-keyed join
 * would attribute one instance's evidence to another's node without saying so.
 *
 * **The consumer property, over the real corpus.** `check:artefact-verification`
 * asks what verifies a generated artefact FOR ITS CONSUMER, as against merely
 * verifying that the committed copy is current — the distinction that let
 * `library:viz:check` stay green while the page it generated could not run
 * (PR #805). Here the consumer property is that every row's link resolves to an
 * anchor on the same page, and that no cell breaks the table it sits in. Both
 * are `pb04` one layer down: a link that goes nowhere reads as a broken site.
 *
 * @module scripts/tests/methodologies-viz.test
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { siteDirFor } from "../../schemas/cat-harness.js";

import {
  instanceOf,
  methodologyRows,
  page,
  pageRelPath,
  short,
  type MethodologyRow,
} from "../gen-methodologies-viz.js";
import {
  checkMethodologyEvidence,
  methodologyNodes,
  type EvidenceReport,
  type MethodologyNode,
} from "../check-methodology-evidence.js";

const INSTANCE = resolve(import.meta.dir, "..", "..");
const REPO = resolve(INSTANCE, "..");

/** A valid node, with only the fields the row cares about varied. */
function node(path: string, name: string, evidence?: string[]): MethodologyNode {
  return {
    node: path,
    state: "ok",
    front: {
      $schema: "folio-methodology/v1",
      name,
      title: `${name.toUpperCase()} — a method`,
      origin: "Somebody, somewhere (1999)",
      "applies-when": "When the question is what this method answers.",
      ...(evidence ? { evidence } : {}),
    },
  };
}

function report(over: Partial<EvidenceReport> = {}): EvidenceReport {
  return {
    undetermined: false,
    nodes: 0,
    invalid: [],
    unresolved: [],
    noEvidence: [],
    untagged: [],
    resolved: [],
    ...over,
  };
}

describe("the three evidence states are three, and stay apart", () => {
  const nodes = [
    node("methodologies/held.md", "held", ["library/a-source"]),
    node("methodologies/cited.md", "cited"),
    node("methodologies/broken.md", "broken", ["library/no-such-slug"]),
  ];
  const r = report({
    nodes: 3,
    noEvidence: [{ node: "methodologies/cited.md", name: "cited", detail: "…" }],
    unresolved: [{ node: "methodologies/broken.md", name: "broken", detail: "…" }],
  });
  const rows = methodologyRows(nodes, r, INSTANCE, REPO);
  const state = (name: string): string => rows.find((x) => x.name === name)!.state;

  it("a citation that resolves is `ingested`", () => {
    expect(state("held")).toBe("ingested");
  });

  it("an origin with no `evidence:` is `cited-only` — an open question, not a defect", () => {
    expect(state("cited")).toBe("cited-only");
  });

  it("an `evidence:` naming nothing is `dangling`, NOT the same as having none", () => {
    // Strictly worse than declaring none: it reads as an ingested source in
    // every listing, so a reader who does not open it is told the citation
    // resolves. `dh4f` — collapsing the two puts the more reassuring answer on
    // the record for the broken one.
    expect(state("broken")).toBe("dangling");
    expect(state("broken")).not.toBe(state("cited"));
  });

  it("all three are distinguishable ON THE PAGE, in words and not only in colour", () => {
    const html = page(rows, r);
    for (const words of ["source held", "cited, not ingested", "citation does not resolve"]) {
      expect(html).toContain(words);
    }
  });
});

describe("the join is keyed by node path, not by name", () => {
  it("two instances adopting the same name do not share a verdict", () => {
    // The failure this pins: a name-keyed join makes one instance's missing
    // source into the other's, silently, and the page then says a method rests
    // on a document that was never ingested for it.
    const nodes = [
      node("methodologies/swot.md", "swot", ["library/held"]),
      node("../smart-base/methodologies/swot.md", "swot"),
    ];
    const rows = methodologyRows(
      nodes,
      report({ noEvidence: [{ node: "../smart-base/methodologies/swot.md", name: "swot", detail: "…" }] }),
      INSTANCE,
      REPO,
    );
    expect(rows.map((x) => [x.instance, x.state])).toEqual([
      ["cat-harness", "ingested"],
      ["smart-base", "cited-only"],
    ]);
  });

  it("a node that does not validate is not a row — it is a finding", () => {
    const rows = methodologyRows(
      [{ node: "methodologies/broken.md", state: "invalid", detail: "origin: Required" }],
      report(),
      INSTANCE,
      REPO,
    );
    expect(rows).toEqual([]);
  });

  it("an untagged file is not a row either — a README in the directory is correct", () => {
    const rows = methodologyRows(
      [{ node: "methodologies/README.md", state: "untagged", detail: "carries no $schema" }],
      report(),
      INSTANCE,
      REPO,
    );
    expect(rows).toEqual([]);
  });
});

describe("which instance declared it — `instanceOf`", () => {
  it("this instance's own node names this instance", () => {
    expect(instanceOf("methodologies/swot.md", INSTANCE, REPO)).toBe("cat-harness");
  });

  it("a SIBLING's node names the sibling, not `..`", () => {
    // What the first rendering of this page actually printed for two of its
    // nine rows, because it split the path instead of resolving it. Caught by
    // reading the page, so it is pinned here rather than trusted to review.
    expect(instanceOf("../smart-base/methodologies/diig.md", INSTANCE, REPO)).toBe("smart-base");
    expect(instanceOf("../folio-assistant-core/methodologies/doc-researcher.md", INSTANCE, REPO)).toBe("folio-assistant-core");
  });
});

describe("the page a reader gets — over the REAL corpus", () => {
  const r = checkMethodologyEvidence(INSTANCE);
  const rows = methodologyRows(methodologyNodes(INSTANCE), r, INSTANCE, REPO);

  it("the graph is found at all — `undetermined` is not a clean run", () => {
    expect(r.undetermined).toBe(false);
    expect(rows.length).toBeGreaterThan(0);
  });

  it("every row's link resolves to an anchor ON THIS PAGE", () => {
    // The consumer property. A "Choosing one" row links to `#<name>`; if the
    // detail section below does not carry that id the link silently goes
    // nowhere, which reads as a broken site rather than a broken link
    // (`pb04`). Checking the committed page, not only the rendered string, so
    // a stale commit fails here too.
    const rendered = page(rows, r);
    // `siteDirFor`, never the literal. `site-dir-single-answer.test.ts` fails
    // a source file that hardcodes the output site root, and it is right to:
    // the site root is one answer and a second spelling of it is a second
    // answer free to disagree. This test wrote the literal and that guard
    // caught it.
    const committed = readFileSync(join(INSTANCE, siteDirFor(INSTANCE), pageRelPath(REPO)!), "utf-8");
    for (const text of [rendered, committed]) {
      const targets = new Set([...text.matchAll(/<a id="([^"]+)"><\/a>/g)].map((m) => m[1]));
      const links = [...text.matchAll(/\]\(#([^)]+)\)/g)].map((m) => m[1]);
      expect(links.length).toBe(rows.length);
      expect(links.filter((l) => !targets.has(l))).toEqual([]);
    }
  });

  it("no cell breaks the table it sits in", () => {
    // `origin` and `applies-when` are free prose and one of them already
    // contains a pipe. An unescaped one silently shifts every column to its
    // right, which renders as a table that is subtly WRONG rather than as one
    // that is obviously broken.
    const body = page(rows, r).split("\n");
    const header = body.findIndex((l) => l.startsWith("| methodology |"));
    expect(header).toBeGreaterThan(-1);
    const columns = (l: string): number => l.split(/(?<!\\)\|/).length;
    const want = columns(body[header]!);
    for (const line of body.slice(header + 2)) {
      if (!line.startsWith("|")) break;
      expect({ line: line.slice(0, 40), columns: columns(line) }).toEqual({
        line: line.slice(0, 40),
        columns: want,
      });
    }
  });

  it("no row leaves a code span open — the defect that printed the table as text", () => {
    // Bean `7w1a`, owner 2026-09-24. The column check above counts pipes and
    // IGNORES code spans, so it passed while a truncated `applies-when` cut a
    // span open on the `madr` row: the stray backtick paired with one in a
    // later cell, the pipes between stopped being cell boundaries, and kramdown
    // rendered the whole table as a paragraph. Checked over the REAL page, in
    // both the rendered string and the committed file.
    const committed = readFileSync(join(INSTANCE, siteDirFor(INSTANCE), pageRelPath(REPO)!), "utf-8");
    for (const text of [page(rows, r), committed]) {
      const lines = text.split("\n");
      const header = lines.findIndex((l) => l.startsWith("| methodology |"));
      expect(header).toBeGreaterThan(-1);
      const tableRows = lines.slice(header + 2).filter((l, i, all) => all.slice(0, i + 1).every((x) => x.startsWith("|")));
      expect(tableRows.length).toBe(rows.length);
      for (const line of tableRows) {
        const ticks = (line.match(/`/g) ?? []).length;
        expect({ line: line.slice(0, 60), even: ticks % 2 === 0 }).toEqual({ line: line.slice(0, 60), even: true });
      }
    }
  });

  it("a cut that lands inside a code span or a bold run backs out of it", () => {
    const long = "x".repeat(130) + " (see `kepner-tregoe` for the method) and more words here";
    const cut = short(long, 140);
    expect((cut.match(/`/g) ?? []).length % 2).toBe(0);
    expect(cut.endsWith("…")).toBe(true);
    const bold = "y".repeat(130) + " **a bold phrase that runs past the limit** tail";
    expect((short(bold, 140).match(/\*\*/g) ?? []).length % 2).toBe(0);
    // ...and a cut that lands OUTSIDE any span is left exactly where it was.
    expect(short("z".repeat(200), 150)).toBe("z".repeat(149) + "…");
  });

  it("the page is DECLARED, not composed — and under the docs tree", () => {
    const at = pageRelPath(REPO);
    expect(at).toBeDefined();
    expect(at!.startsWith("..")).toBe(false);
  });

  it("the counts on the page are the counts in the rows", () => {
    // A generated page that states a number nothing derived is the shape this
    // repository keeps paying for — a count in prose is a claim, not evidence.
    const html = page(rows, r);
    const stat = (label: string): number => {
      const m = new RegExp(`<b>(\\d+)</b><span>${label}`).exec(html);
      return m ? Number(m[1]) : -1;
    };
    expect(stat("adopted methodologies")).toBe(rows.length);
    expect(stat("with the source held here")).toBe(
      rows.filter((x: MethodologyRow) => x.state === "ingested").length,
    );
    expect(stat("cited, not ingested")).toBe(
      rows.filter((x: MethodologyRow) => x.state === "cited-only").length,
    );
  });
});
