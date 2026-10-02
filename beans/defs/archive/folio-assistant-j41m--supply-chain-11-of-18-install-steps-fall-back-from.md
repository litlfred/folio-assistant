---
# folio-assistant-j41m
title: 'SUPPLY CHAIN: 14 install steps defeat or skip their own pin (11 fall back from --frozen-lockfile, 3 never pinned at all), and nothing asks whether a dependency is known-vulnerable'
status: completed
type: task
priority: high
created_at: 2026-09-21T21:55:16Z
updated_at: 2026-09-22T10:46:09Z
parent: folio-assistant-3x2n
---

## Measured 2026-09-21

**11 of 18 install steps defeat their own pin.**

    bun install --frozen-lockfile || bun install
    bun install --frozen-lockfile 2>/dev/null || bun install

in `lean_ci`, `docs-site`, `publish`, `qa-sweep`, `feature-staging` (×3),
`blueprint`, `lean-build`, `qa-sweep-nightly`, `section-title-audit`.

`--frozen-lockfile` exists to fail when the lockfile does not satisfy the
manifest. The fallback converts exactly that failure into an unpinned resolve,
silently, with a green step. **A check that degrades to a pass when it fails is
not a check** — the same shape as the five defects fixed elsewhere in this
session, in supply-chain clothing.

Seven steps pin correctly and have no fallback (`upstream-pins`, `ci-health`,
`health-check`, `code-quality-gates` ×2, `jsonld-gen-check`,
`pr-checks-present`), which is the evidence that the fallback is not required
by the toolchain.

**No dependency audit of any kind** — no `npm audit`, `bun audit`, OSV or
equivalent. **No `.github/dependabot.yml`.**

## The honest counter-argument, to be measured not assumed

The fallback was presumably added because `content/` is a submodule or a
generated tree whose lockfile is not always present, and a hard failure there
blocks unrelated work. If so the fix is a **guard on presence** — pin when a
lockfile exists, and report *no lockfile* as its own state — not an unpinned
retry. That distinction is this bean's actual deliverable.

## Done when

- [x] Each of the 11 sites is classified — **two classes, not one**, and the
      second is worse than this bean recorded (below)
- [x] `no lockfile` is a distinct reported state — the guard emits
      `::notice::` for no folio, pins when a lockfile is there, and
      `::warning::` when it installs unpinned. Three states, never silence
- [x] `check:lockfile-pinning` holds the line, registered in `package.json`
      and `code-quality-gates.yml`. Falsified against the REAL workflows:
      restoring one fallback turns it red and names the file and line
- [x] Whether an audit step earns its place — **measured, put to the owner,
      and answered 2026-09-22: advisory step AND Dependabot, both.**
      `check:dependency-advisories` reports on every PR and blocks nothing;
      `.github/dependabot.yml` turns the same advisories into reviewable PRs.
      Neither gates a merge — see "The ruling" below

## CORRECTION, 2026-09-22 — "11 of 18 install steps" had the wrong denominator

Re-derived adversarially in the spirit of `w4tq`, whose lesson is *counting
things that match a SHAPE rather than things that satisfy the CONTRACT*. This
bean did it one workflow over.

**18 was the count of LINES carrying `--frozen-lockfile`, not of install
steps.** 25 lines mention `bun install`. The eleven and the shape of the fix
are unaffected — but choosing that denominator excluded, and therefore hid,
the rows it did not cover:

**Three install steps that never pinned at all.**

| site | what it is |
|---|---|
| `release-folio-assistant.yml:76` | `cd $PKG_DIR && bun install` — `PKG_DIR` is `.`, where `bun.lock` exists. **The release workflow**, which is the worst possible place for an unpinned resolve. **Fixed.** |
| `publish.yml:570` | `bun install \|\| npm install` — and the step's `working-directory` may not exist. Baselined; bean `u9r9` |
| `discoverability-docs.yml:210` | same. Baselined; bean `u9r9` |

