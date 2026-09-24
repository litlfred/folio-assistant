---
layout: default
title: 'Domain fencing'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/graph-management/domain-fencing.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/graph-management/domain-fencing.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/graph-management/domain-fencing.md){: .fa-edit-source }

{% raw %}
# Domain fencing — keeping one folio's rules out of everybody's platform

> Skill id: `domain-fencing` · Capability: `architecture` · Package: `graph-management`

Detangling a repository and detangling a *rule set* are the same practice. A
platform accumulates rules that were true of one folio, and they are harder to
see than a stray import because nothing fails — the rule simply never fires for
anyone else, or worse, fires wrongly.

## The mechanism already exists and works

`folioOptionalAxes()` in `content/pipeline/qa-criteria-registry.ts`. A folio
opts in through `<name>.config.json`:

```json
{ "qaAxes": ["q-usage"] }
```

Without that, the axis's criteria are **absent from the registry** — not
registered-and-skipped, absent. There is nothing to run and nothing to report.

`q-usage-watcher` states its own fencing, and it is the model to copy:

> "**Folio-optional axis.** The `q-usage` criteria encode a substrate
> deformation parameter `q` and its regimes — **one folio's mathematics, not a
> platform concern.** They are registered only when the folio opts in."

It also states the rule that makes fencing necessary rather than merely tidy:

> "the detangler axis. **Don't conflate the two**" — a domain-regime axis and a
> structural axis are different axes, and a node can pass one while failing the
> other.

## The one that did not use it, and now does

`detangler-archimedean-wall`, in `content/pipeline/qa-criteria-registry.ts`.
It carried **two** independent domain dependencies and its own comment admitted
both:

> "Lean. Classifies a block by reading its `.lean` … which a document folio
> cannot have. (Its chapter list is also one folio's directory names — a
> separate, folio-specific defect.)"

It read a Lean file *and* hardcoded one folio's six directory names, while
sitting on the platform's structural axis alongside eight criteria that are
genuinely generic. It is now fenced behind `qaAxes: ["archimedean-wall"]`.

**`profiles: ["paper"]` was not a fence, and that is the transferable part.**
A profile says what KIND of folio can answer the question. It does not say
WHOSE question it is. Every paper folio has a `.lean` to read, so the profile
admitted all of them to a criterion about six chapters only one of them has.
A domain rule needs an opt-in axis even when it already carries a profile —
the two restrict different things, and neither implies the other.

The criterion is a `detangler`-domain criterion by MECHANISM and one folio's
mathematics by CONTENT, so the fence is a conditional spread of a one-element
array rather than a gated domain — the shape `q-usage` uses does not fit a
single criterion inside an otherwise-generic axis.

### Two things the fencing turned up, both by running it

**The registry and the watcher bucket had to be gated together.** `q-usage`
already did this (`WATCHER_CRITERIA_BY_AXIS` spreads conditionally); the
detangler bucket is built from the array, so leaving `DETANGLER_WATCHER_CRITERIA`
alone would have named a criterion the registry never registered — a watcher
axis reporting on nothing and looking clean doing it, which is bean `dh4f`.

**The mechanism could not be verified ON from inside this repository** when
this was written, and finding out why was worth more than the fence.
`folioOptionalAxes()` resolves its config through `findContentRepoRoot()`,
which stopped at the nearest declared folio directory — `cat-harness/folio/` —
while the config sat one level up. So it read no config at all here, and
neither did `readDeclaredFolioProfile()`: it returned `"undetermined (no
<name>.config.json)"` from the resolved root and `"document"` from the actual
repository root.

> **Re-measured 2026-09-21, and the resolution half no longer reproduces.**
> `findContentRepoRoot()` now returns `cat-harness/`, not `cat-harness/folio/`,
> and `readDeclaredFolioProfile()` returns `document` from **both** roots —
> `cat-harness.config.json` for the resolved one, `folio-assistant.config.json`
> for the repository root. The declaration/config split gave `cat-harness` a
> config of its own and the walk now finds one — **both config files sit at the
> repository root**, named for their instance rather than placed inside it,
> which is why looking in `cat-harness/` for one turns up nothing.
>
> **But the resolver is not what controls this criterion, and the consequence
> below never occurred.** Measured on the same day under bean `zq3f`, which
> opened to check exactly that and closed by falsifying its own premise:
>
> - **The fence is the mechanism, not the resolver.** Probed here,
>   `folioOptionalAxes()` is `[]` and `inRegistry` is `false` — neither config
>   declares `qaAxes`, so `detangler-archimedean-wall` is not registered at
>   all. What stops it firing is the `archimedean-wall` opt-in this very
>   section introduced. `folio-optional-axes.test.ts` pins both states and is
>   the evidence to read first.
> - **There were never any bad verdicts.** 122 `block-qa` sidecars and 113
>   witnesses carry the criterion, and **every one records `"result": "n/a"`**
>   — not one `critical`, not one finding. The paragraph below describes a
>   harm that did not happen for this criterion; what the sidecars record is
>   that it was evaluated and found not applicable.
> - **"235" was a grep artefact.** `grep -rl` counts files CONTAINING a
>   string, so it swept witnesses in with sidecars and counted a substring
>   rather than a verdict — the same error shape as `cat-harness.json`
>   containing `harness.json`, one directory over, and it reached a skill and
>   a PR body before anything parsed it.
>
> Read the paragraph below as the reasoning that motivated the fence, not as a
> live defect. Reading a fixed resolver as a fixed defect would have been one
> error; reading it as *the* fix was the one actually made.

