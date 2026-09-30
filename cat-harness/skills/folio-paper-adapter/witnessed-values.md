---
name: witnessed-values
---

# Witnessed Values Skill

## Purpose

Eliminate **numerical drift** between the paper's prose and the
canonical witness/computation files. Every literal value the paper
quotes for a computed quantity must come from a single source of truth —
the canonical witness file — so updating a witness automatically
propagates to every place the value is mentioned.

## The syntax: Liquid `{{ … }}` — `:val` is deprecated

**Since 2026-09-30 (bean `kott`, issue #1564) a value is written as Liquid**, one
syntax for every target: the PDF, the blueprint, the just-the-docs site and IG
pages all print the same number, because one resolver
(`content/pipeline/liquid-values.ts`) substitutes it before Jekyll, the IG
Publisher or LaTeX sees the text.

```markdown
The electron mass is {{ qou.computations.codata-masses.data.m_e_MeV | precision: 6 }} MeV.
$\mathrm{Vol}(4_1) = {{ qou.computations.volumes.data.vol_4_1 | precision: 8 }}$
This harness is at version {{ cat-harness.version }}.
```

**The address is a path in the knowledge graph:**
`<prefix>.<declared-directory-id>.<entry>.<exact JSON path>`.

- `<prefix>` — the instance's `liquid.prefix`, default its `name`.
- `<declared-directory-id>` — a directory the instance DECLARES. An undeclared
  directory is not addressable, even if the file is there.
- `<entry>` — `<entry>.witness.json` or `<entry>.json` in that directory.
- the JSON path is exact, `data.` included: nothing guesses where a value lives.
- `{{ <prefix>.<field> }}` is a scalar from the declaration itself (`version`,
  `canonicalUrl`, …).

**Filters:** none prints the stored value unchanged, as Jekyll prints a
`site.data` value; `| precision: N` rounds to N significant digits (half-even,
exact for 50-digit witnesses); `| scientific` emits `\times 10^{e}` and belongs
inside math.

**`{{ site.data.… }}` is fhir-harness's**, declared as pass-through: Jekyll and
the IG Publisher resolve it exactly as before, and bean `bamf` populates it for
just-the-docs. `{{ page.* }}` and anything else not declared is left alone.

**Never silent:** a reference under a resolved prefix that does not resolve
becomes a visible `⟦unresolved: …⟧` marker and is reported. Left as `{{ … }}`,
Jekyll would print an undefined variable as the empty string.

**Datasets:** values from an ingested dataset are addressed the same way once
the dataset carries them, e.g. `{{ qou.library.codata-2022.mass-electron }}`
(bean `uyp8`: CODATA is still a vendored Python snapshot today).

The rest of this skill describes `:val[…]`, which keeps working on the LaTeX
path as a **deprecated alias** until a folio migrates its uses.

## How it works (`:val`, deprecated)

A typed registry (e.g. `content/values/registry.ts`) maps short names to
the canonical witness file and a dotted JSON path. In `.md` content,
authors write a directive instead of the literal:

```markdown
The computed parameter is :val[param_0]{precision=6}, which gives
$\text{derived} \approx :val[derived_sq]$.
```

At build time the renderer loads each witness JSON, extracts the value,
and substitutes it with the requested precision and units. If the
witness file changes, the rendered prose changes automatically.

### Directive syntax

```
:val[<name>]                  # uses defaultPrecision, default format
:val[<name>]{precision=8}     # override precision
:val[<name>]{format=scientific}
:val[<name>]{format=measured} # value ± err   (requires errorEntry)
:val[<name>]{units=none}      # suppress units suffix
```

Authors do **not** write `$…$` around `:val[…]` themselves — the
renderer does. The directive also works **inside** an existing math
context (the math-mode pass picks it up):

```markdown
$\mathrm{Vol}(K) = :val[vol_K]{precision=8}$
```

### Why `:val[…]` was chosen over Liquid (superseded 2026-09-30)

The `:directive[arg]{attrs}` form is CommonMark generic-directive
syntax, already used for `:defterm[…]` / `:refterm[…]` (the glossary
system). Liquid `{{ … }}` would collide with math's heavy use of `{…}`
braces. Using `:val[…]` keeps the syntax disjoint from math markup,
reuses the existing directive infrastructure, and mirrors the muscle
memory authors already have for term references.

**Why that no longer decides it.** The collision is real only for a `{{`
that is NOT a value reference, and the resolver matches exactly
`{{ <declared-prefix>.… }}`: LaTeX's `x^{{1}}` or `∏_{{i,j}}` never matches, so
the PDF path is unaffected. Jekyll targets still need other `{{` raw-wrapped,
which qou's docs stager already does by detection. Against that, one syntax
that Jekyll, the IG Publisher and the platform all read won — owner, 2026-09-30:
*"why markdown pages not use same as jekyll? ... be consistent"*.

## Authoring rules

### When to use `:val[name]`

**Use it for every literal whose value is derived from a computation
witness — in *every* block kind**, not just prose. The codemod and
validator are kind-agnostic: they walk every `.md` file regardless of
the wrapping block kind.

| Block kind | Apply `:val[…]`? |
|------------|------------------|
| `definition` | yes — body, illustrative numerals |
| `theorem` / `lemma` / `proposition` / `corollary` | yes — statement body and any quoted bound |
| `conjecture` | yes — even more important: the conjectured value must track its witness |
| `proof` | yes — including witness-citing steps |
| `example` | yes — concrete numerical instantiations |
| `remark` | yes — interpretive numerals |
| `prose` | yes — narrative literals |
| `algorithm` / pseudo-code | yes — anywhere a witness-derived literal appears |
| `table` | yes (manual) — the codemod skips tables; author rewrites by hand |
| `equation` | yes — picked up inside `$…$` and display math |
| `simulator` / `diagram` | n/a — no `.md` body for the codemod to scan |

### Short literals below the match threshold

The codemod only auto-migrates literals carrying at least
`MATCH_PRECISION` significant digits. Lower-precision literals **must be
migrated by hand** — edit them in place to use `:val[name]`, or first
extend the literal to the required precision and re-run the codemod.
This is by design: at low precision a literal may agree with several
registry canonicals, so the codemod refuses to guess.

### When **not** to use `:val[name]`

- Pure exposition examples not asserting the actual numerical value
  (illustrating an algebraic identity with a toy value).
- Values not in the registry. **First add a registry entry** (with
  `needsReview: true` if the canonical witness has not yet been pinned),
  then use `:val[name]`.
- Inside fenced derivation code blocks — the codemod skips these because
  they typically show the literal as part of a derivation, not as a
  final asserted value.

### Adding a new entry

1. Identify the canonical witness JSON.
2. Pick a stable, snake-case `name` mirroring the symbol when possible.
3. Set `defaultPrecision` no larger than the underlying witness
   precision.
4. `units` is plain text rendered after the number; use `null` for
   dimensionless values.
5. If the canonical witness is uncertain, set `needsReview: true` with a
   placeholder witness file/path. The codemod skips such entries; the
   validator emits a warning.

## Validation

Rules run as a phase of the project validator:

| Rule | Level | Checks |
|------|-------|--------|
| `val-registered` | error | name appears in the registry |
| `val-resolves` | error | witness file exists, dotted path resolves |
| `val-precision-bounded` | error | requested precision ≤ source precision |
| `val-units-consistent` | warn | units overrides only when the entry has units |
| `val-pending` | warn | a `needsReview: true` entry was cited |
| `val-block-computation` | warn | a block cites `:val[…]` but its `computation:` field is absent or refers to a different witness |

The last is **informational**: the renderer never blocks on it. It lets
the witness-staleness audit pick up the implicit dependency.

**Liquid references get the same rules** (`val-resolves`,
`val-precision-bounded`, `val-block-computation`, plus `val-filter` for an
unknown filter), so migrating from `:val` keeps a folio's validation rather
than trading it for a `⟦unresolved⟧` marker in the rendered output. A
dataset value (`<entry>/values.json`) is not a computation and asks for no
`computation:` link; `site.*`, `page.*` and pass-through prefixes are
Jekyll's and are not checked here.

**Migrating a folio:** convert a reference only where the platform renders
it to byte-identical LaTeX both ways. Two cases cannot convert, and stay on
`:val`: a witness path with characters a dotted key cannot carry, and a
prose value WITH units — Markdown reads `\,` as an escaped comma, so the
thin space `:val` emits before a unit has no prose spelling.

## Codemod (mass migration)

A codemod rewrites known literals inside math contexts to their
`:val[…]` equivalent. Properties: **math-only** (prose and fenced
derivation blocks are untouched; tables skipped); **idempotent**
(existing `:val[…]` regions are carved out before replacement);
**verified-only** (`needsReview` entries are never auto-applied);
**conservative match** (a literal must agree with the witness to at
least `MATCH_PRECISION` significant digits — set high on purpose, since
at low precision distinct quantities collide).

## Failure modes

The renderer surfaces every failure in the rendered output rather than
dropping content silently:

| Situation | Rendered output |
|-----------|-----------------|
| Unknown name | the `:val[name]` literal verbatim |
| Witness file missing | the `:val[name]` literal |
| Path does not resolve | the `:val[name]` literal |
| `needsReview: true` entry | a `[TODO name]` marker |

If you see any of these in a rendered chapter, fix the registry or
backfill the canonical witness — never paper over the failure with a
hard-coded literal.

## Disjoint from tunable knobs (`EVOLVE-VALUE` fences)

`:val[…]` is for **derived / fixed** values — things a witness
*computes* and the text must not drift from. The complementary case —
values that are *legitimately tunable* (a truncation order, an
exploratory coefficient) — is handled by the **`EVOLVE-VALUE` fence**
convention in `production-vs-exploratory-discipline.md`. The two are
**disjoint**: a value is either witnessed-derived (`:val`) or
fenced-tunable (`EVOLVE-VALUE`), never both. A `:val`-witnessed literal
inside an *exploratory* fence is a contradiction to resolve.

## Skill routing

When asked to write or revise paper content that quotes witness-derived
literals, **first check the registry**. If registered, use `:val[name]`.
If it should be registered but isn't, add it (with `needsReview: true`
if the witness is uncertain) and *then* cite it. Avoid hard-coded
literals in newly-authored prose.

## Formal-source companion: `:leanval[...]` codemod

When the project carries a formal-proof layer, numeric literals inside
its source files use the same registry via a sibling codemod. **Tag
syntax** (line-anchored, end-of-line comment), e.g. for a Lean source:

```lean
volume := 2.029883212819307  -- :leanval[vol_K]{precision=15}
```

The codemod scans the formal-source files (skipping build/cache dirs),
finds lines whose final end-of-line comment starts `-- :leanval[NAME]`,
and rewrites the **immediately preceding decimal literal on the same
line** to the witness value at the registry path, formatted to the
per-occurrence `{precision=N}` attribute or the registry default.
Modes: dry-run (summarise diffs), `--write` (apply), `--check` (CI gate,
exit 1 on drift). Wire `--check` into CI after the witness producers so
a formal literal that has drifted from its witness fails before merge;
the fix is always `--write`.

**When to use the formal-source tag** — any field/literal that quotes a
numerical invariant tracked by a witness JSON. **When not** — opaque
constants computed inline by formal tactics (`1/2`, `√2` from a
decision procedure); the codemod is a drift safety net, not a generic
literal rewriter.
