---
# folio-assistant-53rv
title: 'NETWORK-ACCESS AGENT: fetch what this environment cannot reach (FHIR packages for the mirror, WHO guideline PDFs from IRIS, published IG outputs) and commit them to GitHub'
status: todo
type: task
priority: high
created_at: 2026-10-10T15:06:54Z
updated_at: 2026-10-10T15:06:54Z
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
