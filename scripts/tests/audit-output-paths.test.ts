/**
 * Machine-generated audit output must not land in `.beans/` or `todos/`.
 *
 * `AGENTS.md` is explicit about both:
 *
 * - *"Do not stand up a separate todo store (no API route, dashboard, or
 *   `todos/*.json` work-plan); beans is it."*
 * - *"`beans ≠ sidecars`: never `beans create` bulk machine-generated queues
 *   … keep those as bulk JSON."* — `.beans/` holds the work plan, not bulk
 *   output.
 *
 * Four pipeline scripts defaulted into those two directories anyway. Nothing
 * noticed, because every one of them was unreachable from a scaffolded folio
 * until the pipeline-resolution fix; the first run after it dirtied the
 * folio's git status with two files in forbidden locations.
 *
 * `build/` is gitignored in every folio layout, including what `folio_init`
 * scaffolds — `todos/` was not, which is why the docstring claiming otherwise
 * was wrong outside the `qou` repo it was written in.
 */
import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

const PIPELINE = join(import.meta.dir, "../../content/pipeline");

/** Scripts that write a machine-generated worklist or report. */
const WRITERS = [
  "audit-status-sections.ts",
  "extract-status-sections.ts",
  "qa-agent-drain-queue.ts",
  "qa-section-title-audit.ts",
];

describe("audit output paths", () => {
  for (const file of WRITERS) {
    const src = readFileSync(join(PIPELINE, file), "utf-8");

    test(`${file} does not default into .beans/ or todos/`, () => {
      // String literals only — a path assembled at runtime would slip past
      // this, but all four spell theirs out, which is what made the drift
      // invisible and is also what makes it checkable.
      expect(src).not.toMatch(/"\.beans\/[\w-]+\.json"/);
      expect(src).not.toMatch(/"todos\/[\w-]+\.json"/);
    });

    test(`${file} defaults into build/`, () => {
      expect(src).toMatch(/"build\/[\w-]+\.json"/);
    });
  }

  test("qa-section-title-audit honours --out like its three siblings", () => {
    // It was the only one with a hardcoded path and no way to redirect it.
    const src = readFileSync(join(PIPELINE, "qa-section-title-audit.ts"), "utf-8");
    expect(src).toContain('indexOf("--out")');
  });
});
