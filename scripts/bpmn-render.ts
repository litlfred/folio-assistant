#!/usr/bin/env bun
/**
 * BPMN → SVG, using bpmn-js inside the Chromium already installed here.
 *
 * §12.18 shipped a DAK PDF whose largest gap was that business processes were
 * *listed rather than drawn*. This draws them. It also fills a gap on the WHO
 * side: `smart-dak-immz`'s `input/images/` is empty, so the IG has no process
 * diagrams either, and the same SVGs serve both.
 *
 * ## Why this works at all
 *
 * bpmn-js does **not** lay out a diagram — it renders the layout the file
 * already carries as BPMN Diagram Interchange. Measured across all 8 WHO
 * processes, every one has DI (20–264 `BPMNShape` elements each), so there is
 * a layout to render. A BPMN file without DI would produce an empty canvas
 * rather than an error, which is why {@link renderBpmn} reports a diagram it
 * could not find rather than writing a blank SVG.
 *
 * ## Multiple diagrams per file
 *
 * A BPMN file may declare several `BPMNDiagram` elements: a top-level plane
 * plus one per collapsed sub-process drilled into. This renders the top-level
 * plane and **counts** the rest as `extraPlanes`, because a plain bpmn-js
 * Viewer cannot register an element as both a shape and a plane root — see
 * `RenderResult.extraPlanes`. The count is reported, never dropped.
 *
 * Usage:
 *   bun run scripts/bpmn-render.ts <file.bpmn|dir> -o OUTDIR
 *
 * @module scripts/bpmn-render
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { basename, join } from "path";

/** The bundled viewer, injected into the page — no network fetch. */
const VIEWER_BUNDLE = "node_modules/bpmn-js/dist/bpmn-navigated-viewer.production.min.js";

export interface RenderedDiagram {
  /** BPMN diagram id, or an index when the file names none. */
  id: string;
  svg: string;
}

export interface RenderResult {
  source: string;
  diagrams: RenderedDiagram[];
  /**
   * Sub-process planes present in the file and NOT separately rendered.
   *
   * A BPMN file may carry several `BPMNDiagram` elements: one top-level plane
   * plus a plane per collapsed sub-process that was drilled into.
   * `IMMZ.D.Administer Vaccine` has eight, and `IMMZ.D17` appears both as a
   * shape in the top-level diagram and as the root of its own plane. That is
   * legal BPMN, and a plain bpmn-js Viewer refuses it — "element <IMMZ.D17>
   * already exists" — because rendering both would register the element twice.
   * Drilldown needs the Modeler's drilldown module.
   *
   * So the top-level diagram is rendered and the rest are counted. The count is
   * reported rather than dropped: a process whose sub-process detail is missing
   * is not a process that had none.
   */
  extraPlanes?: number;
  error?: string;
}

/**
 * Chromium's location, when the bundled download is not what is installed.
 *
 * Same probe as `dak-pdf.ts` — this container ships a different build number
 * than the installed playwright expects, and re-downloading is blocked.
 */
export function chromiumExecutable(): string | undefined {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!base || !existsSync(base)) return undefined;
  for (const dir of readdirSync(base).sort().reverse()) {
    for (const rel of ["chrome-linux/chrome", "chrome-linux/headless_shell", "chrome-linux64/chrome"]) {
      const p = join(base, dir, rel);
      if (existsSync(p)) return p;
    }
  }
  return undefined;
}

/**
 * Render every diagram in every given BPMN file.
 *
 * One browser for the whole batch: launching per file dominated the runtime.
 */
export async function renderBpmn(
  files: string[],
  repoRoot: string,
): Promise<RenderResult[]> {
  const bundlePath = join(repoRoot, VIEWER_BUNDLE);
  if (!existsSync(bundlePath)) {
    return files.map((f) => ({
      source: f,
      diagrams: [],
      error: `bpmn-js bundle not found at ${VIEWER_BUNDLE} — run: bun add bpmn-js`,
    }));
  }
  const bundle = readFileSync(bundlePath, "utf-8");

  const { chromium } = await import("playwright");
  const executablePath = chromiumExecutable();
  const browser = await chromium.launch(
    executablePath ? { executablePath, args: ["--no-sandbox"] } : { args: ["--no-sandbox"] },
  );

  const out: RenderResult[] = [];
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><html><body><div id="c"></div></body></html>');
    await page.addScriptTag({ content: bundle });

    for (const file of files) {
      const xml = readFileSync(file, "utf-8");
      try {
        const { xml: primary, stripped } = keepPrimaryPlane(xml);
        const diagrams = await page.evaluate(async (bpmnXml: string) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const W = window as any;
          const viewer = new W.BpmnJS({ container: "#c" });
          await viewer.importXML(bpmnXml);
          const defs = viewer.getDefinitions();
          const all: Array<{ id: string }> = defs?.diagrams ?? [];
          const { svg } = await viewer.saveSVG();
          const id = all[0]?.id || "diagram";
          viewer.destroy();
          return { svg, id };
        }, primary);

        out.push({
          source: file,
          diagrams: [{ id: diagrams.id, svg: diagrams.svg }],
          extraPlanes: stripped,
        });
      } catch (e) {
        out.push({ source: file, diagrams: [], error: String(e).slice(0, 200) });
      }
    }
  } finally {
    await browser.close();
  }
  return out;
}


