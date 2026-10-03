---
# folio-assistant-j27s
title: 'PAGES CANCELLATION: batch staging-preview pushes to gh-pages so the main-site Pages build is not cancelled (#1868 option 1)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-03T08:07:15Z
updated_at: 2026-10-03T08:08:01Z
---

Issue #1868, second problem (comment 2026-10-02T18:10Z): GitHub's pages-build keeps only the newest run and staging pushes land every few minutes, so main-site deploys are cancelled. Owner ruling 2026-10-03 (this session): option 1, push staging previews to gh-pages less often (batch / rate-limit).

## Done when
- [ ] tracking issue for option 1 opened and linked from #1868
- [ ] feature-staging.yml pushes to gh-pages at most once per window (design in the PR), preview comments say when the batch lands
- [ ] skill/doc that describes staging updated
- [ ] gates green
