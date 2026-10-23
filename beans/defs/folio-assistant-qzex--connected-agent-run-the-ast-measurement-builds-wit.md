---
# folio-assistant-qzex
$schema: bean/1.0.0
title: 'CONNECTED AGENT: run the IG AST measurement builds (W1, W2) WITH a terminology server on a machine that reaches packages.fhir.org and tx.fhir.org'
status: completed
type: task
priority: high
created_at: 2026-10-23T14:20:00Z
updated_at: 2026-10-23T16:15:00Z
parent: folio-assistant-a9tx
---

Owner, 2026-10-23: *"make a bean for connected agent ... agent is antigravity"*. The
owner also ruled the same day: **build with a terminology server**. Cloud sessions
get 403 from `tx.fhir.org` and `packages.fhir.org`, so this runs on the owner's
machine. It is Step 1 of a9tx's HANDOVER, nothing more. The cloud thread
"Publisher AST" does Step 2 and the rest from what you push.

**Read first:** bean `folio-assistant-a9tx`, section "HANDOVER — start here", and
its "Rules the owner set". They bind you too. In short:
- do not modify Publisher code;
- exact package versions only;
- no GitHub Actions;
- never merge anything;
- an AST is a cache, never an authority;
- XML and Turtle are excised everywhere for now (owner, 2026-10-23).

## 0. Claim

Set `status: in-progress` in this file. Add a line under "Log" with your agent
name and the start time, then commit it to the bean branch:

```sh
cd ~/space_cats/folio-assistant && git fetch origin cat/cat-harness/beans \
  && git worktree add ../fa-beans origin/cat/cat-harness/beans 2>/dev/null || true
cd ~/space_cats/fa-beans && git pull --ff-only origin cat/cat-harness/beans
# edit beans/defs/folio-assistant-qzex--*.md, then:
git commit -am "bean qzex: claimed by <agent>" && git push origin HEAD:cat/cat-harness/beans
```

**Bean edits are plain git commits on `cat/cat-harness/beans`. Never use `state:push`.**
Pull before every push. If a push is rejected, pull with rebase and push again.
Never force-push.

## 1. Set up

You need JDK 17+, Maven, `npm i -g fsh-sushi`, `gem install jekyll`, git and python3.
Record the version of each in the Log.

```sh
cd ~/space_cats
git clone https://github.com/litlfred/fhir-ig-publisher 2>/dev/null; cd fhir-ig-publisher \
  && git fetch origin && git switch claude/ast-export && git pull && cd ..
```

The branch head must be `f0b5dfa` or later (it fixes a crash after each build when run with `-ig .`). Record the commit you ran.

## 2. Run

```sh
cd ~/space_cats/fhir-ig-publisher/ast-export
curl -s -o /dev/null -w '%{http_code}\n' https://packages.fhir.org/hl7.fhir.uv.extensions.r5   # must print 200
curl -s -o /dev/null -w '%{http_code}\n' https://tx.fhir.org/r4/metadata                     # must print 200
bash scripts/run-real-igs.sh ~/space_cats/ast-real-igs --byte-identical 2>&1 | tee ~/space_cats/ast-real-igs/run.txt
```

**Do NOT pass `--no-tx`.** The default build uses `tx.fhir.org`, and that is the point
of this bean. The run takes 30 to 90 minutes. If a build fails, record the last 40
lines of `~/space_cats/ast-real-igs/<ig>.log` in the Log and go to step 4. Do not
patch around it.

## 3. Record

Add a section "Results <date>" below, with:

- **Provenance:** fork commit, the `smart-trust` and `smart-immunizations` commits
  (`git -C ~/space_cats/ast-real-igs/<ig> rev-parse HEAD`), tool versions,
  and "terminology server: tx.fhir.org".
- **W1, layout:** the line `sources under fsh-generated/resources/: N of M` for each IG.
- **W1, byte-identical:** the "files differing" count. Then classify every
  differing file as timestamp, `.xml`/`.ttl` (excised, so listed and not
  counted), or **finding**. A finding is anything else; list each one.
- **W2:** the per-type table (Library, PlanDefinition, Measure, TOTAL) for each IG,
  copied exactly. smart-immunizations' target is 458 of 458.
