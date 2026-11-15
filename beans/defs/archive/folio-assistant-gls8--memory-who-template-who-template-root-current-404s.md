---
# folio-assistant-gls8
$schema: bean/1.0.0
title: 'Memory: WHO template who.template.root#current 404s on build.fhir.org (branches/main), breaking IG AST refresh on smart-* mains; card Q-TPL-1'
status: completed
type: task
priority: low
created_at: 2026-11-08T07:34:47Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `who-template-404-2026-11-08.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: WHO template who.template.root#current 404s on build.fhir.org (branches/main), breaking IG AST refresh on smart-* mains; card Q-TPL-1


Since at least 2026-11-02 13:26Z (still at 2026-11-08 07:33Z), the IG Publisher resolves `who.template.root#current` to
https://build.fhir.org/ig/WorldHealthOrganization/smart-ig-template/branches/main/package.tgz, which is 404.
smart-ig-template has NO `main` branch (default `master`, tip 82603d0, package 0.5.0), so the build is stale/cleaned.
Hits every WHO SMART IG using `#current` (ig.ini). build.fhir.org is blocked by this sandbox's proxy; check via a CI run.

- smart-immunizations main's only red = IG AST refresh (runs 41452576476, retry 42458838524). Thread cmsg_017WNUkNK8kdDziPK58Pv6G9X8fAnPqhUxFgVauhsSFpts.
- smart-immunizations#118 (wave-4 pins) is NOT blocked by this: its red is translation:block-qa on lower-layer docs coverage (handed to coordinator 07:28Z).
- Card Q-TPL-1 (07:36Z): A trigger build.fhir.org rebuild of template master (rec), B pre-seed template in fhir-harness ig-ast-refresh from pinned commit, C pin ig.ini #0.5.0, D wait.
- 07:35Z user chose D (wait): no workaround. Thread retries the AST refresh ~10:36Z, then once ~6h later, then stops.
- Retries 10:40Z and 16:46Z (run 42501524359) still 404. Retries stopped; thread left open waiting on build.fhir.org.

Related: [[who-template-issue]] (smart-ig-template#67/#68/#69/#70, user chose to wait).
