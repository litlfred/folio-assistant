---
# folio-assistant-k4sp
$schema: bean/1.0.0
title: 'Run SUSHI on smart-trust-phw main with all packages and fix any errors'
status: todo
type: task
priority: normal
created_at: 2026-10-30T19:36:00Z
updated_at: 2026-10-30T19:36:00Z
parent: folio-assistant-negd
---

From thread "Drain PCF beans", 2026-10-30. Cloud sessions cannot fetch two of phw's packages, `ihe.iti.vhl#1.0.0-comment` and `smart.who.int.pcmt-vaxprequal#current`. Run there, SUSHI 3.21.0 on [smart-trust-phw](https://github.com/litlfred/smart-trust-phw) main (4077fba) reports 14 errors: the two failed downloads plus 12 that follow from them (patient-nationality, logical-target and artifact-versionAlgorithm extensions, and the FinishedVaccineProducts type). Suited to agy, which has the network access.

Repo: smart-trust-phw.

## Done when
- [ ] SUSHI runs on phw main with every package in `sushi-config.yaml` loaded.
- [ ] It reports 0 errors, or each remaining error is fixed in a PR (FSH or `sushi-config.yaml`), with no package swapped for another version.
- [ ] If a package is truly unavailable, it is added to [fhir-package-mirror](https://github.com/litlfred/fhir-package-mirror) so cloud sessions can run SUSHI too.
