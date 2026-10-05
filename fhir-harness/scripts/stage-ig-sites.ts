/**
 * Stage every IG whose instance records its source, one Jekyll site each
 * (bean `bamf`).
 *
 * An instance that ingested a published IG's navigation holds
 * `fhir-artifact-index/menu.json` (`folio-ig-menu/v1`), and that file records
 * WHERE the menu was read: `source.of` (the IG repository) and `source.ref`
 * (the commit). That pair is the declared source, so no workflow names an IG:
 * this clones `of` at `ref`, stages it with `build-ig-site` using the IG's own
 * menu, and prints one `<instance> <jekyll source> <at>` line per IG for the
 * caller to build into `<site>/<instance>/<at>/` — `ig` beside the instance's
 * own pages, or `.` when the instance's docs directory declares `igSite`
 * (bean `mftp`): the IG site is then the instance's root, and the docs
 * directory's pages (artefact pages, their assets) are copied into its
 * Jekyll source to build under the IG's own menu. One site, one menu, as the
 * Publisher builds one.
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
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
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

/**
 * The palette of the one webpage theme an instance declares, or why there is none.
 *
 * An instance that declares no webpage theme INHERITS the nearest one along
 * its `needs` chain, breadth-first — as it inherits its dependencies'
 * directories. smart-trust is the case (bean `mftp`): its WHO theme moved to
 * `smart-base/themes/` in the smart-* separation (`kg83`), because the theme
 * is the WHO template's rather than one IG's, and from then on the IG site
 * built in just-the-docs' default scheme. Two webpage themes at the same
 * distance are refused, as two in one instance are: nothing says which.
 */
export function webpagePalette(repoRoot: string, instance: string): { palette?: SitePalette; note: string } {
  const seen = new Set<string>([instance]);
  let level = [instance];
  const misses: string[] = [];
  while (level.length > 0) {
    const hits: { from: string; id: string; palette: SitePalette }[] = [];
    for (const name of level) {
      const found = instanceThemes(repoRoot, name);
      if (!found.ok) {
        misses.push(`${name}: ${found.miss.kind}`);
        continue;
      }
      const web = found.themes.filter((t) => t.kind === "webpage");
      if (web.length > 1) throw new Error(`${name} declares ${web.length} webpage themes (${web.map((t) => t.id).join(", ")}) — nothing says which dresses ${instance}'s IG site`);
      if (web.length === 1) hits.push({ from: name, id: web[0]!.id, palette: web[0]!.palette as SitePalette });
      else misses.push(`${name}: declares themes, none of kind webpage`);
    }
    if (hits.length > 1) throw new Error(`${instance} inherits ${hits.length} webpage themes at the same distance (${hits.map((h) => `${h.from}/${h.id}`).join(", ")}) — nothing says which dresses its IG site`);
    if (hits.length === 1) {
      const h = hits[0]!;
      return { palette: h.palette, note: h.from === instance ? `${instance}: webpage theme ${h.id}` : `${instance}: webpage theme ${h.id}, inherited from ${h.from}` };
    }
    level = level
      .flatMap((name) => instanceNeeds(repoRoot, name))
      .filter((n) => !seen.has(n) && (seen.add(n), true));
  }
  return { note: `${instance}: no webpage theme, its own or along its needs (${misses.join("; ")})` };
}

/**
 * `https://github.com/<o>/<r>/edit/<default branch>` for a GitHub repository,
 * the branch ASKED of the remote (`git ls-remote --symref`), never assumed:
 * an edit link on a branch that does not exist is a 404 a reader hits
 * mid-correction. Undefined for a non-GitHub source, or when the remote
 * cannot be asked — then pages carry no edit link, and the build says so.
 */
