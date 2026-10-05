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

**7 file(s)** across 2 group(s). Each links to the file itself —
this page indexes what is kept, it does not republish it.

## Does each file declare itself?

The graph's declaration says files carry `$schema: folio-fsh-guts/v1`. Three states,
kept apart on purpose: a `.py` or `.ts` script **cannot** carry YAML front
matter, so a tagged `.md` sibling is the contract met by the only mechanism
open to it. Filing that beside a markdown file that simply omitted the line
would make the format's limit and somebody's omission look the same.

| state | files | what it means |
|---|---|---|
| <span class="fg-tag fg-ok">declared</span> | 4 | carries the tag itself |
| <span class="fg-tag fg-side">via sidecar</span> | 3 | a script, described by a tagged `.md` sibling |
| <span class="fg-tag fg-gap">undeclared</span> | 0 | **neither** — a gap, not a format limit |

## retired

1 file(s).

| file | what it is | declares itself |
|---|---|---|
| [cat-harness-orphan-ig-tool-sidecars.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/retired/cat-harness-orphan-ig-tool-sidecars.md) | Three orphaned IG-tool sidecars | <span class="fg-tag fg-ok">declared</span> |

## uploads

6 file(s).

| file | what it is | declares itself |
|---|---|---|
| [Home-_-folio-assistant.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/Home-_-folio-assistant.md) | `Home-_-folio-assistant.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [Home-_-folio-assistant.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/Home-_-folio-assistant.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [omg-2024-spdx-3-0.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/omg-2024-spdx-3-0.md) | `omg-2024-spdx-3-0.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [omg-2024-spdx-3-0.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/omg-2024-spdx-3-0.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
| [strauch-carbno-2025-spdx-3-1-supply-chain.md](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/strauch-carbno-2025-spdx-3-1-supply-chain.md) | `strauch-carbno-2025-spdx-3-1-supply-chain.pdf` | <span class="fg-tag fg-ok">declared</span> |
| [strauch-carbno-2025-spdx-3-1-supply-chain.pdf](https://github.com/litlfred/folio-assistant/blob/main/fsh-guts/uploads/strauch-carbno-2025-spdx-3-1-supply-chain.pdf) | — | <span class="fg-tag fg-side">via sidecar</span> |