- **Security notice:** read
  https://www.fhir.org/guides/security-notices/2026-03-npm-dependencies.html
  (cloud sessions cannot reach it). Say in two or three lines what it says about
  `fhir.base.template`, which version is safe, and whether the build warned.

Tick no box in a9tx yourself. The cloud thread ticks them against your numbers.

Then push the ASTs so the cloud thread can run Step 2 (cross-language validity)
and W7/W8:

```sh
cd ~/space_cats/ast-real-igs
tar czf ast-results.tgz run.txt */output-ast smart-trust.log smart-immunizations.log
cd ~/space_cats/fhir-ig-publisher && git switch -c ast-results/$(date +%F) origin/claude/ast-export \
  && mkdir -p ast-results && cp ~/space_cats/ast-real-igs/ast-results.tgz ast-results/ \
  && git add ast-results && git commit -m "ast-results: W1/W2 run with tx.fhir.org (bean qzex)" \
  && git push -u origin HEAD
```

If the tarball is over 90 MB, push `run.txt` and the two `output-ast/manifest.json`
and `dependencies.json` files only, and say so in the Log. Open **no** pull request.

## 4. Report back (coordination)

1. Set `status: completed` (or `status: todo` with a "BLOCKED:" line if a build
   failed). Commit and push this bean as in step 0.
2. Comment on https://github.com/litlfred/folio-assistant/issues/222. The first
   line is exactly `bean qzex: DONE` or `bean qzex: BLOCKED`, followed by the W2
   totals, the findings count, and the `ast-results/...` branch name. End with the
   line `_Posted by <agent name>_`.
3. Tell the owner in one line, so they can paste it into the "Publisher AST" thread:
   `qzex done, results on branch ast-results/<date>`.

## Results 2026-10-23

- **Provenance:**
  - Fork commit (`litlfred/fhir-ig-publisher`, branch `claude/ast-export`): `f0b5dfaafa05f723a4e7fd2182161cc2ed349eee` (`f0b5dfaa`)
  - Results branch (`litlfred/fhir-ig-publisher`): `ast-results/2026-10-23` (`841a7546b22f577dc385b962cd75b5d440728d23`)
  - `smart-trust` commit (`WorldHealthOrganization/smart-trust`): `422b043fdf594e3a6b15234888f3f53b8927026b`
  - `smart-immunizations` commit (`WorldHealthOrganization/smart-immunizations`): `bd7fa726706efc92d972d0dcebba9505f386b078`
  - Tool versions:
    - JDK: `openjdk version "21.0.3" 2024-04-16 LTS (Zulu21.34+19-CA)`
    - Maven: `Apache Maven 3.9.11 (3e54c93a704957b63ee3494413a2b544fd3d825b)`
    - SUSHI: `SUSHI v3.20.1 (implements FHIR Shorthand specification v3.0.0)`
    - Jekyll: `jekyll 4.3.2`
    - git: `git version 2.56.0`
    - python3: `Python 3.13.12`
  - terminology server: tx.fhir.org

- **W1, layout:**
  - `smart-trust`: `sources under fsh-generated/resources/: 682 of 682  (IncrementalPlan assumes this for FSH)`
  - `smart-immunizations`: `sources under fsh-generated/resources/: 732 of 748  (IncrementalPlan assumes this for FSH)`
    - The 16 resources not under `fsh-generated/resources/` are the 16 FHIR Mapping Language (`StructureMap`) sources under `input/maps/*.fml` (`IMMZ.C4.{LMToPatient,QRToLM,QRToPatient}`, `IMMZ.D1.{LMToBundle,QRToBundle,QRToLM}`, `IMMZ.D13.{LMToBundle,QRToBundle,QRToLM}`, `IMMZ.D17.{LMToBundle,QRToBundle,QRToLM}`, `IMMZ.D5.{LMToBundle,QRToBundle,QRToLM}`, `IMMZ.Helpers`).

