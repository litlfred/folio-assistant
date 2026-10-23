---
# folio-assistant-53rv
$schema: bean/1.0.0
title: 'NETWORK-ACCESS AGENT: fetch what this environment cannot reach (FHIR packages for the mirror, WHO guideline PDFs from IRIS, published IG outputs) and commit them to GitHub'
status: todo
type: task
priority: high
created_at: 2026-10-10T15:06:54Z
updated_at: 2026-10-23T14:00:00Z
parent: folio-assistant-ahvw
---

Owner, 2026-10-10: *"make bean for agent with netwrok access."* The network policy of this session's cloud environment refuses the hosts below with 403. The owner says changing that policy is not theirs to do. So the work below waits for an agent whose environment CAN reach them, or a person on an ordinary machine. Every item ends in a commit to a GitHub repository, which this environment can read. Once it is pushed, the blocked sessions continue offline.

## Hosts refused here (measured 2026-10-10)
- packages.fhir.org, packages2.fhir.org, build.fhir.org
- smart.who.int, worldhealthorganization.github.io
- iris.who.int, www.who.int, cdn.who.int

Reachable here: github.com (git), raw.githubusercontent.com, registry.npmjs.org, pypi, repo1.maven.org.

## Tasks for the agent with network access

### 1. FHIR packages → litlfred/fhir-package-mirror
Add `<name>#<version>.tgz` and its `SHA512SUMS` line. Fetch from packages.fhir.org, and verify each package's `package/package.json` name and version.

Needed for smart-base-clinical (measured):
- `hl7.terminology#7.3.0`
- `hl7.fhir.uv.crmi#2.0.0`
- `hl7.fhir.uv.cqm#2.0.0`

Also needed (reported 2026-10-23 by the SUSHI and Publisher AST runs):
- `hl7.fhir.uv.sdc#4.0.0` (smart-base)
- `hl7.fhir.pubpack#0.2.7` (hard-coded in IG Publisher core 7.0.1)
- `hl7.fhir.uv.tools.r4#1.3.0` and `hl7.fhir.uv.tools.r5#1.3.0` (Publisher TOOLING_IG_CURRENT_RELEASE)
- the latest non-prerelease of `hl7.terminology.r4` and of `hl7.terminology.r5` as packages.fhir.org lists them today. The Publisher adds these automatically. Write the chosen versions in the bean note.

For every package above, also mirror its transitive dependencies (`package.json` `dependencies`), skipping any already in the mirror. Mirror exact versions only: never commit a ballot or npm build under a release version's name.

Then run the seeder for smart-hiv, smart-core, smart-base, smart-trust, smart-immunizations and smart-ra. For each, add every package it reports MISSING:

```sh
bun run fhir-harness/scripts/fhir-cache-seed-npm.ts --sushi-config <ig>/sushi-config.yaml \
  --mirror <mirror> --site-repo smart.who.int.=WorldHealthOrganization/smart-html \
  --missing-out missing.txt
```

smart-core has no sushi-config (it is pre-SUSHI); read its `ig.ini`/`core.xml` for dependencies instead.

### 2. Guideline PDFs from IRIS → the owning repository's `uploads/`
Use the existing intake: `folio-assistant-core/scripts/fetch-dspace-item.ts` / `fetch-who-publication.ts`. Each fetch writes `uploads/<doc_id>/` with `intake.json` and the Dublin Core record. Commit those; the PDF itself is pinned by sha256, as smart-immunizations already does.
- **smart-hiv:** the HIV DAK (2023 web annexes are already in `input/l2/`; the DAK document itself is not), Consolidated guidelines on HIV testing services (2019), and Consolidated guidelines on the use of antiretroviral drugs (2016 2nd ed., plus the current edition the PlanDefinitions should cite).
- **smart-immunizations:** every vaccine position paper on the `References` sheet of `input/decision-logic/IMMZ DAK_decision-support logic.xlsx`. Measles (WER 92(17)) is already in litlfred/test. Also the cited items held only as URLs in `library/9789240099456-eng/smart-kg-l1-dak-references.json`.