`check:lockfile-pinning` now asks **both** questions and keeps them apart: a
pin that **degrades** fails always and is never baselined; an install with
**no pin** is baselined and a NEW one fails. The split is not squeamishness —
a degrading pin has no defensible instance, while an unpinned install
sometimes IS right, which is what the guard's own `::warning::` branch does.

Both branches falsified: a new unpinned install fails by name, a restored
fallback fails by file and line, and removing each turns it green.

**The lesson is the denominator, not the count.** A ratio picks its own
denominator, and a denominator chosen from the numerator's shape cannot report
what it excluded.

## Two classes, and class A is not about lockfiles at all

**Class A — 4 sites** (`lean_ci`, `publish`, `blueprint`, `lean-build`):

    cd content && bun install --frozen-lockfile 2>/dev/null || bun install

In bash, when `cd content` fails the `&&` short-circuits with **cd's** exit
status, so `||` fires and `bun install` runs in the **current** directory —
the repository root. `2>/dev/null` hides cd's *"No such file or directory"*.

**This repository has no `content/`.** So those four steps silently installed
the wrong project's dependencies, unpinned, and reported success. Verified by
running the construction, not by reading it.

**Class B — 7 sites** at the repository root, where `bun.lock` exists. Here the
fallback is purely the defeated pin. Seven OTHER steps pin with no fallback,
which is the evidence it was never load-bearing — so class B simply lost it.

## The audit question, measured

| | |
|---|---|
| direct dependencies | 19 |
| direct devDependencies | 9 |
| resolved packages in `bun.lock` | ~373 |
| declared at an **exact** version | **1 of 28** |
| `bun.lock` | 87 KB |

**The finding is the 1 of 28, not the 373.** A lockfile pins the resolved tree,
so 373 transitive packages are reproducible — but 27 of 28 direct dependencies
are declared as ranges, which means the lockfile is the *only* thing holding
them, and `bun install` without `--frozen-lockfile` silently moves them. That
is exactly what the 11 fallbacks were doing.

So the pin fix above is worth more here than an audit step would be, and an
audit's value is a separate question from its noise cost, which nobody has
measured on this corpus. **Recorded for the owner rather than acted on.**

## The ruling, 2026-09-22 — advisory step AND Dependabot, both

Put to the owner with the measurement rather than a recommendation dressed as
one. The answer was **option 1 + option 3**: a warn-only audit step *and*
Dependabot configured as a real tool, not as a hand-wave at "shift the work".

Both were shipped. They answer **different questions**, and collapsing them
into one mechanism would have lost one of the answers:

| | question | when it speaks |
|---|---|---|
| `check:dependency-advisories` | is anything we depend on known-vulnerable **today, on this PR**? | every PR |
| `.github/dependabot.yml` | what would **fixing** it look like? | weekly, and immediately for a security advisory |

**Neither gates a merge.** That is the decision, not an omission: a hard gate
on advisories hands a transitive advisory nobody can patch the power to red
every PR until somebody adds a suppression — and the suppression is what rots.

### The state that mattered was not "found" vs "not found"

A warn-only step exits 0 in every state, so **the exit code carries no
information at all**. Everything therefore rests on what it *prints*, and this
workflow has already paid for getting that wrong once: its own header records
the ruff step that *"warned about the missing paths and exited 0, so the step
reported a clean baseline it had never computed."*

So the gate reports **three** states and never conflates the outer two:

| state | meaning | rendered |
|---|---|---|
| `clean` | the audit RAN and found nothing | `✓`, **with the package count** |
| `advisories` | it ran and found something | `::warning::` per advisory |
| `undetermined` | it did not produce an answer | `::warning::`, and **never** a `✓` |

`{}` is bun's clean shape and **is** an answer; empty *text* is not. A 502 from
the registry, unparseable output, or packages reported with no readable
advisory are all `undetermined` — because calling any of them clean is the
`dh4f` shape, a clean run reported over what was never examined.

**Falsified, not asserted.** Making `undetermined` render a `✓` turns the suite
red on exactly the assertion that matters (`no undetermined render contains a
tick`), and restoring it turns it green. 15 tests.