- **W1, byte-identical (`smart-trust/output` vs `smart-trust-stock/output`):**
  - `files differing: 4081` (`diff -rq /Users/litlfred/space_cats/ast-real-igs/smart-trust/output /Users/litlfred/space_cats/ast-real-igs/smart-trust-stock/output`)
  - Classification of all `4081` entries:
    1. **`.xml` / `.ttl` (excised per owner ruling 2026-10-23, listed and not counted): `1504` files** (`.xml`, `.ttl`, `.xml.html`, `.ttl.html`).
    2. **Timestamp / timing / archive only: `316` files** (`237` JSON/package/archive/manifest files plus `79` comparison/schema files whose only differences are generation timestamps or embedded timestamps).
    3. **Findings: `2261` files (`2227` differing files + `34` files present only in `smart-trust-stock/output`)** — all caused by a single root cause: `Publisher.main()` calls `Publisher.setTxServerValue(args, self)` which defaults to `FhirSettings.getTxFhirProduction()` (`http://tx.fhir.org`) when `-tx` is omitted, whereas `AstExportCli.main()` only calls `p.getSettings().setTxServer(...)` when `-tx` is explicitly passed on the command line (leaving `txServer = null` when invoked without `-tx`, so `smart-trust/output/qa-txservers.html` says *"This IG was published without any terminology support"* while `smart-trust-stock/output` built with `tx.fhir.org`):
       - **`2151` HTML files** differing only on the `001` jurisdiction rendering in the page header/table (`Global (Whole world)` without terminology server in `AstExportCli` vs `<img alt="International flag" src="assets/images/001.svg" height="16" title="International"/>` with `tx.fhir.org` in stock `Publisher`).
       - **`34` files present only in `smart-trust-stock/output`:** `qa-tx.html` and `33` files under `comparison-v1.7.4/` (`index.html`, `vs-29-Participants-DEV-Participants-DEV-{intersection,union}.html`, `vs-30-Participants-UAT-Participants-UAT{,-intersection,-union}.{html,json}`, `vs-31-Participants-Participants{,-intersection,-union}.{html,json}`, `vs-32-PayloadTypes-PayloadTypes{,-intersection,-union}.{html,json}`, `vs-33-Transactions-Transactions{,-intersection,-union}.{html,json}`, `vs-34-WHORegionalOffices-WHORegionalOffices{,-intersection,-union}.{html,json}`, `xx-16-COSEHeader-COSEHeader.html`, `xx-17-CWT-CWT.html`, `xx-18-CWTPayload-CWTPayload.html`, `xx-19-HCert-HCert.html`, `xx-20-SchemeInformation-SchemeInformation.html`).
       - **`76` QA / expansion / schema / resource HTML & JSON files** differing on terminology expansion/validation output: `qa-txservers.html`, `qa.html`, `qa.min.html`, `qa.json`, `qa.txt`, `qa.compare.txt`, `qa-eslintcompact.txt`, `qa-time-report.tsv`, `expansions.json`, `fragment-usage-analysis.csv`, `dependencies.html`, `downloads.html`, `searchform.html`, `concepts_onboarding_checklist.html`, `dak-api.html`, `data_exchange.html`, `deployment.html`, `qr_code_generation.html`, `sequence-diagrams.html`, `transactions.html`, `schemas/ValueSet-{Actors,ConnectionTypes,Domains,Domains-DEV,Domains-UAT,KeyUsage,KeyUsage-DEV,KeyUsage-UAT,Participants,Participants-DEV,Participants-UAT,PayloadTypes,Transactions,WHORegionalOffices}.{displays,openapi,schema}.json`, and `StructureDefinition-{COSEHeader,CWT,CWTPayload,HCert,SchemeInformation}.html` + `ValueSet-{Actors,ConnectionTypes,Domains,Domains-DEV,Domains-UAT,KeyUsage,KeyUsage-DEV,KeyUsage-UAT,Participants,Participants-DEV,Participants-UAT,PayloadTypes,Transactions,WHORegionalOffices}.html`.