/**
 * Keep only the first `BPMNDiagram`, returning how many were removed.
 *
 * A plain bpmn-js Viewer **cannot import** a file whose sub-process planes
 * reference elements that also appear as shapes: `IMMZ.D.Administer Vaccine`
 * fails with "element <IMMZ.D17> already exists" during `importXML`, before
 * anything is rendered, because `IMMZ.D17` is both a shape in the top-level
 * diagram and the root of its own drilled-down plane. That is legal BPMN;
 * rendering it needs the Modeler's drilldown module.
 *
 * Stripping is done here rather than by catching the failure, because a caught
 * failure yields no diagram at all — 7 of 8 processes drawn instead of 8. The
 * removed planes are counted and surfaced, never silently discarded.
 *
 * Deliberately a text operation on the serialised XML: parsing and
 * re-serialising risks changing namespace prefixes that the DI references
 * depend on.
 */
export function keepPrimaryPlane(xml: string): { xml: string; stripped: number } {
  const open = /<(\w+:)?BPMNDiagram\b/g;
  const starts: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = open.exec(xml)) !== null) starts.push(m.index);
  if (starts.length <= 1) return { xml, stripped: 0 };

  // Cut from the second BPMNDiagram to the end of the last one.
  const closeRe = /<\/(\w+:)?BPMNDiagram>/g;
  const ends: number[] = [];
  while ((m = closeRe.exec(xml)) !== null) ends.push(m.index + m[0].length);
  if (ends.length < starts.length) return { xml, stripped: 0 };

  const cutFrom = starts[1]!;
  const cutTo = ends[ends.length - 1]!;
  return { xml: xml.slice(0, cutFrom) + xml.slice(cutTo), stripped: starts.length - 1 };
}

/** `IMMZ.A.Foo.bpmn` + `Diagram_1` → `IMMZ.A.Foo__Diagram_1.svg` */
export function svgName(source: string, diagramId: string, only: boolean): string {
  const stem = basename(source, ".bpmn").replace(/[^\w.-]+/g, "-");
  const id = diagramId.replace(/[^\w.-]+/g, "-");
  return only ? `${stem}.svg` : `${stem}__${id}.svg`;
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const target = argv.find((a) => !a.startsWith("-"));
  const oi = argv.findIndex((a) => a === "-o" || a === "--out");
  const outDir = oi >= 0 ? argv[oi + 1] : undefined;

  if (!target) {
    console.error("usage: bpmn-render.ts <file.bpmn|dir> -o OUTDIR");
    return 2;
  }

  const files = existsSync(target) && readdirSync
    ? (function () {
        try {
          return readdirSync(target)
            .filter((f) => f.endsWith(".bpmn"))
            .map((f) => join(target, f))
            .sort();
        } catch {
          return [target];
        }
      })()
    : [];

  if (!files.length) {
    console.error(`no .bpmn under ${target}`);
    return 1;
  }

  const results = await renderBpmn(files, process.cwd());
  let diagrams = 0;
  let failed = 0;
  for (const r of results) {
    if (r.error) {
      failed++;
      console.error(`FAIL ${basename(r.source)}: ${r.error}`);
      continue;
    }
    diagrams += r.diagrams.length;
    const extra = r.extraPlanes ? ` (+${r.extraPlanes} sub-process plane(s) not separately rendered)` : "";
    console.log(`${basename(r.source)}: ${r.diagrams.length} diagram(s)${extra}`);
    if (outDir) {
      mkdirSync(outDir, { recursive: true });
      for (const d of r.diagrams) {
        writeFileSync(join(outDir, svgName(r.source, d.id, r.diagrams.length === 1)), d.svg);
      }
    }
  }
  console.log(
    `\n${files.length} file(s), ${diagrams} diagram(s), ${failed} failure(s)` +
      (outDir ? ` → ${outDir}` : " (dry run; pass -o to write)"),
  );
  return failed ? 1 : 0;
}

if (import.meta.main) {
  main()
    .then((c) => process.exit(c))
    .catch((e) => {
      console.error(e);
      process.exit(2);
    });
}
