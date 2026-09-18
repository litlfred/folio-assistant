---
# folio-assistant-u1os
title: Deep staging links in turn reports, and a banner that links back to its issue
status: completed
type: task
priority: normal
created_at: 2026-09-18T17:36:09Z
updated_at: 2026-09-18T17:37:39Z
---

Two author corrections, 2026-09-18.

1. 'instead of just providing the STAGING root, provide the relevant LINKS
   under STAGING for changes made. too much on the user to navigate and find.'
   The turn-report skill requires a staging link but does not say it must be a
   DEEP link to each changed page, and the agent was inconsistent: sometimes
   deep links, sometimes just the root. Root-only makes the reader navigate a
   site to find what changed, which is the cost the rule existed to remove.

2. 'feature branch navbar should link back to issue it is feature branch for.'
   The staging banner names the branch, commit, PR and build log but not the
   ISSUE. A reviewer looking at a staged page cannot get from it to why the
   work exists.

Both are about the same failure: making the reader do lookup work the agent or
the pipeline already had the information to do.
