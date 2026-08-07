---
# folio-assistant-8agu
title: Move .github/lake-packages.json roster to the content repo
status: todo
type: task
created_at: 2026-08-07T10:44:09Z
updated_at: 2026-08-07T10:44:09Z
---

The roster lives in folio-assistant but its lake-root paths (content/<paper>/lean) only resolve in the content repo, which has no roster at all. Same leak class as n1wp/tqoe. lake-cache.sh works around it by inferring the package from the branch family, but lake-cache-refresh.yml still reads the platform copy.
