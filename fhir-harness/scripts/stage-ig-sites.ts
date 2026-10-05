/**
 * Stage every IG whose instance records its source, one Jekyll site each
 * (bean `bamf`).
 *
 * An instance that ingested a published IG's navigation holds
 * `fhir-artifact-index/menu.json` (`folio-ig-menu/v1`), and that file records
 * WHERE the menu was read: `source.of` (the IG repository) and `source.ref`
 * (the commit). That pair is the declared source, so no workflow names an IG:
 * this clones `of` at `ref`, stages it with `build-ig-site` using the IG's own
 * menu, and prints one `<instance> <jekyll source>` line per IG for the
 * caller to build into `<site>/<instance>/ig/`.
 *
 * An instance with no menu, or a menu with no sushi-config source, is skipped
 * and reported: nothing to build is not the same as a build that failed.
 *
 * The site wears the palette of the ONE `webpage` theme the instance declares
 * (bean `u3cd`), resolved through `instanceThemes` — the same answer every
 * other generator reads, so the palette has one home. None declared builds
 * with just-the-docs' default scheme and says so; two declared is refused,
 * because nothing says which one dresses the IG.
 *
 * Usage:
 *   bun run fhir-harness/scripts/stage-ig-sites.ts --work <dir> --baseurl <site baseurl> \
 *     [--plantuml-jar <jar>] [--remote-theme <owner/repo@ref>] [--changed-files <file>]
 *
 * `--changed-files` (one path per line) builds only the IGs the staging cone
 * reaches (bean `4j86`); each decision is printed with its reason.
 *
 * @covers none — a build step: it stages sites and judges no declared graph
 *
 * @module fhir-harness/scripts/stage-ig-sites
 */

import { igApiHubFill } from "./ig-api-views.ts";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { basename, join, relative, resolve, sep } from "node:path";
import { instanceRootsIn, readDeclaration } from "../../cat-harness/schemas/cat-harness.js";
import { instanceThemes } from "../../cat-harness/schemas/theme-by-ref.js";
import { describeStage, stageIgSite, type IgMenu, type IndexedArtifact, type SitePalette, type StageOptions } from "./build-ig-site";
import { IgReleasesSchema, type IgReleases } from "../schemas/ig-releases.ts";
import { readChangedFiles, siteFilter } from "../../cat-harness/scripts/staging-cone.ts";

interface MenuFile extends IgMenu {
  source?: { kind?: string; of?: string; ref?: string };
}

export interface IgToBuild {
  instance: string;
  /** The instance's root directory. */
  root: string;
  menuPath: string;
  repo: string;
  ref: string;
  /** The instance's declared name — what `instanceThemes` keys on. */
  declaredAs: string;
}

/** The palette of the one webpage theme an instance declares, or why there is none. */
export function webpagePalette(repoRoot: string, instance: string): { palette?: SitePalette; note: string } {
  const found = instanceThemes(repoRoot, instance);
  if (!found.ok) return { note: `${instance}: no webpage theme (${found.miss.kind})` };
  const web = found.themes.filter((t) => t.kind === "webpage");
  if (web.length > 1) throw new Error(`${instance} declares ${web.length} webpage themes (${web.map((t) => t.id).join(", ")}) — nothing says which dresses its IG site`);
  if (web.length === 0) return { note: `${instance}: declares themes, none of kind webpage` };
  return { palette: web[0].palette as SitePalette, note: `${instance}: webpage theme ${web[0].id}` };
}

/**
 * The instance's artefact index and where its artefact pages are, for the IG
 * site's `artifacts` page — or undefined when it holds either half not.
 * The pages are the instance's `docs/artifact/`, published one level above
 * the IG site (`/<instance>/artifact/` beside `/<instance>/ig/`), so a link
 * from the IG site is `../artifact/`. Read off the disk, not assumed: an
 * instance with an index and no artefact pages gets no `artifacts` page.
 */
export function artifactsFor(root: string): StageOptions["artifacts"] {
  const index = join(root, "fhir-artifact-index", "index.json");
  // declared-path-literal: the staged IG instance's own docs/artifact/ under `root`, not folio-assistant's docs/
  if (!existsSync(index) || !existsSync(join(root, "docs", "artifact"))) return undefined;
  const ix = JSON.parse(readFileSync(index, "utf-8")) as { artifacts: IndexedArtifact[] };
  return { list: ix.artifacts, pagesHref: "../artifact/" };
}

