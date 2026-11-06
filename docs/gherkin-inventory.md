# Gherkin inventory — harness repos other than cat-harness, cat-harness-tools, smart-trust-tools

Owner rule (litlfred, 2026-11-06): **a test should always have a Gherkin.** This file is the
starting count for the repos outside the ones sibling sessions cover (cat-harness,
cat-harness-tools: the rule, criterion `test-has-gherkin` and `check:test-gherkin`;
smart-trust-tools: its own backfill).

Counted on 2026-11-06 at each repo's default-branch head:

| Repo | Commit |
|---|---|
| fhir-harness | `961679a` |
| folio-assistant-core | `cf44248` |
| bootstrap-tools | `9f478d4` |
| smart-trust-demo | `aea4f64` |
| smart-base | `5fdcf6c` |
| smart-trust | `68f89e1` |
| smart-trust-phw | `13b9359` |
| who-iris | `9929b1f` |
| folio-assistant-sci | `90909a7` |
| smart-immunizations | `26558d2` |

## Counts

| Repo | TS tests (files) | pytest (files) | Rust #[test] | Kotlin @Test | .feature (Scenarios) | test-plan/v1 files | cases | cases naming `feature` |
|---|---|---|---|---|---|---|---|---|
| fhir-harness | 794 (60) | 0 (0) | 0 | 0 | 0 (0) | 0 | 0 | 0 |
| folio-assistant-core | 1370 (133) | 0 (0) | 0 | 0 | 0 (0) | 0 | 0 | 0 |
| bootstrap-tools | 259 (27) | 0 (0) | 0 | 0 | 0 (0) | 0 | 0 | 0 |
| smart-trust-demo | 0 (0) | 0 (0) | 0 | 8 | 0 (0) | 0 | 0 | 0 |
| smart-base | 414 (41) | 0 (0) | 0 | 0 | 0 (0) | 0 | 0 | 0 |
| smart-trust | 0 (0) | 0 (0) | 0 | 0 | 1 (0) | 0 | 0 | 0 |
| smart-trust-phw | 0 (0) | 0 (0) | 0 | 0 | 0 (0) | 0 | 0 | 0 |
| who-iris | 109 (6) | 0 (0) | 0 | 0 | 0 (0) | 0 | 0 | 0 |
| folio-assistant-sci | 534 (60) | 0 (0) | 0 | 0 | 0 (0) | 0 | 0 | 0 |
| smart-immunizations | 0 (0) | 0 (0) | 0 | 0 | 149 (1050) | 0 | 0 | 0 |

How each column is counted (by [`gherkin-inventory.py`](gherkin-inventory.py), run as
`python3 docs/gherkin-inventory.py <dir-with-clones> <repo>...`; `node_modules`, `.git`,
`vendor`, `target`, `build`, `dist`, `.lake`, `output`, `fsh-generated` are skipped):

- **TS tests** — `test(` / `it(` calls (with `.skip`/`.only`/`.todo`/`.each`/`.if`/`.skipIf`) at the
  start of a line in `*.test.*` / `*.spec.*` files (bun:test and vitest). A test built in a loop
  counts once, so this is a count of test *declarations*, not of runtime cases.
- **pytest** — `def test_…` in `test_*.py` / `*_test.py`.
- **Rust** — `#[test]` / `#[tokio::test]`. **Kotlin** — `@Test`.
- **.feature (Scenarios)** — files, and `Scenario:` / `Scenario Outline:` lines in them.
- **test-plan/v1** — JSON files whose `$schema` is `test-plan/v1`; *cases* is `testCases[]`,
  and the last column is how many of those cases set `feature`.

## What the numbers say

- **No repo here links a test to a Gherkin yet**: no `@test:` tag anywhere, and no
  `test-plan/v1` file in any of the ten.
- **Executable tests, by size** (the backfill order, smallest first):
  smart-trust-demo (8 Kotlin) → who-iris (109) → bootstrap-tools (259) → smart-base (414) →
  folio-assistant-sci (534) → fhir-harness (794) → folio-assistant-core (1370).
- **No executable tests**: smart-trust, smart-trust-phw, smart-immunizations — nothing to backfill.
  - smart-trust's one `.feature` holds only the line `#blah` (no Scenario): a placeholder.
  - smart-immunizations' 149 `.feature` files (1050 Scenarios) under `input/testing/features/`
    are DAK *content* — decision-logic and StructureMap specifications — not Gherkins for
    executable tests in the repo. They already satisfy the rule's spirit for content; they are
    outside this count's backfill.

## Backfill convention

One `.feature` per test file (or per test-plan case where one exists); one `Scenario` per test,
tagged `@test:<path>::<test name>`; Given/When/Then written from what the test really asserts.

Gherkin tags end at whitespace, and most test names contain spaces, so in the tag every run of
whitespace in the test name is written as `_`; the Scenario's own name is the test name
verbatim. If `check:test-gherkin` (sibling session) settles a different encoding, the tags are
mechanical to rewrite.

## Backfill PRs

Filled in as each opens; the session stops after three for the owner to choose the rest.
