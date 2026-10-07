---
name: fhir-ig-create
description: >
  Somebody asked for a new FHIR Implementation Guide. Decide where it lives,
  in a new repository of its own or as a staged sub-KG inside the harnessed
  repository the session is already in, by reading three facts and, when they
  do not settle it, asking ONE numbered question with a default. Then route:
  a new repository goes to init-folio; an in-repository IG is declared as a
  staged instance and follows sub-kg-lifecycle, so it can move to its own
  repository later. FHIR-generic only; a harness built on this one may
  specialise it. Use whenever a user asks to create, start, set up or stand up
  an IG, an implementation guide, or a FHIR guide.
---

# fhir-ig-create

> Skill id: `fhir-ig-create` · Package: `fhir-ig-base` · Instance: `fhir-harness`
> Bean `3tza`

Owner, 2026-10-06: *"when asked to create a new FHIR IG …, that can either be
done in a new repo or within the folio of an existing harnessed repo. the
agent should determine users intent and act accordingly."*

This is the IG-shaped half of
[`getting-started`](../../../cat-harness/skills/conduct/conduct-core/getting-started.md),
which triages "create a folio" in general. Read that skill's §1 for how facts
are gathered and §3 for how a question is put. This skill does not restate
them. It adds the one fork getting-started has no branch for: **an IG that
starts inside a repository and may leave it later.**

## When a harness above this one specialises it

An IG built on a harness that `needs` this one (for example one that adds its
own pre- and post-processing, theme and layout rules) may carry its own
creation skill that specialises this one. **If the request names such a
harness's kind of guide, ask `skill_list` for that skill and run it instead.**
It will route back here for every step it does not change. This skill names
no such harness, on purpose: the bare FHIR layer knows nothing above it.

## 1. Read three facts — read-only, before anything is written

| fact | how | values |
|---|---|---|
| `inHarness` | a `<name>.json` instance declaration at the working directory's root (`describeRepository` membership `harness`) | yes / no |
| `hasIg` | an IG source already present: a `sushi-config.yaml` or an `ig.ini` at the root | yes / no |
| `statedWhere` | what the user **said** about where it goes | `new-repo`, `in-repo`, `existing-ig`, `unstated` |

`statedWhere` is `unstated` until the user has said it. "Make me an IG" states
nothing about where. "Start an IG in its own repo" states `new-repo`. Do not
infer it from the repository you happen to be in.

## 2. Decide

| `statedWhere` | `inHarness` | `hasIg` | route |
|---|---|---|---|
| stated | any | any | what they said |
| `unstated` | no | yes | **existing-ig**: hand to [`repo-conversion`](../../../cat-harness/skills/conduct/conduct-core/repo-conversion.md), scan first |
| `unstated` | no | no | **new-repo**: the only route that answers itself |
| `unstated` | yes | any | **ask**, with default `in-repo` |

### The question, when the table says ask

Put it as numbered options, four at most, recommended first, with the default
stated. Load
[`interaction-modality`](../../../cat-harness/skills/conduct/conduct-core/interaction-modality.md)
first; for some users a typed answer is not available at all.

> Where should the new IG live?
>
> 1. **Inside this repository, as a staged sub-KG** *(recommended)*. Cheapest
>    to start and to change your mind about. It can move to its own
>    repository later, and nothing outside this repository changes until you
>    say so.
> 2. **In a new repository of its own.** Creating it is visible outside this
>    repository, so I will ask once more before I create anything.
> 3. **Over an IG repository you already have.** I scan it first and show
>    you what I find before importing anything.
> 4. **Tell me more.**
>
> **Default if you do not answer: 1.** Nothing outside this repository is
> touched.

Why `in-repo` is the default: every step of it is reversible with
`git revert`, and the week of separations it was extracted from (bean
`3tza`) staged every guide in place first and created repositories only
after the rehearsal was green. A repository is the first irreversible act,
so it is not the first act.

Then ask the name, as a short slug, offering the one derived from what they
said as option 1.

## 3. Route

### `in-repo` — a staged sub-KG

