---
# folio-assistant-zakj
title: 'SECRETS: no leaked-token or credential scanning exists at all, in a repo that publishes a site and an npm package'
status: todo
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

- [ ] The paths by which a credential can reach a commit here are enumerated
      and each is either covered or explicitly out of scope with a reason
- [ ] The false-positive rate is measured on this corpus before anything gates
- [ ] A finding is dispatched and adjudicated per `0grh`, not self-reported
- [ ] Third state: a scanner that could not run is never reported as clean