The consequence is already committed in the tree. The config file's own comment
says the third state *"runs every criterion, and the paper adapter's
LaTeX-shaped axes fire `critical` on prose that never reaches pdflatex"* — and
`test/results/block-qa/content/docs/publication-workflow/*.qa.json` carry
`detangler-archimedean-wall` verdicts on workflow documentation. A
`profiles: ["paper"]` criterion, scored against prose, because the declaration
that would have excluded it was never read.

**That is not fixed here.** Moving the config or widening the walk changes what
every consumer sees — including the MCP adapter `src/index.ts` selects — and is
its own change with its own measurement. Recorded rather than acted on, which
is the rule below about residue applied to the tool doing the fencing.

### The residue was measured, and it came back clean

`domain-fencing.md` recorded the whole `wall` domain — `wall-side-correct`,
`wall-base-ring-minimal`, `wall-side-statement`, `wall-side-proof` — as the
same folio's mathematics by the same argument, and did NOT fence it: *"its
checkers are called directly from `q-usage-audit.ts` and pinned by two tests,
so it is its own change with its own measurement."*

That was the right call and the measurement has now been taken. **Both halves
of the caution turned out to be non-blocking, and only measuring showed it:**

- **Discovery is registry-driven, not checker-driven.** The worry was that
  fencing four criteria would strand their checkers as orphans and trip
  *"every orphan names a criterion the registry really declares
  non-automated"*. It does not: `q-usage` has been fenced for some time and
  its checkers are simply **not discovered at all** when the axis is closed.
  Measured before changing anything, on the already-fenced axis, which is the
  cheap way to ask the question.
- **The direct callers keep working, and SHOULD.** `q-usage-audit.ts` calls
  `checkWallSide` and `checkBaseRingMinimal` by function, not through the
  registry. That path is untouched, and the distinction is worth stating:
  fencing governs what the **platform asserts every folio must be measured
  against**, which is a different question from what a **folio's own audit**
  may compute. A folio running that audit has already decided the wall applies.

Measured, off and on:

| | `wall` in registry | in the one-voice bucket | wall checkers discovered |
|---|---|---|---|
| no `qaAxes` | 0 | 0 | none |
| `qaAxes: ["archimedean-wall"]` | 4 | 4 | `wall-side-correct`, `wall-base-ring-minimal` |

Orphans and unimplemented are unchanged in both states, and the full suite is
3899 pass / 0 fail.

**One axis, not two**, because it is one wall: `detangler-archimedean-wall` and
the four `wall` criteria open together on `archimedean-wall`. A folio adds one
key, not two, and cannot end up half-fenced — which is the state a second axis
name would have made reachable.

Verification therefore ran against a synthetic folio root, which is also what
`scripts/tests/folio-optional-axes.test.ts` does, in a subprocess: the registry
reads its config ONCE at module load, so OFF and ON are not both observable in
one process. Measured — off: 8 detangler criteria, absent from registry and
bucket. On: 9, present in both. Removing the conditional spread turns all three
tests red (move 16: watch the gate fail before trusting it).

## There is a precedent for exactly that repair

`detangler-topic-coherence` was de-math'd once already. It had a hardcoded
`DETANGLER_CHAPTER_KEYWORDS` table; that table migrated out to a folio-supplied
`topic-keywords.json`, and the criterion stayed. **The mechanism survived, the
data left.** That is the shape of the repair, and it is the same shape as
`repo-partition.ts`'s open problem — roughly 400 of its 1,180 lines are this
repository's exception list inlined into a tool whose algorithm is generic.

## The test for whether a rule generalizes

Three questions, in order, and the first one that answers settles it:

1. **Does the rationale survive translation?** `proof-gap-audit` §J's reasons
   for extracting a shared sub-derivation — *inconsistent edits later, inflated
   graph energy, hiding that the shared thing is worth naming* — are the
   duplicate-module argument word for word. It generalizes.
2. **Is the domain in the mechanism, or only in the vocabulary?**
   `proposition-consolidation-audit` H3 is set-overlap arithmetic with a kind
   list bolted on; strip the list and the rule stands. H2 normalises boxed
   LaTeX with bound-variable renaming and Levenshtein distance — the *shape*
   generalizes, the detection does not.
3. **Would the platform need the domain installed to run it?**
   `lean-completeness-audit` needs Lake, imports, sorries and axioms. No.

A rule that fails all three is not a failure to be fixed. It is a folio's rule,
correctly located, and the honest move is to fence it and say so — which is
what `q-usage-watcher` does in its first paragraph.

## Record the residue, do not quietly drop it

When a rule is lifted, the part left behind is a finding, not waste.
`critical-path-analysis` splits cleanly: its union-of-two-relations model
generalizes and now lives in `edge-kinds-and-blast-radius.md`; its
GENERAL / SPECIALIZED-STATEMENT / SPECIALIZED-PROOF / MIXED taxonomy does not,
and stays where it is.

The taxonomy is also **subsumed** rather than lost — it is the interface-versus-
implementation distinction restated for propositions. Saying so is what keeps a
future reader from lifting it a second time.
{% endraw %}
