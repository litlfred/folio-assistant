/**
 * qou's chapter profiles — FOLIO CONTENT, quarantined pending migration.
 *
 * Which q-regimes each chapter may use, and which chapters are categorical or
 * archimedean, are editorial judgements about ONE folio's chapters. They do not
 * belong in the platform: AGENTS.md is explicit that a vocabulary written here
 * is either in the wrong repo, or belongs in the folio as data.
 *
 * They lived inline in `qa-checkers-q-usage.ts` — a 31-entry map keyed by qou
 * chapter directory names, plus two chapter sets. This file is the intermediate
 * step of a migration whose other half is in a repo this change cannot touch:
 * the data is out of the checker and behind the `chapter-profile-registry-di`
 * interface, but still shipped by the platform, so that moving it does not
 * silently turn qou's chapter-profile criteria to `n/a` before qou has anywhere
 * to put it.
 *
 * ## To finish the migration (qou side)
 *
 * 1. Copy the three literals below into the folio, beside
 *    `content/values/registry.ts` and `content/schema/references.ts` — where
 *    the other two injected registries already live.
 * 2. Call `configureChapterProfiles({ chapterExpectedRegimes,
 *    categoricalChapters, archimedeanChapters })` from the folio's runner,
 *    `scripts/run-validate.ts`, beside the existing `configureValueRegistry`
 *    and `configureReferenceRegistry` calls.
 * 3. Delete this file and the `registerDefaultChapterProfiles()` call in
 *    `qa-checkers-q-usage.ts`.
 *
 * Step 3 is safe the moment step 2 lands: a folio that configures its own
 * profiles overwrites this one (last call wins), and an unconfigured registry
 * reports `n/a` rather than "expectation met" — see
 * `chapter-profile-registry-di.ts`.
 *
 * @module content/pipeline/_folio-chapter-profiles.qou
 */

import type { QRegime } from "./qa-checkers-q-usage";
import { configureChapterProfiles } from "./chapter-profile-registry-di";

export const CHAPTER_EXPECTED_REGIMES: Record<string, ReadonlySet<QRegime>> = {
  // ── Front matter ───────────────────────────────────────────────
  introduction: new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1",
    "mod-gt-1", "mod-lt-1", "root-of-unity", "fixed-q0",
  ]),
  notation: new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1",
    "real-lt-1", "mod-gt-1", "mod-lt-1", "unit-circle",
    "root-of-unity", "fixed-q0",
  ]),

  // ── Part I — categorical foundations ──────────────────────────
  // Symbolic / generic-R primary. fixed-q0 only in a specialisation
  // block that explicitly carries an archimedean banner.
  "quantum-universes": new Set<QRegime>([
    "na", "symbolic", "generic-R",
  ]),
  "quantum-observable-universes": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive",
  ]),
  "models-of-qous": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1",
    "mod-gt-1", "mod-lt-1", "fixed-q0",
  ]),
  "lifting-and-descent": new Set<QRegime>([
    "na", "symbolic", "generic-R",
  ]),

  // ── Part II — structural mechanics ───────────────────────────
  "braids-and-knots": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "mod-gt-1",
    "mod-lt-1",
  ]),
  "brings-surface": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1",
    "fixed-q0",
  ]),
  "fluid-dynamics": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1", "fixed-q0",
  ]),
  "stochastic-mechanics": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1",
    "real-lt-1", "mod-lt-1", "fixed-q0",
  ]),
  "information-theory": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "fixed-q0",
  ]),
  "mass-theory": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1", "fixed-q0",
  ]),
  "mass-endomorphism": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1",
    "fixed-q0",
  ]),
  "particle-interactions": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1", "fixed-q0",
  ]),
  "gravity-spacetime": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1", "fixed-q0",
  ]),

  // ── Part III — Descartes universe + observations ─────────────
  "climax-volume-mass": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1", "fixed-q0",
  ]),
  observations: new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1", "fixed-q0",
  ]),
  "predicted-spectra": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1", "fixed-q0",
  ]),
  "measurement-observation": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1", "fixed-q0",
  ]),
  "molecular-construction": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1", "fixed-q0",
  ]),
  "organic-chemistry": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1", "fixed-q0",
  ]),

  // ── Ch 11 — q-geometric Langlands (root-of-unity territory) ──
  "q-geometric-langlands": new Set<QRegime>([
    "na", "symbolic", "generic-R", "root-of-unity", "unit-circle",
    "mod-lt-1", "mod-gt-1",
  ]),

  // ── Appendices ────────────────────────────────────────────────
  "appendix-qvalues": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1", "fixed-q0",
  ]),
  "appendix-atomic-mass-calculations": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1", "fixed-q0",
  ]),
  "appendix-knot-operations": new Set<QRegime>([
    "na", "symbolic", "generic-R", "mod-lt-1", "mod-gt-1",
  ]),
  "appendix-knot-periodic-table": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "fixed-q0",
  ]),
  "appendix-nf-witnesses": new Set<QRegime>([
    "na", "symbolic", "generic-R", "fixed-q0",
  ]),
  "appendix-surreals": new Set<QRegime>([
    "na", "symbolic", "generic-R",
  ]),
  "appendix-transfer-matrices": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "fixed-q0",
  ]),

  // Glossary and notation entries are register tables — allow any.
  glossary: new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1",
    "real-lt-1", "mod-gt-1", "mod-lt-1", "unit-circle",
    "root-of-unity", "fixed-q0",
  ]),
  "index-of-definitions": new Set<QRegime>([
    "na", "symbolic", "generic-R", "real-positive", "real-gt-1",
    "real-lt-1", "mod-gt-1", "mod-lt-1", "unit-circle",
    "root-of-unity", "fixed-q0",
  ]),
};

