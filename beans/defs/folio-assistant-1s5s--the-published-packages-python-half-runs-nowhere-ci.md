---
# folio-assistant-1s5s
title: The published package's PYTHON half runs nowhere — CI's pytest job globs a directory that does not contain it
status: todo
type: task
parent: folio-assistant-1xhc
created_at: 2026-09-26T09:13:49Z
updated_at: 2026-09-26T09:14:15Z
---



Split out of `rsi6` 2026-09-26. **That bean was closed `completed` carrying two
unchecked boxes**, which the store's own rule forbids — "ONLY if the bean has
no unchecked todo items left". Recorded here rather than quietly re-ticked,
because a completed bean holding live work is exactly the shape that makes the
store unreadable, and this session has spent the day filing that class against
other people's records.

## The measurement

`@litlfred/block-qa-schema` ships a Python half — `python/block_qa_schema/` —
with a **300-line, 17-test** suite at `tests/test_python.py`. It runs nowhere.

The `Python unused/wildcard imports (hard)` job in `code-quality-gates.yml`
ends with a step named *"Python tests"*, and its glob is:

    cat-harness/scripts/tests/*.test.py

The package's tests are at `cat-harness/schemas/block-qa-schema/tests/` and are
named `test_python.py`, so they fail the glob on BOTH the directory and the
naming convention. Neither half of the package was reachable by CI until
`check:published-packages` landed, and that gate runs `bun run test` — the
JavaScript half only.

## Why it is not fixed with its sibling

The JS half's fix was inside a gate this session owns. This one changes the
**Python job's own step** — a different job, and one whose glob other packages
may rely on. Widening it is a decision about what that job is for, not a
repair, and the repo's rule is not to widen someone else's gate unasked.

Two shapes are plausible and they are not equivalent:

- teach the Python job to discover tests the way `check:published-packages`
  discovers packages — from the git index, per publishable package;
- or give `check:published-packages` a Python arm, so one gate owns "the
  packages this repo ships work", in both languages.

The second keeps the question in one place and is probably right. It also
needs `pytest` on the runner for that step, which the Python job already
installs and the TypeScript job does not.

## Done when

- [ ] `tests/test_python.py` runs in CI, and its 17 tests are counted.
- [ ] Verified by BREAKING it — a deliberately failing assertion turns the job
      red — because a glob that matches nothing exits 0 and looks identical to
      a suite that passed.
- [ ] Whichever job owns it says so in a comment, so the next person adding a
      publishable package knows where its tests are expected to run.

## The second box `rsi6` carried, recorded and NOT actioned

Whether a published package should be **version-checked against the platform
it ships beside**: `block-qa-schema` pins `typescript ^7` while the root pins
`^6`. That divergence is what made the `rsi6` breakage possible. It is a
policy question — must a shipped package track the platform's toolchain, or is
independence the point of publishing it? — and nobody has been asked.
