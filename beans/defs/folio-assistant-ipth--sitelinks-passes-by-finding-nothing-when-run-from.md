---
# folio-assistant-ipth
title: site:links passes by finding nothing when run from the repo root
status: todo
type: task
priority: normal
created_at: 2026-09-20T07:26:06Z
updated_at: 2026-09-20T07:26:24Z
parent: folio-assistant-1xhc
---

Measured 2026-09-20 while landing bean `q0tc`. `bun run site:links` from the repository root prints 'no harness.json at /home/user/folio-assistant; nothing to resolve.' and **exits 0**.

After the #223 split the root carries no `harness.json` — `cat-harness/harness.json` and `bootstrap/harness.json` do — so the script resolves nothing and reports success. That is the `dh4f` shape inside a script rather than a declaration: a consumer scanning nothing and calling it a clean run.

It is not currently gating (`site:links` is not in the 43-gate fast set), which is why it has gone unnoticed — and is also the reason it is worth fixing rather than shrugging at: a check nobody runs, which passes by not looking, is two failures compounding.

Run from `cat-harness/` it works and prints the link table.

## Done when

- [ ] the script resolves the instance the way every other consumer does — `repoRootFor` / the declaration — rather than assuming the cwd is an instance
- [ ] 'no harness.json' is an ERROR or an explicit could-not-determine, never a silent success
- [ ] decide whether it joins the gate set; a check that is never run is the `5rfy` shape (29 of 32 workflows never fired on their own)
