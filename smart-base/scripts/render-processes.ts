#!/usr/bin/env bun
/**
 * render-processes.ts — draw every BPMN process smart-base declares, beside
 * its source.
 *
 * The `.bpmn` is the source of truth, and it lives in a directory the
 * declaration (`smart-base.json`) gives the `processes` typology:
 * `processes/` (the house processes, among them the authoring lifecycle the
 * IG's Authoring Process page shows) and `methodologies/processes/`. The picture
 * is written as `<name>.svg` next to `<name>.bpmn`, as bootstrap-tools draws
 * one for every content graph, because a README on GitHub cannot draw BPMN.
 *
 * It is NOT how the processes reach a site. smart-base is mounted into
 * folio-assistant, whose just-the-docs site draws every mounted instance's
 * processes (`cat-harness-tools` `render:bpmn`), and a branch is previewed
 * there under `STAGING/<slug>/` (`feature-staging`). Nothing here writes into
 * the IG's `input/`.
 *
 * The drawing is bootstrap-tools' (`scripts/render-bpmn.ts`: bpmn-js in
 * headless Chromium, byte-stable, call activities linked to sibling
 * diagrams). Its own CLI draws only the content graphs it supports, so this
 * calls its exported renderer for smart-base's, as cat-harness-tools'
 * `render-bpmn.ts` does for its site. Never vendored.
 *
 *   bun run smart-base/scripts/render-processes.ts            # write
 *   bun run smart-base/scripts/render-processes.ts --check    # fail on a stale picture
 *
 * Exit: 0 drawn or current, 1 a diagram failed or is stale, 2 nothing to draw.
 *
 * @module smart-base/scripts/render-processes
 * @covers processes
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";

import { besideSource, openRenderer, processIds } from "@litlfred/bootstrap-tools/scripts/render-bpmn.ts";

const INSTANCE = resolve(import.meta.dir, "..");
const REPO = resolve(INSTANCE, "..");

/** Every `.bpmn` under a directory, at any depth. */
function bpmnUnder(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return bpmnUnder(p);
    return f.endsWith(".bpmn") ? [p] : [];
  });
}

/** The `.bpmn` sources, from the declaration's `processes` directories. */
export function processSources(instance = INSTANCE): string[] {
  const decl = JSON.parse(readFileSync(join(instance, "smart-base.json"), "utf8")) as {
    directories?: { path: string; graphTypologies?: string[] }[];
  };
  const dirs = (decl.directories ?? []).filter((d) => d.graphTypologies?.includes("processes"));
  return [...new Set(dirs.flatMap((d) => bpmnUnder(resolve(instance, d.path))))].sort();
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const sources = processSources();
  if (sources.length === 0) {
    console.error("✗ no .bpmn in a processes directory of smart-base.json — nothing was drawn or checked.");
    process.exit(2);
  }
  // Call activities link to sibling diagrams by basename, so two diagrams of
  // one name would be ambiguous. Refused rather than trusted.
  const byName = new Map<string, string[]>();
  for (const f of sources) byName.set(basename(f), [...(byName.get(basename(f)) ?? []), f]);
  const clash = [...byName.values()].filter((fs) => fs.length > 1);
  if (clash.length) {
    for (const fs of clash) console.error(`✗ two diagrams named ${basename(fs[0]!)}: ${fs.map((f) => relative(REPO, f)).join(", ")}`);
    process.exit(1);
  }

  const viewer = Bun.resolveSync("bpmn-js/dist/bpmn-viewer.production.min.js", Bun.resolveSync("@litlfred/bootstrap-tools/package.json", import.meta.dir));
  const processFile = new Map<string, string>();
  for (const f of sources) for (const id of processIds(readFileSync(f, "utf8"))) processFile.set(id, f);

  const r = await openRenderer(viewer);
  let bad = 0;
  for (const file of sources) {
    const got = await besideSource(r, file, processFile);
    if ("error" in got) {
      console.error(`✗ ${relative(REPO, file)}: ${got.error}`);
      bad++;
      continue;
    }
    for (const out of [file.replace(/\.bpmn$/, ".svg")]) {
      const prev = existsSync(out) ? readFileSync(out, "utf8") : undefined;
      if (check) {
        if (prev !== got.svg) {
          console.error(`✗ ${relative(REPO, out)} is stale — run without --check`);
          bad++;
        } else console.log(`✓ ${relative(REPO, out)} up to date`);
      } else {
        writeFileSync(out, got.svg);
        console.log(`${prev === got.svg ? "=" : "✓"} ${relative(REPO, out)}`);
      }
    }
  }
  await r.close();
  process.exit(bad ? 1 : 0);
}
