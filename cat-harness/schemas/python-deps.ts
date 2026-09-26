/**
 * The Python packages this repository's scripts need — declared once.
 *
 * Bean `68dt`. Measured 2026-09-20: `pdf-structure.py` imports `pymupdf`,
 * `pdf-ocr.py` shells to tesseract, image extraction wants `pypdf` + `Pillow`,
 * and **nothing in the repository said so**. There was no `requirements.txt`
 * and no `pyproject.toml`, and CI installed `ruff` and nothing else.
 *
 * The cost of that is not inconvenience. A Python tool can only be tested in
 * CI if CI has its backend, so an arm needing one either ships an UNTESTED
 * path — the `5rfy` defect, a gate that never fires — or does not ship. That
 * is what `d5f1`, `1r0p` and `ktt2` were blocked on.
 *
 * ## Authoritative here, `requirements*.txt` generated
 *
 * The carrier convention this repository already follows for schemas: the
 * TypeScript is definitional and the published artefact is downstream
 * (`directory-conventions` §"What lives in the `schemas` graph"). A flat
 * `requirements.txt` cannot carry the two facts a checker needs — which import
 * name a distribution provides, and why a declared package has no import at
 * all — so it is the OUTPUT, not the source.
 *
 * ## Two tiers, because one package costs more than the other eight together
 *
 * Measured by installing each set into a scratch target, 2026-09-20:
 *
 * | set | wheels | size |
 * |---|---|---|
 * | `lean` | 12 wheels | **144 MB** |
 * | `lean` + `extended` | 16 wheels | **467 MB** |
 *
 * `camelot-py` is 912 KB of that 323 MB difference. The rest is numpy, pandas
 * and OpenCV, which it pulls transitively, for ONE script — `pdf-tables.py`.
 * That script is not dead (two skills document it, bean `fj94` has 38 tests
 * for it), so the answer is not to drop it; it is to say what it costs and
 * install it separately.
 *
 * **Those timings are a LOWER BOUND, not a CI figure.** They were taken here
 * against a warm index with every wheel cached. A cold runner pays more, and
 * quoting 6 s as the CI cost would be a measurement laundered into a promise.
 *
 * @module schemas/python-deps
 * @graphNode schema
 */
import { z } from "zod";

/**
 * Which install set a package belongs to.
 *
 * - `lean` — installed in CI. Everything a gate can exercise.
 * - `extended` — declared, NOT installed in CI, with `why` saying what it
 *   costs. A path needing one of these is a path CI cannot test, and the arm
 *   that needs it must say so rather than pretend otherwise.
 */
export const DEP_TIERS = ["lean", "extended"] as const;
export type DepTier = (typeof DEP_TIERS)[number];

export const PythonDepSchema = z
  .object({
    /** The distribution name pip installs, e.g. `pdfminer.six`. */
    distribution: z.string().min(1),
    /**
     * The module name Python imports, when it differs from the distribution.
     *
     * `PyYAML` imports as `yaml`, `pdfminer.six` as `pdfminer`, `camelot-py`
     * as `camelot`. Without this mapping a checker comparing imports to
     * declarations reports three false gaps, which is how such a checker gets
     * switched off.
     */
    imports: z.string().min(1).optional(),
    tier: z.enum(DEP_TIERS),
    /**
     * Why this is declared — and for a `transitive` entry, why it has no
     * import of its own.
     */
    why: z.string().min(1),
    /**
     * Nothing imports it directly; it is required by something that does.
     *
     * `Pillow` is the case: `pypdf` refuses image extraction without it and
     * raises at the point of use, so it is a real requirement that no `import`
     * statement will ever reveal. Stated, so "declared and unimported" is
     * distinguishable from dead weight — which is what the checker would
     * otherwise have to guess.
     */
    transitive: z.boolean().optional(),
  })
  .refine((d) => d.transitive !== true || /require|need|pull|without/i.test(d.why), {
    message: "a transitive entry's `why` must say what requires it — otherwise it reads as dead weight",
    path: ["why"],
  });

