---
$schema: folio-memory/v1
id: do-not-encode-a-rule-against-a-working-setup
label: trap
summary: "never encode an unverified constraint — a rule that refuses a working setup is worse than no rule"
createdAt: 2026-09-19
roles:
  - code-reviewer
  - validation-pipeline
agents:
  - ci-health-watcher
  - platform-boundary-guard
---
Owner, 2026-09-19: **"dont encode rules against a working setup."**

A constraint in a schema, validator or gate is a **refusal**, and the two
ways it can be wrong are not symmetric. A *missing* constraint lets a bad
setup through, and it fails visibly at the point of use with the real error.
A *wrong* constraint refuses a good setup at the gate, with a confident
message asserting the thing is impossible — and nobody investigates a settled
question. Same asymmetry as rendering "could not check" as green.

So an **asserted but unverified** constraint is left OUT of the gate and
written down as an open question. Not encoded "provisionally".

**The test is the evidence, not the confidence.** Encode an entailment of the
mechanism (Pages has no per-file media-type config; air-gapped compute cannot
reach hosted inference) or something measured here with the command shown.
Do not encode "someone said so", or what was true of one account, one plan or
one version.

Worked case: `docs/proposals/deployment-topologies.md` §3 leaves
`private repo` × `github-pages` out of its incompatibility table — issue #363
states it as flatly unavailable, but GitHub has offered Pages on private
repos on paid plans and the account's entitlement was never checked.

The same rule in both lanes: a watcher must not render "could not check" as
green, and a boundary guard must not encode a constraint that refuses a folio
nobody has tried.
