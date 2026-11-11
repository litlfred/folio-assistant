#!/usr/bin/env bun
/**
 * The journeys viewer: write the pages of the `journeys-viewer` visualiser a
 * layer declares — an index of every journey in the checkout, one page per
 * journey, and the workshop layer — into a site being built.
 *
 * @module scripts/gen-journeys-viz
 * @covers user-scenario, workshop
 *
 * Usage:
 *   bun run cat journeys:viz --instance <dir> [--site <site dir>]
 *
 * The pages go to the route of the visualiser `--instance` declares
 * `renderedBy: "journeys-viewer"`, `<site>/<locale>/<instance>/<id>/`
 * (`visualiserRoute`). A layer that declares none gets nothing and the
 * run exits 78 (not applicable), so a site build running every declared
 * writer (`visualiser-writers.ts`) reads it as declined rather than failed.
 * Without `--site` the pages go under the layer's own site directory.
 *
 * WHAT is drawn is read from the declarations (`journeys/read.ts`): every
 * `user-scenario` and `workshop` directory of every layer in the checkout,
 * so a downstream's site shows its own journeys and those of the layers it
 * mounts, each layer a sub-graph page. HOW is `journeys/render.ts`.
 *
 * Nothing is committed: like `archimate:pages --out`, the pages are a build
 * product of the site, and a re-run with the same inputs writes the same
 * bytes.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, posix, relative, resolve } from "node:path";

import { findDeclarationFile } from "../schemas/kg/instance-roots.js";
import { siteDirFor } from "../schemas/kg/cat-harness.js";
import { visualiserRoute } from "../schemas/kg/visualiser-route.js";
import { declaredVisualisers, pageParts } from "./viewer-declarations.ts";
import { exitNotApplicable } from "./lib/not-applicable.ts";
import { readArchimate } from "../archimate/schemas/archimate.ts";
import { planSlugs } from "../archimate/schemas/slugs.ts";
import { archimateDir, configPath, localDirOf, readConfig } from "../archimate/scripts/check-archimate.ts";
import { declaredPageRoot } from "../archimate/scripts/gen-archimate-pages.ts";
import { readJourneyCorpus, type JourneyCorpus } from "./journeys/read.ts";
import { renderJourneyPages, TOOL_ID, type PageFile, type SiteLinks } from "./journeys/render.ts";
import { subjectHref } from "./lib/subject-pages.ts";
import { panelFile } from "./lib/task-panel.ts";

export { TOOL_ID };

interface Decl {
  name: string;
  title?: string;
  visualisers?: { id: string; renderedBy: string }[];
  directories: { id: string; path: string }[];
}

function readDecl(root: string): Decl {
  const file = findDeclarationFile(root);
  if (file === undefined) throw new Error(`no instance declaration in ${root}`);
  return JSON.parse(readFileSync(join(root, file), "utf8")) as Decl;
}

/** The route the layer declares for this Tool, site-relative with no trailing slash; undefined when it declares none. */
export function journeysRoute(root: string): string | undefined {
  const d = readDecl(root);
  const v = (d.visualisers ?? []).find((x) => x.renderedBy === TOOL_ID);
  return v === undefined ? undefined : visualiserRoute(pageParts({ harness: d.name, visualiser: v.id })).replace(/\/$/, "");
}

