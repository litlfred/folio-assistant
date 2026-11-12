---
# folio-assistant-g2es
$schema: bean/1.0.0
title: 'Memory: How to run sushi in a cloud sandbox where packages.fhir.org is blocked (seed ~/.fhir/packages from fhir-package-mirror + npm)'
status: completed
type: task
priority: low
created_at: 2026-11-10T19:55:08Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `sushi-in-sandbox.md` (memory type: reference) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: How to run sushi in a cloud sandbox where packages.fhir.org is blocked (seed ~/.fhir/packages from fhir-package-mirror + npm)

packages.fhir.org and *.github.io are blocked by the sandbox proxy. To run sushi (required 0 errors before commit on fhir repos):

1. `GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 https://github.com/litlfred/fhir-package-mirror` (public, no add_repo needed).
2. Extract each `name#ver.tgz` into `~/.fhir/packages/name#ver/` (tarball holds `package/`).
3. Packages missing from the mirror: fetch `https://registry.npmjs.org/<name>/-/<name>-<ver>.tgz` (registry.npmjs.org is reachable) into the same layout. For smart-trust-phw (11-10) that was hl7.fhir.uv.cpg#2.0.0, hl7.fhir.us.cqfmeasures#5.0.0, ihe.iti.pcf#1.1.0, smart.who.int.pcmt#0.1.0, smart.who.int.base#0.2.0.
4. `npm i -g fsh-sushi`, then `sushi build .`.

smart-trust-phw baseline: 0 errors, 10 warnings. Issues are disabled on that fork. Published pages live on its gh-pages branch (readable with git fetch).

smart-trust-phw publishing (11-10, owner card Q-TX-3 A): `site-publish.yml` (by hand, workflow_dispatch on main) now publishes gh-pages from Actions; it needs bun 1.4.4 (bun.lock is lockfileVersion 2). PRs #55 (transactions page fix), #56, #57 merged; first Actions publish daff855.