export type PythonDep = z.infer<typeof PythonDepSchema>;

/**
 * Every Python package this repository's scripts need.
 *
 * Derived from a real scan, not from memory: `check-python-deps.ts` parses
 * every `scripts/**‌/*.py` and compares. Adding a script that imports
 * something new fails that check until it is declared here.
 */
export const PYTHON_DEPS: readonly PythonDep[] = [
  {
    distribution: "pymupdf",
    tier: "lean",
    why: "The PDF backend for `pdf-structure.py` and `pdf-pages.py` — embedded outline, page text, page count. The single most load-bearing dependency here and the one nothing declared.",
  },
  {
    distribution: "pypdf",
    tier: "lean",
    why: "`pdf-extract.py`, `pypdf_safe.py` and `_pypdf_compat.py`. Also the image-extraction path, which is why Pillow is below.",
  },
  {
    distribution: "pillow",
    imports: "PIL",
    tier: "lean",
    transitive: true,
    why: "Required by `pypdf` for image extraction: without it `page.images` raises `ImportError: pillow is required` at the point of use, while `len(page.images)` quietly returns 0 — a false zero measured 2026-09-19 while scoping `d5f1`.",
  },
  {
    distribution: "pdfplumber",
    tier: "lean",
    why: "`_pypdf_compat.py`'s second backend, so a document one reader cannot open is not simply refused.",
  },
  {
    distribution: "pdfminer.six",
    imports: "pdfminer",
    tier: "lean",
    why: "`pdf-extract.py`. The distribution name differs from the import name, which is exactly what `imports` exists for.",
  },
  {
    distribution: "lxml",
    tier: "lean",
    why: "`smart-base-transform.py` and both translation extract/inject scripts — XML with namespaces, which `xml.etree` handles poorly enough to matter here.",
  },
  {
    distribution: "requests",
    tier: "lean",
    why: "The five translation scripts that reach Crowdin, Launchpad and Weblate.",
  },
  {
    distribution: "PyYAML",
    imports: "yaml",
    tier: "lean",
    why: "`translation_config.py`. Imports as `yaml`.",
  },
  {
    distribution: "cryptography",
    tier: "lean",
    why: "`pypdf_safe.py`. Present system-wide in this container, which is precisely why it went undeclared in the first draft of this list — the checker caught it, and 'it happens to be installed here' is how an undeclared dependency is born.",
  },
  {
    distribution: "cffi",
    tier: "lean",
    transitive: true,
    why: "Required by `cryptography`'s Rust bindings: without it, importing `cryptography` raises `ModuleNotFoundError: _cffi_backend` and then PANICS under pyo3 — a failure at IMPORT time, before any code runs. Measured 2026-09-19 in this container while scoping `d5f1`; installing `cffi` was what made `pypdf` usable at all.",
  },
  {
    distribution: "camelot-py",
    imports: "camelot",
    tier: "extended",
    why: "`pdf-tables.py` only. 912 KB itself, but it pulls numpy, pandas and OpenCV — 323 MB measured 2026-09-20, more than the whole lean set. Kept out of CI for that reason alone; the script is live (two skills document it, bean `fj94` has 38 tests) and this is a cost statement, not a deprecation.",
  },
];

/** The module name an entry provides — `imports` when given, else the distribution. */
export function importNameOf(d: PythonDep): string {
  return d.imports ?? d.distribution;
}

export function depsForTier(tier: DepTier): readonly PythonDep[] {
  return PYTHON_DEPS.filter((d) => d.tier === tier);
}

/** The generated requirements file for a tier — see `scripts/gen-python-deps.ts`. */
export function requirementsPath(tier: DepTier): string {
  return tier === "lean" ? "requirements.txt" : "requirements-extended.txt";
}
