---
# folio-assistant-k8rc
title: 'The TypeScript prose backlog: 344 mentions, and the exemption does not cover all of them'
status: in-progress
type: task
priority: normal
created_at: 2026-09-21T20:25:00Z
updated_at: 2026-09-21T21:40:00Z
parent: folio-assistant-vke6
---

The markdown half of this is done (`vzur`, #769). This is the `.ts` half, and
it is **not** simply the same sweep one file type over — the exemption that
covers it is sound for most of the corpus and wrong for a subset.

**Measured 2026-09-21 on `main` @ `83cc04b`:** 344 mentions of `harness.json`
or `harness.config.json` in `.ts` files under `cat-harness/`, excluding
`RETIRED_DECLARATION`'s own definition and the gate that hunts it.

## Why `check:declaration-filename` does not fail on these

By design. Its prose class is exempt because *"a rename REWORDS these; it does
not substitute a constant into them"* — flagging them would make the check
demand that every doc comment be assembled from constants, which nothing here
asks for. That argument is **correct for a doc comment**.

## The subset it is wrong for, and the worked example

`src/index.ts:136` and `:138` were **log messages**:

```ts
log("init", `Loaded harness.config.json: adapter=${adapterType}`);
log("init", `Failed to read harness.config.json: ${e}`);
```

`harnessConfigPath` is computed two lines up by `expectedInstanceConfigPath()`
and the file is `<name>.config.json` since the split — so the server told an
operator to go and look at a file that does not exist, while holding the real
path in a variable. **A log line is not prose a rename rewords; it is output
somebody acts on.** Fixed in the same change that opened this bean, by naming
the path already in hand.

That is one clear subclass. The measurement below has not separated the rest.

## What has to happen before a sweep, not after

**Do not run a blanket substitution.** This exact backlog has now produced the
same failure twice at two file types: `jijc`'s *"a blanket migration cannot
tell a literal that IS the code from a literal DESCRIBING code"*, and `vzur`'s
Pass B, whose phrase substitution produced ten broken lines and left four in
the tree for a later session to find. A third attempt earns a third instance.

Classify first. The classes visible from a skim, none of them counted yet:

| class | what it is | fix |
|---|---|---|
| **user-visible output** | log lines, thrown `Error` messages, MCP tool descriptions and parameter help | name the computed path, or the placeholder form — **wrong at runtime**, like `index.ts` above |
| **doc comment describing the mechanism** | `/** ... as declared in `harness.config.json` */` | reword; the existing exemption's reasoning applies |
| **history** | a comment stating what a name WAS, beside its replacement | leave; rewriting falsifies the record |
| **test fixture** | constructing the file the code under test looks for | `jijc` carries this as an open judgement — **do not settle it here** |

`src/tools/*.ts` is where the first class concentrates on the skim
(`readme-sync.ts:48`, `folio-init.ts:62`/`:125` are tool descriptions an agent
reads), which is why it is worth counting rather than assuming.

## Done when

- [x] The 344 are classified into the four classes above, with counts. **335,
      not 344** — see below.
- [x] Every **user-visible output** mention names the file actually used, or
      the placeholder form where no path is in hand.
- [ ] A decision recorded on whether `check:declaration-filename` grows a
      fifth class for user-visible strings — distinct from its `prose` class,
      whose exemption argument does not reach them. **The backlog is now
      clear, so this is only the owner's call**; put to them on
      [#788](https://github.com/litlfred/folio-assistant/issues/788).
- [x] Doc comments and history left to a separate pass, or explicitly folded
      in with reasons — **left, with the reason being that the exemption's
      own argument holds for them.** 183 doc-comments and 22 history
      mentions; a rename genuinely does reword a doc comment beside the code
      it describes, which was never the disputed part.

*Recorded by session_017MEZnJxx7WeekiNCabx4hx, which found it while measuring
`zq3f`, fixed the two runtime-wrong log lines, and did not sweep the rest.*

---

## Measured 2026-09-21 — and the count in this bean's own header was wrong

| class | count | disposition |
|---|---|---|
| doc-comment | 183 | the exemption's reasoning holds — left |
| test-fixture | 92 | `jijc`'s open judgement — **not settled here** |
| history | 22 | states a former name — left |
| **runtime** | **40** | **fixed** |
| | **335** | in 133 files |

**335, not 344.** This bean's figure came from a naive `grep`, which counts
`cat-harness.json` and `harness.jsonld` as matches because it bounds only the
left side. The classifier uses the gate's own both-sided rule, so the two
corpora now agree. *A count taken with the wrong matcher is the same mistake
`zq3f` made three hours earlier, with the same shape.*

**The falsifier was named in advance and did not land.** The brief said: if
the runtime class turned out to be most of the 344, then `prose` was the wrong
name for the exemption and the gate's framing was the defect rather than the
backlog. It is 40 of 335, so the framing stands.

## The one that was not a message

`check:published-refs` composed `join(root, "harness.config.json")`. After the
2026-09-21 rename `existsSync` was false for every instance, every iteration
`continue`d, and carrier 1 reported **0 examined** with *"no instance carries
a harness.config.json — there are no declared instance dependencies in this
repository to check"*.

True about a filename, false about the repository:
`folio-assistant.config.json` declares `dependencies.folioAssistant` with no
`ref` and no `version`, which is exactly the `major` unpinned finding that
carrier exists to raise. **A check that scans nothing and reports a clean run
is the `dh4f` shape**, and this one was hiding the only dependency edge in the
repository. Now 1 examined, 1 major.

**Its tests passed throughout.** The fixture wrote the same literal the code
composed, so both sides were wrong together and the suite agreed with itself
about a file that did not exist. `instance-fixture` already warns that a
fixture discovery cannot see "passes for the wrong reason"; this was that
hazard from the other direction — a fixture discovery *can* see, agreeing with
production code that was itself looking in the wrong place. Both fixtures now
go through `writeInstanceConfig`.

## Four runtime mentions remain, and they are correct

Which is why the class is not zero. `LEGACY_HARNESS_CONFIG`, whose whole job
is naming the retired file, and three `docs/_data/harness.json` — **Jekyll's
own data file**, sharing a basename and nothing else. The fourth string in
that same file pointed an editor at the *declaration* and was wrong; it now
spells it with `instanceDeclarationFilename(decl.name)`.

## Found on the way, and fixed separately

`bun test` was red on `origin/main` before this branch touched anything:
`494bbbb6f` renamed `cat-bootstrap` to `bootstrap` and one assertion in
`check-invocation-parity.test.ts` did not follow. Its own comment explains why
it was the only one that noticed — *"a matcher proven only against fixtures is
proven against its author's idea of the file"* — and fixing all five
occurrences would have destroyed that property. Its own commit, so a
base-branch breakage is not buried in this diff.