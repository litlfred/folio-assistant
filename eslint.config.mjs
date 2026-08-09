import tseslint from "typescript-eslint";

/**
 * ESLint flat config.
 *
 * `package.json` has carried `"lint": "eslint ."` for a long time, but there
 * was no config file and neither `eslint` nor `typescript-eslint` was a
 * dependency — so the documented command has never run. AGENTS.md lists
 * `eslint .` as a project command, which made that worse than a no-op: it
 * read as coverage that did not exist.
 *
 * SEVERITY SPLIT. A first run over 194 files found 356 problems. Failing the
 * gate on all of them would make `bun run lint` permanently red, which trains
 * everyone to ignore it — exactly how the test suite came to sit at 29
 * permanent failures. So:
 *
 *   ERROR — things that are defects regardless of style: dead bindings,
 *           `let` that is never reassigned, and (implicitly) anything that
 *           fails to PARSE. The parse check alone earned its keep on the
 *           first run: `scripts/generate-docs.ts` had `skills/*​/…` inside a
 *           JSDoc block, whose `*​/` closed the comment early and left the
 *           rest of it being parsed as code. bun could not load that file.
 *
 *   WARN  — gradual-typing and module-style debt that is real but is a
 *           project-wide decision, not something to fail a build over. This
 *           tier is now EMPTY: `no-require-imports`, `no-unsafe-function-type`
 *           and `no-this-alias` were drained first, and `no-explicit-any` —
 *           190 of the original 356 — followed. Every rule is an error.
 *
 * Warnings are counted, not hidden. `bun run lint` reports them; the backlog
 * is visible without being a blocker. Tighten by promoting a rule here once
 * its count reaches zero — and promote it the moment it does, so the count
 * cannot creep back up behind a warning nobody reads.
 */
export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "**/.lake/**",
      "dist/**",
      "schemas/generated/**",
      "**/*.d.ts",
      "viewer/**",
      "ui/**",
      "home_page/**",
    ],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      // ── Errors: invariants that currently HOLD ─────────────────
      // A rule is an error here only once its count is zero, so a red
      // `bun run lint` always means a regression rather than pre-existing
      // debt. Promote a rule from the warn block below when it reaches zero.
      "prefer-const": "error", // driven to 0 (15 auto-fixed)
      // Driven to 0 from 111. Promoting it is the ratchet: the cleanup is
      // only worth doing if it cannot silently come back.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          // `_`-prefixed bindings are the conventional "deliberately unused"
          // marker and are used that way across the pipeline.
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],

      // Driven to 0 from 13. All were lazy inline `require()` of Node
      // builtins (`fs`, `child_process`) inside functions — a CommonJS idiom
      // in an ESM/TS codebase, and deferring a builtin's load buys nothing.
      // Hoisted to top-level imports.
      "@typescript-eslint/no-require-imports": "error",
      // Driven to 0 from 10. Every site was a redundant widening: two servers
      // cast an already-typed handler to `Function` (throwing away its return
      // type), and the test stubs typed their tool registries as `Function`
      // where a real call signature was available.
      "@typescript-eslint/no-unsafe-function-type": "error",
      // Driven to 0 from 2. Both were `const self = this` forced by
      // `Bun.serve({ fetch(req) {…} })` — a method shorthand binds its own
      // `this`. An arrow captures it lexically and the alias disappears.
      "@typescript-eslint/no-this-alias": "error",

      // Driven to 0 from 201 over 194 files (bean lnt1) — the last rule to
      // come off `warn`, and the only one that was never a sweep: each `any`
      // was a separate typing decision, and a blanket replacement with
      // `unknown` would either not compile or push a cast to every call site.
      //
      // A rule is an error only once its count is zero, and this one now is,
      // so the escape hatch closes here rather than sitting on `warn` while
      // the count creeps back. What the drain surfaced, in short: the skill
      // registry never validated against its own schema; three schemas had
      // drifted from the data (a second `FeedbackItem`, a second
      // `LifecycleStage`, `SkillDefinition` missing two fields present on
      // 18/18 files); `blk.status` was a phantom in both resolvers;
      // `renderBlock` was being handed a `ResolvedBlock`; feedback
      // status/priority were written to `main` unvalidated; PACKAGES.md had
      // always shipped empty; and five mdast guards could never fire.
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
);
