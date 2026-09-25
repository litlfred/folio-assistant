/**
 * Subprocess links are DERIVED from the pages, and every one lands (bean `xl55`).
 *
 * Until `xl55` a process carried `<…:link href>` naming the page written about
 * it. Of ten, five were broken somewhere and nothing said so. The links are
 * now built from `WebPageNode.asset.source`, which makes the second half of
 * this file possible: checking every rendered link against the pages it names.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { siteDirFor } from "../../schemas/cat-harness.ts";
import { workflowFiles } from "../known-skills.js";
import { processPresentations, processTarget, type Presentation } from "../process-presentations.js";

const ROOT = resolve(import.meta.dir, "..", "..");
const SITE = join(ROOT, siteDirFor(ROOT));
const SVG_DIR = join(SITE, "assets/img/workflows");

const p = (page: string, node: string): Presentation => ({ page, node, pageTitle: page });

describe("processTarget — where a subprocess box lands", () => {
  test("exactly one section presents it → that section", () => {
    expect(processTarget("x", [p("evidence", "the-subprocess")])).toBe("evidence.html#the-subprocess");
  });

  test("a slug with a path keeps it", () => {
    expect(processTarget("x", [p("guides/who-smart-ig", "the-l3-pipeline")])).toBe("guides/who-smart-ig.html#the-l3-pipeline");
  });

  test("none → the process's own generated page", () => {
    expect(processTarget("options-analysis", undefined)).toBe("processes/options-analysis.html");
    expect(processTarget("options-analysis", [])).toBe("processes/options-analysis.html");
  });

  test("MORE than one → the process page, which lists them all — never a silent pick", () => {
    expect(processTarget("content-lifecycle", [p("a", "x"), p("b", "y")])).toBe("processes/content-lifecycle.html");
  });
});

describe("this repository, right now", () => {
  test("the index is not empty — a check over nothing is not a check", async () => {
    const idx = await processPresentations(ROOT);
    expect(idx.size).toBeGreaterThan(0);
    expect(idx.get("processes/ingest-theme.bpmn")?.map((x) => `${x.page}#${x.node}`)).toEqual([
      "document-ingestion#ingest-the-theme",
    ]);
  });

  /** Every anchor a generated page pins, or a heading that would derive one. */
  const anchorsOf = (md: string): Set<string> =>
    new Set([...md.matchAll(/\{:\s*#([\w-]+)/g), ...md.matchAll(/\bid="([\w-]+)"/g)].map((m) => m[1]!));

  test("every subprocess link in every rendered diagram lands on a page, and on its section", () => {
    // Only the SVGs `render-bpmn` writes. Three bootstrap diagrams' SVGs sit in
    // the same directory but are rendered by nothing since the split (bean
    // `oqdr`), so a finding in one would be about a stale file, not about how
    // links are derived — reported there rather than silently filtered here.
    const rendered = new Set(
      workflowFiles(ROOT)
        .filter((f) => f.endsWith(".bpmn"))
        .map((f) => `${f.split("/").pop()!.slice(0, -5)}.svg`),
    );
    const links = readdirSync(SVG_DIR)
      .filter((f) => rendered.has(f))
      .flatMap((f) =>
        [...readFileSync(join(SVG_DIR, f), "utf-8").matchAll(/class="fa-subprocess-link" href="([^"]+)"/g)].map((m) => ({
          svg: f,
          href: m[1]!,
        })),
      );
    expect(links.length).toBeGreaterThan(0);
    const broken: string[] = [];
    for (const { svg, href } of links) {
      // Relative to the SVG FILE — which is how docs-ui re-anchors it when inlined.
      const [path, anchor] = href.split("#");
      const abs = resolve(SVG_DIR, path!);
      const md = abs.replace(/\.html$/, ".md");
      if (!abs.startsWith(SITE) || !existsSync(md)) {
        broken.push(`${svg}: ${href} — no page at ${md.slice(SITE.length + 1)}`);
        continue;
      }
      if (anchor && !anchorsOf(readFileSync(md, "utf-8")).has(anchor)) {
        broken.push(`${svg}: ${href} — ${dirname(md) === SITE ? "" : "…/"}${md.split("/").pop()} has no #${anchor}`);
      }
    }
    expect(broken).toEqual([]);
  });

  test("no diagram names a page — the link is the page's to declare", () => {
    const dir = join(ROOT, "processes");
    const named = readdirSync(dir)
      .filter((f) => f.endsWith(".bpmn"))
      .filter((f) => /<[\w.-]+:link\b[^>]*\bhref=/.test(readFileSync(join(dir, f), "utf-8")));
    expect(named).toEqual([]);
  });
});
