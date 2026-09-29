---
name: security
description: >
  The security sub-KG's entry point. What the boundaries are, which machinery
  already guards each one, and the single rule that unifies them — refuse,
  never repair. Read this before adding a check, so the answer that already
  exists is reused rather than rebuilt in a fourth place.
---

# Security — one question, asked at every boundary

> **This value came from outside. What may I do with it?**

Everything in this package is that question at a different boundary. The split
is deliberately **not** by attack name, because the same untrusted string is
command injection at a shell, path traversal at a `join`, and XSS at a template —
three names for one fact, and filing the rule under each of them is how a
correct guard ends up in one file while three call sites hand-roll it.

## The rule that unifies them: refuse, never repair

**A check returns a refusal, not a cleaned-up value.** This is measured, not
stylistic. `fuzm`: the staging slug pipeline REPLACED disallowed characters,
so input `..` survived as output `..`, and a branch of `---` collapsed to the
empty string — which made `rm -rf "pages/STAGING/$SLUG"` name every preview.
A repair silently changes which artefact is named. A refusal makes the caller
decide, and only the caller knows whether that is a 400, an `exit 1`, or a skip.

**And check by VALUE, never by provenance.** `feature-staging.yml` re-runs its
slug guard after the value crosses a job boundary, and says why in four lines:
it was validated once, and "where it came from" is not a property you can read
off a variable.

## The boundaries, and what guards each one today

| boundary | the hazard | machinery | state |
|---|---|---|---|
| `${{ }}` → a `run:` or `script:` block | the value is substituted into the script TEXT before bash or V8 parses it, so a quote is enough — and inside a JS template literal `${…}` is EVALUATED, so it need not even close one. A step OUTPUT carries whatever the step put in it, so the gate resolves provenance rather than trusting the band | `scripts/check-workflow-injection.ts` + baseline + 2 test files | **gated** (`1wef`, `j0zs`); two surfaces with two remedies, `with:`/`env:`/`if:` still ungraded |
| an external id → a path | `join(base, external)` escapes the store; `mkdirSync` + `writeFileSync` make it a write primitive | [`path-containment`](path-containment.md), `src/core/safe-path.ts` | **guarded; narrowly gated** — `server-path-sinks.test.ts`, a source ratchet (`6bhf`) |
| a shell string → a process | `execSync("cmd " + value)` gives the shell a program | [`injection-boundaries`](injection-boundaries.md) | partly (`execFileSync` at the fixed sites) |
| an archive → a filesystem | a LINK member writes through to its target, which `..`-refusal does not cover | member-TYPE whitelist (`tar tvzf`, accept only `-` and `d`) at the one call site, `tar-member-guard.test.ts` against real archives | **closed at one site** (`6bhf`) |
| a `.po` catalogue → a render | translated content is authored elsewhere | `scripts/translation/translation_security.py` | exists, unaudited here |
| content → HTML | XSS in a rendered surface | bean `q2wm`, declared XSS hints on tools and skills | **open** |

## Where to look when adding a check

1. **Is the boundary in the table?** Then the machinery exists — extend it.
   Adding a second guard for a guarded boundary is how they drift apart.
2. **Is there already a helper?** `src/core/safe-path.ts` is the path one. It got
   there because `resolveWithin` sat in `scripts/serve-rendering.ts`, complete and
   correct, while three HTTP handlers did the wrong thing — the exact shape `1wef`
   names: *"somebody had understood this hazard exactly. Nothing checked it, so
   the correctness was one edit from gone."*
3. **Can a gate hold the property?** A hand-maintained invariant drifts and the
   symptom of forgetting is invisible (`tyyc`). A guard without a gate is a guard
   with an expiry date.

## What this package does NOT own

**`rm -rf` in this repository is already well defended**, and that is a measured
finding rather than an assumption — all 42 `rm -r*` lines carrying an expansion
were read for bean `6bhf`. All four staging deletion sites are guarded by value,
and 14 of 16 shell files carrying such a line run `set -u`. The hazard the owner
asked about is real in general and is not, today, where this repository is open.
The open surface was the TypeScript I/O layer.

**Deletion policy is not security.** Whether an agent may remove a durable
artefact at all is
[`deletion-requires-confirmation`](../folio-core/deletion-requires-confirmation.md),
and it governs cases where the path is perfectly safe and the deletion is still
wrong.