- **W2:**
  - `smart-trust`:
    ```text
    W2: logic resources with >=1 edge to another logic resource in this IG
      Library            0 of 0
      PlanDefinition     0 of 0
      Measure            0 of 0
      TOTAL              0 of 0   (smart-immunizations target: 458 of 458)
    edges with target outside this IG (kept, resolved=null): 654
    ```
  - `smart-immunizations`:
    ```text
    W2: logic resources with >=1 edge to another logic resource in this IG
      Library          275 of 279
      PlanDefinition   138 of 138
      Measure           41 of 41
      TOTAL            454 of 458   (smart-immunizations target: 458 of 458)
    edges with target outside this IG (kept, resolved=null): 2666
    ```
    - Note on the 4 `Library` resources (`275 of 279`): `Library/IMMZAgeConcepts|0.2.0` (40 incoming edges), `Library/IMMZConcepts|0.2.0` (415 incoming edges), `Library/WHOCommon|0.2.0`, and `Library/WHOConcepts|0.2.0` (112 incoming edges) are leaf concept/common libraries in the dependency DAG: other logic resources in `smart-immunizations` depend on them, while their own outgoing `relatedArtifact.depends-on` edges point only to `CodeSystem` and `ValueSet` resources (not to another `Library`/`PlanDefinition`/`Measure`).

- **Security notice (`https://www.fhir.org/guides/security-notices/2026-03-npm-dependencies.html`, issued 17-March 2026):**
  - Because FHIR IG packages use unscoped names on `packages.fhir.org`, running standard `npm` client tools could fetch those unscoped names from `npmjs.com` and execute arbitrary `npm` lifecycle install scripts; a security researcher uploaded a demonstration malicious package at `fhir.base.template` on `npmjs.com`, which is now blocked on `npmjs.com` and no longer supported.
  - HL7 instructs IG authors to migrate to the new multi-language base template **`fhir2.base.template`** (which is safe and maintained; HL7 also registered published FHIR package names on `npmjs.com` and notes the IG Publisher will refuse to run for IGs depending on `fhir.base.template` in the near future).
  - **Did the build warn?** **Yes** — both `smart-trust.log` and `smart-immunizations.log` printed: `This content depends on fhir.base.template which is no longer considered secure to use` / `See Security notification at https://www.fhir.org/guides/security-notices/2026-03-npm-dependencies.html`.

## Done when
- [x] Results section filled, with provenance and the security-notice summary
- [x] ASTs pushed to an `ast-results/<date>` branch of litlfred/fhir-ig-publisher
- [x] issue #222 comment posted

## Log

- `2026-10-23T14:24:00Z` — Claimed by `antigravity`.
- `2026-10-23T14:24:00Z` — Step 1 set up:
  - JDK: `openjdk version "21.0.3" 2024-04-16 LTS (Zulu21.34+19-CA)`
  - Maven: `Apache Maven 3.9.11 (3e54c93a704957b63ee3494413a2b544fd3d825b)`
  - SUSHI: `SUSHI v3.20.1 (implements FHIR Shorthand specification v3.0.0)`
  - Jekyll: `jekyll 4.3.2`
  - git: `git version 2.56.0`
  - python3: `Python 3.13.12`
  - `litlfred/fhir-ig-publisher` (`claude/ast-export`): `1b23e27058f83d409d7f124909250e6cc2fce503` (`1b23e27`)
  - Reachability: `https://packages.fhir.org/hl7.fhir.uv.extensions.r5` -> `200`, `https://tx.fhir.org/r4/metadata` -> `200`
- `2026-10-23T14:40:00Z` — First run at `1b23e27058f83d409d7f124909250e6cc2fce503`:
  - Both IGs built through `p.execute()`, then `AstExportCli.main` crashed at `AstExportCli.java:42` (`Utilities.path(".", "output-ast")`) with `java.lang.RuntimeException: Computed path does not start with first element: ., output-ast`.
  - First run's byte-identical check (`smart-trust/output` vs `smart-trust-stock/output`) completed and produced `4081` differing entries (`diff -rq`): `1504` `.xml`/`.ttl`/`.xml.html`/`.ttl.html` files (excised), `316` timestamp/archive-only files, and `2261` findings (`2151` HTML files differing only on `Global (Whole world)` vs the `001.svg` International flag icon, `34` files only in `smart-trust-stock/output` (`qa-tx.html` + 33 `comparison-v1.7.4/` files), and `76` QA/expansion/schema/resource files) because `AstExportCli` leaves `txServer = null` when `-tx` is omitted whereas `Publisher.main()` calls `Publisher.setTxServerValue` defaulting to `FhirSettings.getTxFhirProduction()`.
