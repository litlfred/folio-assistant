---
layout: default
title: Initializing into folio-assistant
parent: CatBootstrap
nav_order: 1
---

# Initializing a repository into a `folio-assistant` instance
{: .no_toc }

**You arrived here from cat-bootstrap**, having been given one reference and having
read this instance's declaration. This page is step 2's destination: what to do
to make the repository you are in an instance of *this* harness.

Every cat-harness instance publishes this page at the same place —
`<stub>/docs/cat-bootstrap/initialization.md` — so cat-bootstrap needs no per-target
knowledge. If you are initializing into a different harness, you are reading
the wrong one; read that instance's copy instead.

1. TOC
{:toc}

---

## What you already know by the time you are here

Three things, all read rather than asked:

| | from |
|---|---|
| that this repository is **not yet** an instance | no root `harness.json` |
| the instance to become one **of** | the single reference a person supplied |
| what that instance **is** | its own `harness.json` |

If any of those is missing, you are earlier in the process than this page.
Go back to [`cat-bootstrap/README.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-bootstrap/README.md).

## Do these, in this order

The order is the load-bearing part, not the individual steps.

1. **Write this repository's `harness.json`** from what the upstream
   declaration said — its `name`, and the directories and graph kinds it
   implies. Not before reading theirs: a declaration written first leaves a
   window in which this repository claims to be something it is not, and every
   consumer that reads a declaration would believe it.
2. **Create the directories the declaration names**, and *only* those. A
   declared-but-absent directory is the defect where a consumer scans nothing
   and reports a clean run over it.
3. **Write `AGENTS.md`**, with `CLAUDE.md` and `GEMINI.md` as thin stubs
   pointing at it. This is the phase-two file cat-bootstrap's own `AGENTS.md`
   promises: the one you copied in could rely on nothing, and this one may
   rely on the harness that now exists.
4. **Re-enter through this harness.** Read *its* next steps rather than any
   list held in cat-bootstrap — the set of available steps changed the moment the
   harness arrived, and the authority on what they are is the harness, not the
   cat-bootstrap that predates it.

## What this instance expects that a bare one does not

`folio-assistant` is **the platform, not the content**. A folio — a paper, a
WHO SMART Guideline, an IG — lives in a *separate* repository that depends on
this one. If you are initializing a repository meant to hold subject matter,
you want a folio instance, and `bun run init-folio` is the tool for it.

Two consequences worth knowing before you write the declaration:

- **The work plan is `beans/`**, committed, so it survives a resume in a fresh
  container. Install it before any durable work.
- **Skills are knowledge-graph content**, resolved through the declaration
  rather than from a memorised path — which is why step 1 is the declaration
  and not a directory listing.

## If you cannot finish

**Stop, and leave the repository un-initialised.** An unbootstrapped repository
is a recoverable state. One carrying a declaration that names the wrong
upstream, or directories that do not exist, is not — it will be believed, and
every artefact written afterwards inherits the mistake.
