/**
 * The graph-kind table and the graph-kind registry must name the same kinds —
 * bean `5o3a`.
 *
 * **No check crossed from prose to code, and three clean merges went through the
 * gap.** #266 collapsed the kinds `workplan` and `process-state` into a single
 * `beans`, changed the registry, and left every *description* of it untouched:
 * the table in `directory-conventions.md` still listed both retired kinds at a
 * path that no longer existed, the registry's own doc comment opened "Five, and
 * deliberately none of them renderable" over a map of four, and `AGENTS.md`
 * described an intermediate state of #266's own branch. `AGENTS.md` designates
 * that skill the source of truth, so an agent following it would have written
 * `graph: "workplan"` and been refused by the registry it was told to trust.
 *
 * #269 fixed the instance. This is the guard, and nothing existing could have
 * been it: `gen-skill-docs --check` verifies the generated mirror matches its
 * hand-authored source, so it cannot notice that BOTH describe a registry they
 * no longer match.
 *
 * **The defect is live, not historical.** `kg` was renamed to `cat-harness` on
 * 2026-09-19 — the same class of change as #266, in a file this test now guards.
 *
 * ## Two decisions, and why they went this way
 *
 * **Both directions are hard.** A kind in the table that the registry lacks is
 * the measured defect. A kind in the registry the table omits is the same class
 * reversed, and it means every new kind must land with its prose in the same PR.
 * That is a policy choice rather than a bug fix, and it is priced at zero right
 * now: measured 2026-09-19, both directions were already clean, so this locks in
 * a property the corpus has rather than demanding work to reach it. Softening it
 * is one assertion.
 *
 * **Scoped to the table's first column, never a grep of the file.** #269's
 * rewrites deliberately name `workplan` and `process-state` in prose, to preserve
 * the superseded design and stop somebody re-proposing it; the same file also
 * explains at length that `kg:audit`, `kg-export` and the `kg` QA family keep
 * their names. A text search would read every one of those as a live claim. The
 * table is the machine-readable part, which is the argument for scoping there.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { BASE_GRAPH_KINDS, GRAPH_KIND_ALIASES, defaultGraphKinds } from "../../schemas/cat-harness.js";

const ROOT = join(import.meta.dir, "../..");
const DOC = "skills/folio-core/directory-conventions.md";
/** The table's header row, verbatim. Renaming a column is a deliberate edit. */
const HEADER = "| kind | declared by | contents | renderable |";

/**
 * The kinds the table names, read from its FIRST COLUMN only.
 *
 * Located by the header row rather than by position or by a pattern over the
 * prose: the file holds two pipe-tables and this is the one whose columns say
 * what they are. Absent, or present more than once, THROWS — a table this test
 * cannot find is not an empty table, and a silent pass over nothing is the
 * failure mode the whole bean is about.
 */
function documentedKinds(): string[] {
  const lines = readFileSync(join(ROOT, DOC), "utf8").split("\n");
  const at = lines.reduce<number[]>((acc, l, i) => (l.trim() === HEADER ? [...acc, i] : acc), []);
  if (at.length !== 1) {
    throw new Error(
      `${DOC}: expected exactly one graph-kind table header, found ${at.length}. ` +
        `Looked for the line: ${HEADER}`,
    );
  }
  const out: string[] = [];
  // Skip the header and the |---|---| delimiter beneath it.
  for (let i = at[0]! + 2; i < lines.length; i++) {
    const line = lines[i]!;
    if (!line.trimStart().startsWith("|")) break;
    const first = line.split("|")[1] ?? "";
    // A cell reads `` `tools` `` or `` **`folio-assist-core`** ``; the kind is the
    // backticked token, and bold marks WHO DECLARES it in the next column.
    const kind = first.replace(/[`*]/g, "").trim();
    if (kind) out.push(kind);
  }
  return out;
}

/** Every name a table row may legitimately carry. */
function validKinds(): Set<string> {
  return new Set([
    ...defaultGraphKinds.names(),
    ...Object.keys(BASE_GRAPH_KINDS),
    // A deprecated alias still reads, so documenting one is not an error.
    ...Object.keys(GRAPH_KIND_ALIASES),
  ]);
}

describe("the graph-kind table and the registry name the same kinds", () => {
  test("the table is found, and is not empty", () => {
    // Without this the two assertions below pass vacuously over `[]` — which is
    // exactly how #266's drift survived three green merges.
    expect(documentedKinds().length).toBeGreaterThan(5);
  });

  test("every kind in the table exists in the registry", () => {
    // The measured defect: the table named `workplan` and `process-state` after
    // the registry stopped knowing them, and the file is designated the source
    // of truth, so an agent would have written a declaration the loader refuses.
    const valid = validKinds();
    const unknown = documentedKinds().filter((k) => !valid.has(k));
    expect(unknown).toEqual([]);
  });

  test("every registered kind appears in the table", () => {
    // The reverse direction, hard by choice — see the header. Clean when written,
    // so this costs nothing today and stops a kind shipping undescribed.
    const documented = new Set(documentedKinds());
    const undocumented = defaultGraphKinds.names().filter((k) => !documented.has(k));
    expect(undocumented).toEqual([]);
  });
});
