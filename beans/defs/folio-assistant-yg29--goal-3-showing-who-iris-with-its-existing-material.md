---
# folio-assistant-yg29
title: 'GOAL 3: showing who-iris with its existing materialised assets, through a themed harness'
status: in-progress
type: milestone
priority: high
created_at: 2026-09-20T18:48:29Z
updated_at: 2026-09-22T19:30:00Z
---

The owner's words, 2026-09-20 (session_017PqeiS4JYySSWGAYLedmus), kept verbatim:

> showing who-iris w/ existing materialized assets with themed harness.

Created on the owner's ruling for bean `wqht`: *"wqht - milesotne"*.

## Epics under this milestone

| epic | why |
|---|---|
| `kupb` | IRIS CATALOGUE — a referenced import of who-iris into the KG, its themes, and the SDLC that tests a sample import. Landed on main with #477. |

## REPAIRED 2026-09-22 — this milestone's stated path was stale, and `k59d` is why it is being rewritten here

`k59d` shipped `bun run check:stale-paths` and then **declined to edit this bean**,
on the correct ground that *"a milestone is a statement of what its owner believes
the goal needs next, and rewriting somebody else's belief is not a checker's to
do."* Its remaining Done-when is *"`p5wm` and `yg29` are repaired **by their
owners**"*. Stream 3 of the #956 consolidation (`w0cr`) owns this milestone, so
this is that repair. `p5wm` is stream 2's and is untouched.

**Every row below was re-measured on `main` @ `b7f8945` before the old text was
removed.** The point of the repair is not tidiness: an agent sent here to ask
"what is next for this goal" was being routed onto four closed boxes, which is
exactly the cost `bean-blocking` names.

| what this bean used to advertise | what the store said |
|---|---|
| step 1 — close `z7ev`, `lzbw`, `huiu`, "built but still read open" | all three already **`completed`** |
| step 3 — `jbx2` | already **`completed`** |
| "Blocked on the owner: `hqku`" | `hqku` is **`completed`** |
| "The missing piece is a page. `who-iris/` has no `docs/`" | `who-iris/docs/` holds **three** rendered pages |

## What is TRUE as of 2026-09-22, each line with how it was measured

Re-measured on `main` @ `b7f8945`, in a fresh container, by running the thing
rather than by reading a previous session's report:

| | measurement |
|---|---|
| `check:voices` | **exit 0** — 6 voices, 58 rules, including `who-editorial`, `who-guideline-development`, `who-publication-design`. This is `kupb`'s own falsifier across the who-style-guide → who-iris boundary. |
| `check:catalogue` | **exit 0** — 13 nodes: **0 unknown, 10 referenced, 3 materialized**, against 1,057,223 files upstream |
| `iris:pages:check` | **11 page(s) up to date, no orphans** |
| the rendered site | built locally, then `mount-instance-docs.ts` run over it: `who-iris/library/` → **`/who-iris/`**, `who-iris/docs/` → `/docs/who-iris/`, `who-iris/library/` → `/library/who-iris/` |
| the theme | `/who-iris/index.html` renders on `--iris-*` custom properties, not just-the-docs chrome |

### All three of this milestone's Done-when clauses are met

