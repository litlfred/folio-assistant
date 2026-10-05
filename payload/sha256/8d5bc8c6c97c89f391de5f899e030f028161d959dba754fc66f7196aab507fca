---
# folio-assistant-dp1j
title: 'KG AFFORDANCES: browse, materialise, instantiate, copy-into-my-folio — as processes and skills, gated by write capability'
status: todo
type: task
created_at: 2026-09-20T17:13:19Z
updated_at: 2026-09-20T17:13:19Z
parent: folio-assistant-yj32
---

Owner, 2026-09-20, verbatim:

> in genreal when browsing a conformant KG, user can borwse, try to
> materialise assets, instantate (and make use of tooling), copy assets into
> their own folio to edit/comment-todos on, etc... bpmn process aroiund folio,
> doc ignestion in cat-harness.  as skills., bean up

## What this names: the VERBS of a conformant KG

Every visualiser bean so far has been about *looking* at a subgraph. This says
looking is only the first of several things a reader may do, and the set is
general — it applies to **any** conformant KG, not to one directory:

| verb | what it means |
|---|---|
| **browse** | read the graph where it is — the read-only floor |
| **materialise** | bring a declared asset into being locally |
| **instantiate** | stand up an instance from it, and use its tooling |
| **copy into my folio** | take an asset into a folio I own, to edit / comment / raise todos on |

The last is the important one: it turns a KG from something you *read* into
something you can *take from*, and it is where provenance starts mattering.

## Measured 2026-09-20 — and this ask INVERTS the pattern of the last three

`v1hw`, `supn` and `aazi` were each a widget over a relation nobody had
written down. **This one is the opposite: three of the four verbs already have
machinery, and what is missing is the processes and skills that compose them.**

| verb | what already exists |
|---|---|
| materialise | `materialiseDirectories` (`cat-harness.ts:2903`), and `dependents: "reproduce" \| "skip"` already decides what a dependent gets |
| instantiate | `folio_init` (`src/tools/folio-init.ts`), registered among the GENERIC tools precisely because it runs before a folio has a content type |
| copy into my folio | **`KgAsset.source`** — `AssetSource {instance, path, ref}`, whose own docstring reads *"Where it was copied from; absent means authored here."* That IS the copy relation, already declared and already validated |
| browse | the visualiser gap — `2krx`, `jbx2`, `v1hw`, `6lb8` |

**So the copy verb has its provenance edge today and nothing uses it.** An
asset copied into a folio should carry `source`, and a reader of that folio
should be able to ask where a thing came from and whether the origin has
moved on. That is a fully declared relation waiting for a process.

Doc ingestion is likewise already processed, not absent: `document-ingestion`,
`content-acquisition`, `ingest-build-l1-kg`, `ingest-derive-content`,
`evidence-retrieval` and `getting-started` are BPMN already, with
`library-ingestion` and `document-intake` as skills.

## What is actually missing

1. **No `folio-init` SKILL.** The tool exists and nothing tells an agent when
   or why to reach for it. That is the `2krx` third criterion — *no skill means
   no tools* — landing on the instantiate verb.
2. **No process for the copy verb.** Nothing says: check the capability, copy,
   stamp `source`, and let the folio owner edit or comment from there.
3. **No statement that these are the verbs.** They are scattered across a
   schema field, a tool and a function, and nowhere is it written that a
   conformant KG affords exactly these.

## The verbs are gated by the capabilities settled earlier today

Browse is the read-only floor and needs nothing. **Materialise, instantiate
and copy all WRITE**, so each needs one of `git-push`, `github-api` or
`github-connector` — the owner's answer that the write path is several tools
chosen by capability and permission. So these processes should ask which write
tool is available and degrade when none is, rather than assume one.

That also means **browse must remain fully useful with no write capability at
all** — otherwise a reader without credentials meets a broken interface rather
than a read-only one.

## Done when

- [ ] The four verbs are written down as the affordances of a conformant KG
- [ ] A `folio-init` skill exists, so the instantiate tool is reachable
- [ ] A BPMN process for copy-into-folio that stamps `KgAsset.source`
- [ ] Each writing verb declares its capability requirement and degrades
- [ ] Browse is provably useful with zero write capability

## Relates to

`2krx` (visualiser/docs/skill per subgraph — browse is its first criterion),
`jbx2` and `v1hw` (the two surfaces where a reader would first meet these
verbs), `d308` (Tool nodes — `folio_init` is one), `yj32` (the harness as an
interface these verbs act through), and the `github-api` /
`github-connector` capabilities declared this session.
