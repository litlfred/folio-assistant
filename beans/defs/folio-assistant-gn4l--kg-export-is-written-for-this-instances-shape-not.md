---
# folio-assistant-gn4l
title: kg-export is written for THIS instance's shape, not just hardcoded to its root
status: completed
type: task
priority: normal
created_at: 2026-09-19T15:06:44Z
updated_at: 2026-09-19T15:14:47Z
parent: folio-assistant-vke6
---

## The measurement, 2026-09-19

Opened while building `x3bd`, after twice estimating this wrong out loud.

**`kg-export.ts` cannot export any instance but this one**, and the reason is
not the one it looks like. `const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")`
reads as a hardcoded path — the `bgle` shape — so the obvious fix is a
`--root` flag beside the `--out` and `--base-url` it already takes.

That is wrong twice over:

1. **27 references** to `ROOT`, consumed by ~20 functions that take no root
   parameter. A flag means changing every one of their signatures.
2. **It would not work.** Those references include `.claude/skills/`,
   `skills/`, `package.json`, `SKILL_IO_DIR`, `auditSchemaNodes(ROOT)` and
   `git`. None of them is something a minimal instance has. Adding `--root`
   would make the exporter try to export bootstrap **as if bootstrap were
   folio-assistant**.

So the exporter is not root-hardcoded; it is **written for this instance's
shape**. The generic half (read a declaration, walk its declared graphs, emit
nodes) and the folio-assistant-specific half (skill I/O schemas, `.claude/`
actors, package manifests, the schema-node audit) are not separated, and only
the first is what another instance needs.

## Why this blocks bootstrap

`bootstrap/README.md` step 2 says *"Load `bootstrap/bootstrap.jsonld`"*. That
file should be GENERATED — `.jsonld` is generated everywhere else here and CI
gates the siblings — but nothing can generate it for an instance that is not
this repository.