### Measured today, and it corrects this bean's own denominator again

`bun audit` on the current tree: **no vulnerabilities**, across **372** resolved
packages. A clean run is evidence about the advisory database, not about the
code — and an advisory not yet published is not one this can see.

**"1 of 28 direct dependencies at an exact version" is the ROOT manifest
alone.** Across all five manifests that carry dependencies it is **40**: root
28, `mcp-server` 5, `block-qa-schema` 4, `scripts/tests` 2, `schemas` 1. The
finding is unchanged — the ranges still dominate — but the denominator was
narrower than it read, which is the *second* time this bean has had to say
that. Recorded here rather than quietly corrected, because the pattern is the
point: a ratio picks its own denominator.

The sixth `package.json`, `cat-harness/viewer`, declares **no** dependencies
and is deliberately **not** a Dependabot directory. Listing it would be a
consumer scanning nothing and reporting a clean run over it.

### One thing this does NOT establish, stated rather than assumed

This repository installs with bun and commits `bun.lock`, and
`check:lockfile-pinning` requires `--frozen-lockfile` to hold. Whether
Dependabot regenerates a **bun** lockfile is a fact about Dependabot that
cannot be established from inside this checkout, so it is not claimed — in the
config or here. If Dependabot's PRs arrive red on `--frozen-lockfile`, that is
the answer rather than a mystery: run `bun install` on the branch and push the
lock.

### Why `github-actions` is in the Dependabot config at all

It is not hygiene. An action is code this repository executes **with its own
token** on every push. `check:workflow-injection` guards what the workflows
themselves do with untrusted input; nothing guarded the actions they call. That
was a supply chain with no eyes on it whatsoever.

## Summary of Changes

Merged as `011ea91` ([#893](https://github.com/litlfred/folio-assistant/pull/893)).

**The lockfile half** (landed earlier): `check:lockfile-pinning` fails any pin
that DEGRADES — `--frozen-lockfile || bun install` — always, never baselined,
because the failure it swallows is the one it exists to raise. An install with
no pin at all is baselined and a NEW one fails. Falsified against the real
workflows: restoring one fallback turns it red and names file and line.

**The audit half** (the owner's ruling, both options): `check:dependency-advisories`
reports on every PR and blocks nothing; `.github/dependabot.yml` turns the same
advisories into reviewable PRs. Neither gates a merge. The warn-only gate keeps
three states apart in its OUTPUT — `clean`, `advisories`, `undetermined` —
because a step that exits 0 in every state has no other channel, and this
workflow already has a recorded case of a step reporting "a clean baseline it
had never computed". Falsified: making `undetermined` render a tick turns the
suite red on exactly that assertion.

Confirmed externally rather than asserted: GitHub's own Dependabot API validated
the config (its check run passed), and the advisory job ran green on a real
runner. Left explicitly open, because this checkout cannot settle it: whether
Dependabot regenerates a **bun** lockfile.

**What this bean got wrong twice, both recorded above rather than quietly
fixed.** Its title's "11 of 18" took the denominator from the numerator's shape
and hid three install steps that never pinned at all. Its "1 of 28 at an exact
version" was the ROOT manifest alone; across all five manifests carrying
dependencies it is 40. A ratio picks its own denominator — `w4tq`'s lesson,
twice in one bean.

---

### Independently re-derived 2026-09-22, and it agreed

A separate session reached this bean through `health`'s
`bean-self-declared-done` finding and re-derived it from scratch, not knowing
#893 had landed. Same verdict, by a different route: `check:lockfile-pinning`
registered in `package.json:96` AND `code-quality-gates.yml:813`;
`check:dependency-advisories` in `package.json:80` and at `:1155`/`:1184`;
`.github/dependabot.yml` present. Registration was checked in **both** places
deliberately — a gate in `package.json` alone is the failure `tyyc` was closed
for.

Worth one line because the two passes were independent: this bean's own
`## CORRECTION` is what made it read as trustworthy on the second pass, which
is the argument for recording a correction rather than quietly fixing it.
