---
title: "fsh-guts — the trashcan that is kept"
description: "Deprecated and throwaway structured content, kept rather than deleted. Not published to the canonical site."
---
<style>
.fg-tag{display:inline-block;padding:.05rem .4rem;border-radius:3px;font-size:.75rem;
  font-weight:600;white-space:nowrap;border:1px solid currentColor}
/* Bean rtuo: light-page inks measured 2.19-2.29:1 on the default dark page
   (#27262b). Dark inks by default; the light scheme keeps the originals. */
.fg-ok{color:#5cd3bd}    /* 8.23:1 on #27262b */
.fg-side{color:#b9a8ec}  /* 7.06:1 */
.fg-gap{color:#f5a070}   /* 7.25:1 */
:root[data-fa-scheme="light"] .fg-ok{color:#0d6e5e}
:root[data-fa-scheme="light"] .fg-side{color:#6b5b95}
:root[data-fa-scheme="light"] .fg-gap{color:#a8430f}
</style>

This page is **not on the published site**. It is declared
`publish: "staging-only"`, so `compose-docs.ts` withholds it from the canonical
deploy and includes it in a local build or a `STAGING/<slug>/` preview.

`fsh-guts` holds content that was **relocated rather than deleted**. The rule
it makes enforceable is the one `AGENTS.md` states for beans and means
generally: a scrapped item stops the next agent re-entering a dead end, while
a deleted one cannot be told from an accident. Delete here means relocate, and
relocate is reversible.

**144 file(s)** across 5 group(s). Each links to the file itself —
this page indexes what is kept, it does not republish it.

## Does each file declare itself?

The graph's declaration says files carry `$schema: folio-fsh-guts/v1`. Three states,
kept apart on purpose: a `.py` or `.ts` script **cannot** carry YAML front
matter, so a tagged `.md` sibling is the contract met by the only mechanism
open to it. Filing that beside a markdown file that simply omitted the line
would make the format's limit and somebody's omission look the same.

| state | files | what it means |
|---|---|---|
| <span class="fg-tag fg-ok">declared</span> | 79 | carries the tag itself |
| <span class="fg-tag fg-side">via sidecar</span> | 57 | a script, described by a tagged `.md` sibling |
| <span class="fg-tag fg-gap">undeclared</span> | 8 | **neither** — a gap, not a format limit |

The 8 undeclared are listed below with the rest rather than in a
separate section: they are part of the corpus, and a gap hidden behind a
summary count is the failure this table exists to avoid.

## at the root

1 file(s).

| file | what it is | declares itself |
|---|---|---|
| [README.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/README.md) | fsh-guts | <span class="fg-tag fg-ok">declared</span> |

## retired

22 file(s).

| file | what it is | declares itself |
|---|---|---|
| [bootstrap-split.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/bootstrap-split.md) | bootstrap and bootstrap-tools, as staged | <span class="fg-tag fg-ok">declared</span> |
| [bootstrap-split.tar.gz](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/bootstrap-split.tar.gz) | — | <span class="fg-tag fg-gap">undeclared</span> |
| [detangle-schema-viewer.html](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/detangle-schema-viewer.html) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [detangle-schema-viewer.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/detangle-schema-viewer.md) | detangle's schema viewer page — retired 2026-09-23 | <span class="fg-tag fg-ok">declared</span> |
| [external-schema-w3c-dcat-3.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/external-schema-w3c-dcat-3.md) | The record, as it was | <span class="fg-tag fg-ok">declared</span> |
| [kg-export-folio-assistant-orphan-sidecar.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/kg-export-folio-assistant-orphan-sidecar.md) | The orphaned `kg-export.@litlfred/folio-assistant` sidecar | <span class="fg-tag fg-ok">declared</span> |
| [library-orphaned-figure-blocks.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/library-orphaned-figure-blocks.md) | Orphaned library figure blocks | <span class="fg-tag fg-ok">declared</span> |
| [library-orphaned-figure-blocks.tar.gz](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/library-orphaned-figure-blocks.tar.gz) | — | <span class="fg-tag fg-gap">undeclared</span> |
| [remote-stubs-package.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/remote-stubs-package.md) | `remote-stubs`, as it was at retirement | <span class="fg-tag fg-ok">declared</span> |
| [skill-capability-front-matter.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/skill-capability-front-matter.md) | `capability:` in skill front matter — the whole record | <span class="fg-tag fg-ok">declared</span> |
| [skill-definition-roles.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/skill-definition-roles.md) | `SkillDefinition.roles` — retired 2026-09-20 | <span class="fg-tag fg-ok">declared</span> |
| [skill-instructions-AGENTS.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/skill-instructions-AGENTS.md) | AGENTS.md — kg-navigation | <span class="fg-tag fg-ok">declared</span> |
| [skill-instructions-bootstrap-graph-emission.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/skill-instructions-bootstrap-graph-emission.md) | Emitting bootstrap's own graph | <span class="fg-tag fg-ok">declared</span> |
| [skill-instructions-bootstrap-graph-publication.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/skill-instructions-bootstrap-graph-publication.md) | Publishing bootstrap's graph | <span class="fg-tag fg-ok">declared</span> |
| [skill-instructions-bootstrap-kg-navigation.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/skill-instructions-bootstrap-kg-navigation.md) | Reading a knowledge graph before you have anything | <span class="fg-tag fg-ok">declared</span> |
| [skill-instructions-confirm-harness.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/skill-instructions-confirm-harness.md) | Which harness, and where | <span class="fg-tag fg-ok">declared</span> |
| [skill-instructions-discussion.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/skill-instructions-discussion.md) | discussion — settling what an agent cannot read off disk | <span class="fg-tag fg-ok">declared</span> |
| [skill-instructions-log-message.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/skill-instructions-log-message.md) | Logging what you are doing | <span class="fg-tag fg-ok">declared</span> |
| [skill-instructions-root-readme.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/skill-instructions-root-readme.md) | The root README, and the one fact it must carry | <span class="fg-tag fg-ok">declared</span> |
| [skill-package-front-matter.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/skill-package-front-matter.md) | `package:` in skill front matter — the whole record | <span class="fg-tag fg-ok">declared</span> |
| [skill-roles-front-matter.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/skill-roles-front-matter.md) | `roles:` in skill front matter — the whole record | <span class="fg-tag fg-ok">declared</span> |
| [translations-fr-agent-onboarding.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/translations-fr-agent-onboarding.md) | Intégration de l'agent | <span class="fg-tag fg-ok">declared</span> |

## samples

1 file(s).

| file | what it is | declares itself |
|---|---|---|
| [xlg2-wpro-trial-original.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/samples/xlg2-wpro-trial-original.md) | Sample-import trial — Publication and information products style guide | <span class="fg-tag fg-ok">declared</span> |

## scripts

16 file(s).

| file | what it is | declares itself |
|---|---|---|
| [computations-refactor-fixers.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/computations-refactor-fixers.md) | The six computations-refactor fixers | <span class="fg-tag fg-ok">declared</span> |
| [extract-lean-blocks.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/extract-lean-blocks.md) | `extract-lean-blocks.py` | <span class="fg-tag fg-ok">declared</span> |
| [extract-lean-blocks.py](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/extract-lean-blocks.py) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [fix-cross-cluster-witness-loads.py](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/fix-cross-cluster-witness-loads.py) | — | <span class="fg-tag fg-gap">undeclared</span> |
| [fix-env-injection.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/fix-env-injection.md) | `fix_env_injection.py` | <span class="fg-tag fg-ok">declared</span> |
| [fix-moved-scripts.py](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/fix-moved-scripts.py) | — | <span class="fg-tag fg-gap">undeclared</span> |
| [fix-root-script-shim.py](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/fix-root-script-shim.py) | — | <span class="fg-tag fg-gap">undeclared</span> |
| [generate-docs.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/generate-docs.md) | `generate-docs.ts` | <span class="fg-tag fg-ok">declared</span> |
| [generate-docs.ts](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/generate-docs.ts) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [materialize_iw_queue.py](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/materialize_iw_queue.py) | — | <span class="fg-tag fg-gap">undeclared</span> |
| [migrate-cluster-phase.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/migrate-cluster-phase.md) | `migrate-cluster-phase.py` | <span class="fg-tag fg-ok">declared</span> |
| [migrate-cluster-phase.py](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/migrate-cluster-phase.py) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [migrate-probes-phase1.py](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/migrate-probes-phase1.py) | — | <span class="fg-tag fg-gap">undeclared</span> |
| [split-docs-page.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/split-docs-page.md) | `split-docs-page.py` | <span class="fg-tag fg-ok">declared</span> |
| [split-docs-page.py](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/split-docs-page.py) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [wire_stale_claims.py](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/scripts/wire_stale_claims.py) | — | <span class="fg-tag fg-gap">undeclared</span> |

## uploads

104 file(s).

| file | what it is | declares itself |
|---|---|---|
| [2504.07199v3.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2504.07199v3.md) | `2504.07199v3.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [2504.07199v3.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2504.07199v3.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [2504.19675v2.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2504.19675v2.md) | `2504.19675v2.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [2504.19675v2.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2504.19675v2.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [2504.21474v1.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2504.21474v1.md) | `2504.21474v1.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [2504.21474v1.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2504.21474v1.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [2508.21620v2.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2508.21620v2.md) | `2508.21620v2.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [2508.21620v2.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2508.21620v2.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [2602.12670v4.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2602.12670v4.md) | `2602.12670v4.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [2602.12670v4.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2602.12670v4.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [2602.12670v4.pdf.extraction.json](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2602.12670v4.pdf.extraction.json) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [2602.12670v4.pdf.extraction.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2602.12670v4.pdf.extraction.md) | `2602.12670v4.pdf.extraction.json` | <span class="fg-tag fg-ok">declared</span> |
| [2605.03537v1.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2605.03537v1.md) | `2605.03537v1.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [2605.03537v1.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2605.03537v1.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [2606.04382v1.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2606.04382v1.md) | `2606.04382v1.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [2606.04382v1.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2606.04382v1.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [2607.14456v1.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2607.14456v1.md) | `2607.14456v1.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [2607.14456v1.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2607.14456v1.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [2607.20636v1.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2607.20636v1.md) | `2607.20636v1.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [2607.20636v1.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2607.20636v1.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [2607.25032v1.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2607.25032v1.md) | `2607.25032v1.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [2607.25032v1.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2607.25032v1.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [2607.25032v1.pdf.extraction.json](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2607.25032v1.pdf.extraction.json) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [2607.25032v1.pdf.extraction.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2607.25032v1.pdf.extraction.md) | `2607.25032v1.pdf.extraction.json` | <span class="fg-tag fg-ok">declared</span> |
| [2608.08453v1.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2608.08453v1.md) | `2608.08453v1.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [2608.08453v1.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2608.08453v1.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [2608.08453v1.pdf.extraction.json](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2608.08453v1.pdf.extraction.json) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [2608.08453v1.pdf.extraction.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/2608.08453v1.pdf.extraction.md) | `2608.08453v1.pdf.extraction.json` | <span class="fg-tag fg-ok">declared</span> |
| [9789240010567-eng.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/9789240010567-eng.md) | `9789240010567-eng.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [9789240010567-eng.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/9789240010567-eng.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [9789240081949-eng.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/9789240081949-eng.md) | `9789240081949-eng.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [9789240081949-eng.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/9789240081949-eng.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [9789240093362-eng.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/9789240093362-eng.md) | `9789240093362-eng.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [9789240093362-eng.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/9789240093362-eng.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [9789240120747-eng.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/9789240120747-eng.md) | `9789240120747-eng.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [9789240120747-eng.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/9789240120747-eng.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [9789241509510_eng.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/9789241509510_eng.md) | `9789241509510_eng.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [9789241509510_eng.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/9789241509510_eng.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [9789241511766-eng.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/9789241511766-eng.md) | `9789241511766-eng.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [9789241511766-eng.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/9789241511766-eng.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [Agent-Skill-best-practices-Gemini-CLI.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/Agent-Skill-best-practices-Gemini-CLI.md) | `Agent Skill best practices - Gemini CLI.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [Agent-Skill-best-practices-Gemini-CLI.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/Agent-Skill-best-practices-Gemini-CLI.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [Agent-Skill-best-practices-Gemini-CLI.pdf.extraction.json](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/Agent-Skill-best-practices-Gemini-CLI.pdf.extraction.json) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [Agent-Skill-best-practices-Gemini-CLI.pdf.extraction.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/Agent-Skill-best-practices-Gemini-CLI.pdf.extraction.md) | `Agent Skill best practices - Gemini CLI.pdf.extraction.json` | <span class="fg-tag fg-ok">declared</span> |
| [Agent-Skills-Google-Antigravity-Docs.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/Agent-Skills-Google-Antigravity-Docs.md) | `Agent Skills - Google Antigravity Docs.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [Agent-Skills-Google-Antigravity-Docs.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/Agent-Skills-Google-Antigravity-Docs.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [Best-Practices-Google-Antigravity-Docs.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/Best-Practices-Google-Antigravity-Docs.md) | `Best Practices - Google Antigravity Docs.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [Best-Practices-Google-Antigravity-Docs.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/Best-Practices-Google-Antigravity-Docs.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [Equipping-agents-for-the-real-world-with-Agent-Skills-_-Anthropic.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/Equipping-agents-for-the-real-world-with-Agent-Skills-_-Anthropic.md) | `Equipping agents for the real world with Agent Skills _ Anthropic.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [Equipping-agents-for-the-real-world-with-Agent-Skills-_-Anthropic.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/Equipping-agents-for-the-real-world-with-Agent-Skills-_-Anthropic.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [Equipping-agents-for-the-real-world-with-Agent-Skills-_-Anthropic.pdf.extraction.json](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/Equipping-agents-for-the-real-world-with-Agent-Skills-_-Anthropic.pdf.extraction.json) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [Equipping-agents-for-the-real-world-with-Agent-Skills-_-Anthropic.pdf.extraction.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/Equipping-agents-for-the-real-world-with-Agent-Skills-_-Anthropic.pdf.extraction.md) | `Equipping agents for the real world with Agent Skills _ Anthropic.pdf.extraction.json` | <span class="fg-tag fg-ok">declared</span> |
| [PIIS2589750021000388-2.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/PIIS2589750021000388-2.md) | `PIIS2589750021000388-2.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [PIIS2589750021000388-2.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/PIIS2589750021000388-2.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [Skill-authoring-best-practices-Claude-Platform-Docs.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/Skill-authoring-best-practices-Claude-Platform-Docs.md) | `Skill authoring best practices - Claude Platform Docs.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [Skill-authoring-best-practices-Claude-Platform-Docs.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/Skill-authoring-best-practices-Claude-Platform-Docs.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [Skill-authoring-best-practices-Claude-Platform-Docs.pdf.extraction.json](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/Skill-authoring-best-practices-Claude-Platform-Docs.pdf.extraction.json) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [Skill-authoring-best-practices-Claude-Platform-Docs.pdf.extraction.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/Skill-authoring-best-practices-Claude-Platform-Docs.pdf.extraction.md) | `Skill authoring best practices - Claude Platform Docs.pdf.extraction.json` | <span class="fg-tag fg-ok">declared</span> |
| [Skills-in-OpenAI-API.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/Skills-in-OpenAI-API.md) | `Skills in OpenAI API.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [Skills-in-OpenAI-API.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/Skills-in-OpenAI-API.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [Skills-in-OpenAI-API.pdf.extraction.json](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/Skills-in-OpenAI-API.pdf.extraction.json) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [Skills-in-OpenAI-API.pdf.extraction.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/Skills-in-OpenAI-API.pdf.extraction.md) | `Skills in OpenAI API.pdf.extraction.json` | <span class="fg-tag fg-ok">declared</span> |
| [WHO-RHR-18.06-eng.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/WHO-RHR-18.06-eng.md) | `WHO-RHR-18.06-eng.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [WHO-RHR-18.06-eng.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/WHO-RHR-18.06-eng.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [arxiv-0909.4061v2.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/arxiv-0909.4061v2.md) | `arxiv-0909.4061v2.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [arxiv-0909.4061v2.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/arxiv-0909.4061v2.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [arxiv-2202.02427v1.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/arxiv-2202.02427v1.md) | `arxiv-2202.02427v1.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [arxiv-2202.02427v1.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/arxiv-2202.02427v1.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [deerwester-1990-indexing-by-lsa.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/deerwester-1990-indexing-by-lsa.md) | `deerwester-1990-indexing-by-lsa.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [deerwester-1990-indexing-by-lsa.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/deerwester-1990-indexing-by-lsa.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [dong-2025-doc-researcher.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/dong-2025-doc-researcher.md) | `dong-2025-doc-researcher.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [dong-2025-doc-researcher.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/dong-2025-doc-researcher.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [dusengumuremyi-2026-ai-mediated-raci.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/dusengumuremyi-2026-ai-mediated-raci.md) | `dusengumuremyi-2026-ai-mediated-raci.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [dusengumuremyi-2026-ai-mediated-raci.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/dusengumuremyi-2026-ai-mediated-raci.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [feng-2023-designing-with-language.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/feng-2023-designing-with-language.md) | `feng-2023-designing-with-language.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [feng-2023-designing-with-language.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/feng-2023-designing-with-language.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [gurel-tat-2017-swot-analysis.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/gurel-tat-2017-swot-analysis.md) | `gurel-tat-2017-swot-analysis.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [gurel-tat-2017-swot-analysis.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/gurel-tat-2017-swot-analysis.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [landauer-foltz-laham-1998-intro-lsa.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/landauer-foltz-laham-1998-intro-lsa.md) | `landauer-foltz-laham-1998-intro-lsa.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [landauer-foltz-laham-1998-intro-lsa.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/landauer-foltz-laham-1998-intro-lsa.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [milnorlink.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/milnorlink.md) | `milnorlink.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [milnorlink.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/milnorlink.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [neubauer-2025-ai-assisted-schema-creation.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/neubauer-2025-ai-assisted-schema-creation.md) | `neubauer-2025-ai-assisted-schema-creation.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [neubauer-2025-ai-assisted-schema-creation.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/neubauer-2025-ai-assisted-schema-creation.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [omg-2024-spdx-3-0.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/omg-2024-spdx-3-0.md) | `omg-2024-spdx-3-0.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [omg-2024-spdx-3-0.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/omg-2024-spdx-3-0.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [qi-hessen-vanderheijden-2023-ca-vs-lsa.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/qi-hessen-vanderheijden-2023-ca-vs-lsa.md) | `qi-hessen-vanderheijden-2023-ca-vs-lsa.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [qi-hessen-vanderheijden-2023-ca-vs-lsa.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/qi-hessen-vanderheijden-2023-ca-vs-lsa.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [rfc2119-key-words-requirement-levels.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/rfc2119-key-words-requirement-levels.md) | `rfc2119-key-words-requirement-levels.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [rfc2119-key-words-requirement-levels.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/rfc2119-key-words-requirement-levels.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [rfc8174-uppercase-vs-lowercase-2119-key-words.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/rfc8174-uppercase-vs-lowercase-2119-key-words.md) | `rfc8174-uppercase-vs-lowercase-2119-key-words.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [rfc8174-uppercase-vs-lowercase-2119-key-words.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/rfc8174-uppercase-vs-lowercase-2119-key-words.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [sammut-bonnici-galea-2015-swot-analysis.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/sammut-bonnici-galea-2015-swot-analysis.md) | `sammut-bonnici-galea-2015-swot-analysis.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [sammut-bonnici-galea-2015-swot-analysis.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/sammut-bonnici-galea-2015-swot-analysis.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [strauch-carbno-2025-spdx-3-1-supply-chain.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/strauch-carbno-2025-spdx-3-1-supply-chain.md) | `strauch-carbno-2025-spdx-3-1-supply-chain.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [strauch-carbno-2025-spdx-3-1-supply-chain.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/strauch-carbno-2025-spdx-3-1-supply-chain.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [w3c-2013-prov-o.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/w3c-2013-prov-o.md) | `w3c-2013-prov-o.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [w3c-2013-prov-o.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/w3c-2013-prov-o.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [w3c-2018-odrl-model-2-2.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/w3c-2018-odrl-model-2-2.md) | `w3c-2018-odrl-model-2-2.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [w3c-2018-odrl-model-2-2.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/w3c-2018-odrl-model-2-2.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [w3c-2020-json-ld-1-1.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/w3c-2020-json-ld-1-1.md) | `w3c-2020-json-ld-1-1.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [w3c-2020-json-ld-1-1.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/w3c-2020-json-ld-1-1.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [wang-rangaiah-2026-mcdm-aggregation.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/wang-rangaiah-2026-mcdm-aggregation.md) | `wang-rangaiah-2026-mcdm-aggregation.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [wang-rangaiah-2026-mcdm-aggregation.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/wang-rangaiah-2026-mcdm-aggregation.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
