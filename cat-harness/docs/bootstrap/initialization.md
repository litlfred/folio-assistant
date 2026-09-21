---
layout: default
title: Initializing into folio-assistant
parent: CatBootstrap
nav_order: 1
---

# Initializing a repository into a `folio-assistant` instance
{: .no_toc }

**You arrived here from bootstrap**, having been given one reference and having
read this instance's declaration. This page is step 2's destination: what to do
to make the repository you are in an instance of *this* harness.

Every cat-harness instance publishes this page at the same place —
`<stub>/docs/bootstrap/initialization.md` — so bootstrap needs no per-target
knowledge. If you are initializing into a different harness, you are reading
the wrong one; read that instance's copy instead.

1. TOC
{:toc}

---

## What you already know by the time you are here

Three things, all read rather than asked:

| | from |
|---|---|
| that this repository is **not yet** an instance | no repository's declaration |
| the instance to become one **of** | the single reference a person supplied |
| what that instance **is** | its own declaration |

If any of those is missing, you are earlier in the process than this page.
Go back to [`bootstrap/README.md`](https://github.com/litlfred/folio-assistant/blob/main/bootstrap/README.md).

## Do these, in this order

The order is the load-bearing part, not the individual steps.

1. **Write this repository's declaration** from what the upstream
   declaration said — its `name`, and the directories and graph kinds it
   implies. Not before reading theirs: a declaration written first leaves a
   window in which this repository claims to be something it is not, and every
   consumer that reads a declaration would believe it.
2. **Create the directories the declaration names**, and *only* those. A
   declared-but-absent directory is the defect where a consumer scans nothing
   and reports a clean run over it.
3. **Write `AGENTS.md`**, with `CLAUDE.md` and `GEMINI.md` as thin stubs
   pointing at it. This is the phase-two file bootstrap's own `AGENTS.md`
   promises: the one you copied in could rely on nothing, and this one may
   rely on the harness that now exists.
4. **Re-enter through this harness.** Read *its* next steps rather than any
   list held in bootstrap — the set of available steps changed the moment the
   harness arrived, and the authority on what they are is the harness, not the
   bootstrap that predates it.

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

## If you are creating a new instance KIND, not a new instance

Everything above assumes you are making **another instance of an existing
kind** — a `folio-assistant` instance, using this harness's vocabulary. Making
a new *kind* is a different act, and it changes which of the files you inherit
are yours.

**The files you inherit that are POINTERS belong to you.** The first one is
[`bootstrap/README.md`](https://github.com/litlfred/folio-assistant/blob/main/bootstrap/README.md)
— the page an Initiator reads before it knows anything about the repository.
It is written for *this* repository: it resolves 13 links into
`../cat-harness/`, across 6 files, and every one of them is a **term
definition** — what a role is, what a DAK block is, what a harness declaration
is.

Bootstrap a new instance kind that is not built on `cat-harness`, and your
first reader gets a page whose every definition points into a harness they are
not using. **Repointing it is expected**, not a modification of platform code:
aim the links at whatever layer defines *your* vocabulary. Keep the
user-scenario structure — persona, user scenario, business process, functional
requirement — because that is the formalism the bootstrap process reads; change
only where the terms resolve.

Files that are a MECHANISM rather than a pointer are the opposite: they belong
to the layer that ships them, and editing one is a platform change with every
gate that implies.

The naming rules, the prefix families, what a new graph kind must declare, and
the test that usually says *"this is not a new kind"* are in the
[`instance-kinds`](https://litlfred.github.io/folio-assistant/reference/skill-instructions/instance-kinds.html) skill.

## If you cannot finish

**Stop, and leave the repository un-initialised.** An unbootstrapped repository
is a recoverable state. One carrying a declaration that names the wrong
upstream, or directories that do not exist, is not — it will be believed, and
every artefact written afterwards inherits the mistake.
