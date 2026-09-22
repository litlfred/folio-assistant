/**
 * The uploads harness is the QUEUE's, and stays the queue's.
 *
 * Issue #836, bean `v18c`. `uploads` and `library` declared the same
 * `coverage.visualiser`, so the uploads tile opened the corpus browser and
 * rendered the library's entry count — 0 on this instance, while 27 sources
 * waited in the queue beside it. The owner rejected all three ways of dividing
 * one page: *"funcionally different/behavior diffent so need distinct
 * harness"*.
 *
 * So the assertions here are about the SEPARATION, not about columns. A test
 * that checked the table's headings would pass just as happily on the day
 * somebody folded the corpus back in.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { itemState, viewerHtml } from "../gen-uploads-viz.ts";
import { readLibraryGraph } from "../library-graph.ts";
import { instanceRootsIn, repoRootFor } from "../../schemas/cat-harness.ts";
import type { UploadItem } from "../library-graph.ts";

const item = (over: Partial<UploadItem> = {}): UploadItem => ({
  file: "2602.12670v4.pdf",
  kind: "file",
  instance: "folio-assistant",
  path: "uploads/2602.12670v4.pdf",
  bytes: 1769852,
  ext: "pdf",
  ingestedBy: "",
  docId: "",
  title: "",
  declaredFiles: 0,
  ...over,
});

describe("ONE dataset — this harness publishes no projection of its own", () => {
  test("the generator source emits no assets/uploads projection", () => {
    // Bean `flh4` / issue #618, recorded in `state-visualizer.ts`: the queue
    // block lives in `assets/library/index.json`, "since two projections over
    // it would be two answers to how many are queued". The first draft of this
    // generator emitted its own, which could not have DISAGREED on the day it
    // was written — the trap is the day one is regenerated and the other is
    // not. Asserted against the SOURCE, because a second projection is a thing
    // that gets added back by someone doing the obvious thing.
    const src = readFileSync(join(import.meta.dir, "..", "gen-uploads-viz.ts"), "utf8");
    expect(src).not.toMatch(/emit\(\s*join\(\s*dataDir/);
  });

  test("the viewer is pointed at the LIBRARY projection", () => {
    // `viewerPlacement(..., "library")` is what makes the href resolve to the
    // one dataset. Passing the uploads segment instead would mint a second.
    const src = readFileSync(join(import.meta.dir, "..", "gen-uploads-viz.ts"), "utf8");
    expect(src).toContain('viewerPlacement(site, `${handler}/${seg}`, "library")');
  });
});

describe("state is read from the corpus link, not guessed", () => {
  test("a unit no library slug names is waiting", () => {
    expect(itemState(item())).toBe("waiting");
  });

  test("a unit a slug names is ingested", () => {
    expect(itemState(item({ ingestedBy: "some-slug" }))).toBe("ingested");
  });
});

describe("the viewer is a queue view", () => {
  const html = viewerHtml("../../assets/uploads/index.json");

  test("the headline is what is WAITING, not a total", () => {
    // The pipeline doc's argument, made structural: the corpus grep searches
    // `library/` only, so a file waiting here makes a clean grep read as
    // "nobody has done this". A total would read as reassurance.
    expect(html).toContain("waiting to be ingested");
    const lead = html.indexOf("waiting to be ingested");
    const total = html.indexOf("queued units");
    expect(lead).toBeGreaterThan(-1);
    expect(total).toBeGreaterThan(-1);
    expect(lead).toBeLessThan(total);
  });

  test("it says why the queue matters, in the page rather than in a comment", () => {
    // A reader who opens this page and does not know the pipeline has to be
    // told there, not in a doc they would have to go and find.
    expect(html).toContain("library/");
    expect(html).toMatch(/not.*reachable by the corpus checklist/is);
  });

  test("an empty queue and an unreadable projection are DIFFERENT", () => {
    // Opposite facts, and the same rule the todo board states for its index.
    expect(html).toContain("Nothing in the queue");
    expect(html).toContain("This is not the same as an empty queue");
  });

  test("the projection is fetched by the RELATIVE href it was given", () => {
    // #801, one layer along: an absolute site-root path resolves against the
    // ORIGIN under a baseurl, which is how twelve navbar tiles came to 404.
    // The same bytes have to serve the canonical deploy and a STAGING preview.
    expect(html).toContain(JSON.stringify("../../assets/uploads/index.json"));
    expect(html).not.toMatch(/fetch\(["']\//);
  });

  test("a subject scope narrows the view without a second page template", () => {
    const scoped = viewerHtml("../../../assets/uploads/index.json", "folio-assistant");
    expect(scoped).toContain(JSON.stringify("folio-assistant"));
    // One template, two renderings — the rule gen-library-viz states for its
    // own two views.
    expect(scoped.replace(/folio-assistant/g, "").length).toBeGreaterThan(0);
  });
});

describe("a sidecar is not a queued document", () => {
  // Against the REAL corpus, because this defect is about what the queue
  // actually holds and a fixture would have been written by the same reading
  // that got it wrong. Found by rendering the page: five `.extraction.json`
  // files stood in the table as units "waiting to be ingested", 0 KB each,
  // inflating the headline from 20 to 27 — the one number the page exists for.
  const root = repoRootFor(join(import.meta.dir, "..", ".."));
  const g = readLibraryGraph(instanceRootsIn(root));

  test("the corpus is readable, so the assertions below are not vacuous", () => {
    expect(g).not.toBeNull();
    expect(g!.uploads.length).toBeGreaterThan(0);
  });

  test("no extraction sidecar whose SOURCE is queued is itself a unit", () => {
    const names = new Set(g!.uploads.map((u) => u.file));
    const offenders = g!.uploads
      .map((u) => u.file)
      .filter((f) => f.endsWith(".extraction.json") && names.has(f.slice(0, -".extraction.json".length)));
    expect(offenders).toEqual([]);
  });

  test("an ORPHAN sidecar would still be a unit — the rule is keyed on the source", () => {
    // The sign-flipped defect: dropping every sidecar would hide a file that
    // nothing accounts for, which is exactly what a queue view is for. Asserted
    // on the RULE rather than on the corpus, which today has no orphan.
    const src = readFileSync(join(import.meta.dir, "..", "library-graph.ts"), "utf8");
    expect(src).toContain("!present.has(source)");
  });
});
