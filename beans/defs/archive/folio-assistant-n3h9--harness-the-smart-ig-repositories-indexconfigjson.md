---
# folio-assistant-n3h9
$schema: bean/1.0.0
title: 'HARNESS the smart-* IG repositories: index.config.json remote mounts, Actions gh-pages switched off, agent-run harnessed publish'
status: completed
type: epic
priority: high
created_at: 2026-10-10T14:06:53Z
updated_at: 2026-10-31T12:15:30Z
parent: folio-assistant-vuip
---

Owner, 2026-10-10: *"you can work onthe litlfred/smart-* go ahead and harness them with index.config.json and make sure they stop the ghpages currrent redering pipleine and use to the harnessed one"* (fhir-harness, smart-base harness). Repositories: *"smart-base, smart-base-clinical, smart-core, smart-immunizations, smart-hiv and smart-trust smart-ra"*.

## State measured 2026-10-10

- **Push-triggered gh-pages builds:**
  - smart-hiv: `ghbuild.yml` on push
  - smart-base-clinical: `ghbuild.yml` on push
  - smart-core: `ghbuild.yml` on push
  - smart-ra: `staging.yml` on push to main
- **Manual-only:** smart-base (`ghbuild` is workflow_call only; `folio-site.yml` and `ci.yml` by dispatch), smart-immunizations and smart-trust (`fhirbuild` by dispatch).
- **Submodules:** smart-base and smart-ra carry the folio-assistant submodule. fhir-harness's `templates/ig-repo-site/folio-site.yml` predates the separation (it assumes the submodule and runs in Actions).
- **Another session** (session_017QXvm7c7RDYFguWzSxhrMb, "Epic separation status review") is working on smart-base, smart-trust and smart-immunizations (claude/seed-smart-base, 48a6 rollout). It was messaged before any push to those three.

## Decided (session 2026-10-10)

Agent-run publishing, as for who-iris: an `index.config.json` remote-mounting smart-base (whose closure brings in fhir-harness, core and the harness layers), no submodule, and one parameterised build tool driven by a Routine. Each repository's gh-pages Actions deploy is switched off.

## Done when, per repository

- [x] `index.config.json` declares the instance and its remote mounts, with consent recorded
- [x] no push- or PR-triggered workflow writes gh-pages
- [x] the harnessed site is built from an empty directory and published by an agent; its Pages run succeeds
- [x] smart-base: the per-branch IG previews under `branches/` survive
- [x] smart-core (pre-SUSHI): builds, or is recorded as not buildable with the reason

## 2026-10-10 — progress, and what this container cannot reach

**Merged.** The Actions gh-pages builds are off:
- smart-hiv#1, smart-base-clinical#1 and smart-core#1: `ghbuild.yml` removed, `fhirbuild.yml` dispatch-only;
- smart-ra#35: `staging.yml` and `ra-mapper.yml` dispatch-only, on the owner's "agent-run as well". This reverses the 2026-10-09 "it needs CI" setting.

**Ownership.** smart-base, smart-trust and smart-immunizations go to session_017QXvm7c7RDYFguWzSxhrMb, once the owner confirms it there.

**Network.** The policy refuses these hosts with 403:
- smart.who.int, worldhealthorganization.github.io
- packages.fhir.org, packages2.fhir.org, build.fhir.org
- iris.who.int, www.who.int, cdn.who.int

The owner says the policy is not theirs to change.

**Workaround.** The FHIR package cache is seeded with `fhir-cache-seed-npm.ts`, through npm, the litlfred/fhir-package-mirror, and `--site-repo smart.who.int.=WorldHealthOrganization/smart-html`; raw.githubusercontent.com is reachable. For smart-base-clinical, 9 of 13 packages seed. Missing at their exact versions:
- `hl7.terminology#7.3.0` (npm has 7.0.1)
- `hl7.fhir.uv.crmi#2.0.0` (npm has 2.0.0-ballot)
- `hl7.fhir.uv.cqm#2.0.0` (npm has 1.0.0)
- `smart.who.int.base#1.0.0`, which is found once `--site-repo` names smart-html

Adding the three HL7 tarballs to litlfred/fhir-package-mirror, with their SHA512SUMS lines, from a machine that can reach packages.fhir.org would unblock SUSHI and the IG Publisher here.

