---
# folio-assistant-n3h9
title: 'HARNESS the smart-* IG repositories: index.config.json remote mounts, Actions gh-pages switched off, agent-run harnessed publish'
status: in-progress
type: epic
priority: high
created_at: 2026-10-10T14:06:53Z
updated_at: 2026-10-11T05:50:00Z
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
- [ ] `index.config.json` declares the instance and its remote mounts, with consent recorded
- [ ] no push- or PR-triggered workflow writes gh-pages
- [ ] the harnessed site is built from an empty directory and published by an agent; its Pages run succeeds
- [ ] smart-base: the per-branch IG previews under `branches/` survive
- [ ] smart-core (pre-SUSHI): builds, or is recorded as not buildable with the reason

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
- [ ] the build tool takes `--staging <branch>` and writes only `STAGING/<branch>/`, keeping the root site and the other previews
- [ ] smart-ra: a public-comment change set can be reviewed on an agent-built `STAGING/<branch>/` preview

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
- [ ] smart-ra step 2: workflows onto the mounts, submodule removed
- [ ] an IG mode for build-instance-site (fhir-harness stage-ig-sites), after 53rv's packages land
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
