#!/usr/bin/env bun
/**
 * A FILED REQUIREMENT IS A VALID REQUIREMENT, AND NO TWO DOCUMENTS SHARE A NAME.
 *
 * Owner, 2026-09-23 (issue #1164): when a harness feature ships, its proposal
 * is moved from `docs/proposals/` to `docs/requirements/` and filed against
 * the bootstrap `Requirement` schema — and, asked what happens on the move,
 * *"make sure no name collision, need to organize things when filing"*.
 *
 * Three things are checked, each because it cannot be seen by reading one
 * file:
 *
 * 1. **Every requirement page's front matter parses as a `Requirement`.** The
 *    page's own Jekyll keys (`layout`, `nav_order`, `summary`, …) ride beside
 *    it; only the schema's fields are checked, and the schema refuses what it
 *    must (a non-functional statement with a `capability`, a duplicate key, a
 *    superseded requirement that names no successor).
 * 2. **The id is the file name.** `req:<slug>` in `<slug>.md` — so a test
 *    run's `req:<slug>#<key>` resolves by path, with no index to keep.
 * 3. **No slug is in both sub-graphs.** A proposal filed onto an existing
 *    requirement would overwrite it; a requirement whose proposal was copied
 *    rather than moved leaves two documents free to disagree. Either way it
 *    is refused here, before the move, not discovered after.
 *
 * The directories are READ FROM THE DECLARATION — whatever the instance
 * declares with the `requirements` and `proposals` graph kinds, at its root or
 * from within `docs/` — never hardcoded. A declared kind with no directory on disk is a failure: a clean
 * run over nothing is the defect this repository keeps re-finding.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { parse as parseYaml } from "yaml";

import { RequirementFields, RequirementSchema } from "../schemas/requirement.ts";
import { nestedDirectories, readDeclaration } from "../schemas/cat-harness.ts";

const REPO = join(import.meta.dir, "..", "..");
const INSTANCE = join(REPO, "cat-harness");

/** The front matter of a markdown file, or null when it has none. */
export function frontMatter(text: string): Record<string, unknown> | null {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) return null;
  const v = parseYaml(m[1]);
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

/** Only the schema's own fields: a page's layout keys are not the requirement's business. */
export function requirementPart(fm: Record<string, unknown>): Record<string, unknown> {
  const keys = Object.keys(RequirementFields.shape);
  return Object.fromEntries(Object.entries(fm).filter(([k]) => keys.includes(k)));
}

export interface Problem { file: string; message: string }

/** Check one requirement page. */
export function checkRequirementPage(file: string, text: string): Problem[] {
  const fm = frontMatter(text);
  if (!fm) return [{ file, message: "has no front matter, so it carries no requirement" }];
  const out: Problem[] = [];
  const r = RequirementSchema.safeParse(requirementPart(fm));
  if (!r.success) {
    for (const i of r.error.issues) out.push({ file, message: `${i.path.join(".") || "(root)"}: ${i.message}` });
    return out;
  }
  const slug = basename(file, ".md");
  if (r.data.id !== `req:${slug}`) {
    out.push({ file, message: `id is \`${r.data.id}\` but the file is \`${slug}.md\` — the id is the file name, \`req:${slug}\`` });
  }
  return out;
}

/** Slugs present in both sub-graphs. */
export function collisions(proposals: string[], requirements: string[]): string[] {
  const req = new Set(requirements);
  return proposals.filter((p) => req.has(p)).sort();
}

function slugsIn(dir: string): string[] {
  return readdirSync(dir).filter((n) => n.endsWith(".md") && n !== "index.md").map((n) => basename(n, ".md"));
}

/**
 * The directory the instance declares for `kind` — at its root, or FROM WITHIN
 * a declared directory (`docs/docs.json`, issue #1164). Throws when it
 * declares none or several, or the directory is missing.
 */
export function declaredDirFor(instanceRoot: string, kind: string): string {
  const decl = readDeclaration(instanceRoot);
  if (!decl) throw new Error(`no declaration could be read at ${instanceRoot}`);
  const all = [...(decl.directories ?? []), ...nestedDirectories(instanceRoot, decl)];
  const hits = all.filter((e) => (e.graphKinds ?? []).includes(kind));
  if (hits.length !== 1) {
    throw new Error(`the instance declares ${hits.length} directories of kind \`${kind}\`; exactly one is expected`);
  }
  const dir = join(instanceRoot, hits[0].path);
  if (!existsSync(dir)) throw new Error(`\`${kind}\` is declared at ${hits[0].path}, which does not exist`);
  return dir;
}

if (import.meta.main) {
  let reqDir: string, propDir: string;
  try {
    reqDir = declaredDirFor(INSTANCE, "requirements");
    propDir = declaredDirFor(INSTANCE, "proposals");
  } catch (e) {
    console.error(`  ✗ ${(e as Error).message}`);
    process.exit(1);
  }
  const reqSlugs = slugsIn(reqDir);
  const propSlugs = slugsIn(propDir);
  console.log(`Requirements — ${reqSlugs.length} filed in ${relative(REPO, reqDir)}/, ` +
    `${propSlugs.length} proposal(s) in ${relative(REPO, propDir)}/`);
  const problems: Problem[] = [];
  for (const slug of reqSlugs) {
    const file = join(reqDir, `${slug}.md`);
    problems.push(...checkRequirementPage(relative(REPO, file), readFileSync(file, "utf8")));
  }
  for (const c of collisions(propSlugs, reqSlugs)) {
    problems.push({ file: `${c}.md`, message: "is in BOTH proposals and requirements — a proposal is MOVED when filed, never copied" });
  }
  if (problems.length === 0) {
    // A DETERMINED empty is still an answer, and said as one.
    console.log(reqSlugs.length === 0
      ? "  ✓ none filed yet — the directory was read and holds only its index"
      : "  ✓ every filed requirement is valid, and no name is used twice");
    process.exit(0);
  }
  for (const p of problems) console.error(`  ✗ ${p.file}: ${p.message}`);
  process.exit(1);
}
