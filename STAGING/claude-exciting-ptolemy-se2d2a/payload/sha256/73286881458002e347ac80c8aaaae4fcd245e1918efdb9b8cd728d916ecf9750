---
# folio-assistant-073f
title: 'KG-JSONLD STAGING: each <stub> stages its JSON-LD on cat/<harness>/kg-jsonld; CI gates it; the gated branch publishes to the CDN (bootstrap-first walk, failed subgraph skips its cone)'
status: todo
type: feature
priority: normal
created_at: 2026-10-02T21:42:43Z
updated_at: 2026-10-04T13:29:38Z
parent: folio-assistant-whlc
---

Owner, 2026-10-02, verbatim: "i think we also need cat-kg-jsonld in which all of the json(ld) is staged before being published. right now. it is a bit adhoc. bootstrap-tools writes to bootstrap's gh-pages direcrtly i thinkj..... instead (whoever is doing the rendering of the KG):
* the writer puts <stub>'s new/incremental updates to the json(ld) KG in the <stub>'a cat-kg-json-ld branch
* the CI checks are run. if failed blocker/gates, stop/error/msg out back to the writer, othewise continue. sub-task can CI builds better support dependcy cone incremental builds to speed up things
* <stub>'s cat-kg-json-ld branch is used to update the <stub>'s CDN (in this case gh-pages)
* note: a repo's json-ld rendering is multi-stage, bootstrap is first, the cat-harness etc based on dependecny walk. only bootstrap is catastrpohic failure on json-ld rendering chain - subgraphs can fail (then all their depdenceis fail/skipped too) but recover as much as possible. if json-ld rendering of sub-graph fails downstream rendeing (pdf, jsutthedoc, etc) also fail/skipped (depending on depency cone)
we will need to update process/skills/etc. bean up and roast with disaptch agent"

Branch name per the owner's final scheme (via the merge steward, 2026-10-02): `cat/<harness>/kg-jsonld`.

## Relation to `4ak5`
`4ak5` decides WHAT each harness exports (one JSON-LD + schema per instance, root `index.jsonld`). This bean decides HOW an export reaches the CDN: staged, gated, then published. They share the per-instance unit; implement `4ak5`'s export as the writer this bean stages.

## The pipeline asked for
1. **Stage.** The writer (whoever renders a `<stub>`'s KG) commits new or incremental JSON-LD to `cat/<stub>/kg-jsonld`, never to `gh-pages` directly. Today `bootstrap-tools` writes to bootstrap's `gh-pages` directly (owner's reading; to be measured).
2. **Gate.** CI runs the KG gates on that branch. A blocker stops the run and reports back to the writer; otherwise continue.
3. **Publish.** The gated branch updates the `<stub>`'s CDN (here `gh-pages`).
4. **Order and failure.** Rendering follows the dependency walk, bootstrap first. A bootstrap failure is catastrophic and stops everything. A failed subgraph skips its whole dependency cone, and the rest continues ("recover as much as possible"). Downstream renders in that cone (PDF, just-the-docs, …) are skipped too.

## Children (to split into beans when started)
- [x] measure today's writers: who writes JSON-LD to which `gh-pages`, from which workflow — measured 2026-10-04, below
- [ ] `cat/<harness>/kg-jsonld` branch contract (layout, manifest, who may write)
- [ ] CI gate on the staging branch, with blocker report back to the writer
- [ ] publish step: staging branch → CDN
- [ ] dependency-walk orchestration: bootstrap catastrophic; failed subgraph skips its cone, recorded as skipped (not passed)
- [ ] downstream renders (PDF, just-the-docs) honour the same cone
- [ ] sub-task: incremental CI builds over the dependency cone
- [ ] process + skills: BPMN under `processes/`, skill updates

## Roast
The owner asked for a dispatched-agent roast. Deferred by the merge steward (2026-10-02: weekly budget ~3%, cap two agents): bean only for now. When budget allows, 2–3 agents: a critic, a CI-gating reviewer, a dependency-cone reviewer.

## Done when
- [ ] no writer pushes KG JSON-LD to a CDN except through a gated `cat/<harness>/kg-jsonld` branch
- [ ] a failing subgraph's cone is skipped and reported as skipped, with bootstrap failure stopping the run



## Measured 2026-10-04: who writes KG JSON-LD to a CDN today (child 1)

Measured on folio-assistant main `f8f329a` (session_01Jf39Vh4B8EQT6TBYzTtMCA). I read every workflow here and in both submodules that pushes to a `gh-pages` branch, then kept those whose commands, not comments, produce JSON-LD.

| writer (workflow) | repository | trigger | writes to | what JSON-LD |
|---|---|---|---|---|
| `docs-site.yml` | folio-assistant | push to `main` | folio-assistant `gh-pages`, root (full replace via `publish-gh-pages.sh`) | `kg-export` (cat-harness, root instance), `instance-exports.ts` (11 instances, #2067), bootstrap via `export-graph.ts`, glossaries, `ns-export`, locale exports, subgraph JSON-LD |
| `feature-staging.yml` | folio-assistant | PR pushes | folio-assistant `gh-pages` under `STAGING/<branch>/` | the same set with `--base-url` (parity is gated by `check:invocation-parity`) |
| `folio-staging.yml` | folio-assistant (reusable, for folios) | called by a folio | the folio's `gh-pages` | via `publish-main-site.ts`, folio side |
| `publish-bootstrap.yml` | **bootstrap-tools** | cron every 6 h + dispatch | **bootstrap's** `gh-pages`, cross-repo, with a token | `scripts/site.ts --root ../bootstrap`: bootstrap's own documents |
| `pages.yml` | **bootstrap-tools** | push to its `main` | bootstrap-tools' own `gh-pages` | `scripts/site.ts --root .` |

The owner's reading is **confirmed**: bootstrap-tools writes bootstrap's `gh-pages` directly, on a 6-hour cron, outside any folio-assistant gate. No JSON-LD writer goes through a staging branch today. `publish.yml` and `discoverability-docs.yml` also push to `gh-pages`, but write no JSON-LD.

**Two consequences for the design:**
1. **The staging branches need a WRITER on the branch store.** That is the same open question as `xsrv`'s route-keyed writer, options (a) mount/push, (b) a `publish` verb, (c) generators write directly. The owner was asked on 2026-10-04; one answer should serve both beans.
2. **Writers are spread over three repositories**, so "no writer pushes KG JSON-LD to a CDN except through a gated branch" needs the bootstrap-tools workflows changed in bootstrap-tools too.
