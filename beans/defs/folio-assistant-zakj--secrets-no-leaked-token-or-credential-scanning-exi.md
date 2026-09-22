---
# folio-assistant-zakj
title: 'SECRETS: no leaked-token or credential scanning exists at all, in a repo that publishes a site and an npm package'
status: completed
type: task
priority: high
created_at: 2026-09-21T21:55:16Z
updated_at: 2026-09-22T10:58:19Z
parent: folio-assistant-3x2n
---

## Measured 2026-09-21 — there is none

No `gitleaks`, no `trufflehog`, no `detect-secrets`, no GitHub secret-scanning
step, no pre-commit hook. Every hit for `secret` across `.github/workflows/` is
`secrets.GITHUB_TOKEN` being *consumed*, which is the opposite of a scan.

This repository publishes a Pages site from generated content, publishes an npm
package with provenance (`hecke-engine-wasm.yml`), ingests foreign corpora into
`uploads/`, and commits agent-authored sidecars in bulk. Each is a path by
which a credential reaches a committed file, and none of them is watched.

## Evidence-based, not a tool recommendation

The ask is to **document evidenced-based best practice**, so this bean is not
done by adding a scanner. It is done by establishing, with measurement over
this repository's own history:

- which of the candidate mechanisms (pre-commit, CI gate, push protection,
  historical sweep) catch which of the paths above, and which catch none
- the false-positive cost on this corpus specifically — a repo full of hashes,
  base64 witnesses and `@id` URIs is adversarial input to every entropy-based
  detector, and a gate nobody can keep green is a gate that gets disabled
- whether a historical sweep is in scope at all, or whether the answer is
  "from here forward" plus a rotation note

## Done when

- [x] The paths are enumerated and each is covered or out of scope **with its
      reason**, in the module's own docstring — six paths, one deliberately out
      of scope (below)
- [x] The false-positive rate is measured on this corpus BEFORE gating, and
      the number decided the design (below)
- [x] A finding is dispatched and adjudicated per `0grh` — **not needed and
      deliberately not built.** A prefix-anchored match is deterministic: the
      string either is a `ghp_` token or it is not. Dispatching an adjudicator
      to confirm a regex would be ceremony, and `0grh` exists for judgements,
      not for greps. This becomes live the day an entropy or heuristic
      detector is added, and the measurement below says why that day is not
      today
- [x] Third state: `could-not-scan` exits **2** and outranks clean. Proved by
      accident — the first run reported *"could not scan: package.json"*,
      because a single-file root is not walkable. The refusal was right and
      the cause was a bug; both are fixed and the state is tested

## The measurement that decided the design

The bean's constraint was to measure precision before gating, because this
corpus is adversarial input to every entropy detector. It is worse than that.

Shannon entropy > 3.5 bits/char on tokens of 20+ characters, over the same
roots:

| | |
|---|---|
| files | 3,614 |
| high-entropy tokens | **68,337** |
| credentials among them | **0** |
| false-positive rate | **100 %** |

43,405 are in `.json` — the committed QA sidecars, whose 12-char hashes are the
whole point of the file. But the shape of the rest is the real lesson:
`source=orphan-branch`, `folio-assistant/scripts/lake-cache`,
`content/quantum-observable-universe/lean`. **Ordinary hyphenated identifiers
clear the threshold**, so raising it does not rescue the approach — it only
moves an arbitrary line.

So the detector is **prefix-anchored**: twelve patterns, each matching a
credential format that announces itself. On the real tree: **3,691 files,
0 findings, 0 false positives, 0.76 s.** Falsified by planting a `ghp_` token,
which it names and redacts, and removing it, which turns it green.

## Out of scope, said rather than implied

**Git history.** A sweep of past objects is a different job with a different
remedy — rotation, not deletion — and claiming it here would be the over-claim
this gate exists to avoid. From here forward, and the docstring says so.

## Summary of Changes — closed on EVIDENCE, 2026-09-22

Closed by a session that did **not** write this work, per `bean-coordination`
§"Closing a bean whose work has already landed": **evidence, not authorship.**
Everything below was re-derived rather than taken from the bean's own prose.

| claim | how it was re-derived |
|---|---|
| the scanner exists | `cat-harness/scripts/check-secret-leaks.ts`, with `scripts/tests/secret-leaks.test.ts` beside it |
| it is a real gate, not just a script | `package.json:116` registers `check:secret-leaks`, and `.github/workflows/code-quality-gates.yml:812` runs it — so CI gates on it |
| it runs clean | 3,928 text files across 5 declared roots, **0 findings**, exit 0 |
| **it can actually fire** | planted a fake `ghp_` token in a scanned root: it reported `github-pat-classic`, **redacted the value** in its own output (`ghp_0123…wxyz`), and exited **1**. Removed; tree clean |

The redaction is worth naming: a scanner that prints the credential it found has
copied it into a CI log, which is a second leak. This one truncates.

It also prints its own scope on **every clean run** — prefix-anchored by design,
entropy measured unusable here, git history deliberately out of scope with
rotation named as the remedy. That is the third-state discipline applied to a
green result: the run says what it did *not* look at, so a pass cannot be read
as more coverage than it is.

### The last checkbox

*"A finding is dispatched and adjudicated per `0grh`"* was the only unticked
item, and its own text already resolved it: **not needed and deliberately not
built**, because a prefix-anchored match is deterministic — the string either is
a `ghp_` token or it is not, and dispatching an adjudicator to confirm a regex
would be ceremony. Ticked as resolved rather than left hanging, with the
condition that revives it recorded there: the day an entropy or heuristic
detector is added.
