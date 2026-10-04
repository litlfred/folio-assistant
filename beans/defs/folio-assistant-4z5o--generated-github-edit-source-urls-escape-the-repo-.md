---
# folio-assistant-4z5o
title: 'Generated GitHub edit/source URLs escape the repo with ../ for every cross-instance figure'
status: todo
type: bug
priority: normal
created_at: 2026-10-04T09:08:59Z
updated_at: 2026-10-04T09:08:59Z
---
Generated pages compose GitHub URLs by joining an instance-relative path that leaves the instance root, producing links with `/main/../` in them:

    https://github.com/litlfred/folio-assistant/edit/main/../folio-assistant-core/processes/library/l1-document-ingestion.bpmn
    https://github.com/litlfred/folio-assistant/blob/main/folio-assistant-core/...   (the blob form is correct)

The `edit/` form is broken on the published site. GitHub does not normalise `..` in that position.

PRE-EXISTING ON MAIN, not introduced by any one PR. Counted with `git grep -o "edit/main/\.\./[a-z-]*"` over `cat-harness/docs/*.md`:

| instance | main | #1898 branch |
|---|---|---|
| folio-assistant-core | 7 | 12 |
| fhir-harness | 3 | 3 |
| smart-base | 2 | 2 |
| folio-assistant-sci | 1 | 1 |

13 on main, 18 on the branch - the branch moves five more figures across the boundary, so it amplifies a defect it did not create.

## Done when
- [ ] a cross-instance edit URL is repo-root-relative, with no `..` segment
- [ ] a test pins it for a figure whose source is in a nested instance
- [ ] the count is zero, not baselined
