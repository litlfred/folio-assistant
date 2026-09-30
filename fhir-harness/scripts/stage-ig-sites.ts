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
 * Usage:
 *   bun run fhir-harness/scripts/stage-ig-sites.ts --work <dir> --baseurl <site baseurl> \
 *     [--plantuml-jar <jar>] [--remote-theme <owner/repo@ref>]
 *
 * @covers none — a build step: it stages sites and judges no declared graph
 *
 * @module fhir-harness/scripts/stage-ig-sites
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { instanceRootsIn } from "../../cat-harness/schemas/cat-harness.js";
import { describeStage, stageIgSite, type IgMenu } from "./build-ig-site";

interface MenuFile extends IgMenu {
  source?: { kind?: string; of?: string; ref?: string };
}

export interface IgToBuild {
  instance: string;
  menuPath: string;
  repo: string;
  ref: string;
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
    build.push({ instance, menuPath, repo: m.source.of, ref: m.source.ref });
  }
  return { build, skipped };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opt = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  const work = opt("--work");
  const base = opt("--baseurl");
  if (!work || base === undefined) {
    console.error("usage: stage-ig-sites.ts --work <dir> --baseurl <site baseurl> [--plantuml-jar <jar>] [--remote-theme <owner/repo@ref>]");
    process.exit(2);
  }
  const { build, skipped } = igsToBuild(resolve("."));
  for (const s of skipped) console.error(`skipped ${s}`);
  for (const ig of build) {
    const src = resolve(work, ig.instance, "src");
    const site = resolve(work, ig.instance, "site");
    mkdirSync(src, { recursive: true });
    // A pinned commit, fetched alone: the menu was read from exactly this tree.
    const git = (...a: string[]) => execFileSync("git", ["-C", src, ...a], { stdio: ["ignore", "ignore", "inherit"] });
    git("init", "-q");
    git("fetch", "-q", "--depth", "1", ig.repo, ig.ref);
    git("checkout", "-q", "FETCH_HEAD");
    const r = stageIgSite(src, site, {
      baseurl: `${base.replace(/\/$/, "")}/${ig.instance}/ig`,
      plantumlJar: opt("--plantuml-jar"),
      menu: JSON.parse(readFileSync(ig.menuPath, "utf-8")) as IgMenu,
      remoteTheme: opt("--remote-theme"),
    });
    console.error(`${ig.instance} (${ig.repo}@${ig.ref.slice(0, 7)}):\n${describeStage(r)}`);
    if (r.siteData.refused.length) process.exit(1);
    // stdout carries only the build list, one IG per line.
    console.log(`${ig.instance} ${site}`);
  }
}