The fallback the proposal permits (§4, "hardcoded JSON/JSON-LD in bootstrap is
acceptable but not preferred") is **also** bigger than it looks: bootstrap's
vocabulary carries 8 classes (`Actor`, `Role`, `Skill`, `Process`,
`ProcessNode`, `SequenceFlow`, `Directory`, `GraphKind`) and **zero
properties**, so relating a process to its steps needs terms minted into
`schemas/vocabulary.ts` first, gated by `ns:check` and the undeclared-terms
pass in `kg-export` itself.

## Done when

- [x] the generic half of `kg-export` is separated from the
      folio-assistant-specific half — `COLLECTOR_SCOPE` states the boundary
      and `collectInstanceNodes` is the generic side
- [x] the generic half takes an instance root and is exercised against one
      that is NOT this repository — **bootstrap**, a real instance, rather
      than a fixture: 19 nodes including its 2 skills and its 1 declared
      directory, where the root instance yields 1212
- [x] whatever a minimal instance lacks is a THIRD STATE — `omitted` names
      every instance-bound collector that was not run, and an absent declared
      directory is a reported problem rather than a crash or a silent skip
- [ ] `bootstrap.jsonld` is generated rather than authored, or this bean
      records why that was refused


_2026-09-19_ — THE SEAM IS DRAWN, and it is drawn by WHAT EACH COLLECTOR READS rather than by whether it mentions ROOT. That distinction is the finding: two of the four instance-bound collectors never mention ROOT at all, so the obvious classifier would have put them on the wrong side. CLASSIFIED BY READING EACH ONE: generic and root-parameterisable — collectSkills (knownSkillDirs), collectProcesses (workflowDirs), collectDeclaredRoles (kgRoots), collectDeclaration (<root>/harness.json). Universal, needing no root at all — collectGraphKinds, the global kind registry. Instance-bound, each for a DIFFERENT reason — collectRegistryNodes (`.claude/skills/<group>` as a path literal), collectPackages (package-manifest.json plus directories named in code), collectSchemas (auditSchemaNodes over this repo's schemas/), and collectTools, which is the sharpest of the four: it is IMPORT-BOUND, a compile-time `import { tools } from "tools/index.ts"`, so threading a root through it reaches nothing. It would need the tool set passed in. PROVEN A REFACTOR, NOT A BEHAVIOUR CHANGE: captured _kg/folio-assistant.jsonld before touching anything (1,117,150 bytes) and diffed after — IDENTICAL apart from `generatedAt`, a timestamp. That is the same discipline as the LOCAL_PACKAGES change: the equality IS the evidence. EXERCISED AGAINST A REAL NON-ROOT INSTANCE rather than a fixture — bootstrap, which has a declaration, two skills, no BPMN, no tools/, no package.json and no .claude/. It now exports 19 nodes (2 Skill, 16 GraphKind, 1 Directory) where the root yields 1212 across seven types. A fixture would have proven the plumbing; bootstrap proves the SHAPE, because bootstrap is exactly what the exporter was never written for. TWO BUGS I MADE AND CAUGHT, both the same class — a helper called without the root it was just given. collectProcesses called findBpmnDirs() bare, so it found THIS repository's BPMN directories and joined them against bootstrap/, throwing ENOENT; and collectSkills called skillMdDirs() bare, which is why bootstrap first exported 17 nodes with ZERO skills while having two. The second is the more instructive: it did not crash, it silently returned an empty section — precisely the dh4f shape this bean exists to prevent, produced by the change meant to prevent it. THIRD STATE, because of that: `omitted` names every instance-bound collector that was not run, so "this instance has no tools" and "tools were never looked for" stay different facts; and a declared-but-absent directory is now a reported problem rather than a crash or a skip. 9 tests, and they assert PRESENCE rather than counts — a pinned number would make "it still works" and "somebody deleted a diagram" indistinguishable, a mistake already made twice this session. Verified: full suite 2802 pass 0 fail; tsc and eslint clean; kg:audit:check, ns:check, check:declared-paths, check:declared-assets, check:bean-parents, check:schema-nodes all rc=0. STILL OPEN: bootstrap.jsonld is now GENERATABLE but not generated — main() still exports only this instance, and wiring a second output plus its staleness gate is the next step, not this one.


## The last box, closed 2026-09-21 — and it was FORCED rather than chosen

`pve3`'s "neither" ruling made this bean's remaining work compulsory. Once
cat-harness stopped declaring `bootstrap/skills/`, a Tool here that
satisfies a skill there had to name bootstrap's document — and a link to a
document nothing publishes is a 404 with an `@id` in front of it.

### What was missing was narrower than this bean's prose suggests

`collectInstanceNodes` has worked since 2026-09-19 — measured again today,
bootstrap 85 nodes against cat-harness's 1861, genuinely different graphs.
**Identity had not followed it.** `exportIdentity` read `ROOT`
unconditionally, so any instance's nodes were minted into THIS instance's
document IRI.

- `ExportOptions.instanceRoot`, honoured by `exportIdentity` and `buildExport`
- `kg-export.ts --instance <root>`
- `docs-site.yml` publishes `bootstrap.jsonld` + its `.json` alias, and
  `publishedPaths()` in `kg-export.test.ts` lists both, so removing the deploy
  step is a test failure rather than a silent 404

### The hazard this creates, and the test that catches it

Identity and collectors are separately parameterised, so honouring
`instanceRoot` for the identity alone produces **a document wrong about whose
it is, under a name a consumer trusts.** Measured by removing the branch:
bootstrap's document came back with **2079 nodes** — this instance's
skills and processes — instead of 85, with `@id`, stub and published path all
correct. Every other signal called it healthy.

`buildExport` therefore routes a foreign instance through
`collectInstanceNodes`, and a test asserts the size relation and a named skill
rather than merely that both build. Dropping the branch turns 2 red.

### Three defects found on the way

**1. Seven dangling links in the foreign export.** `collectSkills` puts
`inPackage` on every skill; `collectPackages` is instance-bound and omitted.
A link to a collector that did not run is now stripped at the seam, not faked.

**2. My first reading of that was VACUOUS.** `danglingLinks` is computed but
not written into the published document, so reading the file and defaulting an
absent key to `[]` reported zero. The in-memory export said seven. *A default
standing in for an absent field is not an answer* — the same shape as `pomp`.

**3. `skillHome` exiled skills this instance also declares.** Without an
own-first check, a skill in both cat-harness and a sibling linked to the
sibling's document — `agent-skills.jsonld` and `kg-navigation.jsonld` appeared
as targets the deploy never writes. Caught by the published-paths walk.