/** Chapters whose narrative-expected profile is "categorical only". */
export const CATEGORICAL_CHAPTERS: ReadonlySet<string> = new Set([
  "quantum-universes",
  "lifting-and-descent",
  "braids-and-knots",
  "appendix-knot-operations",
  "appendix-surreals",
]);

/** Chapters whose narrative-expected profile is "archimedean / fixed q_0". */
export const ARCHIMEDEAN_CHAPTERS: ReadonlySet<string> = new Set([
  "mass-theory",
  "particle-interactions",
  "gravity-spacetime",
  "climax-volume-mass",
  "observations",
  "predicted-spectra",
  "measurement-observation",
  "molecular-construction",
  "organic-chemistry",
  "fluid-dynamics",
  "appendix-qvalues",
  "appendix-atomic-mass-calculations",
]);

/**
 * Prose terms qou requires a formal definition for. Lifted verbatim from
 * `find-dangling-remarks.ts`.
 */
export const TERMS_NEEDING_DEFINITIONS: Record<string, string> = {
  "energy": "def:crossing-energy or similar",
  "force": "categorical force definition",
  "particle": "def:q-harmonic-form or def:fermion-boson-decomposition",
  "observable": "def:quantum-observable-universe",
  "measurement": "def:observation",
  "degeneration": "formal Frobenius non-degeneracy failure",
  "time reversal": "prop:fiber-adjoint-involution",
  "virtual particle": "brane tower level definition",
  "pair creation": "exceptional divisor passage",
  "chirality flip": "formal chirality reversal definition",
  "big bang": "initial object in QOU_deg",
  "heat death": "terminal object / classical limit",
};

/**
 * qou's Lean module layout: which namespace belongs to which chapter. Lifted
 * verbatim from `mapBuildFileToChapter` in `scripts/lean-audit.ts`, in the same
 * order — first match wins, and an unmatched path still falls back to `"core"`
 * at the call site.
 */
export const LEAN_MODULE_CHAPTERS = [
  { pathFragment: "QOU/QuantumObservableUniverse", chapter: "ch1-quantum-observable-universe" },
  { pathFragment: "QOU/Torsion", chapter: "ch3-lifting-of-quantum-torsion" },
  { pathFragment: "QOU/Descartes/", chapter: "ch6-descartes-universe" },
  { pathFragment: "QOU/PathIntegrals", chapter: "ch4-path-integrals-and-braiding" },
  { pathFragment: "QOU/KnotTheory", chapter: "ch4-path-integrals-and-braiding" },
  { pathFragment: "QOU/KnotRegistry", chapter: "ch4-path-integrals-and-braiding" },
  { pathFragment: "QOU/BringsSurface", chapter: "ch5-brings-surface" },
  { pathFragment: "QOU/DescartesUniverse", chapter: "ch6-descartes-universe" },
  { pathFragment: "QOU/GaugeFieldFluidDynamics", chapter: "ch10-fluid-dynamics" },
  { pathFragment: "QOU/InformationTheory", chapter: "ch9-information-theory" },
  { pathFragment: "QOU/QGeometricLanglands", chapter: "ch11-q-geometric-langlands" },
  { pathFragment: "QOU/Glossary", chapter: "ch8-glossary" },
  { pathFragment: "QOU/HadronicMass", chapter: "ch7-observations" },
  { pathFragment: "QOU/AtomicMass", chapter: "ch7-observations" },
  { pathFragment: "QOU/MassDerivation", chapter: "ch7-observations" },
  { pathFragment: "QOU/CODATAChain", chapter: "ch7-observations" },
  { pathFragment: "QOU/RepresentationTheory", chapter: "ch2-quantum-geometry" },
  { pathFragment: "QOU/Calculations", chapter: "shared" },
  { pathFragment: "QOU/MathConstants", chapter: "shared" },
] as const;

/**
 * Register qou's profiles as the registry default.
 *
 * Invoked for its side effect from `qa-checkers-q-usage.ts`. A folio calling
 * `configureChapterProfiles` itself overwrites this, so wiring the folio side
 * does not require deleting this file first.
 */
export function registerDefaultChapterProfiles(): void {
  configureChapterProfiles({
    chapterExpectedRegimes: CHAPTER_EXPECTED_REGIMES,
    categoricalChapters: CATEGORICAL_CHAPTERS,
    archimedeanChapters: ARCHIMEDEAN_CHAPTERS,
    termsNeedingDefinitions: TERMS_NEEDING_DEFINITIONS,
    leanModuleChapters: LEAN_MODULE_CHAPTERS,
  });
}
