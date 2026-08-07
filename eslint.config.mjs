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
 *           project-wide decision, not something to fail a build over:
 *           `no-explicit-any` (190 of the 356), `no-require-imports`,
 *           `no-unsafe-function-type`, `no-this-alias`.
 *
 * Warnings are counted, not hidden. `bun run lint` reports them; the backlog
 * is visible without being a blocker. Tighten by promoting a rule here once
 * its count reaches zero.
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

      // ── Warnings: acknowledged debt, tracked not enforced ──────
      // Remaining counts over 194 files:
      //   no-explicit-any        201  (gradual typing — a per-site typing
      //                                decision, wants its own plan)
      //   no-unsafe-function-type 10
      //   no-this-alias            2
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "@typescript-eslint/no-this-alias": "warn",
    },
  },
);