/** Where the links that leave the viewer go: the processes viewer's sub-graph pages, and ArchiMate views. */
export function siteLinks(corpus: JourneyCorpus, route: string, title: string): SiteLinks {
  const processes = declaredVisualisers(corpus.checkout).find((v) => v.renderedBy === "processes-viewer");
  const views = new Map<string, Map<string, { svg: string; page: string; name: string }> | null>();
  const archimateFor = (instance: string) => {
    if (views.has(instance)) return views.get(instance) ?? undefined;
    let out: Map<string, { svg: string; page: string; name: string }> | null = null;
    const info = corpus.instances.get(instance);
    try {
      if (info && configPath(info.root) !== undefined) {
        const config = readConfig(info.root);
        const decl = readDecl(info.root);
        const graphPath = localDirOf(info.root, archimateDir(info.root, config)).replace(/\/$/, "");
        const pageRoot = declaredPageRoot(decl as never, config.directory);
        out = new Map();
        for (const cm of config.models) {
          const model = readArchimate(readFileSync(join(archimateDir(info.root, config), cm.file)));
          const slugOf = planSlugs(model);
          for (const v of model.views) {
            out.set(`${cm.id}\0${v.id}`, {
              svg: posix.join(graphPath, cm.id, "views", `${v.id}.svg`),
              page: `${posix.join(pageRoot, cm.id, "views", slugOf.get(v.id) ?? v.id)}/`,
              name: v.name,
            });
          }
        }
      }
    } catch {
      out = null; // no ArchiMate pages for this layer: the view is drawn as unresolved
    }
    views.set(instance, out);
    return out ?? undefined;
  };
  return {
    route,
    title,
    ...(processes
      ? {
          processesPage: (instance: string) => `${"../".repeat(route.split("/").length + 2)}${visualiserRoute(pageParts({ harness: processes.harness, visualiser: processes.id, subgraph: instance }))}`,
          // The ⓘ panel's sidecar the processes viewer writes for the drawing, beside its pages.
          processPanel: (_instance: string, bpmn: string) => visualiserRoute({ ...pageParts({ harness: processes.harness, visualiser: processes.id }), asset: panelFile(posix.basename(bpmn, ".bpmn")) }),
        }
      : {}),
    archimateView: (instance, model, view) => archimateFor(instance)?.get(`${model}\0${view}`),
    // A step's page as the KG site's own BPMN rendering links it
    // (`render-bpmn.ts`): its subject IRI, where a page is published for it.
    stepPage: (instance, bpmn, process, task) => {
      const root = corpus.instances.get(instance)?.root;
      return root === undefined ? undefined : subjectHref(resolve(root, bpmn), "process", `${process}/node/${task}`);
    },
  };
}

/** Every file the run writes, site-relative. */
export function journeyFiles(instanceRoot: string): { route: string; files: PageFile[]; corpus: JourneyCorpus } | undefined {
  const route = journeysRoute(instanceRoot);
  if (route === undefined) return undefined;
  const decl = readDecl(instanceRoot);
  const corpus = readJourneyCorpus(instanceRoot);
  const files = renderJourneyPages(corpus, siteLinks(corpus, route, decl.title ?? decl.name), decl.name).map((f) => ({ ...f, path: posix.join(route, f.path) }));
  return { route, files, corpus };
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

if (import.meta.main) {
  const instance = arg("instance");
  if (!instance) {
    console.error("usage: gen-journeys-viz.ts --instance <dir> [--site <site dir>]");
    process.exit(2);
  }
  const root = resolve(instance);
  const out = journeyFiles(root);
  if (out === undefined) {
    exitNotApplicable("journeys:viz", `${readDecl(root).name} declares no visualiser renderedBy ${TOOL_ID}`);
  }
  const siteArg = arg("site");
  const site = siteArg !== undefined ? resolve(siteArg) : (() => {
    const d = siteDirFor(root);
    return isAbsolute(d) ? d : join(root, d);
  })();
  // The route is this Tool's alone, so what an earlier run left there is replaced whole.
  const target = join(site, out.route);
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
  for (const f of out.files) {
    const p = join(site, f.path);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, f.content);
  }
  const pages = out.files.filter((f) => f.path.endsWith("index.html")).length;
  for (const p of out.corpus.problems) console.warn(`! ${p.instance}/${p.file}: ${p.message}`);
  console.log(
    `wrote ${pages} page(s) in ${relative(process.cwd(), target) || "."}/ — ${out.corpus.journeys.length} journey(s), ${out.corpus.workshops.length} workshop(s) across ${new Set(out.corpus.journeys.map((j) => j.instance)).size} instance(s)`,
  );
}
