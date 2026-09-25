---
name: publish-verification
description: >-
  Verify what a publish produced BEFORE it is deployed, and alert the
  publication manager whenever any step after the publish button fails —
  the verifier set, how to add a verifier, what is in scope, and how the
  publication manager triages the one alert.
capability: review
package: folio-core
---

# Publish verification, and the one alert

Bean `vigi`. Owner, 2026-09-23: *"a set of post processing tools for
verification that a failure triggers an alert to the publisher manager …
new sub-process"*, run **before deployment**; and *"every step post 'push
the publish button' should be same"*.

## The two processes

- **`publish-verification.bpmn`** — the verifier set over the built tree,
  between the export and the deploy. Pass, fail, or could-not-tell; the
  caller deploys only on a pass.
- **`publish-alert.bpmn`** — ONE alert, called from every failure edge in
  `docs-site-publish.bpmn`: an incomplete export, a verification failure, a
  failed deploy, a lost preview. It reaches the role that already owns the
  release: the **publication manager**.

## The verifier set

`bun run publish:verify -- --dir <built site> [--report out.md]` —
`scripts/publish-verify.ts`. Exit 0 pass · 1 a finding · 2 could not tell.
The caller treats 1 and 2 alike: an unverified release is not a verified one.

Each verifier is one entry in `VERIFIERS`: an id, the question it asks, and a
function from the directory to findings. **Adding a verifier is adding an
entry**; the report, the exit code and the alert need no change. Give it a
test that builds a document to break it, as `publish-verify.test.ts` does.

**`jsonld-expand`** is the first: every JSON-LD document of ours is expanded
by a real processor (`jsonld.js`, network refused). A key the `@context` does
not declare is DROPPED by a processor, silently — the first run found the
vocabulary losing `layer` on all 159 terms and the fsh-guts export losing
`skipped`.

## What is in scope

A document is ours when its `@context` names our content context or binds a
namespace in the `own-namespaces` code list. Everything else in the tree —
a WHO IG's ingested artefact index — is counted as out of scope, reported,
and never able to block the release. The same scoping as bean `2j09`.

## Triage, for the publication manager

The alert is a tracking issue labelled `publication-manager`: opened on the
first failure, **commented on** for each later one (a comment notifies; an
edit does not), closed by the next clean publish. The issue says which step
failed and whether the site deployed:

- **Nothing was deployed** (the export, or verification) — the live site is
  the previous publish. Hold, or fix forward.
- **The site deployed** and something after it failed (a lost preview) — it
  is live. Say so in the issue before fixing.

The label names the role, not a person: no actor declares a GitHub account
for `publication-manager`. Watching the label is how a person takes the role.
