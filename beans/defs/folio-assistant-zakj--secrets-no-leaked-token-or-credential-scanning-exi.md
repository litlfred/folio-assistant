---
# folio-assistant-zakj
title: 'SECRETS: no leaked-token or credential scanning exists at all, in a repo that publishes a site and an npm package'
status: in-progress
type: task
priority: high
parent: folio-assistant-3x2n
created_at: 2026-09-21T21:55:16Z
updated_at: 2026-09-21T21:55:16Z
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
- [ ] A finding is dispatched and adjudicated per `0grh` — **not needed and
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
