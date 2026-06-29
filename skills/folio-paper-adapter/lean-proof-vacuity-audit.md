---
name: lean-proof-vacuity-audit
description: >-
  Detect and fix Lean "vacuous proof" anti-patterns — declarations that
  type-check, are sorry-free and axiom-clean, and whose statement matches the
  .md, yet carry NO mathematical content (they assume what they claim, conclude
  something trivially true, or rest on a false premise). These slip past
  `proof-statement-integrity` (which only checks signature-stability + an axiom
  sweep), so detection is semantic and agent-checked. Use when auditing Lean for
  circular / vacuous / trivially-true proofs, after a batch
  proof-statement-integrity normalization (the batch "wrap the conclusion in a
  structure field and project it" fix produces these), or when a "theorem" looks
  too easy. Emits per-block QA sidecar params under the `proof-no-*` criteria.
roles: [collaborator]
---

# lean-proof-vacuity-audit

A proof can be **sorry-free, axiom-clean, and statement-faithful** and still
prove **nothing**. `proof-statement-integrity` guards the *statement* (signature
unchanged vs prior commit, no `sorryAx`) but not the *content*. This skill
catches the family of **vacuous proofs** — proofs whose validity is purely
syntactic — and drains them to honest representations.

The canonical trigger: a batch "fix proof-statement-integrity" pass that
discharges a `sorry`/false-`axiom` by wrapping the conclusion in a `structure`
field and projecting it. That removes the `sorry` and the axiom, the statement
is unchanged, the checker goes green — but the theorem now **assumes its own
conclusion**.

## The anti-pattern family

### 1. Self-assuming projection (circular) — `proof-no-self-assuming-projection`

The conclusion is carried as a `structure`/`class` field and the proof returns
that field verbatim. The other fields (the would-be hypotheses) are unused.

```lean
structure D (S) where
  hyp1 : ...                                   -- decoration, NEVER used
  exists_lambda : ∃ λ, ∀ r, phi r = λ * psi r  -- ← the CONCLUSION, as a field
theorem foo (S) (d : D S) :
    ∃ λ, ∀ r, d.phi r = λ * d.psi r := d.exists_lambda   -- ← P ⊢ P, vacuous
```

The goal is *literally the type of* `d.exists_lambda`. Equivalent shapes:
`:= ⟨d.claim_a, d.claim_b⟩` (conjunction of conclusion-fields), `:= by exact
d.claim`, `:= ctx.claim_foo`, class form `[C M] … := C.field`.

### 2. Trivial-true conclusion — `proof-no-trivial-true`

The stated goal is a tautology, so any proof is content-free.

```lean
theorem foo (heavy hypotheses) : True := trivial          -- conclusion is True
theorem bar : (0 : R) = 0 := rfl                          -- tautology
theorem baz : x = x := rfl                                 -- reflexivity dressed as a result
structure D where holds : Prop := True                     -- a "Prop" field pinned to True
```

Watch for a `holds : Prop` / `claim : Prop` field that is later **instantiated
as `True`**, or a conclusion that `simp`/`tauto`/`trivial` closes with no use of
the hypotheses.

**The `theorem`→`def` dodge (STRICT — forbidden).** Re-declaring a
vacuous `theorem X : True := trivial` as `def X : True := trivial` (or
`abbrev`/`instance`) can hide it from detectors that key on the provable kinds.
A trivial-bodied `: True` `def` is flagged as pattern **`def-disguised-true`**.
Carve-outs: a shadow-stub (real decl resolves elsewhere) or a
`conjecture`-block Lean placeholder (sibling `.ts` is `conjecture(...)`) →
exempt. Per **AGENTS.md §1a**, dodging an audit this way is a review failure;
the honest dispositions are *prove it* / *state the real proposition with
`sorry` + `-- Ref:`* / *demote to `conjecture`* — never a vacuous `def : True`.

### 3. False / unsatisfiable premise (vacuously true) — `proof-no-false-premise`

A hypothesis can never hold, so the theorem is vacuously true and asserts
nothing about the intended domain.

```lean
theorem foo (h : (0 : R) = 1) : Anything := absurd h (by norm_num)   -- premise impossible
theorem bar (h : n < 0) (hn : n : ℕ) : P n := (Nat.not_lt_zero n h).elim
```

### 4. Unused hypotheses (statement weaker than intended) — `proof-no-unused-hypotheses`

*All* declared hypotheses are unused. Sometimes legitimate (uniformity across a
family), but frequently a signal that the statement was weakened until it became
trivial, or that the "hypotheses" are scaffolding for a circular field-projection.
Agent judges intent.

### 5. `decide` / `native_decide` masking — `proof-no-decide-masking`

A non-trivial statement is closed by `decide`/`native_decide`, trusting the
kernel/compiler evaluator instead of proving structure. `native_decide` adds
`Lean.ofReduceBool` to the axiom set — an integrity concern in its own right.
The runnable scanner (below) flags **only `native_decide`**; a plain `decide`
on a small decidable goal (`(-1:ℤ)^6 = 1`, `genus 11 = 5`) is
idiomatic and not a defect.

### 6. Axiom that is a candidate to prove — `proof-no-provable-axiom`

An `axiom` carrying **no bibliographic `-- Ref:` justification** (and no
`[cite]` / DOI / URL in its docstring) asserts content with nothing backing
it — it should either be **proved** (converted to a `theorem`) or **cited**
(marked a genuine external input). This is the dual of `proof-no-axiom-growth`
(which guards against *adding* axioms): this guards against *leaving provable
or unjustified content as a global axiom*.

```lean
axiom my_identity (x : R) : f x = g x          -- no -- Ref:, looks provable → flag
```

Tiers (agent-confirmed):

- **provable** — Mathlib or a short argument discharges it ⇒ prove it (recipe-1).
- **legitimate-but-uncited** — a genuine external input (deep theorem,
  opaque postulated construction) ⇒ add a `-- Ref:` (recipe-3), do NOT pretend
  to prove it.
- **conditional input** — belongs as a `[Class]` hypothesis on downstream
  consumers (recipe-2 / §3b-cond) rather than a global axiom.

Do **not** flag an axiom that already carries a `-- Ref:` / citation — resting
on a cited upstream result is sound.

## Why `proof-statement-integrity` misses all of these

Per the QA registry, `proof-statement-integrity` is `automated: false`
(agent-checked) and verifies exactly two things: (i) the provable-kind signature
is **unchanged** vs the prior commit (or an author-approved restatement appears
in the same `.md` + `.ts` diff); (ii) `lean_verify` shows no `sorryAx` /
unexpected axioms. A self-assuming projection satisfies **both** — the signature
is the intended one, and there is no `sorry`/axiom. Vacuity is a *semantic*
property of the proof term, invisible to a signature-diff + axiom sweep. Hence a
separate, agent-checked criterion family.

## Legit vs. anti — the discriminators

Do **not** flag these legitimate patterns:

- **§3b-cond conditional-class** where the proof **composes** multiple class
  fields or **applies lemmas** to *derive* the conclusion — `Iff.intro h.fwd
  h.bwd`, `h.step1.trans h.step2`, `by rw [h.a]; exact h.b`, `by linarith
  [h.x, h.y]`. The class fields encode *hypotheses*; the theorem *derives*. This
  is exactly AGENTS.md §3b-cond item 5's required shape.
- **Honest named axiom with `-- Ref:`** for a genuine external input, where
  downstream theorems **`obtain`/consume** it rather than re-assuming the
  conclusion. Resting on a cited upstream axiom is sound; smuggling the
  conclusion into a local field is not.
- **A field that is a genuine hypothesis** the theorem then *uses*.
- **Unused hypothesis kept for family uniformity** (the agent should confirm the
  statement is non-trivial despite the unused binder).

The single discriminator for #1: does the proof **return a conclusion-typed
field verbatim** (anti) or **derive the conclusion from hypothesis-typed fields**
(legit)? `obtain ⟨…⟩ := upstream; <derivation>` is legit; `:= d.<conclusion>` is
not.

## Sibling-resolution stubs — delete shadows, flag placeholders (do NOT bless)

A **sibling-resolution stub** is a content-block `.lean` sibling whose body is
`theorem foo : True := trivial` with a docstring `**Sibling-resolution stub** …`.
The criterion evaluates the decl the block's `lean.ref` **resolves to**
(`export-json.ts`: sibling **first**, then `<lakeRoot>/<Decl/Path>.lean`), so a
trivial sibling *shadows* the real library decl. Handle each by class — never
silently bless a bare `: True`:

- **Shadow** — the ref's decl-path resolves to a real library decl. The stub is
  pure shadowing: **delete it** (the block then resolves to the real proof). Do
  NOT exempt. See the **no-shadowing-stubs** directive in AGENTS.md §0a.
- **Genuine placeholder** — no library formalisation exists. The block is an
  *unformalised* proposition asserting `: True` — **flag it** (honest fix: state
  the real proposition with `sorry` + `-- Ref:`, or demote to `conjecture`).
- **`definition`** blocks require a sibling — it must carry the **real**
  formalisation, never `: True`.

Detect a stub by: docstring `Sibling-resolution stub`, OR body `: True := by
trivial` / `:= trivial`. A stub *corrupted* into a `: True ∧ True := ⟨d.f1,…⟩`
projection is the self-assuming-projection anti-pattern — restore the honest
stub, then apply the shadow/placeholder rule above.

## Fix recipe (priority order)

When a vacuous proof is confirmed, make it **honest** — do not hand-wave a fake
proof:

1. **Genuine proof (best).** Restructure so the carrier's fields are genuine
   *hypotheses* (or come from a cited upstream result via `obtain`), and the
   theorem **derives** the conclusion (the cited import is load-bearing).
2. **§3b-cond conditional-class.** If the result depends on a genuine conjecture,
   axiomatise the conjecture's **inputs** as a `class`, carry it as an explicit
   `[Instance]` hypothesis, and **derive** the conclusion (non-degenerate per
   §3b-cond item 5). Add the conditional banner to the `.md`.
3. **Honest named axiom with `-- Ref:`.** If the content is a legitimate external
   input, make it a clearly-named `axiom` with a bibliographic `-- Ref:` and have
   downstream theorems **consume** it.
4. **Demote the block kind `theorem` → `conjecture`.** If the statement is
   genuinely unproved and not yet a rigorous conditional, change the `.ts` kind
   to `conjecture` (and update `.md`). This is a claim change — surface it to the
   owner before committing.

**Never** the batch anti-fix: wrapping the conclusion in a structure field and
projecting it. That converts a *visible* gap (`sorry`) into an *invisible* one.

## Detection heuristic (candidate grep → agent confirmation)

0. **Runnable scanner (preferred).** `bun run
   content/pipeline/lean-vacuity-axiom-audit.ts` walks every `.lean` (library
   trees + content-block siblings), strips comments/docstrings, and emits a
   witness JSON (`docs/audits/<date>-lean-vacuity-axiom-audit.json`) keyed by
   path, with one entry per category (#1–#6 above). It exempts sibling-stub
   *shadows* (real formalisation resolvable via `lean.ref` / docstring) and
   field *compositions* that derive. `--write-sidecars` upserts
   `reviewer.kind="script"` candidate entries on the owning blocks' `.qa.json`.

1. **Cheap candidate filter** (regex):
   - proof body `:=\s*\w+\.\w+\s*$`, `:=\s*⟨[^⟩]*\.\w+[^⟩]*⟩`, `:= by\s+exact\s+\w+\.\w+`, `:= ctx\.`, `:= d\.`, `:= h\.`
   - conclusion `: True`, `: .* = .*` where both sides identical, `holds : Prop`
   - `decide`, `native_decide`
   - structures whose field names are `claim_*`, `exists_*`, `*_holds`, `result`, `property`, `spec`, `main`
2. **Agent confirmation** (this skill / `lean-proof-review`): open the file, read
   the carrier's definition, check whether the projected field's type unifies
   with the goal (up to bound variables), and whether sibling fields are used.
   Apply the legit-vs-anti discriminator above. Record verdict + evidence.

### 7. `: True` carrier field — `proof-claims-unencoded` / pattern `true-class-field`

A `class`/`structure` field typed literally `: True` (or `True ∧ … ∧ True`, or a
`Prop := True` default) carries **zero** content — every instance satisfies it,
so a downstream consumer that takes the field as a hypothesis assumes nothing.
This is the *field-level* analogue of a `: True` conclusion, and it is the gap
that the empty-prop-carrier (zero-field) and claims-unencoded (≥2 enumerated
bullets) detectors both structurally miss: a **single** `: True` field on an
otherwise-populated carrier. Worst case: a conjecture carrier with `holds : True`
that a trivial `instance … := ⟨⟩` then "closes" (fabricating a content-free
instance of an open conjecture). **Honest fix:** encode the real property as the
field type, or — for genuinely-open infrastructure Mathlib lacks — annotate the
field `opaque marker` / `@marker` (then it is **exempt-but-tracked**), never
leave a bare un-annotated `: True`.

> **Escalation signal on trivial-true.** A `placeholder-true` /
> `def-disguised-true` whose docstring carries theorem-assertion language
> (`**Theorem**` / `**Lemma**` / `**Proposition**`) and is **not** a conjecture
> carrier should be annotated *"docstring asserts a provable claim while the Lean
> concludes `True`"* — a real claim hidden behind a tautology, distinct from an
> honest open conjecture.

## Agent-inspection ledger — making agent confirmation mandatory

The detector is **high-recall by design**; the legit-vs-genuine call requires
agent inspection (a `decide` on a true concrete fact is legit; a `: True` hiding
a real theorem is not). For **content blocks** that verdict lands on the
`<block>.qa.json` sidecar (above). But a **standalone library `.lean`**
(`content/**/lean/<Paper>/**/*.lean` with no `.ts`/`.md` sibling) has **no
sidecar**, so an agent verdict has nowhere durable to live — detection stays
purely machine, and a one-off triage doc can silently mis-call a candidate
"legit". The **review ledger** closes that gap:

```bash
# Seed/refresh: new + file-changed candidates become `needs-agent`.
bun run content/pipeline/lean-vacuity-axiom-audit.ts content/<paper> \
  --review-ledger docs/audits/lean-vacuity-review-ledger.json
# Enforce: exit 1 if ANY non-exempt candidate lacks a FRESH agent verdict.
bun run content/pipeline/lean-vacuity-axiom-audit.ts content/<paper> \
  --check-ledger docs/audits/lean-vacuity-review-ledger.json
```

- **Ledger** (`lean-vacuity-review/v1`, committed): keyed by
  `<relpath>::<decl>::<category>`; each entry records the agent `verdict`
  (`genuine` | `legit` | `advisory` | `needs-agent`), optional `disposition` /
  `evidence` / `reviewer`, and the **`.lean` sha at review time**.
- **Staleness = re-review.** If the `.lean` changes after a verdict, `file_sha`
  drifts and `--review-ledger` resets the entry to `needs-agent`
  (preserving `stale_prev_verdict`). A verdict only counts while it matches the
  file it was made against — the machine cannot bless a candidate, only an agent
  verdict can, and only while fresh.
- **Resolved candidates are pruned** automatically (a fixed file no longer
  flags, so its key drops out).
- **The agent workflow:** run `--review-ledger` to materialise the queue, inspect
  each `needs-agent` entry per the legit-vs-anti discriminators above, write the
  verdict (+ disposition/evidence) into the ledger, fix every `genuine` /
  `advisory` candidate, then `--check-ledger` must pass. This is the
  "agent inspection, not just machine" gate.

## QA criteria (sidecar params) — wiring

Mirrors the existing `proof-statement-integrity` model (Agent-checked,
`automated: false`). Per-block sidecar `<block>.qa.json` gains a
`criteria["proof-no-<x>"]` array of `QaCriterionEntry` with `reviewer.kind =
"agent"`.

| criterion id | status | anti-pattern |
|---|---|---|
| `proof-no-self-assuming-projection` | active | #1 circular projection |
| `proof-no-trivial-true` | active | #2 tautological conclusion |
| `proof-no-false-premise` | active | #3 vacuously true |
| `proof-no-unused-hypotheses` | active | #4 weakened statement |
| `proof-no-decide-masking` | active | #5 evaluator masking (`native_decide`) |
| `proof-no-provable-axiom` | active | #6 uncited / provable axiom |

**Minimal wiring:**

1. `content/pipeline/qa-criteria-registry.ts` — add a `QaCriterionDefinition`
   to the `PROOF` array (it auto-flows into `QA_CRITERIA_REGISTRY`,
   `PROOF_WATCHER_CRITERIA`, and the `proof` watcher axis). Use:
   `domain: "proof"`, `default_severity: "critical"`, `depends_on: ["lean"]`,
   `automated: false`, `applies_to: ["theorem","lemma","proposition","corollary"]`.
2. `.claude/skills/local/proof-integration-watcher.md` — add a dispatch row per
   criterion → `lean-proof-review` (logic-validity review type).
3. No new checker file: `qa-sweep` marks `automated: false` criteria
   `needs-agent`; `proof-integration-watcher` dispatches an agent that runs this
   skill and writes the `reviewer.kind="agent"` sidecar entry.

`bun run content/pipeline/qa-sweep.ts <block-path> --only proof-no-self-assuming-projection`
marks the entry `needs-agent`; the agent then fills the verdict.

## Audit + drain workflow

1. **Audit:** grep candidates across all `.lean` (library trees + content-block
   siblings), agent-confirm, record findings in
   `docs/audits/<date>-lean-vacuous-proof-audit.md`.
2. **Classify:** assign each confirmed instance a fix from the recipe (1–4).
   Recipe-4 (demote to conjecture) items are claim changes — list them for owner
   sign-off, don't auto-demote.
3. **Drain:** fix file-by-file (or small directory batches), microcommit per
   AGENTS.md branch+PR policy, verify each with `lean`-direct against the
   restored cache oleans (per `lean-environment-setup.md`).
4. **Backfill sidecars:** run `qa-sweep --only <criterion>` on the drained blocks
   so the green verdict is recorded.
