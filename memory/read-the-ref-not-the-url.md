---
$schema: folio-memory/v1
id: read-the-ref-not-the-url
label: trap
summary: "a 404 or a failed fetch is not evidence — read the publish ref"
createdAt: 2026-09-19
roles:
  - build-pipeline
agents:
  - ci-health-watcher
---
**First check for a deployment or 404 question is the publish ref, not a
fetch.** `git fetch origin gh-pages && git ls-tree -r --name-only FETCH_HEAD |
grep <thing>`; staging previews are `STAGING/<branch-slug>/`, the slug being
the branch with `/` replaced by `-`.

**A published URL is looked up, never composed.**
`docs/<stub>/proposals/x.md` publishes to `/proposals/x.html` — the stub
segment is a source-tree convention Jekyll does not carry into the site, so a
composed URL 404s on a page that is there. Measured 2026-09-19 on
`cat-bootstrap.md`.

**A failed fetch from an agent container is a proxy result.** Outbound HTTPS
is proxied and `github.io` is blocked: `curl` returns `000` with `CONNECT
tunnel failed, response 403` whether or not the page exists. "Could not
determine" is honest, and still the wrong answer when the ref could determine
it.

**CI state is `get_check_runs`, not `get_status`** — the latter reports
`{"state":"pending","total_count":0}` on a PR whose checks are green, because
this repo posts check runs and no legacy statuses. Compare its `head_sha`
against the PR's current head: `check_suite.completed` routinely names a
superseded sha, and the staging workflow's own commits are not PR heads.

Skill: `skills/folio-core/github-state-inspection.md`.

NOT tagged to `platform-boundary-guard`, which wants the compose-not-resolve
half: measured 2026-09-19 it was already at **201 of its 200 lines**, so a
14th entry pushes one of its own TRAPs past the harness cut. The skill is the
source of truth; memory only summarises.