### 3. Published IG outputs, for seeding the artefact index
smart-hiv, smart-base-clinical and smart-core have no gh-pages of their own. Either:
- run SUSHI and the IG Publisher once task 1 lands (Java is available here), or
- copy WHO's published outputs (`canonicals.json`, `package.tgz`, `artifacts.html`, `package.manifest.json`) into a branch the seeding can read (`ingest-ig-artifacts.ts --kind gh-pages`).

## Done when
- [ ] fhir-cache-seed-npm reports 0 missing for all seven smart-* IGs, offline except for github/npm
- [ ] smart-hiv `uploads/` holds the HIV DAK and the HTS and ARV guidelines; smart-immunizations' holds the position papers
- [ ] bean n3h9 notes which seeding source was used for each of the three IGs without gh-pages

Related: n3h9 (harness the smart-* repos), kvd2 (recommendation scenarios), 8pzh (L1 extraction).

_2026-10-16T10:45:00Z_ — Parented to `ahvw` (PROCESS) by subject: it had no parent, so it sat under no epic or goal and failed the parent check on main (https://claude.ai/code/session_01NUrhvvMEwU5MmPW4L2w9jP).

## Run sheet for an agent on the owner's device (added 2026-10-23)

Start it from the owner's machine (`~/space_cats`), where packages.fhir.org and iris.who.int are reachable. The last mirror commit (eead24e, 2026-10-06) was made this way.

Repos and branches:
- This bean: `litlfred/folio-assistant`, branch `cat/cat-harness/beans` (the newest bean copy). Edit it with plain git commits, never `state:push`.
- Mirror: `litlfred/fhir-package-mirror`, branch `main`. Commit tarballs + `SHA512SUMS` straight to `main`, as before.
- Seeder: `fhir-harness/scripts/fhir-cache-seed-npm.ts` from the `litlfred/fhir-harness` layer.
- IGs: `litlfred/smart-base`, `smart-base-clinical`, `smart-core`, `smart-hiv`, `smart-immunizations`, `smart-ra`, `smart-trust`.

Order:
1. Task 1 first. Push the three tarballs to the mirror as soon as they verify, before running the seeder, because the Publisher AST work (bean a9tx) waits on them.
2. Seeder on all seven IGs; add whatever it reports missing; re-run until 0 missing.
3. Task 2 (IRIS). IG repos: push to a branch `claude/53rv-iris-sources`, and do NOT open a PR. The owner approves PRs on IG repos. SUSHI must pass on the branch before any commit to an IG repo.
4. Skip task 3 unless the owner asks.

Coordination:
- This bean is the shared log. The cloud thread "FHIR packages and sources" in the Folio Assistant project watches this branch and the mirror's `main`, and passes results on to the Publisher AST thread (a9tx). The device agent cannot message those threads, so pushing is how it reports.
- Push after each step finishes (mirror commit, then bean note), not once at the end, so the waiting threads can start early.
- Before each push, `git pull --rebase`, because other sessions commit to this bean branch too.

Follow-up:
- Each bean note says what was done, what is still open, and the exact next command. A later run (device or cloud) then resumes from the note without asking.
- If the run stops part way, leave `status: in-progress` and add a line starting `NEXT:`.

On failure:
- Never commit a tarball whose `package/package.json` name or version doesn't match, or whose download was cut short. Record it as `FAILED <package>: <error>`.
- A host that refuses or times out: retry twice, then record `BLOCKED <host>: <HTTP code or error>` and go on with the other items.
- A missing IRIS item: record its title and the URL tried; don't substitute another edition.
- SUSHI errors on an IG branch: don't commit to that IG. Record the first error lines and move on.
- Any FAILED or BLOCKED line keeps the bean open. Set `status: todo` (not completed) and tell the owner in the run's final message.

Report back: append a dated line to this bean listing the mirror commit, each IG's missing count and the IRIS branches, and set `status: completed` only when every Done-when box is ticked.

Status 2026-10-23: none of the three tarballs is in the mirror yet. npm has only older versions (hl7.terminology 7.0.1, crmi 2.0.0-ballot, cqm 1.0.0), so npm is not a substitute. Cloud sessions still get 403 from packages.fhir.org, hl7.org and iris.who.int.