**Seeding source.** The three forks have no gh-pages branch, and WHO's published copies are on refused hosts. So the artefact index must come from a local IG Publisher build, which needs the packages above.

## 2026-10-10 — staging previews are agent-run (owner's decision)

Owner, 2026-10-10, choosing between agent-run previews, PR previews in Actions, and no previews: **"Agent-run previews"**.

The one agent-run build tool this epic delivers also publishes a branch preview at `STAGING/<branch>/`, the path smart-ra's public-comment links expect for the AFTER side. It runs on request, or from a Routine. Nothing in Actions builds a preview on its own.

Until the tool exists, an agent starts `staging.yml` by hand (workflow_dispatch) for any PR that needs a preview.

Done when, added:
- [x] the build tool takes `--staging <branch>` and writes only `STAGING/<branch>/`, keeping the root site and the other previews
- [x] smart-ra: a public-comment change set can be reviewed on an agent-built `STAGING/<branch>/` preview (2026-10-30: STAGING/pr-93/, Pages 41053277898 success)

## 2026-10-11 — environment migrated: four repositories on remote mounts, and an agent-run publish

Owner, 2026-10-10: *"keep going. keep migrating environment"*. On 2026-10-11: *"repin as needed. merge all ready green next 4hrs, continue"*.

**Remote mounts, no submodule.** These follow who-iris's pattern: the instance declaration at the root, plus `index.config.json`. Each mounts smart-base (its 22 declared directories), fhir-harness, folio-assistant-core, cat-harness, cat-harness-tools, bootstrap and bootstrap-tools, at each repository's main of 2026-10-10:
- smart-hiv#2: `smart-hiv.json`
- smart-base-clinical#2: `smart-base-clinical.json`
- smart-core#2: `smart-core.json`

Each was verified from an empty directory: remote-mount exits 0 and all seven layers mount. The declarations declare no directories yet (dh4f), and the IG content is seeded later (53rv).

**smart-ra (dpi-h-ra), step 1: smart-ra#37.** The same mounts sit beside the folio-assistant submodule. Step 2 moves its six workflows onto the mounts and removes the submodule.

**The build tool.** `build-instance-site` is in place:
- implementation: cat-harness-tools #58, #62, #64, #67;
- Tool node and `ScriptName` type: cat-harness #104;
- `publish-site --into/--keep`: bootstrap-tools #16.

