/**
 * A theme by REFERENCE — `{instance?, themeId}` — resolved against the
 * instance that owns it, not only against the platform's own table.
 *
 * @module cat-harness/schemas/theme-by-ref
 *
 * Bean `v8n5`. #1168 B8 (owner, 2026-09-30: *"migrate to ThemeRef"*) gave
 * every theme reference an `instance`, so *"a cross-instance theme now says
 * whose theme it is"* — and every consumer then went on reading `themeId`
 * alone and looking it up in {@link THEMES}, the platform's table. A who-iris
 * card citing `{instance: "who-iris", themeId: "iris-web"}` therefore resolved
 * to nothing, and the harness surfaces rendered on the avatar's hue instead of
 * the theme who-iris measured off its own sources.
 *
 * ## The platform finds an instance's themes; it never holds them
 *
 * `who-iris/themes/themes.ts` says why its palette is not in
 * `cat-harness/schemas/`: *"a palette read off a WHO style guide is subject
 * matter."* So nothing here names who-iris or copies a colour. The owner is
 * found by its declared `name`, its themes by the directory it declares with
 * graph kind `themes`, and the module there by one convention: a `themes.ts`
 * exporting `INSTANCE_THEMES`, already resolved. That is the same shape as
 * the tool groups — the harness loads a layer by what its declaration says,
 * rather than importing it, which is what keeps the harness able to build
 * alone.
 *
 * ## Absent is not the platform's
 *
 * A reference with no `instance` means the CITING instance's own
 * ({@link ThemeRefSchema}). The platform table is the answer only when the
 * owner is the platform itself or nobody is named — which is every reference
 * that existed before B8, so nothing that resolved yesterday stops resolving.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { instanceDirectoriesForGraph, instanceRootsIn, readDeclaration } from "./cat-harness.js";
import type { ResolvedTheme, ThemeRef } from "./theme.js";
import { themeById } from "./themes.js";

/** The graph kind an instance's own themes are declared under. */
export const THEMES_GRAPH_KIND = "themes";
/** The module a `themes` directory holds, and the export it must carry. */
export const INSTANCE_THEMES_MODULE = "themes.ts";
export const INSTANCE_THEMES_EXPORT = "INSTANCE_THEMES";

/** Why a reference did not resolve — each a different repair. */
export type ThemeRefMiss =
  | { kind: "no-such-instance"; instance: string }
  | { kind: "no-themes-directory"; instance: string }
  | { kind: "no-themes-module"; instance: string; path: string }
  | { kind: "no-such-theme"; instance: string; themeId: string };

export type ThemeRefResult = { ok: true; theme: ResolvedTheme; owner: string | undefined } | { ok: false; miss: ThemeRefMiss };

/** The themes an instance declares, or why it declares none that can be read. */
function instanceThemes(repoRoot: string, instance: string): { ok: true; themes: readonly ResolvedTheme[] } | { ok: false; miss: ThemeRefMiss } {
  const root = instanceRootsIn(repoRoot).find((r) => readDeclaration(r)?.name === instance);
  if (root === undefined) return { ok: false, miss: { kind: "no-such-instance", instance } };
  const dirs = instanceDirectoriesForGraph(root, THEMES_GRAPH_KIND);
  if (dirs.length === 0) return { ok: false, miss: { kind: "no-themes-directory", instance } };
  const themes: ResolvedTheme[] = [];
  let read = 0;
  for (const dir of dirs) {
    const path = join(dir, INSTANCE_THEMES_MODULE);
    if (!existsSync(path)) continue;
    // Synchronous on purpose: every consumer is a generator that resolves
    // themes inline while it builds a page, and Bun's `require` loads a `.ts`
    // module synchronously.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(path) as Record<string, unknown>;
    const list = mod[INSTANCE_THEMES_EXPORT];
    if (Array.isArray(list)) {
      themes.push(...(list as ResolvedTheme[]));
      read++;
    }
  }
  if (read === 0) {
    return { ok: false, miss: { kind: "no-themes-module", instance, path: join(dirs[0]!, INSTANCE_THEMES_MODULE) } };
  }
  return { ok: true, themes };
}

/**
 * Resolve a theme reference.
 *
 * @param ref            the reference as declared
 * @param repoRoot       the repository whose instances may own it
 * @param citingInstance the instance that wrote the reference — the owner when
 *                       `ref.instance` is absent
 * @param platform       the platform instance's name; its themes are {@link THEMES}
 */
export function themeByRef(ref: ThemeRef, repoRoot: string, citingInstance?: string, platform = "cat-harness"): ThemeRefResult {
  const owner = ref.instance ?? citingInstance;
  if (owner === undefined || owner === platform) {
    const theme = themeById(ref.themeId);
    return theme ? { ok: true, theme, owner } : { ok: false, miss: { kind: "no-such-theme", instance: owner ?? platform, themeId: ref.themeId } };
  }
  const found = instanceThemes(repoRoot, owner);
  if (!found.ok) {
    // An instance that owns no themes of its own may still cite the
    // platform's by bare id — that is how every reference read before B8.
    if (ref.instance === undefined) {
      const theme = themeById(ref.themeId);
      if (theme) return { ok: true, theme, owner: platform };
    }
    return found;
  }
  const own = found.themes.find((t) => t.id === ref.themeId);
  if (own) return { ok: true, theme: own, owner };
  if (ref.instance === undefined) {
    const theme = themeById(ref.themeId);
    if (theme) return { ok: true, theme, owner: platform };
  }
  return { ok: false, miss: { kind: "no-such-theme", instance: owner, themeId: ref.themeId } };
}

/** A sentence for a finding. */
export function explainThemeRefMiss(m: ThemeRefMiss): string {
  switch (m.kind) {
    case "no-such-instance":
      return `no instance named "${m.instance}" is declared in this repository`;
    case "no-themes-directory":
      return `"${m.instance}" declares no directory with graph kind "${THEMES_GRAPH_KIND}"`;
    case "no-themes-module":
      return `"${m.instance}"'s themes directory has no ${INSTANCE_THEMES_MODULE} exporting ${INSTANCE_THEMES_EXPORT} (looked at ${m.path})`;
    case "no-such-theme":
      return `"${m.instance}" declares no theme "${m.themeId}"`;
  }
}
