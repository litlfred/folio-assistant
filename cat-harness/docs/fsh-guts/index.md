---
title: "fsh-guts — the trashcan that is kept"
description: "Deprecated and throwaway structured content, kept rather than deleted. Not published to the canonical site."
---
<style>
.fg-tag{display:inline-block;padding:.05rem .4rem;border-radius:3px;font-size:.75rem;
  font-weight:600;white-space:nowrap;border:1px solid currentColor}
.fg-ok{color:#0d6e5e}
.fg-side{color:#6b5b95}
.fg-gap{color:#a8430f}
</style>

This page is **not on the published site**. It is declared
`publish: "staging-only"`, so `compose-docs.ts` withholds it from the canonical
deploy and includes it in a local build or a `STAGING/<slug>/` preview.

`fsh-guts` holds content that was **relocated rather than deleted**. The rule
it makes enforceable is the one `AGENTS.md` states for beans and means
generally: a scrapped item stops the next agent re-entering a dead end, while
a deleted one cannot be told from an accident. Delete here means relocate, and
relocate is reversible.

**28 file(s)** across 2 group(s). Each links to the file itself —
this page indexes what is kept, it does not republish it.

## Does each file declare itself?

The graph's declaration says files carry `$schema: folio-fsh-guts/v1`. Three states,
kept apart on purpose: a `.py` or `.ts` script **cannot** carry YAML front
matter, so a tagged `.md` sibling is the contract met by the only mechanism
open to it. Filing that beside a markdown file that simply omitted the line
would make the format's limit and somebody's omission look the same.

| state | files | what it means |
|---|---|---|
| <span class="fg-tag fg-ok">declared</span> | 18 | carries the tag itself |
| <span class="fg-tag fg-side">via sidecar</span> | 4 | a script, described by a tagged `.md` sibling |
| <span class="fg-tag fg-gap">undeclared</span> | 6 | **neither** — a gap, not a format limit |

The 6 undeclared are listed below with the rest rather than in a
separate section: they are part of the corpus, and a gap hidden behind a
summary count is the failure this table exists to avoid.

## retired

12 file(s).

| file | what it is | declares itself |
|---|---|---|
| [remote-stubs-package.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/remote-stubs-package.md) | `remote-stubs`, as it was at retirement | <span class="fg-tag fg-ok">declared</span> |
| [skill-definition-roles.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/skill-definition-roles.md) | `SkillDefinition.roles` — retired 2026-09-20 | <span class="fg-tag fg-ok">declared</span> |
| [skill-instructions-AGENTS.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/skill-instructions-AGENTS.md) | AGENTS.md — kg-navigation | <span class="fg-tag fg-ok">declared</span> |
| [skill-instructions-bootstrap-graph-emission.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/skill-instructions-bootstrap-graph-emission.md) | Emitting bootstrap's own graph | <span class="fg-tag fg-ok">declared</span> |
| [skill-instructions-bootstrap-graph-publication.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/skill-instructions-bootstrap-graph-publication.md) | Publishing bootstrap's graph | <span class="fg-tag fg-ok">declared</span> |
| [skill-instructions-bootstrap-kg-navigation.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/skill-instructions-bootstrap-kg-navigation.md) | Reading a knowledge graph before you have anything | <span class="fg-tag fg-ok">declared</span> |
| [skill-instructions-confirm-harness.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/skill-instructions-confirm-harness.md) | Which harness, and where | <span class="fg-tag fg-ok">declared</span> |
| [skill-instructions-discussion.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/skill-instructions-discussion.md) | discussion — settling what an agent cannot read off disk | <span class="fg-tag fg-ok">declared</span> |
| [skill-instructions-log-message.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/skill-instructions-log-message.md) | Logging what you are doing | <span class="fg-tag fg-ok">declared</span> |
| [skill-instructions-root-readme.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/skill-instructions-root-readme.md) | The root README, and the one fact it must carry | <span class="fg-tag fg-ok">declared</span> |
| [skill-roles-front-matter.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/skill-roles-front-matter.md) | `roles:` in skill front matter — the whole record | <span class="fg-tag fg-ok">declared</span> |
| [translations-fr-agent-onboarding.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/translations-fr-agent-onboarding.md) | Intégration de l'agent | <span class="fg-tag fg-ok">declared</span> |

## scripts

16 file(s).

| file | what it is | declares itself |
|---|---|---|
| [computations-refactor-fixers.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/computations-refactor-fixers.md) | The six computations-refactor fixers | <span class="fg-tag fg-ok">declared</span> |
| [extract-lean-blocks.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/extract-lean-blocks.md) | `extract-lean-blocks.py` | <span class="fg-tag fg-ok">declared</span> |
| [extract-lean-blocks.py](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/extract-lean-blocks.py) | Declaration start patterns | <span class="fg-tag fg-side">via sidecar</span> |
| [fix-cross-cluster-witness-loads.py](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/fix-cross-cluster-witness-loads.py) | — | <span class="fg-tag fg-gap">undeclared</span> |
| [fix-env-injection.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/fix-env-injection.md) | `fix_env_injection.py` | <span class="fg-tag fg-ok">declared</span> |
| [fix-moved-scripts.py](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/fix-moved-scripts.py) | — | <span class="fg-tag fg-gap">undeclared</span> |
| [fix-root-script-shim.py](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/fix-root-script-shim.py) | Match a substrate import anywhere — including indented / lazy | <span class="fg-tag fg-gap">undeclared</span> |
| [generate-docs.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/generate-docs.md) | `generate-docs.ts` | <span class="fg-tag fg-ok">declared</span> |
| [generate-docs.ts](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/generate-docs.ts) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [materialize_iw_queue.py](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/materialize_iw_queue.py) | TWO ROOTS, because the two directories below belong to different ones. | <span class="fg-tag fg-gap">undeclared</span> |
| [migrate-cluster-phase.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/migrate-cluster-phase.md) | `migrate-cluster-phase.py` | <span class="fg-tag fg-ok">declared</span> |
| [migrate-cluster-phase.py](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/migrate-cluster-phase.py) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [migrate-probes-phase1.py](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/migrate-probes-phase1.py) | — | <span class="fg-tag fg-gap">undeclared</span> |
| [split-docs-page.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/split-docs-page.md) | `split-docs-page.py` | <span class="fg-tag fg-ok">declared</span> |
| [split-docs-page.py](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/split-docs-page.py) | Drop the page's own H1 and its TOC block; the emitter re-creates both. The | <span class="fg-tag fg-side">via sidecar</span> |
| [wire_stale_claims.py](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/wire_stale_claims.py) | Match a `kind(...)` builder call followed by a single object literal. | <span class="fg-tag fg-gap">undeclared</span> |
