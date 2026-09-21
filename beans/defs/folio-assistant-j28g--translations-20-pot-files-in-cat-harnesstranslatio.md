---
# folio-assistant-j28g
title: 'TRANSLATIONS: 20 .pot files in cat-harness/translations/ are for diagrams cat-harness does not own, and --check reports them clean'
status: todo
type: bug
priority: normal
created_at: 2026-09-21T18:53:45Z
updated_at: 2026-09-21T18:54:08Z
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
