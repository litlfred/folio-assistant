---
# folio-assistant-7s52
title: staging-review hands a reader URLs the AGENT cannot open — but the publish ref is a git branch
status: in-progress
type: task
priority: normal
created_at: 2026-09-22T06:33:57Z
updated_at: 2026-09-22T06:34:02Z
parent: folio-assistant-o3xy
---

Issue: https://github.com/litlfred/folio-assistant/issues/849

`staging-review` already owns the publish ref, and already names the failure:
bean `rptk`, a contrast defect that survived two days *"because the gate that
swept the page never opened the view"*. It composes URLs for a reader and stops
there.

THE AGENT CANNOT OPEN THEM. Measured this session, all three routes:
`curl` -> 403 CONNECT tunnel failed; `WebFetch` -> EGRESS_BLOCKED; Playwright
-> `net::ERR_TUNNEL_CONNECTION_FAILED` (Chromium is proxy-configured too, so a
browser is not a way around it).

The cost is measured rather than hypothetical: twelve navbar tiles shipped
pointing at the ORIGIN instead of the site (#801), and 100+ green gates were
fine with it, because nothing in the repository could look at what deployed.

But the site is published to the `gh-pages` BRANCH, and git works. Serving that
ref through a Playwright route handler renders the real deployed bytes. Used
twice this session: the production/staging A/B that reproduced the owner's 404
mechanically (12/12 off-site vs 0/12), and the post-merge uploads check.

Related to `81vy` (deployment awareness — which tools apply on which surface),
which stays open: that bean is about the surface constraining the tools, this
is one technique for one surface.

## Done when

- [ ] `staging-review` says the agent can open it itself, with the mechanics
- [ ] The limit is stated: it serves BYTES, not the live host — redirects,
      headers and Pages' own 404 behaviour are out of scope
- [ ] How to tell the technique has stopped applying (publishing moves off a
      branch), rather than reporting a clean run over nothing
- [ ] `bun run gates` green
