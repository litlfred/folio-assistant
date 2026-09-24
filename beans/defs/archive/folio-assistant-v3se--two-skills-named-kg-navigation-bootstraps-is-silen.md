---
# folio-assistant-v3se
title: Two skills named kg-navigation — bootstrap's is silently dropped for folio-core's
status: completed
type: task
priority: normal
created_at: 2026-09-20T03:26:21Z
updated_at: 2026-09-20T13:49:14Z
parent: folio-assistant-vke6
---

## Measured 2026-09-20, from `gen-skill-docs` output

```
↪ kg-navigation (dup — kept Platform core (folio-core))
```

Two different skills carry the name `kg-navigation`:

| | assumes |
|---|---|
| `bootstrap/skills/kg-navigation.md` | **nothing** — no MCP, no harness, no tools |
| `skills/folio-core/kg-navigation.md` | the harness is installed |

The generator keeps folio-core's and **silently drops bootstrap's**, so the
published instruction body for that name is the one that assumes everything
bootstrap does not have.

## Why it matters more than a normal name clash

Bootstrap's README step 1 tells a cold agent to read `kg-navigation` *before
anything else is known*. An agent that resolves the name through the published
docs — or through `skill_fetch`, if the same precedence applies there — gets
instructions written for a repository with a harness in it. That is the exact
failure bootstrap exists to prevent, arrived at by a name collision rather
than by a missing file.

## Not introduced by the PR that found it

Pre-existing on `main`: `skills/folio-core/kg-navigation.md` is there
independently of `bootstrap/skills/kg-navigation.md`. Found while fixing a
stale-docs failure on #448 and recorded rather than fixed, because it is not
that PR's to widen.

## What to check before choosing a fix

- **Does `skill_fetch` have the same precedence as the docs generator?** If it
  resolves per-instance, only the published docs are wrong and the fix is
  narrower than it looks. If it resolves by bare name over a merged table, a
  bootstrap agent is genuinely served the wrong body. `LOCAL_PACKAGES` is now
  discovered per instance, so this is worth measuring rather than assuming.
- **Is a name collision across instances a defect at all, or the overlay
  working?** A dependency's skill of the same name is *supposed* to be
  overridden by the root's. Bootstrap is the case where that rule inverts —
  it runs before the root exists — and that may be the thing to state rather
  than the name to change.

## Done when

- [ ] measured which resolver wins for a bare `kg-navigation`, per instance
- [ ] either the names are distinct, or the precedence is stated and tested
      for the bootstrap case specifically
- [ ] the generator reports a dropped duplicate as a FINDING rather than a
      `↪` line in a long success list — it was one line among 173

---

## 2026-09-20 — two thirds of this were already fixed, by someone else

Measured before touching anything, and the bean's own premise had expired:
`bootstrap/skills/kg-navigation.md` **no longer exists**. It was renamed to
`bootstrap-kg-navigation.md` in `6252e287f` ("bootstrap publishes only what it
declares, and gains the discussion process"), under bean `3jj9` — not this one.

So the names ARE distinct, `gen-skill-docs` reports **zero** duplicates, and
done-when #2 is satisfied by a sibling session's work. Done-when #1 (measure
which resolver wins) is moot for this pair: there is no longer a bare name for
two documents to contest.

## What was NOT fixed, and is the durable half

Done-when #3. An undeclared collision was still a `↪` line in a list of 173
successes, and the generator still **dropped** the later document silently.
The specific collision was gone; the mechanism that hid it was not.

`gen-skill-docs.ts` now collects them and FAILS, in the writer as well as
under `--check` — a dropped document is not staleness that a re-run repairs,
it is a page that never reaches the site, so reporting it only under `--check`
would leave the writer cheerfully publishing 173 pages and one silence.

**Promoted while the count is zero**, which is this repository's rule for every
ratchet and also the only moment the promotion is free.

A DECLARED pair is untouched: it carries a `publishPrefix`, publishes under two
names, and gets a directional banner on each. What now fails is one name, two
documents, and nobody having decided which governs — a judgement, not something
running order may settle.

Falsified by recreating the exact collision this bean reported:

    writer  -> exit 1: "kg-navigation: kept Platform core (folio-core),
                        dropped the copy from Bootstrap"
    --check -> exit 1
    removed -> exit 0

## Done when

- [x] measured which resolver wins — moot: the names are distinct, 0 duplicates
- [x] the names are distinct (`3jj9`, not this bean)
- [x] an undeclared duplicate is a FINDING that fails, not a line in a success
      list — falsified both ways