- `2026-10-23T14:48:00Z` — Pulled `litlfred/claude/ast-export` to `f0b5dfaafa05f723a4e7fd2182161cc2ed349eee` (`f0b5dfaa`, `fix(ast-export): default -ast-out from the absolute IG root`) with no local edits to `AstExportCli`, Publisher, or library code, and reran Step 2 (`bash scripts/run-real-igs.sh ~/space_cats/ast-real-igs --byte-identical`).
- `2026-10-23T15:01:00Z` — Second run at `f0b5dfaafa05f723a4e7fd2182161cc2ed349eee` succeeded (exit 0):
  - `smart-trust`: 682 resources, 675 edges, `fsh-index.json=True`, `682 of 682` under `fsh-generated/resources/`, W2 `0 of 0`, 654 external edges.
  - `smart-immunizations`: 748 resources, 6483 edges, `fsh-index.json=True`, `732 of 748` under `fsh-generated/resources/` (16 `input/maps/*.fml` `StructureMap` resources), W2 `Library 275 of 279`, `PlanDefinition 138 of 138`, `Measure 41 of 41`, `TOTAL 454 of 458` (the 4 remaining Libraries are leaf concept/common libraries `IMMZAgeConcepts`, `IMMZConcepts`, `WHOCommon`, `WHOConcepts` which have incoming logic edges and outgoing CodeSystem/ValueSet edges), 2666 external edges.
  - Byte-identical (`smart-trust/output` vs `smart-trust-stock/output`): `4081` differing entries with the identical breakdown (`1504` excised `.xml`/`.ttl`, `316` timestamps/archives, `2261` findings from `AstExportCli` leaving `txServer = null` when `-tx` is not explicitly passed).
  - Packaged `ast-results.tgz` (5.2 MB, containing `run.txt`, `smart-trust/output-ast`, `smart-immunizations/output-ast`, `smart-trust.log`, `smart-immunizations.log`) and pushed to `litlfred/fhir-ig-publisher` branch `ast-results/2026-10-23` (`841a7546b22f577dc385b962cd75b5d440728d23`).
- `2026-10-23T15:57:00Z` — Round 2 claimed by `antigravity`; pulled `litlfred/claude/ast-export` to `dbfdb03191c2e7271f631778c55b12d7c14b05ce` (`dbfdb031`, after `8cdfc2b7` and `ebb4bdd7`).
- `2026-10-23T16:14:00Z` — Round 2 run at `dbfdb03191c2e7271f631778c55b12d7c14b05ce` succeeded (exit 0):
  - `smart-trust`: 682 resources, 675 edges, `fsh-index.json=True`, `682 of 682` under `fsh-generated/resources/`, W2 `any 0 of 0` / `out 0`, 654 external edges.
  - `smart-immunizations`: 748 resources, 6483 edges, `fsh-index.json=True`, `732 of 748` under `fsh-generated/resources/` (16 `input/maps/*.fml` `StructureMap` resources), W2 `Library any 279 of 279 / out 275`, `PlanDefinition any 138 of 138 / out 138`, `Measure any 41 of 41 / out 41`, **`TOTAL any 458 of 458 / out 454`** (target `458 of 458` met!), 2666 external edges.
  - Byte-identical (`smart-trust/output` vs `smart-trust-stock/output`): `4080` differing entries (`1504` excised `.xml`/`.ttl`, `2493` timestamps/archives, and `83` non-timestamp differences from Publisher run-to-run non-determinism, temporary directory path `/smart-trust` vs `/smart-trust-stock`, and `Exception().printStackTrace` entry point in `comparison-v1.7.4/xx-*.html`; all `2261` missing-`txServer` findings from Round 1 are resolved).
  - Packaged `ast-results.tgz` (5.2 MB) and pushed to `litlfred/fhir-ig-publisher` branch `ast-results/2026-10-23-r2` (`2aa23dd3160828b3f9f440b9219205be940947ab`).

## Round 2: rerun at fork `8cdfc2b` or later (2026-10-23)