who-iris is pinned to it (who-iris #32, #33, #34). Its publish Routine now makes one `build-instance-site` call. It was first used from this session (gh-pages 2951fee; Pages run 38072524836, success). The Routine itself is blocked: its session's permission check refuses cloning the pinned layers.

Still open:
- [x] smart-ra step 2: workflows onto the mounts, submodule removed
- [x] an IG mode for build-instance-site (fhir-harness stage-ig-sites), after 53rv's packages land — done by another route, see 2026-10-23 below
- [ ] the Routine environment allows cloning the litlfred repos and `bun install`/`bun run` (owner setting)

## 2026-10-11 — smart-ra onto the mounts

- smart-ra#37 (merged): index.config.json mounts the 7 layers plus folio-assistant-sci beside the submodule. sci is needed because core's block kinds name its `paper` adapter (bean bzwk).
- smart-ra#38 (merged): qa-sweep.yml checks out without submodules and mounts from the lock. CI green, 933 sidecars pass.
- smart-ra#39 (open): composite action `.github/actions/mount-layers`. qa-sweep-nightly, section-title-audit, public-comment and public-comment-check move onto it.
- Left: staging.yml (agent-run) → build-instance-site. smart-ra has no package.json, so its build steps (build-document-site, public-comment-site, build-library-site, gen-node-kind-pages, archimate) need script names first. After that, remove the folio-assistant submodule.
- Found: section-title-audit reports 0 titles on dpi-h-ra (its sections are SectionRefs with no inline title). This is pre-existing, and the workflow is dispatch-only.

## 2026-10-11 — smart-ra fully on the mounts (no submodule)

- smart-ra#39 (merged): every workflow uses `.github/actions/mount-layers`.
- smart-ra#40 (merged): the site is built by `build-instance-site`, using package.json scripts and `--site-step site:node-kinds`. Result: 8778 pages, 0 unresolved links. staging.yml is removed.
  - Repins: cat-harness-tools bbfc3c5 (#107: --site-step, the review page root link) and cat-harness e890428 (#133: the Tool's siteStep).
  - Consent recorded: "repin as neede".
- smart-ra#41 (merged): the folio-assistant submodule is removed.
  - `.claude/hooks/session-start.sh` mounts from the lock when the mounts are absent.
  - .mcp.json and dpi-h-ra.config.json point at the mount paths.
- Still open: the first agent-run publish of smart-ra's root site and of its previews. The command is in AGENTS.md "The site", with `--publish --remote`.

## 2026-10-11 06:41 — first agent-run root publish of smart-ra

- The owner chose "2": publish the root now.
- smart-ra#42 (merged) made the RA mapper a site step (`tools/ra-mapper/build-site.sh`, `site:mapper`). Without it the root publish would have dropped `mapper/`. ra-mapper.yml, an Actions deploy, is removed.
- Published from smart-ra main 6b42948 with the AGENTS.md command:
  - gh-pages c36bb41: 8780 pages, 0 unresolved links;
  - STAGING/ and _render-log/ kept;
  - Pages run 38118816755 succeeded.
- Breaks: the old root `review/` is now `en/review/`, so links to /smart-ra/review/ 404. Root `_main-site.json` (the reusable staging workflow's before-manifest) is gone with that workflow.

_2026-10-16T10:45:00Z_ — Parented to `vuip` (GOAL 1) by subject: it had no parent, so it sat under no epic or goal and failed the parent check on main (https://claude.ai/code/session_01NUrhvvMEwU5MmPW4L2w9jP).

## 2026-10-20 — smart-base checklist item measured (lane S, session_016heucWhrncLm4uy52csBcz, relayed by the drain coordinator session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6)

"No push- or PR-triggered workflow writes gh-pages", for **smart-base: met, with one sanctioned exception** — `publish-context.yml` runs on push to main and writes only `ns/context/v1.jsonld` (bean `63q4`, owner 2026-10-15). Every other gh-pages writer is `workflow_dispatch` / `workflow_call` only. smart-base#114/#115 (DAK hub dead links, view-page tabs) merged and upstreamed as WorldHealthOrganization/smart-base#335 (781a8b99). smart-base#99 stays open: needs a ghbuild job log, host blocked here.

## 2026-10-23 — IG mode verified; smart-base submodule removal staged (thread "smart IG harnessing", https://claude.ai/code/session_01AW61nue34oLGoENwjCNcSA)

- **IG mode: exists.** It is not a flag on build-instance-site. fhir-harness declares the `site-publisher-ig` slot (`pipeline-plugins/site-publisher-ig.json`); `stage-local.ts` reaches it, and `fhir-harness/scripts/stage-local-ig.ts` builds an IG repository's folio site by calling `buildInstanceSite` with the `ig-site:ast`, `ig-site:compose` and `ig-site:publisher-pages` steps (thin artefact pages from the cached AST). build-instance-site also has `site.build.profile: "ig-repo-site"`. smart-trust and smart-immunizations gh-pages carry `folio-build.json` and 1,404 / 1,955 thin artefact pages. The AST comes from the `cat/fhir-harness/fhir-ast/smart.who.int.*` cache branches, so a fresh AST still needs 53rv.
- **smart-base submodule.** Nothing in smart-base's workflows uses `folio-assistant/` any more (site-publish.yml mounts from index.lock.json). Only `.claude/mount-platform.sh`, CLAUDE.md and one BPMN comment did. Branch `claude/n3h9-drop-folio-assistant-submodule` (local, not pushed) removes the gitlink and `.gitmodules` and makes the hook replay `index.lock.json` with cat-harness-tools' `mount-from-lock.ts`, as site-publish.yml does. Tested here: 6 layers mount OK in 69 s, and `render-processes.ts` runs with `NODE_PATH=cat-harness-tools/node_modules`.
- **SUSHI** on that branch: 14 errors, all from the 3 packages this environment cannot download (`hl7.terminology#7.3.0`, `hl7.fhir.uv.crmi#2.0.0`, `hl7.fhir.uv.sdc#4.0.0`; bean 53rv). The change touches no `input/` or `sushi-config.yaml`. Not committed: waiting on the owner (SUSHI-before-commit rule).

## Owner ruling 2026-10-23: scope of the move to WHO

Owner, 2026-10-23, asked "what goes to WHO: a) IG content only, b) content plus harness wiring, c) everything with the shared layers moved to the WHO org": *"5 b for now. willl move elsewhere later"*. So:
- **What goes to WHO/smart-\*:** the IG content and each repo's harness wiring (`<name>.json`, `index.config.json`, `index.lock.json`, AGENTS.md, workflows).
- **What stays in litlfred for now:** the shared layers (cat-harness, cat-harness-tools, fhir-harness, folio-assistant-core, bootstrap). WHO repos pointing at them is accepted for now. The layers may later move somewhere other than WHO.
- **Not yet:** a migration bean, issue, or upstream PRs. The forks pull in all of WHO's changes first (smart-base#121, smart-trust#66). WHO repos are never changed without the owner's permission.

Measured 2026-10-23, fork main against WHO main: smart-base 773 ahead and 3 behind, still carrying the folio-assistant submodule; smart-trust 94 ahead and 11 behind; smart-immunizations 109 ahead; smart-ra 213 ahead; smart-hiv 39 ahead; smart-base-clinical 8 ahead; smart-core 8 ahead (on `master`). Thread "FHIR beans and WHO migration" (https://claude.ai/code/session_01Bye99WLJxQpyCxh2eMgW19).
- **Update 14:08.** The owner said "1". Draft PR litlfred/smart-base#123 (issue #122, commit 2d03f4b). With stand-ins (crmi 2.0.0-ballot, sdc 4.0.0-ballot, terminology 7.0.1), SUSHI gives 0 errors, but that is NOT a pass: fhir-harness `ig-publisher-fork` requires exact versions. The PR stays a draft until SUSHI is rerun on the exact versions after 53rv.
- **Update 14:15.** SUSHI rerun on the exact versions (hl7.terminology 7.3.0, crmi 2.0.0, sdc 4.0.0 from fhir-package-mirror c344c47, SHA512-checked): 0 errors, 17 warnings. smart-base#123 is cleared on SUSHI. Seen: `fhir-cache-seed-npm.ts --mirror <git URL> --mirror-commit c344c47` still reported the 3 as missing; `--mirror <local clone>` found them.
- **Correction 16:25.** The seeder's "bug" above was my abbreviated `--mirror-commit c344c47`: git cannot fetch a short SHA from a remote, so the mirror was dropped. The full SHA works. litlfred/fhir-harness#134 (issue #133) makes the seeder refuse a short SHA by name.

## 2026-10-30 11:40Z — measured against "Done when", per repository (thread draining aai-programme#40, https://claude.ai/code/session_013ZJ1uYnvBifNcPaVPVJbUS)

Measured from each fork's default branch and gh-pages through the REST API.

| repo (head) | 1. index.config.json + consent | 2. no push/PR gh-pages writer | 3. harnessed site, agent-published, Pages green | extra |
|---|---|---|---|---|
| smart-base (main 4571b1f) | met: 6 remote mounts, each with consent whose ref = the pin; no submodule | met, with the sanctioned `publish-context.yml` (push, writes only the JSON-LD context; bean 63q4) | met: gh-pages `folio-build.json` from 50f373b (2026-10-16); latest Pages run 40042559557 success | `branches/` previews survive (30+ dirs): **met** |
| smart-base-clinical (main 052a2ec) | met: 7 mounts, consent 2026-10-15 | met (fhirbuild, release only) | **not met**: no gh-pages branch, no `site` key, no `cat/fhir-harness/fhir-ast/*` AST cache | |
| smart-core (master 01cc729) | met: 7 mounts, consent 2026-10-15 | met (fhirbuild dispatch only) | **not met**: no gh-pages, no AST cache | buildability: see below |
| smart-hiv (main 1cb92e9) | met: 7 mounts, consent 2026-10-15 | met (all dispatch/release) | met: gh-pages 8c4dcea "folio site, built locally" from 50162f2 (2026-10-15); Pages run 38807117989 success. AST branch `cat/fhir-harness/fhir-ast/smart.who.int.hiv` | site is two weeks behind main |
| smart-immunizations (main f2f75c9) | met: 7 mounts, consent 2026-10-24/29 | met (`repo_actions.ymlOFF` is not a workflow; harness-pr-checks and ig-ast-refresh write no gh-pages) | met: `folio-build.json` from ff6a29a (2026-10-15); Pages 39814091498 success | |
| smart-trust (main 89df1be) | met: 7 mounts, consent 2026-10-23 | met (same shape as immunizations) | met: `folio-build.json` from f349127 (2026-10-15); Pages 39814084881 success | |
| smart-ra (main cacf7de) | met: 7 mounts, consent 2026-10-29 | met (qa-sweep on PR is warn-only, writes no gh-pages) | met: gh-pages 0f74cda "Publish dpi-h-ra 9d9cbbc" (2026-10-26); Pages 40340760641 success | public-comment preview: **not met** — the only agent-built preview (`STAGING/claude-stoic-bohr-w77r7f`, 2026-10-14) carries no `public-comments/` or `changeset.json`; the four previews that do were built by the retired `staging.yml` (github-actions[bot], 2026-10-05..10) |

**smart-core.** Pre-SUSHI: `ig.ini` → `input/core.xml` (`who.fhir.core` 0.2.0, no FSH), template `who.fhir.template#current`. A `#current` package is served only by build.fhir.org (refused here) and the mirror takes exact versions only, so the IG Publisher cannot run it in this environment.

Owner setting still open: the Routine environment allowing clone of the litlfred repos and `bun` (not attempted).

## 2026-10-30 12:22Z — fixes after the measurement (same thread)

- **smart-ra#101 (merged, 95229fa)**: `site.build.pre` now runs `ig-index:build` before `check:archimate`. Since the repin to smart-base 415d637 (smart-ra#96), every smart-ra site build was refused at the coverage gate. The cause: smart-base stopped committing `fhir-artifact-index/index.json` (smart-base 091a6c1, fhir-harness#124), so the ig-pages writer for the mounted smart-base had nothing to render. Verified by a dry-run from a cleared index: 16089 pages, 0 unresolved. The PR's harness checks show failures only because they ran after the merge (`refs/pull/101/merge` gone).
  - smart-trust and smart-immunizations mount smart-base the same way and will likely hit the same gate on their next publish. Neither runs `ig-index:build` for mounted IG instances. The general fix belongs in build-instance-site: run mounted instances' `builtAtPublish` writers.
- **smart-ra public-comment preview: done.** It is agent-built at `STAGING/pr-93/` (gh-pages 62c4195), from external PR smart-ra#93 (Chine-E, a 1-line prose change to the executive summary) merged onto main.
  - The preview carries `changeset.json` (1 prose change), `review/`, and the public-comment dashboard (`en/folio-assistant-core/public-comments/folio/dpi-h-ra/`, 2744 comments).
  - The link is on smart-ra#93. Pages run 41053277898 succeeded.
  - Seen: stage-local found "no open pull request" for the local branch name `pr-93`, because the fork's head ref is `patch-3`. So the review page has no PR review comments.
- **smart-base-clinical#5 (merged, c3d594e)**:
  - `site: {landing: smart-base, agentRun: true}`;
  - fhir-harness's `ig-ast-refresh.yml` and `site-publish.yml` templates, unchanged;
  - an AGENTS.md with "The site";
  - the 7 layers repinned to smart-ra's 2026-10-29 set, with the owner's consent of 2026-10-30T11:13Z. smart-base's directory list follows 415d637, where `smart-base-external-schemas` is gone.
  - Not repinned to the main tips: fhir-harness main `typologies/ig-annex.json` carries `shownOnPublishedPages`, which cat-harness main's GraphTypologyNode schema rejects (`unrecognized_keys`). The main tips are mutually inconsistent at 2026-10-30 11:50Z.
- **smart-base-clinical AST: blocked.** `ig-ast-refresh` run 41051844061 failed twice, deterministically (attempts at 11:58Z and 12:15Z, about 2 minutes each), in "Build the IG and export its AST". The only readable annotation is "404 Not Found"; the job log and the `ast-build-log` artifact are refused from this container (blob host 403).
  - Suspected cause: `smart.who.int.base#1.0.0` (sushi-config dependency), which is neither on npm nor in fhir-package-mirror. The template `who.template.root#current` is the other candidate.
  - Needs someone who can read the job log (the owner, in the browser), or the package published or mirrored. Without an AST there is no site, so smart-base-clinical's checklist item 3 stays open.

## Merged from the cat-harness copy (bean dedupe, 2026-10-30)

These lines differed from the kept copy and could not be merged automatically (cat-harness-tools#459). They are kept here so nothing is lost.

Where: ## 2026-10-10 — staging previews are agent-run (owner's decision)

```text
Owner, 2026-10-10, choosing between agent-run previews, PR previews in Actions, and no previews: **"Agent-run previews"**.

The one agent-run build tool this epic delivers also publishes a branch preview at `STAGING/<branch>/`, the path smart-ra's public-comment links expect for the AFTER side. It runs on request, or from a Routine. Nothing in Actions builds a preview on its own.

Until the tool exists, an agent starts `staging.yml` by hand (workflow_dispatch) for any PR that needs a preview.

Done when, added:
- [ ] the build tool takes `--staging <branch>` and writes only `STAGING/<branch>/`, keeping the root site and the other previews
- [ ] smart-ra: a public-comment change set can be reviewed on an agent-built `STAGING/<branch>/` preview
```

Where: ## 2026-10-11 — environment migrated: four repositories on remote mounts, and an agent-run publish

```text
Owner, 2026-10-10: *"keep going. keep migrating environment"*. On 2026-10-11: *"repin as needed. merge all ready green next 4hrs, continue"*.

**Remote mounts, no submodule.** These follow who-iris's pattern: the instance declaration at the root, plus `index.config.json`. Each mounts smart-base (its 22 declared directories), fhir-harness, folio-assistant-core, cat-harness, cat-harness-tools, bootstrap and bootstrap-tools, at each repository's main of 2026-10-10:
- smart-hiv#2: `smart-hiv.json`
- smart-base-clinical#2: `smart-base-clinical.json`
- smart-core#2: `smart-core.json`

Each was verified from an empty directory: remote-mount exits 0 and all seven layers mount. The declarations declare no directories yet (dh4f), and the IG content is seeded later (53rv).

**smart-ra (dpi-h-ra), step 1: smart-ra#37.** The same mounts sit beside the folio-assistant submodule. Step 2 moves its six workflows onto the mounts and removes the submodule.

**The build tool.** `build-instance-site` is in place:
- implementation: cat-harness-tools #58, #62, #64, #67;
- Tool node and `ScriptName` type: cat-harness #104;
- `publish-site --into/--keep`: bootstrap-tools #16.

who-iris is pinned to it (who-iris #32, #33, #34). Its publish Routine now makes one `build-instance-site` call. It was first used from this session (gh-pages 2951fee; Pages run 38072524836, success). The Routine itself is blocked: its session's permission check refuses cloning the pinned layers.

Still open:
- [ ] smart-ra step 2: workflows onto the mounts, submodule removed
- [ ] an IG mode for build-instance-site (fhir-harness stage-ig-sites), after 53rv's packages land
- [ ] the Routine environment allows cloning the litlfred repos and `bun install`/`bun run` (owner setting)
```

## 2026-10-31T12:15:30Z — smart-base-clinical AST + harnessed site published; all 7 repositories complete

- **smart-base-clinical (`main` `d99c02b`):**
  - Cause of `ig-ast-refresh` run `41051844061` failure (confirmed from job `124054820706` log): SUSHI succeeded (`0 Errors, 1 Warning`), and `AstExportCli` failed fetching `who.template.root#current` from `https://build.fhir.org/ig/WorldHealthOrganization/smart-ig-template/branches/main/package.tgz` (`404 Not Found`).
  - Resolved via `template-repos: who.template.root=WorldHealthOrganization/smart-ig-template` (`fhir-harness#196`): AST cache branch `cat/fhir-harness/fhir-ast/smart.who.int.base-clinical` is seeded, `Site publish (by hand)` run `41158331849` succeeded (`2026-10-31T02:04:54Z`), `gh-pages` is at `dbb243827bbd36ce4b75c13894aedaacd841eab1` (*"Publish smart-base-clinical d99c02b (folio site, built locally)"*), and `pages build and deployment` run `41158735874` succeeded (`2026-10-31T02:10:03Z`).
- All five per-repository checklist items are now met across all seven `smart-*` repositories (`smart-base`, `smart-base-clinical`, `smart-core`, `smart-hiv`, `smart-immunizations`, `smart-trust`, `smart-ra`).