The lifecycle is [`sub-kg-lifecycle`](../../../cat-harness/skills/kg/graph-management/sub-kg-lifecycle.md)
and its process `sub-kg-lifecycle.bpmn`; this is what its stage 1 means for an
IG.

1. **Scaffold the declaration and the seam**:
   `bun run init-folio --staged <name> --title "<title>" --repository <owner>/<name> --needs fhir-harness`.
   It writes `<name>/<name>.json` (`repository` is the planned home, and
   `livesAt` is this repository) and an empty `<name>/platform.ts`, and
   nothing at the repository's root. Never `--instance` here: that scaffolds a
   whole repository.
2. **Declare the graphs as their files arrive.** An IG's graphs are typically
   `ig-ast`, `fhir-artifact-index` and `docs` with `igSite: true`. Route
   every platform import through `platform.ts`: an empty seam on day one
   costs nothing, and retrofitting one later cost 25 reroutes in one instance.
3. **Get the IG source**, one of:
   - **authored here**: `sushi-config.yaml` and `input/` under the
     instance, authored with [`l3-fhir-authoring`](../content/fhir-ig-authoring/l3-fhir-authoring.md);
   - **an IG already published elsewhere**: ingest its artefact index and
     navigation, which record the source repository and commit they read:
     `bun run ingest:ig -- --source <published output> --kind gh-pages --id <name> --base <published url> --out <name>`
     and `bun run ingest:ig-menu -- --source <ig repo checkout> --out <name>/fhir-artifact-index`.
4. **Build its site** from a local checkout:
   `bun run fhir-harness/scripts/stage-ig-sites.ts --work <dir> --baseurl <baseurl> --only <name> --source <ig repo checkout>`
   ([`ig-build-pipeline`](ig-build-pipeline.md), [`ig-render-jekyll`](ig-render-jekyll.md)).
5. **Seed the plan**: one bean for the IG, under the epic the work belongs to,
   after the existence check in `todo-manager`.

From there the IG grows in place, and leaves only through
`sub-kg-lifecycle`'s two owner confirmations.

### `new-repo` — its own repository

1. **Confirm before creating.** Creating a repository is outward-facing and
   is not undone by a revert, so the question in `sub-kg-lifecycle` §"7 and
   12" is asked first, with default "not yet". The owner may create it
   themselves; a session without the permission hands over with
   [`agent-handoff`](../../../cat-harness/skills/sdlc/sdlc-core/agent-handoff.md).
2. **Scaffold**: `bun run init-folio --dir <repo> --instance --title "<title>"`.
   There is no IG content type, so `--instance` it is: a harness instance
   with no folio (bean `mer2`). `--link submodule` is the default.
3. **Declare** `needs: ["fhir-harness"]` and the same graphs as above, at the
   new repository's root, with no `livesAt`.
4. Then steps 3 to 5 of `in-repo`, at the root.
5. **Ask the two build questions** before the first push: whether the
   repository's automatic gh-pages builds stay automatic, and whether to
   install the just-the-docs site (default yes). The rule and the question
   text are [`ig-build-pipeline`](ig-build-pipeline.md) §"Who starts a
   build"; a repository forked from an upstream IG is the usual case.

### `existing-ig`

`repo-conversion` scans first and imports second, never the other way round.
After the import, declare the instance at the root as in `new-repo` step 3,
then ask the two build questions in [`ig-build-pipeline`](ig-build-pipeline.md)
§"Who starts a build". An existing IG repository almost always carries build
workflows that publish on every push.

## Anti-patterns

1. **Creating a repository because the request said "new".** "A new IG" is
   not "a new repository". Ask.
2. **Running `init-folio --instance` inside a harnessed repository** for an
   in-repo IG. It writes `AGENTS.md`, `.mcp.json`, a beans store and a
   session hook into a subdirectory. `--staged` is the in-repo mode.
3. **Hard-coding a publisher's identity here.** Template, chrome and
   publication target belong to a harness above this one.
4. **Skipping the seam because the IG has no code yet.** The first test that
   imports a platform helper is the first climb.