Reviewed by the Publisher AST thread. Round 1 found a bug in the launcher: `AstExportCli`
set a terminology server only when `-tx` was given. So the AST builds in round 1 ran
**without** one, while the stock build used tx.fhir.org. That accounts for the 2261 findings.
Fixed in `ebb4bdd`: the launcher reuses `Publisher.setTxServerValue`. `8cdfc2b` makes W2
count a logic edge in either direction. Round 1's ASTs are kept, but they are not
measurements.

Already checked in the cloud on round 1's ASTs: `ig-ast.ts validity` returns **valid** for
both IGs. The Java digest from your Mac matches the TypeScript one on Linux.

To do:
1. `git -C ~/space_cats/fhir-ig-publisher switch claude/ast-export && git -C ~/space_cats/fhir-ig-publisher pull`,
   to `8cdfc2b` or later. Make no code edits.
2. `rm -rf ~/space_cats/ast-real-igs/*/output-ast ~/space_cats/ast-real-igs/smart-trust-stock`, then step 2
   as before (with `--byte-identical`, without `--no-tx`).
3. Add a section "Results round 2" with the same fields as round 1. The W2 lines now
   print `any` and `out`, so copy both. Classify the differing files as before. The
   expectation is that only timestamps and `.xml`/`.ttl` remain, so list every other file
   as a finding.
4. Push to a new branch `ast-results/2026-10-23-r2` (step 3 of this bean), then step 4.
   The first line of the #222 comment is `bean qzex round 2: DONE`. The line for the owner
   is `qzex r2 done, results on branch ast-results/2026-10-23-r2`.

## Results round 2

- **Provenance:**
  - Fork commit (`litlfred/fhir-ig-publisher`, branch `claude/ast-export`): `dbfdb03191c2e7271f631778c55b12d7c14b05ce` (`dbfdb031`, including `ebb4bdd7` and `8cdfc2b7`)
  - Results branch (`litlfred/fhir-ig-publisher`): `ast-results/2026-10-23-r2` (`2aa23dd3160828b3f9f440b9219205be940947ab`)
  - `smart-trust` commit (`WorldHealthOrganization/smart-trust`): `422b043fdf594e3a6b15234888f3f53b8927026b`
  - `smart-immunizations` commit (`WorldHealthOrganization/smart-immunizations`): `bd7fa726706efc92d972d0dcebba9505f386b078`
  - Tool versions:
    - JDK: `openjdk version "21.0.3" 2024-04-16 LTS (Zulu21.34+19-CA)`
    - Maven: `Apache Maven 3.9.11 (3e54c93a704957b63ee3494413a2b544fd3d825b)`
    - SUSHI: `SUSHI v3.20.1 (implements FHIR Shorthand specification v3.0.0)`
    - Jekyll: `jekyll 4.3.2`
    - git: `git version 2.56.0`
    - python3: `Python 3.13.12`
  - terminology server: tx.fhir.org

- **W1, layout:**
  - `smart-trust`: `sources under fsh-generated/resources/: 682 of 682  (IncrementalPlan assumes this for FSH)`
  - `smart-immunizations`: `sources under fsh-generated/resources/: 732 of 748  (IncrementalPlan assumes this for FSH)`
    - The 16 resources not under `fsh-generated/resources/` are the 16 `StructureMap` resources under `input/maps/*.fml` (now handled in `IncrementalPlan` by `dbfdb031`).

