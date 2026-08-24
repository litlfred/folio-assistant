import { describe, expect, test } from "bun:test";
import { checkUsesEditorialHygiene } from "../../content/pipeline/qa-checkers-uses";
import { buildContentGraph } from "../../content/pipeline/content-graph";
import { walkBlocks } from "../../content/pipeline/qa-utils";
import { parseUses } from "../../content/pipeline/content-graph";
import { FOLIO_ROOT, hasFolio } from "./helpers";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * `uses-editorial-hygiene` reports a `uses[]` entry as transitively redundant
 * when another entry's **editorial** cone reaches it, and its hit message used
 * to name `prune-transitive-deps.ts` as the remedy in every case.
 *
 * The pruner computes the transitive reduction of `uses[]` ONLY — its own
 * docstring says so, and reducing the formal relation would be unsound. So
 * when the path leaves an entry by its `interprets` edge, the criterion warns
 * and the named remedy reports nothing and changes nothing. Measured in qou
 * 2026-08-24: `prop:centered-hecke-variance-positive` warns, and the pruner
 * lists no edge for it, because `rem:non-commutative-probability-dictionary`
 * has an empty `uses` cone and a 29-node editorial one.
 *
 * A remedy that silently no-ops is worse than no remedy named: it reads as
 * "someone should run the script" rather than "this is an editorial question".
 * Whether an `interprets` hop SHOULD make a `uses` edge redundant is a
 * decision about the editorial model, and this test does not take it — it
 * pins only that the message tells the truth about which case is which.
 *
 * Running it is how the scale came out. Over qou 2026-08-24: **374 blocks
 * warn, carrying 594 redundancy reports, and ALL 594 are `interprets`-only —
 * not one runs through `uses`.** So the remedy the criterion used to name was
 * a no-op every single time it was named, on ~10 % of the corpus. That is the
 * `So the` shape again: advice that has never once applied.
 *
 * Asserted generically over whatever folio is attached; no label is hardcoded.
 */
describe.skipIf(!hasFolio())("uses-editorial-hygiene names a remedy that applies", () => {
  const contentDir = (): string => join(FOLIO_ROOT!, "content");

  // Walks every block in the folio and builds the graph: seconds, not ms.
  test("the pruner is named iff the path runs through `uses`", () => {
    const g = buildContentGraph(contentDir(), FOLIO_ROOT!);
    let warned = 0;
    let viaUsesSeen = 0;
    let viaInterpretsSeen = 0;

    for (const b of walkBlocks(contentDir())) {
      const r = checkUsesEditorialHygiene(b.ts);
      if (r.result !== "warn") continue;
      warned++;
      const direct = [...new Set(parseUses(readFileSync(b.ts, "utf-8")))];
      for (const h of r.hits) {
        const text = (h as { text?: string }).text ?? "";
        // Recover the (u, other) pair the checker reported.
        const m = text.match(/redundant "([^"]+)" — (?:already )?reachable via "([^"]+)"/);
        if (!m) continue;
        const [, u, other] = m;
        expect(direct).toContain(u);
        expect(direct).toContain(other);
        const viaUses = g.cone(other, "uses").has(u);
        if (viaUses) viaUsesSeen++;
        else viaInterpretsSeen++;
        // The invariant: promise the pruner only when it will act.
        expect(text.includes("run prune-transitive-deps.ts")).toBe(viaUses);
        if (!viaUses) expect(text).toContain("`interprets`");
      }
    }

    // A folio with no redundancy at all would make the assertions vacuous;
    // say so rather than reporting a silent pass over nothing.
    if (warned === 0) {
      console.log("  (no block warns in this folio — invariant not exercised)");
    } else {
      console.log(
        `  ${warned} warning block(s): ${viaUsesSeen} via uses, ` +
          `${viaInterpretsSeen} via interprets only`,
      );
    }
  }, 120_000);
});
