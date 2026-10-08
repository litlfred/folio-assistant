#!/usr/bin/env bun
/**
 * Tool releases and profiles — validate every declared one, and the graph
 * they form together.
 *
 * @module scripts/tool-releases
 * @covers tool-release
 *
 * Step 1 of `docs/proposals/tool-releases-2026-10-07.md` (issue #2481, bean
 * `3sbm`). The shapes are `schemas/tool-release.ts` and
 * `schemas/tool-profile.ts`; this is their gate. It resolves nothing and
 * downloads nothing — the resolver is step 2.
 *
 *   bun run cat-harness/scripts/tool-releases.ts --check
 *
 * Exit 0 clean · 1 a finding · 2 nothing to check (no release anywhere is
 * `could not determine`, never a pass).
 *
 * ## What `--check` refuses
 *
 * 1. A file tagged `folio-tool-release/v1` or `folio-tool-profile/v1` that
 *    does not parse, and a `.json` in the directory carrying neither tag — the
 *    directory is a place to look and the file must say what it is.
 * 2. A licence that is not a valid expression over the PINNED SPDX License
 *    List, checked with `check:source-licence`'s own parser. A list that
 *    cannot be read is could-not-determine and fails, never a pass.
 * 3. A file whose stem equals its `name` — `findDeclarationFile` would read
 *    it as an instance declaration (`directory-conventions`, §"Every other
 *    marker").
 * 4. Everything {@link toolReleaseGraphProblems} finds across the whole set:
 *    a duplicate release, a dangling runtime or profile ref, a runtime with no
 *    `entry.home` to inject, and a profile that names a runtime directly.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";

import { loadSpdxLicenseList } from "../schemas/spdx-license-expression";
import { TOOL_PROFILE_SCHEMA_TAG, ToolProfileSchema, toolReleaseGraphProblems, type ToolProfile } from "../schemas/tool-profile";
import { TOOL_RELEASE_SCHEMA_TAG, ToolReleaseSchema, toolReleaseLicenceProblem, toolReleaseRef, type ToolRelease } from "../schemas/tool-release";

const ROOT = resolve(import.meta.dir, "..");

/**
 * The tool-release directories an instance can see, in overlay order —
 * resolved from declarations, including every dependency, the way
 * `codeListDirs` does. T1: every layer inherits cat-harness's.
 */
export async function toolReleaseDirs(instanceRoot: string): Promise<string[]> {
  const { orderedDependencies } = await import("../schemas/harness-config.js");
  const { ownDirectories } = await import("../schemas/cat-harness.js");
  const dirs: string[] = [];
  const add = (name: string, root: string, own: boolean) => {
    for (const d of ownDirectories({ name, root, own })) {
      if (d.graphTypologies.includes("tool-release")) dirs.push(d.absPath);
    }
  };
  for (const dep of orderedDependencies(instanceRoot)) add(dep.dependency.name, dep.rootPath, false);
  add("(root)", resolve(instanceRoot), true);
  return [...new Set(dirs)];
}

export interface LoadedToolReleases {
  releases: { file: string; release: ToolRelease }[];
  profiles: { file: string; profile: ToolProfile }[];
  problems: string[];
}

/** Read every `.json` in the directories, routing each by its `$schema` tag. Never throws. */
export function loadToolReleases(dirs: readonly string[], base: string): LoadedToolReleases {
  const out: LoadedToolReleases = { releases: [], profiles: [], problems: [] };
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
      const p = join(dir, f);
      const where = relative(base, p);
      let raw: unknown;
      try {
        raw = JSON.parse(readFileSync(p, "utf-8"));
      } catch (e) {
        out.problems.push(`${where}: not JSON — ${(e as Error).message}`);
        continue;
      }
      const tag = (raw as { $schema?: unknown }).$schema;
      const stem = basename(f, ".json");
      if (tag === TOOL_RELEASE_SCHEMA_TAG) {
        const r = ToolReleaseSchema.safeParse(raw);
        if (!r.success) out.problems.push(`${where}: ${r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
        else out.releases.push({ file: where, release: r.data });
      } else if (tag === TOOL_PROFILE_SCHEMA_TAG) {
        const r = ToolProfileSchema.safeParse(raw);
        if (!r.success) out.problems.push(`${where}: ${r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
        else out.profiles.push({ file: where, profile: r.data });
      } else {
        out.problems.push(`${where}: carries neither \`${TOOL_RELEASE_SCHEMA_TAG}\` nor \`${TOOL_PROFILE_SCHEMA_TAG}\` — a file here must say what it is`);
        continue;
      }
      const name = (raw as { name?: unknown }).name;
      if (typeof name === "string" && name === stem) {
        out.problems.push(`${where}: its stem equals its \`name\`, so \`findDeclarationFile\` would take it for an instance declaration — rename the file`);
      }
    }
  }
  return out;
}

async function run(argv: string[]): Promise<number> {
  const instance = argv.includes("--instance") ? resolve(argv[argv.indexOf("--instance") + 1]!) : ROOT;
  const base = resolve(instance, "..");
  const dirs = await toolReleaseDirs(instance);
  const loaded = loadToolReleases(dirs, base);
  const problems = [...loaded.problems];

  console.log(
    `${loaded.releases.length} tool release(s) and ${loaded.profiles.length} profile(s) from ${dirs.length} declared director${dirs.length === 1 ? "y" : "ies"}:`,
  );
  for (const { release: r } of loaded.releases) {
    const plat = r.platform ? ` [${r.platform.os}-${r.platform.arch}${r.platform.distribution ? `-${r.platform.distribution}` : ""}]` : "";
    console.log(`  ${(toolReleaseRef(r) + plat).padEnd(50)} ${r.role.padEnd(8)} ${r.kind.padEnd(8)} ${r.digest.digest.slice(0, 12)}`);
  }
  for (const { profile: p } of loaded.profiles) console.log(`  profile ${p.name.padEnd(42)} ${Object.values(p.tools).join(", ")}`);

  if (loaded.releases.length === 0 && problems.length === 0) {
    console.error("\nNo tool release found — `could not determine`, not a pass.");
    return 2;
  }

  const list = loadSpdxLicenseList(resolve(instance, ".."));
  if (typeof list === "string") problems.push(`licences could not be checked: ${list}`);
  else {
    for (const { file, release } of loaded.releases) {
      const problem = toolReleaseLicenceProblem(release, list);
      if (problem) problems.push(`${file}: licence \`${release.licence}\` — ${problem}`);
    }
  }
  problems.push(...toolReleaseGraphProblems(loaded.releases.map((r) => r.release), loaded.profiles.map((p) => p.profile)));

  if (problems.length > 0) {
    console.error(`\n✗ ${problems.length} finding(s):`);
    for (const p of problems) console.error(`    ${p}`);
    return 1;
  }
  console.log("\n✓ every release and profile parses, every licence is on the pinned SPDX list, and every ref resolves");
  return 0;
}

if (import.meta.main) process.exit(await run(process.argv.slice(2)));