- **W1, byte-identical (`smart-trust/output` vs `smart-trust-stock/output`):**
  - `files differing: 4080` (`diff -rq /Users/litlfred/space_cats/ast-real-igs/smart-trust/output /Users/litlfred/space_cats/ast-real-igs/smart-trust-stock/output`)
  - All `2261` missing-`txServer` findings from Round 1 (`0` files `Only in`, `0` jurisdiction flag differences, `0` missing terminology expansions) are completely gone.
  - Classification of all `4080` entries:
    1. **`.xml` / `.ttl` (excised per owner ruling 2026-10-23, listed and not counted): `1504` files** (`.xml`, `.ttl`, `.xml.html`, `.ttl.html`).
    2. **Timestamp / timing / archive only: `2493` files** (`2151` HTML pages and `342` JSON/package/archive/manifest files whose only differences are generation timestamps).
    3. **Non-timestamp differences (`83` files listed below — all from stock IG Publisher per-run UUIDs, working-directory paths, or profiling/timing, except 5 `comparison-v1.7.4/xx-*.html` stack traces naming `AstExportCli.main` vs `Publisher.main`):**
       - **Per-run random UUIDs generated by stock Publisher (`64` files):**
         - `5` logical-model HTML pages where `HierarchicalTableGenerator` emits a per-run `UUID.randomUUID()` JS comment (`// 55ed16aa-...` vs `// 5212a6f2-...`):
           `StructureDefinition-COSEHeader.html`, `StructureDefinition-CWT.html`, `StructureDefinition-CWTPayload.html`, `StructureDefinition-HCert.html`, `StructureDefinition-SchemeInformation.html`.
         - `58` comparison JSON files under `comparison-v1.7.4/` where `ComparisonSession` generates a per-run session UUID prefix (`853836d0-4172-4d1f-9a5d-02bbcdb68638-*` vs `9124f609-6c99-46b9-ae5a-6204a6f1b1aa-*`):
           `comparison-v1.7.4/cs-1-Actors-Actors-{intersection,union}.json`, `comparison-v1.7.4/cs-2-ConnectionTypes-ConnectionTypes-{intersection,union}.json`, `comparison-v1.7.4/cs-3-Domains-DEV-Domains-DEV-{intersection,union}.json`, `comparison-v1.7.4/cs-4-Domains-UAT-Domains-UAT-{intersection,union}.json`, `comparison-v1.7.4/cs-5-Domains-Domains-{intersection,union}.json`, `comparison-v1.7.4/cs-6-KeyUsage-DEV-KeyUsage-DEV-{intersection,union}.json`, `comparison-v1.7.4/cs-7-KeyUsage-UAT-KeyUsage-UAT-{intersection,union}.json`, `comparison-v1.7.4/cs-8-KeyUsage-KeyUsage-{intersection,union}.json`, `comparison-v1.7.4/cs-9-Participants-DEV-Participants-DEV-{intersection,union}.json`, `comparison-v1.7.4/cs-10-Participants-UAT-Participants-UAT-{intersection,union}.json`, `comparison-v1.7.4/cs-11-Participants-Participants-{intersection,union}.json`, `comparison-v1.7.4/cs-12-PayloadTypes-PayloadTypes-{intersection,union}.json`, `comparison-v1.7.4/cs-13-RefMartCountryList-RefMartCountryList-{intersection,union}.json`, `comparison-v1.7.4/cs-14-Transactions-Transactions-{intersection,union}.json`, `comparison-v1.7.4/cs-15-WHORegionalOffices-WHORegionalOffices-{intersection,union}.json`, `comparison-v1.7.4/vs-21-Actors-Actors-{intersection,union}.json`, `comparison-v1.7.4/vs-22-ConnectionTypes-ConnectionTypes-{intersection,union}.json`, `comparison-v1.7.4/vs-23-Domains-DEV-Domains-DEV-{intersection,union}.json`, `comparison-v1.7.4/vs-24-Domains-UAT-Domains-UAT-{intersection,union}.json`, `comparison-v1.7.4/vs-25-Domains-Domains-{intersection,union}.json`, `comparison-v1.7.4/vs-26-KeyUsage-DEV-KeyUsage-DEV-{intersection,union}.json`, `comparison-v1.7.4/vs-27-KeyUsage-UAT-KeyUsage-UAT-{intersection,union}.json`, `comparison-v1.7.4/vs-28-KeyUsage-KeyUsage-{intersection,union}.json`, `comparison-v1.7.4/vs-29-Participants-DEV-Participants-DEV-{intersection,union}.json`, `comparison-v1.7.4/vs-30-Participants-UAT-Participants-UAT-{intersection,union}.json`, `comparison-v1.7.4/vs-31-Participants-Participants-{intersection,union}.json`, `comparison-v1.7.4/vs-32-PayloadTypes-PayloadTypes-{intersection,union}.json`, `comparison-v1.7.4/vs-33-Transactions-Transactions-{intersection,union}.json`, `comparison-v1.7.4/vs-34-WHORegionalOffices-WHORegionalOffices-{intersection,union}.json`.
         - `1` expansion bundle (`expansions.json`) where the Bundle `id` and each ValueSet expansion `identifier` are per-run `urn:uuid:...` values.
       - **Per-run timing / memory / HTTP request-id / HashSet iteration order (`10` files):**
         - `codesystem-ref-all-list.json`, `codesystem-ref-list.json` (JSON key order of `ConceptMap-ParticipantsToWHORegionalOffices.html` vs `ValueSet-Participants.html` in `uses` object).
         - `dependencies.html`, `qa.html`, `qa.min.html` (base64-encoded PNG data URI zlib header bytes / timestamp in `HierarchicalTableGenerator` icons and working-directory paths).
         - `fragment-usage-analysis.csv`, `qa-time-report.tsv`, `qa.json` (`maxMemory` bytes), `qa-tx.html` (`tx.fhir.org` HTTP `date`/`etag`/`x-request-id` response headers), `qa-txservers.html` (duplicate row count of primary server log entries).
       - **Working-directory path difference (`smart-trust` vs `smart-trust-stock` in `run-real-igs.sh`, `4` files):**
         - `qa-eslintcompact.txt`, `qa.compare.txt`, `qa.txt`, `searchform.html` (embed the absolute checkout path `/Users/litlfred/space_cats/ast-real-igs/smart-trust/...` vs `/Users/litlfred/space_cats/ast-real-igs/smart-trust-stock/...`).
       - **Entry-point frame in `comparison-v1.7.4` exception stack traces (`5` files):**
         - `comparison-v1.7.4/xx-16-COSEHeader-COSEHeader.html`, `comparison-v1.7.4/xx-17-CWT-CWT.html`, `comparison-v1.7.4/xx-18-CWTPayload-CWTPayload.html`, `comparison-v1.7.4/xx-19-HCert-HCert.html`, `comparison-v1.7.4/xx-20-SchemeInformation-SchemeInformation.html` (stock Publisher's `ProfileComparer` throws `FHIRException: Profile Comparison is only supported for FHIR R4` on R5 logical models and prints the Java stack trace into `xx-*.html`; the bottom stack frame is `at org.hl7.fhir.igtools.ast.AstExportCli.main(AstExportCli.java:41)` vs `at org.hl7.fhir.igtools.publisher.Publisher.main(Publisher.java:1625)`).

- **W2:**
  - `smart-trust`:
    ```text
    W2: logic resources with a logic-to-logic edge in this IG (out = outgoing only; any = in or out)
      Library         any    0 of 0   out    0
      PlanDefinition  any    0 of 0   out    0
      Measure         any    0 of 0   out    0
      TOTAL           any    0 of 0   out    0   (smart-immunizations target: 458 of 458)
    edges with target outside this IG (kept, resolved=null): 654
    ```
  - `smart-immunizations`:
    ```text
    W2: logic resources with a logic-to-logic edge in this IG (out = outgoing only; any = in or out)
      Library         any  279 of 279   out  275
      PlanDefinition  any  138 of 138   out  138
      Measure         any   41 of 41   out   41
      TOTAL           any  458 of 458   out  454   (smart-immunizations target: 458 of 458)
    edges with target outside this IG (kept, resolved=null): 2666
    ```

- **Security notice (`https://www.fhir.org/guides/security-notices/2026-03-npm-dependencies.html`, issued 17-March 2026):**
  - Because FHIR IG packages use unscoped names on `packages.fhir.org`, running standard `npm` client tools could fetch those unscoped names from `npmjs.com` and execute arbitrary `npm` lifecycle install scripts; a security researcher uploaded a demonstration malicious package at `fhir.base.template` on `npmjs.com`, which is now blocked on `npmjs.com` and no longer supported.
  - HL7 instructs IG authors to migrate to the new multi-language base template **`fhir2.base.template`** (which is safe and maintained; HL7 also registered published FHIR package names on `npmjs.com` and notes the IG Publisher will refuse to run for IGs depending on `fhir.base.template` in the near future).
  - **Did the build warn?** **Yes** — both `smart-trust.log` and `smart-immunizations.log` printed: `This content depends on fhir.base.template which is no longer considered secure to use` / `See Security notification at https://www.fhir.org/guides/security-notices/2026-03-npm-dependencies.html`.
