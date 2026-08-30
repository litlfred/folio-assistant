---
# folio-assistant-e1f6
title: 'Sweep: every tool that shells out — does it work on a scaffolded folio, and what does it print when its dependency is missing?'
status: completed
type: task
priority: normal
created_at: 2026-08-29T02:41:13Z
updated_at: 2026-08-30T10:37:02Z
---

Follow-on from p9a2. Two properties per tool: (a) honest reporting when the dependency is absent, (b) actually functional on a folio_init layout.

## Summary of Changes

Follow-on from `p9a2`, which fixed one false pass and suggested asking the same
question of every tool that shells out. Two properties checked per tool:

- **(a) honest reporting** when the dependency is absent, and
- **(b) actually functional** on a `folio_init` layout.

### (a) came back clean

`runPipeline` already guards the missing-script case and `asToolText` renders
it as `⚠️ <error>`. `beans-prime` handles a missing `.beans/`. `check-deps` and
the capability probes report absence. The render tools probe with `hasCommand`
before spawning. **`content_validate` was the only false pass**, and `p9a2`
fixed it. That is a better result than the 2-of-2 base rate suggested.

### (b) was where the damage was

`pipelineScriptPath` resolved `content/pipeline/<script>.ts` against the FOLIO
only — the `qou` layout, where the platform was vendored into the content repo.
Nothing `folio_init` scaffolds has that directory. So **the entire QA, audit,
bibliography and transform surface returned `pipeline script not found`** on
every scaffolded folio.

Honest, unlike `p9a2`'s defect. Still completely inert.

Measured on folio-test, before → after:

    qa_staleness            script not found  →  exit 2   (its own verdict)
    section_title_audit     script not found  →  ok
    defterm_validate        script not found  →  ok
    value_validate          script not found  →  ok
    glossary_candidates     script not found  →  exit 2
    wiring_audit            script not found  →  ok, real report over 12 blocks
    status_sections_audit   script not found  →  ok
    prune_deps              script not found  →  ok
    glossary_check          script not found  →  exit 1
    content_export          script not found  →  ok, 14.5 KB written
    qa_sweep                script not found  →  ok, real criteria JSON

The non-zero exits are the scripts' own findings, not resolution failures —
the distinction `p9a2` built into `pipelineFailedToRun`.

`resolveValidateScript` now delegates to the shared `resolvePipelineScript`;
they were separate copies of the same fallback for exactly one commit, and a
test pins their agreement.

### A third defect, found while verifying the second

`content_export` resolved, ran, and **exited 1**. Cause: `references` and
`referenceMap` are Proxies over an injected registry, so *touching* either
throws when a folio has not configured one — and the paper-level `references`
field is assembled last, so the export did all its work and then died.

A folio with no bibliography is the normal case, not an edge one: a new folio
has no references and `folio_init` scaffolds none.

`validate.ts` already had the right shape — ask `referenceRegistryConfigured()`
rather than catch, so "this folio has no bibliography" stays distinguishable
from "the lookup failed". Applied that to both touch points in `export-json`
(guarding only the one that threw first would have moved the crash to the other
on any folio whose blocks carry `cites[]`), and it now says what it did not
resolve rather than exporting an empty list silently.

### Not done

The bibliography tools (`bib_qa`, `bib_validate`, `references_validate`) were
not exercised — they reach the network and the batch timed out. They go through
`runPipeline`, so they get the resolution fix; whether they behave sensibly
against an empty registry is unverified. Worth a follow-up if a folio starts
carrying references.

Gates: 1181 pass / 0 fail, tsc clean, eslint clean.


## Closed 2026-08-30 — resolution fix verified in the code

Status was `in-progress` with no open items in the body. The claimed fix is
present: `resolvePipelineScript` in `adapters/document/tools/_pipeline.ts`,
used by 3 files, documented to try the folio's own `content/pipeline/` first
and fall back to the platform's.

**What I checked, because it looked wrong at first.** The OLD folio-only
resolver `pipelineScriptPath` is still in that file, still a bare
`join(REPO_ROOT, "content", "pipeline", name)` with no fallback — i.e. exactly
the defect this bean describes. It is **dead**: zero production callers. Its
only references are its own definition and `scripts/tests/qa-tools.test.ts`,
which asserts the old behaviour.

That leftover is not a defect but it is a hazard, and a test pinning a dead
function's behaviour is a test that can never matter — the class
`folio-assistant-6fnb` catalogued. Split out rather than left implicit here.
