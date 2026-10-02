---
# folio-assistant-j28g
title: 'TRANSLATIONS: 20 .pot files in cat-harness/translations/ are for diagrams cat-harness does not own, and --check reports them clean'
status: completed
type: bug
priority: normal
created_at: 2026-09-21T18:53:45Z
updated_at: 2026-09-21T22:11:07Z
parent: folio-assistant-1xhc
---


Found 2026-09-21 while checking that the new swimlane `<bpmn:documentation>`
(bean `sqtq`) would actually reach a translator. It does — for 58 diagrams.
For three of them it cannot, and nothing says so.

## The finding

`cat-harness/translations/<locale>/workflows/` holds **62** `.pot` files per
locale. `translate-bpmn --check` reports on **58**:

```
Checking 58 diagram(s) against: ar, es, fr, ru, zh
  ✓   0  never extracted
  ✓   0  out of date
Every diagram has a current .pot in every locale.
```

That sentence is true about the 58 and silent about the other four, which are
never re-extracted and never compared:

| stem | why cat-harness will not extract it |
|---|---|
| `discussion` | `bootstrap/workflows/` — a NESTED INSTANCE's diagram |
| `initialize-harness` | same |
| `log-message` | same |
| `bootstrap` | **the diagram does not exist anywhere.** Renamed to `initialize-harness.bpmn` in `7d57e2d279` |

Four stems × five locales = **20 files**, 2608–8695 bytes each, all dated
2026-09-20.

## Why it is not a blind spot to "fix" by widening the scan

Bean `7u3g` is `scrapped` for exactly that mistake, twice in one day: the
root instance does not read a nested instance's graph **by design**, and
`instance-graph-isolation.test.ts` fails when somebody declares
`bootstrap/workflows/` at the root. `translate-bpmn` seeing 58 is
CORRECT.

The defect is the other direction — `fd6i`, declared-never-used. The
templates exist, a translator can open them, and three of them describe
diagrams whose strings will silently diverge from the `.pot` the moment
bootstrap's lanes change. The fourth describes nothing at all.

## Two things to settle, and they are different questions

1. **Does bootstrap translate itself?** It declares no `translations/`
   directory. If it should, these three belong under `bootstrap/`, moved
   rather than deleted — a translator may already hold a `.po` keyed to them.
   If it should not, they are relics.
2. **Should `--check` ask the reverse direction?** It asks "does every
   diagram have a current template". It does not ask "does every template
   have a diagram". The second question is what would have caught
   `bootstrap.pot` the day the file was renamed, and it is one `readdirSync`.

## NOT deleted

Reported with sizes and dates, per `deletion-requires-confirmation`. A `.pot`
is a translator's input and may already have a `.po` behind it; an agent does
not get to decide that nobody was working from these.

## Done when

- [ ] a ruling on (1) — bootstrap translates itself, or these are relics
- [ ] `--check` reports a template whose diagram is absent, rather than
      counting only the diagrams it owns
- [ ] the 20 files are moved or removed **by that ruling**, not by an agent

## Resolved 2026-09-21 — the owner's ruling: bootstrap translates itself

`bun run gates --all`: **100 gates, green.**

### Re-measured before acting, and one fact had changed

This bean said four stems had no diagram. On today's `main` only **one** does:
`main` renamed `cat-bootstrap/` to `bootstrap/`, so `discussion`,
`initialize-harness` and `log-message` now match diagrams at
`bootstrap/workflows/`. Only `bootstrap.pot` matches nothing anywhere.

The substance was unchanged — cat-harness still scans 58 of 61 diagrams, and
the three it skips are bootstrap's, correctly — but the framing "four
orphans" was wrong by then and would have sent somebody looking for four
missing diagrams.

### And one fact was WORSE than filed

Filed as idle files. Measured on the day: `log-message.pot` did **not**
contain the `<bpmn:documentation>` added to `log-message.bpmn`'s two lanes
hours earlier (bean `sqtq`). A translator opening it would have translated
text the diagram no longer carried, and nothing in cat-harness would ever
have corrected it. Not clutter — a trap.

### What shipped

- **`translate-bpmn --instance <root>`**, the same shape
  `kg-export --instance ./bootstrap` already uses. The fix is a SECOND RUN
  pointed at the owning instance, never a wider scan: widening re-introduces
  the leak `instance-graph-isolation.test.ts` exists to stop (`7u3g`).
- **15 templates moved** to `bootstrap/translations/<locale>/workflows/` with
  `git mv`, so history follows, and re-extracted there. `log-message.pot` now
  carries the lane documentation — verified by grepping for it, not assumed.
- **`bootstrap.pot` removed** in all five locales, on the owner's ruling.
  Confirmed first that no `bootstrap.bpmn` exists anywhere; recoverable from
  `7d57e2d279~`.
- **The reverse check** — a template whose diagram this instance does not own
  is now a finding. That is what would have caught `bootstrap.pot` the day of
  the rename, instead of the check printing *"Every diagram has a current .pot
  in every locale"* over a file it never looked at (`fd6i`).
  **Falsified**: a planted `ghost-diagram.pot` exits 1; removing it exits 0.
  It does not delete — it names the two possible causes and says removing a
  translator's input is a person's call.
- **`translate-bpmn:bootstrap:check` wired into `code-quality-gates.yml`**, so
  bootstrap's templates stay current rather than going stale again silently.

cat-harness now holds 58 templates for 58 diagrams — exact, in both
directions, and checked in both directions.

## Done when — status

- [x] a ruling on (1) — **bootstrap translates itself**
- [x] `--check` reports a template whose diagram is absent, rather than
      counting only the diagrams it owns — falsified with a planted relic
- [x] the 20 files are moved or removed **by that ruling**: 15 moved to
      bootstrap, 5 removed as relics
