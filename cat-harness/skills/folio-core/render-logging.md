---
name: render-logging
description: >-
  Log every render to the publish branch — what was published, removed,
  restored or deliberately retained — to an append-only log that lives beside
  what it describes. Use when adding or removing anything on `gh-pages`, when
  asking "what happened to this preview", or before writing a workflow step
  that deletes a published artefact.
agents:
  - platform-boundary-guard
  - ci-health-watcher
---

# Render logging — the publish branch keeps its own history

Owner, 2026-09-20: *"a specialised Logger skill for the gh-pages rendering
context … log all staging rendering (when added, when deleted) to a logging
directory/file on gh-pages."*

## The question it exists to answer

> **What happened to `STAGING/<slug>`, and why?**

Today nothing answers that. A preview appears, a bot comments a URL, and some
time later the link 404s. Whether it was cleaned up because its pull request
closed, removed by a dispatch somebody confirmed, or **deleted by an unrelated
merge to `main`** is not recoverable — and the third really happened, on every
deploy, for months, measured on the real branch: bean `plj1`, three
`docs(gh-pages)` commits, 1/3/1 previews on their parents and zero after.

The defect was silent precisely because **the publish branch kept no record of
its own changes**. That is what this fixes.

## Append-only, and never anything else

A removal is a **new entry**, not the erasure of an old one. The pair — the
`rendered` and the `removed` that follows it — IS the history.

This is not a rule somebody has to remember. `scripts/render-log.ts` offers no
verb that could lose an entry: no `--remove`, no `--edit`, no id to overwrite.
The never-delete property is a shape, so a caller cannot be written wrongly.

**Emptying a log is a person's decision**, taken deliberately, with the
confirmation every durable artefact here requires
([`deletion-requires-confirmation`](deletion-requires-confirmation.md)). No
tool and no workflow does it.

## The four events, and why `retained` earns its place

| event | what it records |
|---|---|
| `rendered` | published, or re-published over itself — so "when was this last built" needs no commit archaeology |
| `removed` | taken down. **Requires a reason**, refused without one |
| `restored` | carried across a full-replace deploy by `restore-staging`. Its own event, because "somebody pushed this branch" and "an unrelated merge nearly deleted it" are different facts |
| `retained` | a removal was **considered and refused**. Also requires a reason |

`retained` is the one that makes the log worth reading. A preview still
standing because a liveness signal fired leaves no trace otherwise, and the
next person asking *"why is this still up"* has nothing to consult — which is
how bean `w2g5`'s branch-reuse case became invisible in the first place.

## Where it lives, and why that is structural

`_render-log/<YYYY-MM-DD>.jsonl`, at the **root of the publish branch**.

**Outside `STAGING/`, deliberately.** The cleanup runs
`rm -rf "STAGING/$SLUG"`, and a branch named to collide with a directory under
`STAGING/` slugifies to exactly that name — verified, git permits such a ref.
A store outside `STAGING/` is unreachable by that command whatever the slug
says. A guard you have to remember is not the same as a location that cannot
be reached.

**One file per UTC day**, not one growing file and not one per entry. Six
workflows publish to this branch; a read-modify-write of a single file loses
whatever landed in between, and the tool appends a line rather than rewriting.
One file per entry would make "what happened this week" a directory walk.

## It does NOT survive a deploy on its own — this is the part to get right

`docs-site.yml` is a **full replace**: `git rm -r --ignore-unmatch '*'` over
the whole branch, then copies `_site` in. It is the only one of this
repository's six `gh-pages` publishers without `keep_files: true`, and it is
the one that fires on every push to `main`.

So **the log is carried across that deploy by `restore-staging.ts`**,
unconditionally — not gated on open pull requests the way previews are. A
preview belongs to an open PR; a log entry about a *closed* one is exactly
what nothing would carry, and exactly what a reader needs most.

A log a deploy truncates is worse than no log, because its whole value is that
entries persist and a reader will believe they did.

`CARRIED_PREFIXES` is where that is declared, and it is a **list** because
this is the second tenant of one rule rather than a special case: bean `6pfo`'s
retired-record store is the next, and adding it should be a row rather than a
third code path free to disagree with the other two. The carry runs **before**
the preview check, deliberately — the early `empty` return used to leave that
function the moment there were no previews, which would have kept the record of
the branch only on the days the branch happened to still hold previews.

