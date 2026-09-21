/**
 * `check-lane-documentation`'s copy of the extractor agrees with the extractor.
 *
 * @module scripts/tests/lane-extraction-parity.test
 *
 * `check-lane-documentation.ts` answers "would a translator ever see this
 * lane's text" and must answer it the way the REAL extractor would. It cannot
 * ask `extractBpmn` directly: that lives in `content/pipeline/`, which is
 * `folio-assist-core`, while the check is `agentic-harness`, and
 * `check:partition` refuses the edge because core depends on the harness.
 * So `decodeLabel` and the extractor's filter are duplicated there.
 *
 * **This is what makes that duplicate legitimate.** `AGENTS.md`: an
 * unavoidable duplicate is fine while an unchecked one is not. A copy that
 * drifts would report a string as extractable that no `.pot` will ever carry
 * — green on a gate whose entire purpose is to catch that.
 *
 * The comparison runs over the repository's OWN diagrams rather than a
 * fixture, because a fixture proves the two agree on the cases somebody
 * thought to write down, and the corpus is where the disagreement would
 * actually appear: 61 diagrams carrying quotation marks, `&#10;`, em-dashes,
 * backticks and prose long enough for gettext to wrap.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { extractBpmn } from "../../content/pipeline/bpmn-translate.js";
import { checkLanes } from "../check-lane-documentation.js";

const REPO = resolve(import.meta.dir, "..", "..", "..");

function bpmnFiles(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".bpmn")) out.push(p);
    }
  };
  walk(root);
  return out.sort();
}

/**
 * The check's duplicated pair, re-stated here so the test compares two
 * implementations rather than one against itself.
 *
 * Kept verbatim with `check-lane-documentation.ts`: if you change it there,
 * this test fails until you change it here too, and THAT is the point — the
 * failure names the drift instead of hiding it.
 */
function decodeLabel(raw: string): string {
  return raw
    .replace(/&#10;|&#xA;/gi, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function isExtractable(msgid: string): boolean {
  if (!msgid) return false;
  return !(/^[A-Za-z_][A-Za-z0-9_]*$/.test(msgid) && /_/.test(msgid));
}

const NAMED_COPY = new RegExp(
  "<(?:bpmn:)?(?:process|lane|task|serviceTask|userTask|manualTask|scriptTask|" +
    "sendTask|receiveTask|businessRuleTask|callActivity|subProcess|" +
    "startEvent|endEvent|intermediateCatchEvent|intermediateThrowEvent|boundaryEvent|" +
    "exclusiveGateway|parallelGateway|inclusiveGateway|eventBasedGateway|" +
    "sequenceFlow|participant|collaboration)\\b[^>]*?\\sname=\"([^\"]*)\"",
  "g",
);

const DOCUMENTATION_COPY = /<(?:bpmn:)?documentation>([\s\S]*?)<\/(?:bpmn:)?documentation>/g;

function localMsgids(xml: string): Set<string> {
  const out = new Set<string>();
  for (const m of xml.matchAll(DOCUMENTATION_COPY)) {
    const id = decodeLabel(m[1] ?? "");
    if (isExtractable(id)) out.add(id);
  }
  for (const m of xml.matchAll(NAMED_COPY)) {
    const id = decodeLabel(m[1] ?? "");
    if (isExtractable(id)) out.add(id);
  }
  return out;
}

describe("the lane check's extractor copy has not drifted", () => {
  const files = bpmnFiles(REPO);

  // A corpus of nothing would make every assertion below vacuously true —
  // `6tkl`, the same failure the check itself guards against.
  test("there are diagrams to compare", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  test("every string the real extractor produces, the copy also produces", () => {
    const missing: string[] = [];
    for (const f of files) {
      const xml = readFileSync(f, "utf-8");
      const rel = relative(REPO, f);
      const mine = localMsgids(xml);
      for (const e of extractBpmn(xml, rel)) {
        if (!mine.has(e.msgid)) missing.push(`${rel}: ${e.msgid.slice(0, 70)}`);
      }
    }
    // A string the extractor emits and the copy does not would be reported as
    // NOT EXTRACTED while a translator can see it perfectly well — a false
    // finding, which fails CI on work that is right.
    expect(missing).toEqual([]);
  });

  test("the copy claims nothing the real extractor would not emit", () => {
    const extra: string[] = [];
    for (const f of files) {
      const xml = readFileSync(f, "utf-8");
      const rel = relative(REPO, f);
      const theirs = new Set(extractBpmn(xml, rel).map((e) => e.msgid));
      for (const id of localMsgids(xml)) {
        if (!theirs.has(id)) extra.push(`${rel}: ${id.slice(0, 70)}`);
      }
    }
    // The dangerous direction: the copy says "a translator will see this" for
    // a string the extractor drops, so the gate goes green over text that
    // reaches no catalogue in any locale.
    expect(extra).toEqual([]);
  });

  test("the corpus it is actually run against comes back clean", () => {
    const r = checkLanes(REPO);
    expect(r.unextracted).toEqual([]);
    expect(r.undocumented).toEqual([]);
    expect(r.unnamed).toEqual([]);
    expect(r.orphans).toEqual([]);
    expect(r.lanes).toBeGreaterThan(0);
  });
});
