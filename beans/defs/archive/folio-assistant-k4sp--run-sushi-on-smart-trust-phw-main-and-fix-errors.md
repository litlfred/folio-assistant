---
# folio-assistant-k4sp
$schema: bean/1.0.0
title: 'Run SUSHI on smart-trust-phw main with all packages and fix any errors'
status: completed
type: task
priority: normal
created_at: 2026-10-30T19:36:00Z
updated_at: 2026-10-30T20:30:40Z
parent: folio-assistant-negd
---

From thread "Drain PCF beans", 2026-10-30. Cloud sessions cannot fetch two of phw's packages, `ihe.iti.vhl#1.0.0-comment` and `smart.who.int.pcmt-vaxprequal#current`. Run there, SUSHI 3.21.0 on [smart-trust-phw](https://github.com/litlfred/smart-trust-phw) main (4077fba) reports 14 errors: the two failed downloads plus 12 that follow from them (patient-nationality, logical-target and artifact-versionAlgorithm extensions, and the FinishedVaccineProducts type). Suited to agy, which has the network access.

Repo: smart-trust-phw.

## Done when
- [x] SUSHI runs on phw main with every package in `sushi-config.yaml` loaded.
- [x] It reports 0 errors, or each remaining error is fixed in a PR (FSH or `sushi-config.yaml`), with no package swapped for another version.
- [x] If a package is truly unavailable, it is added to [fhir-package-mirror](https://github.com/litlfred/fhir-package-mirror) so cloud sessions can run SUSHI too.

_2026-10-30T20:13:30Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).

_2026-10-30T20:30:40Z_ — Completed:
- Ran `sushi .` on `litlfred/smart-trust-phw` `main` (`4077fba6e553a3da5078bb07e061db429f2e1955`) with every package in `sushi-config.yaml` loaded: **0 Errors, 7 Warnings** (60 FHIR resources exported, no FSH or `sushi-config.yaml` changes needed).
- Added `ihe.iti.vhl#1.0.0-comment`, `smart.who.int.pcmt-vaxprequal#current` (from `build.fhir.org/ig/qas.json`, with `package/package.json` `version` normalized to `"current"` so `fhir-cache-seed-npm --mirror` accepts it), and its transitive dependency `hl7.terminology.r5#7.3.0` to [litlfred/fhir-package-mirror#5](https://github.com/litlfred/fhir-package-mirror/pull/5) (merged as `87e59e41d49b656e9f8faa5801a6e6c29cb5ec53`), and extended `scripts/mirror.py` to support `name#current` specs from `build.fhir.org/ig/qas.json`.
- Verified offline cloud-session workflow: `fhir-cache-seed-npm.ts --sushi-config sushi-config.yaml --mirror <mirror> --site-repo smart.who.int.=WorldHealthOrganization/smart-html` installs all 39 declared + transitive packages with **0 missing**, and `sushi .` with `FPL_REGISTRY` pointing at the local mirror reports **0 Errors, 7 Warnings**.