A carry that could not be determined is **not a warning**. It collapses into
the restore's own `unknown`, exit 2, which fails the deploy step: continuing
would run the full replace and delete the record. A determined *absence* — the
branch is readable and has no log yet — is reported rather than omitted,
because "there is no log yet" and "the carry never ran" look identical in a
silent report and only the second is a defect.

## Who writes an entry

Every path that can change `STAGING/` writes one, and
`scripts/tests/workflow-yaml.test.ts` asserts that by job rather than leaving
it to be remembered:

| path | event | how it lands |
|---|---|---|
| `feature-staging.yml` → `stage` | `rendered` | its **own commit**, after the deploy. The publish action writes only into `destination_dir`, so an entry riding in `_site` would land at `STAGING/<slug>/_render-log/` — inside the directory a cleanup removes |
| `feature-staging.yml` → `cleanup`, confirmed | `removed` | the **same commit as the removal** |
| `feature-staging.yml` → `cleanup`, unconfirmed | `retained` | its own commit |
| `feature-staging.yml` → `cleanup-dispatch` | `removed` | the **same commit as the removal** |
| `docs-site.yml` → restore | carried, not written | `restore-staging.ts` |

**A removal and its record are one commit.** A separate log push can fail on
its own and leave a preview that vanished with nothing saying why, which is
precisely the state bean `plj1` left the branch in. Staging them together makes
that impossible rather than unlikely.

**The `rendered` and `retained` entries are `continue-on-error`.** A preview
that deployed and whose entry did not is a gap in the record, not a failed
deploy, and failing the job there would turn a logging problem into a lost
review surface. The step goes red in the run, so the gap is visible. A
`removed` entry has no such fallback and needs none: it cannot fail separately
from the removal it describes.

## Writing an entry

```sh
bun run cat-harness/scripts/render-log.ts --dir <gh-pages-checkout> \
  --event rendered --kind staging-preview --path STAGING/<slug> --slug <slug> \
  --summary "preview published" --branch "$BRANCH" --commit "$SHA" --run "$RUN_URL"
```

The tool **writes into a directory and never pushes**. The workflows that call
it already hold a `gh-pages` checkout with their own retry and concurrency
handling; a second pusher racing those is a new way to lose a deploy. One job
knows how to push, this one knows what to write.

Reading back: `--read [--day YYYY-MM-DD]`. It **exits 1 when any line could
not be read**, and prints which — a short count must be visible as short,
never passed off as complete. Same rule as
[`ci-health`](ci-health.md): could-not-determine is never rendered as clean.

## A path is checked by VALUE, never trusted by provenance

`--path` is refused unless it is `/` or a sequence of plain segments — no
`..`, no leading `/`, no backslash.

Bean `fuzm`: the staging slug sanitiser **can** emit `..` (input `..` gives
output `..`), and is safe only because git rejects every ref name containing
it. That invariant holds for a slug taken from a ref and **does not hold** for
one taken from a dispatch input — and `cleanup-dispatch` takes exactly that.
So the check is on the value, not on where it came from.

## It is a specialisation of `folio-log/v1`, not a rival

`schemas/log-entry.ts` already answers "what does an entry look like", and a
render entry reuses those spellings: `id`, `at`, `summary`, `detail`,
`references`, `capture`. Three things differ, each deliberately:

| | activity log | render log |
|---|---|---|
| subject | what an **agent** did | what was **published** |
| store | `fsh-guts/logs/`, in the repo | the publish branch |
| published | **no**, by owner decision | **yes**, deliberately |

That last row is not a contradiction of the activity log's rule. They are
different logs: an agent's audit trail is not published, and a record of what
is on the publish branch belongs where its subject's absence can be seen.

## Related

| | |
|---|---|
| the process | [`staging-render-log.bpmn`](../workflows/staging-render-log.bpmn) |
| the entry shape it specialises | `schemas/log-entry.ts`, `skills/folio-core/activity-log.md` |
| why the publish branch loses things | bean `plj1`, `scripts/restore-staging.ts` |
| why a closed PR is not an abandoned branch | bean `w2g5` |
| the path hazard | bean `fuzm` |
