---
# folio-assistant-5xfr
title: qou's pin bump must rename folio.config.json AND add qaAxes in the same commit, or it silently loses both
status: todo
type: task
priority: normal
parent: folio-assistant-1swy
created_at: 2026-09-20T14:37:58Z
updated_at: 2026-09-20T14:37:58Z
---


## What is true TODAY, measured, because I got it wrong first

I reported in session chat that "qou is running without that axis as of this
merge", after fencing `detangler-archimedean-wall` behind `qaAxes`. **That was
wrong, and the reason is the pin.**

`qou/.folio-assistant-pin` → `df28d02` (2026-09-07). Read at that commit:

- `folioOptionalAxes()` exists and reads `join(findContentRepoRoot(), "folio.config.json")`
  — literally, not through a constant.
- `detangler-archimedean-wall` is registered **unconditionally**.

qou carries `folio.config.json`. So at its pin qou is correctly configured and
gets the criterion. Nothing broke when #523 merged. The pin is doing exactly
the job `.folio-assistant-pin`'s own header describes — *"every number this repo
quotes is a function of BOTH the corpus commit and the platform commit"* — and
it bought the time this bean is written in.

## What breaks at the bump, and it is two independent things

The platform renamed `folio.config.json` → `harness.config.json` on 2026-09-18
(`6nfy`), **eleven days after qou's pin**, and made the old name a hard break
rather than a fallback — on the author's explicit instruction, recorded in
`6nfy`. So a bump past 2026-09-18 does two things at once:

1. **qou loses its entire harness config.** Not just the axis:
   `contentType`, `adapter`, `adapterModule`, `feedbackDir`, `viewer{dir,port}`,
   `simulators{dir,pyodideCache}`, `readme{linkStyle,publishRef,pagesBaseUrl}`.
   `readDeclaredFolioProfile` goes to the third state, which the platform's own
   config comment says "runs every criterion, and the paper adapter's
   LaTeX-shaped axes fire `critical` on prose that never reaches pdflatex."
   `contentType: "paper"` happens to be restored by `src/index.ts`'s default —
   **by accident, not by declaration**, which is the worst kind of working.
2. **qou loses `detangler-archimedean-wall`**, now fenced behind
   `qaAxes: ["archimedean-wall"]` (#523). qou has no `qaAxes` key at all today,
   so this is an addition, not an edit.

Doing only (1) loses the axis silently. Doing only (2) is **inert** — the new
platform will not read `folio.config.json` at all. They have to land together.

## The bump recipe, one file

```sh
cd ~/space_cats/qou
git mv folio.config.json harness.config.json
# then add the key:
#   "qaAxes": ["archimedean-wall"]
```

Nothing else moves. `harness.json` (the instance declaration, added 2026-09-20
in qou#7445) is a **different file** and is already correct — that PR's own
message says it is "inert against qou's current pin … preparation for the bump",
which is the same discipline as this bean and the reason the two must be bumped
as one change.

Then, per `.folio-assistant-pin`'s standing rule, **state the before/after issue
counts in the bump commit message.** Expect the archimedean-wall verdicts to
survive; expect anything the third state was over-running to stop.

## Why this is a bean rather than a chat message

The hazard is invisible from either repository alone. From folio-assistant, qou's
pin is not in the tree; from qou, the platform's rename is eleven days in a
future it has not adopted. Nothing fails today and nothing will warn at the
bump — `9ici` records that the one reader which still accepts the old name reads
**voices only**, so the bump's symptom is fifteen settings quietly gone while
voices keep working.

That is bean `xom7`'s shape one repository boundary out: the broken state and
the working state look identical from inside.

## Done when

The qou pin bump past 2026-09-18 lands with the rename and the `qaAxes` key in
the same commit, and its message quotes before/after counts. **Not actionable
from this repository** — this session has read-only access to qou.

## Not in scope

Bumping the pin. That is a qou decision with eleven-plus days of platform change
behind it, and this bean says only what must ride along when somebody makes it.

## 2026-09-20 — measured in a qou checkout, and it is worse than "add an axis"

Push access to qou was granted this session and the repo is attached, so the
claims below are read off the real tree rather than inferred.

**`.folio-assistant-pin` is not a submodule.** qou links the platform as a
sibling checkout through `scripts/setup-folio-assistant.sh`, and the pin is one
SHA on the last line of `.folio-assistant-pin`. That file carries its own rule,
which this bump has to honour: *"When you bump it, state the before/after issue
counts in the commit message — a change in count is a platform behaviour change
and should be looked at, not absorbed silently."*

**The config name is already dead at `main`, independently of #567.**
`folioOptionalAxes()` on `origin/main` reads:

```ts
resolveHarnessConfigPath(findContentRepoRoot())?.path
  ?? join(findContentRepoRoot(), HARNESS_CONFIG)
```

`HARNESS_CONFIG` is `harness.config.json`, and `folio.config.json` is **not a
fallback** — `harness-dirs.test.ts` asserts that deliberately ("the old name is
dead, not deprecated"). qou carries `folio.config.json`. So a bump to current
main leaves qou's config **entirely unread**, not merely missing an axis:

| key in `qou/folio.config.json` | what goes unread | observable |
|---|---|---|
| `qaAxes` (absent) | the archimedean-wall opt-in | criteria silently stop running |
| `simulators.dir` | `"simulators"` | README simulators section → third state |
| `contentType` / `adapterModule` | `"paper"` | masked — `paper` is also the default |
| `readme.pagesBaseUrl` | `https://litlfred.github.io/qou` | masked — same answer from the git remote |
| `viewer.dir`, `feedbackDir` | platform subpaths | unread |

Three of those are masked by a default that happens to agree. That is what
makes it the bad kind of break: the two that are NOT masked are the two nobody
looks at on a normal day.

**qou still works only because its pin predates the rename.** `df28d02` is
2026-09-07; the global name changed 2026-09-18. Eleven days of drift that no
gate in either repo can see, because qou's CI runs the pinned platform and the
platform's CI never sees qou.

## The sequencing, and why it is not "do it now"

The rename target depends on whether #567 has merged:

```
against main today   folio.config.json -> harness.config.json  (+ qaAxes)
after #567 merges    folio.config.json -> qou.config.json      (+ qaAxes)
```

`qou/harness.json` declares `name: "qou"`, so the second is what the instance
is actually called. Doing it now means renaming twice inside a day and leaving
a commit in qou's history pointing at a filename the platform retired the next
morning. **One commit, after #567 merges.**

## Done when

- [ ] #567 is merged and a platform SHA containing it exists.
- [ ] One commit on a `claude/` branch in qou: `git mv folio.config.json
      qou.config.json`, add `"qaAxes": ["archimedean-wall"]`, bump
      `.folio-assistant-pin`.
- [ ] Before/after issue counts measured against the SAME corpus commit and
      written into that commit message, per `.folio-assistant-pin`'s own rule.
- [ ] The archimedean-wall criteria are confirmed RUNNING after the bump —
      the whole point, and the thing a green sweep would otherwise hide.