- **"The rendered site shows the IRIS hierarchy, with the three materialised
  items distinguished from the referenced ones and the distinction explained"** —
  `/who-iris/community-list.html` carries a state badge per row, a legend table
  giving all three states (`unknown` = *"nobody has looked; never rendered as
  either of the above"*), and the prose *"A row is not greyed out when this
  repository does not hold it — it says referenced instead, which is the actual
  state and the whole point of a catalogue modelled by reference."*
- **"It renders on the IRIS theme rather than the default"** — measured above.
- **"`check:voices` is green across the instance boundary"** — exit 0.

**The badge carries the WORD as well as the colour**, so `j66n`'s own constraint
— *"a theme sets the stripe's hue; it never sets its width to zero"*, SC 1.4.1 —
holds on the rendering as well as on the theme. Checked rather than assumed.

## A correction worth keeping, because the method was wrong before the answer was

The first pass of this measurement concluded the replica pages were **unreachable**
— `bun run preview:site` builds the site and `/who-iris/` is not in its output.
That conclusion was **wrong**, and the reason is instructive: `preview:site` does
not run the `mount-instance-docs.ts` step that `.github/workflows/docs-site.yml`
runs after the Jekyll build. The script's own header warns that it is not what CI
builds, and names theme chrome as the difference; **the mount is a second
difference, and it is the one that decides whether a page exists at all.**

A local preview that omits a mount step reports *absent* for *not-built-here*,
which is the `dh4f` shape — a clean run over content it never saw — pointed the
other way. Recorded here rather than in a session log because the next agent to
verify a mounted instance from a local build will hit it too.

## What actually remains

1. **`809i` is built and was `todo`** — the same "built but reads open" defect,
   one level down. Closed 2026-09-22 on evidence with its three clauses measured;
   see its own Summary of Changes.
2. **`j66n` has one clause left**, and it is a judgement rather than an
   omission: `ingest-theme.bpmn` is drawn but is not a call activity of
   `document-ingestion.bpmn`, because *which* artefacts are theme sources is a
   question nobody has answered. **Owner-blocked, not agent-blocked** — and it
   sits close to the premise the owner already withdrew for `xffc`/`d3yq`
   (*"no formal role/theme mapping per se. that is authoring (human/agentic)
   decision/judgement"*), so it is put to the owner rather than guessed.
3. **`kupb` cannot close**, and its own Done-when is why: *"Every child is
   closed."* It has **13 open children** measured 2026-09-22 — `4pm8`, `54rk`,
   `809i`(now closed), `eof6`, `gpdo`, `hfwl`, `hpax`, `j66n`, `j79e`, `rtrg`,
   `v048`, `w5bn`, `xies`. Several are large independent subjects — Pagefind
   search, CDN publication, compiled-artefact caching, detangle, the
   large-datasets subsetting skill — rather than IRIS-catalogue work. Whether
   they belong under `kupb` is a re-parenting decision and is **the owner's**.

## RE-MEASURED 2026-09-25 — `kupb` is three days closer than this bean says

The section above was measured 2026-09-22. Re-derived against the store today,
item by item, not carried forward:

| item | recorded above | now |
|---|---|---|
| `j66n` | *"has one clause left … **owner-blocked**"* | **`completed`** |
| `kupb`'s children | 13 open | **4 open**, 9 closed |

**Nine closed since:** `54rk`, `809i`, `gpdo`, `hfwl`, `hpax`, `j66n`, `rtrg`,
`v048`, `w5bn`.

**Four still open:** `4pm8` (todo — Pagefind evaluation), `eof6` (in-progress
— search index as a release artifact), `j79e` (in-progress — detangle),
`xies` (in-progress — publish to CDN).

Two things follow, and they point opposite ways:

1. **The `j66n` line above is stale and should not be acted on.** It puts a
   theme-sources question to the owner that its own bean has since closed.
   Left in place with this correction beside it rather than deleted, so the
   next reader can see the question was answered rather than dropped.
2. **The re-parenting decision is unchanged and is still the owner's** — but
   it is now a smaller question. Of the four that remain, all four are the
   "large independent subject" kind the 2026-09-22 note flagged (search,
   CDN publication, detangle), and **none** is IRIS-catalogue work. The case
   for re-parenting them out of `kupb` is therefore stronger than when it was
   4-of-13; whether to do it is still not an agent's call.

This bean has now been re-measured twice for the same reason (`k59d`): a
milestone's body is read as current by every session that opens it, and
nothing recomputes it. That is the argument for the check `k59d` asks for,
not for a third hand pass.

## Not blocked on the owner any more

`hqku` is `completed`; the question *"is `library/` active content a sweep should
judge, or derived material it should skip?"* has been answered. This bean carried
it as a live blocker for two days after it closed. `xffc` and `d3yq` remain
**re-scoped, not scrapped**, per the owner 2026-09-20 — their disposition is
still open and is asked as a selectable question rather than assumed.

## Done when

- [x] The rendered site shows the IRIS hierarchy, with the three materialised
      items distinguished from the referenced ones and the distinction
      explained
- [x] It renders on the IRIS theme rather than the default
- [x] `check:voices` is green across the instance boundary
- [ ] `kupb` closes — blocked on its 13 open children, whose re-parenting is the
      owner's call
