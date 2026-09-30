/**
 * Every theme a declaration references is installed (#1168 B8).
 *
 * Theme references became `ThemeRef` objects `{instance?, themeId}` on
 * 2026-09-30 (owner: "migrate to ThemeRef"). The schema checks the shape;
 * this checks the reference RESOLVES. Before it, an unknown theme fell back
 * silently to the default at render time — a declaration that reads as a
 * choice and renders as none.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Glob } from "bun";

import { declarationPathIn, instanceRootsIn } from "../../schemas/cat-harness.js";
import { themeById } from "../../schemas/themes.js";

const REPO = resolve(import.meta.dir, "..", "..", "..");

type Ref = { themeId: string; instance?: string };

function refs(): { where: string; ref: Ref }[] {
  const out: { where: string; ref: Ref }[] = [];
  for (const root of instanceRootsIn(REPO)) {
    const p = declarationPathIn(root);
    if (!p) continue;
    const d = JSON.parse(readFileSync(p, "utf-8")) as {
      name?: string;
      directories?: { id: string; theme?: Ref; tile?: { theme?: Ref } }[];
      stickies?: { id: string; theme?: Ref }[];
    };
    const at = (s: string) => `${d.name ?? root}: ${s}`;
    for (const e of d.directories ?? []) {
      if (e.theme) out.push({ where: at(`directory ${e.id}`), ref: e.theme });
      if (e.tile?.theme) out.push({ where: at(`tile ${e.id}`), ref: e.tile.theme });
    }
    for (const s of d.stickies ?? []) if (s.theme) out.push({ where: at(`sticky ${s.id}`), ref: s.theme });
  }
  // Sticky contributions declared as their own files.
  for (const rel of new Glob("*.json").scanSync({ cwd: resolve(REPO, "cat-harness", "folio") })) {
    const c = JSON.parse(readFileSync(resolve(REPO, "cat-harness", "folio", rel), "utf-8")) as { theme?: Ref };
    if (c.theme) out.push({ where: `cat-harness/folio/${rel}`, ref: c.theme });
  }
  return out;
}

describe("declared theme references resolve", () => {
  const all = refs();

  test("the corpus is non-empty, so the assertion below is not vacuous", () => {
    expect(all.length).toBeGreaterThan(0);
  });

  test("every reference is a ThemeRef naming an installed theme", () => {
    const bad = all
      .filter(({ ref }) => typeof ref !== "object" || themeById(ref.themeId) === undefined)
      .map(({ where, ref }) => `${where} → ${JSON.stringify(ref)}`);
    expect(bad).toEqual([]);
  });
});