/**
 * The instance's recorded GitHub releases (`fhir-artifact-index/releases.json`),
 * validated, for the IG site's `releases` page; undefined when none was
 * recorded. A file that does not validate throws: a wrong download link is
 * worse than none.
 */
export function releasesFor(root: string): IgReleases | undefined {
  const at = join(root, "fhir-artifact-index", "releases.json");
  return existsSync(at) ? IgReleasesSchema.parse(JSON.parse(readFileSync(at, "utf-8"))) : undefined;
}

/** Every instance whose IG menu records a cloneable sushi-config source. */
export function igsToBuild(repoRoot: string): { build: IgToBuild[]; skipped: string[] } {
  const build: IgToBuild[] = [];
  const skipped: string[] = [];
  for (const root of instanceRootsIn(repoRoot)) {
    const menuPath = join(root, "fhir-artifact-index", "menu.json");
    if (!existsSync(menuPath)) continue;
    const m = JSON.parse(readFileSync(menuPath, "utf-8")) as MenuFile;
    const instance = basename(root);
    if (m.source?.kind !== "sushi-config" || !m.source.of || !m.source.ref) {
      skipped.push(`${instance}: menu.json records no sushi-config source repository and commit`);
      continue;
    }
    build.push({ instance, root, menuPath, repo: m.source.of, ref: m.source.ref, declaredAs: readDeclaration(root)?.name ?? instance });
  }
  return { build, skipped };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opt = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  const work = opt("--work");
  const base = opt("--baseurl");
  if (!work || base === undefined) {
    console.error("usage: stage-ig-sites.ts --work <dir> --baseurl <site baseurl> [--plantuml-jar <jar>] [--remote-theme <owner/repo@ref>] [--changed-files <file>]");
    process.exit(2);
  }
  const { build, skipped } = igsToBuild(resolve("."));
  for (const s of skipped) console.error(`skipped ${s}`);
  // The staging cone (bean `4j86`): with `--changed-files`, an IG no changed
  // file reaches is not built. Without it, every IG is, as before.
  const inCone = siteFilter(resolve("."), readChangedFiles(opt("--changed-files")), ["fhir-harness/scripts/stage-ig-sites.ts"]);
  for (const ig of build) {
    const d = inCone(relative(resolve("."), ig.root).split(sep).join("/"));
    console.error(`${ig.instance}: ${d.carry ? "built" : "not built"} — ${d.why}`);
    if (!d.carry) continue;
    const src = resolve(work, ig.instance, "src");
    const site = resolve(work, ig.instance, "site");
    mkdirSync(src, { recursive: true });
    // A pinned commit, fetched alone: the menu was read from exactly this tree.
    const git = (...a: string[]) => execFileSync("git", ["-C", src, ...a], { stdio: ["ignore", "ignore", "inherit"] });
    git("init", "-q");
    git("fetch", "-q", "--depth", "1", ig.repo, ig.ref);
    git("checkout", "-q", "FETCH_HEAD");
    const theme = webpagePalette(resolve("."), ig.declaredAs);
    console.error(theme.note);
    const r = stageIgSite(src, site, {
      palette: theme.palette,
      baseurl: `${base.replace(/\/$/, "")}/${ig.instance}/ig`,
      plantumlJar: opt("--plantuml-jar"),
      menu: JSON.parse(readFileSync(ig.menuPath, "utf-8")) as IgMenu,
      remoteTheme: opt("--remote-theme"),
      artifacts: artifactsFor(ig.root),
      releases: releasesFor(ig.root),
      // The IG's post-processing output, where its source holds only a marker.
      fills: [igApiHubFill(ig.root)].filter((x) => x !== undefined),
    });
    console.error(`${ig.instance} (${ig.repo}@${ig.ref.slice(0, 7)}):\n${describeStage(r)}`);
    if (r.siteData.refused.length) process.exit(1);
    // stdout carries only the build list, one IG per line.
    console.log(`${ig.instance} ${site}`);
  }
}
