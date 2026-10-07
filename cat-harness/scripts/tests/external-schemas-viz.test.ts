/**
 * The external-schemas viewer — the declared users, and the page a reader gets.
 *
 * Bean `yunp`: `external-schema` was one of the declared kinds with no
 * published viewer, so the navbar listed it disabled and four records — an
 * authority, an edition, namespace IRIs, dependents and operative terms each —
 * were reachable only by opening the JSON.
 *
 * ## What is asserted, and what deliberately is not
 *
 * **Not the prose**, for the reason `methodologies-viz.test.ts` states: a test
 * that pinned the sentences fails every time somebody improves one.
 *
 * **The declared users** (bean `u63y`), read from the users rather than from a
 * hand-written list on the record; `spec-users.test.ts` tests the reader, and
 * this file asserts the page over the real corpus. `loadSpecs` already validates
 * every record and `undeclaredNamespaces` already reconciles the namespaces —
 * both are imported rather than restated, so this file asserts the join and
 * leaves their own tests to them.
 *
 * **The consumer property, over the real registry.** Every row in the summary
 * table links to `#<id>`, and the detail section below must carry that anchor —
 * `pb04`: a link that goes nowhere reads as a broken site. Checked against the
 * committed page as well as the freshly rendered one, so a stale commit fails
 * here rather than in a reader's browser.
 *
 * @module scripts/tests/external-schemas-viz.test
 *
 * The tests of this file that read the whole checkout (reads the
 * external-schema registry and the declarations of every content instance that
 * uses it) live in `test/external-schemas-viz-checkout.test.ts` (bean `7zz1`):
 * standing alone, cat-harness has none of it.
 */