export function githubEditBase(repo: string): string | undefined {
  const m = /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(repo);
  if (!m) return undefined;
  try {
    const out = execFileSync("git", ["ls-remote", "--symref", repo, "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const branch = /^ref: refs\/heads\/(\S+)\s+HEAD$/m.exec(out)?.[1];
    if (!branch) {
      console.error(`${repo}: no default branch reported — pages carry no edit link`);
      return undefined;
    }
    return `https://github.com/${m[1]}/${m[2]}/edit/${branch}`;
  } catch {
    console.error(`${repo}: could not ask its default branch — pages carry no edit link`);
    return undefined;
  }
}

/** The instances `name` declares it `needs`, by name. */
function instanceNeeds(repoRoot: string, name: string): string[] {
  const root = instanceRootsIn(repoRoot).find((r) => (readDeclaration(r)?.name ?? basename(r)) === name);
  return root ? (readDeclaration(root)?.needs ?? []) : [];
}

/**
 * The instance's artefact index and where its artefact pages are, for the IG
 * site's `artifacts` page — or undefined when it holds either half not.
 * The pages are the instance's `docs/artifact/`, published one level above
 * the IG site (`/<instance>/artifact/` beside `/<instance>/ig/`), so a link
 * from the IG site is `../artifact/`. Read off the disk, not assumed: an
 * instance with an index and no artefact pages gets no `artifacts` page.
 */
export function artifactsFor(root: string, pagesHref = "../artifact/"): StageOptions["artifacts"] {
  const index = join(root, "fhir-artifact-index", "index.json");
  // declared-path-literal: the staged IG instance's own docs/artifact/ under `root`, not folio-assistant's docs/
  if (!existsSync(index) || !existsSync(join(root, "docs", "artifact"))) return undefined;
  const ix = JSON.parse(readFileSync(index, "utf-8")) as { artifacts: IndexedArtifact[] };
  return { list: ix.artifacts, pagesHref };
}

/**
 * The instance's docs directory when it declares `igSite` (bean `mftp`):
 * built INTO the IG's own site at `/<instance>/`. Undefined otherwise — the
 * IG site then sits at `/<instance>/ig/` beside it. Read off the declaration,
 * never inferred from the menu: smart-base holds a menu too, and its root is
 * a harness landing page.
 */
export function igSiteDocs(root: string): string | undefined {
  const d = readDeclaration(root)?.directories?.find((x) => x.igSite === true && x.graphKinds?.includes("docs"));
  return d ? join(root, d.path) : undefined;
}

/**
 * Copy an `igSite` docs directory into a staged IG site's Jekyll source,
 * refusing to overwrite: a file the IG's own build already wrote at the same
 * path is two answers for one URL, and the generator is supposed to have
 * dropped every page the IG site writes itself. The directory's README is
 * repository documentation, not a page.
 *
 * ONE exception, and it carries no body: a docs page that is front matter
 * ONLY declares something ABOUT the page the IG build generated there — the
 * artefact index's viewer declaration on `artifacts.md` (`gen-ig-pages`) —
 * so its keys are laid onto that page's front matter, the page's own keys
 * winning. A front-matter-only page with nothing to land on is a collision
 * in reverse, and reported the same way.
 */
/** A file that is a front-matter block and nothing else (whitespace aside). */
const FRONT_MATTER_ONLY = /^---\n([\s\S]*?)\n---\s*$/;

export function copyDocsInto(docs: string, site: string): { copied: number; merged: string[]; collisions: string[] } {
  let copied = 0;
  const merged: string[] = [];
  const collisions: string[] = [];
  const walk = (rel: string): void => {
    for (const name of readdirSync(join(docs, rel)).sort()) {
      const r = rel ? join(rel, name) : name;
      if (!rel && name === "README.md") continue;
      if (statSync(join(docs, r)).isDirectory()) {
        walk(r);
        continue;
      }
      const fmOnly = FRONT_MATTER_ONLY.exec(readFileSync(join(docs, r), "utf-8"));
      if (fmOnly) {
        const target = join(site, r);
        const page = existsSync(target) ? readFileSync(target, "utf-8") : undefined;
        if (page === undefined || !page.startsWith("---\n")) {
          collisions.push(`${r} (front matter only, and no generated page to lay it on)`);
          continue;
        }
        const end = page.indexOf("\n---", 3);
        const own = new Set([...page.slice(4, end).matchAll(/^([A-Za-z_][\w-]*):/gm)].map((m) => m[1]));
        // Each top-level key with its indented continuation lines, skipping the page's own.
        const blocks = fmOnly[1]!.split(/\n(?=[A-Za-z_])/).filter((b) => !own.has(/^([A-Za-z_][\w-]*):/.exec(b)?.[1] ?? ""));
        writeFileSync(target, `${page.slice(0, end)}\n${blocks.join("\n")}${page.slice(end)}`);
        merged.push(r);
        continue;
      }
      if (existsSync(join(site, r))) {
        collisions.push(r);
        continue;
      }
      mkdirSync(join(site, rel), { recursive: true });
      cpSync(join(docs, r), join(site, r));
      copied++;
    }
  };
  walk("");
  return { copied, merged, collisions };
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
    const docs = igSiteDocs(ig.root);
    const editBase = githubEditBase(ig.repo);
    const r = stageIgSite(src, site, {
      palette: theme.palette,
      baseurl: `${base.replace(/\/$/, "")}/${ig.instance}${docs ? "" : "/ig"}`,
      plantumlJar: opt("--plantuml-jar"),
      menu: JSON.parse(readFileSync(ig.menuPath, "utf-8")) as IgMenu,
      remoteTheme: opt("--remote-theme"),
      artifacts: artifactsFor(ig.root, docs ? "artifact/" : "../artifact/"),
      releases: releasesFor(ig.root),
      ...(editBase ? { editBase } : {}),
      // The IG's post-processing output, where its source holds only a marker.
      fills: [igApiHubFill(ig.root, docs ? "" : "../")].filter((x) => x !== undefined),
    });
    console.error(`${ig.instance} (${ig.repo}@${ig.ref.slice(0, 7)}):\n${describeStage(r)}`);
    if (r.siteData.refused.length) process.exit(1);
    if (docs) {
      const c = copyDocsInto(docs, site);
      console.error(`${ig.instance}: igSite — ${c.copied} file(s) from ${relative(resolve("."), docs)} built into the IG site at /${ig.instance}/${c.merged.length ? `; front matter laid onto ${c.merged.join(", ")}` : ""}`);
      if (c.collisions.length) {
        console.error(`${ig.instance}: ${c.collisions.length} file(s) the IG site already writes — refusing two answers for one URL:\n  ${c.collisions.slice(0, 20).join("\n  ")}`);
        process.exit(1);
      }
    }
    // stdout carries only the build list, one IG per line.
    console.log(`${ig.instance} ${site} ${docs ? "." : "ig"}`);
  }
}
