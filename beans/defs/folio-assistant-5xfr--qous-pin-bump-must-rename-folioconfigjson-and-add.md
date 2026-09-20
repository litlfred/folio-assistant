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
