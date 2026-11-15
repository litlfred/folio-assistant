---
# folio-assistant-w7r3
$schema: bean/1.0.0
title: 'CONNECTED AGENT: W7 round 3, the incremental rebuild after the temporary-IG fixes, and W8, on smart-immunizations with tx.fhir.org'
status: completed
type: task
priority: high
created_at: 2026-10-23T20:40:00Z
updated_at: 2026-10-23T22:57:00Z
parent: folio-assistant-a9tx
---

Follows bean `folio-assistant-wv7r`. That round got further than any before it. The base was
clean, the plan was `incremental`, and the temporary IG's Publisher run reached Jekyll. Two
things then failed:
- Jekyll stopped: `Could not locate the included file 'menu.xml'`;
- the script exited before W8.

The fork fixes them:
- `e3c7119`: the temporary IG gets `input/includes/` and `fsh-generated/includes/`, and
  `w7-round.sh` runs W8 even when W7 fails;
- `d2d4bfe`: every `path-*` directory exists in the temporary IG, which fixes the
  `input/cql is not a valid directory` error in the `fml` probe.

The rules are as in wv7r:
- do not edit Publisher or library code;
- no GitHub Actions;
- open no PR;
- merge nothing;
- edit beans with plain git commits on `cat/cat-harness/beans`, never `state:push`;
- **do not tick W7 or W8 in a9tx.** Report numbers only.

The plan line that `w7-round.sh` prints comes from `AstPlanCli`, which takes no
`-verify-incremental`, so it reads `decision: full  computed: incremental`. That is
expected. The decision that was acted on is in `$W/w7*/work/plan.json`.

## 0. Claim

Set `status: in-progress` and add a Log line. Commit and push.

## 1. Set up

```sh
cd ~/space_cats/fhir-ig-publisher && git switch claude/ast-export && git pull --ff-only
git rev-parse --short HEAD    # must be d2d4bfe or later; record it
cd ast-export && mvn -q compile && mvn -q test    # 65 tests, all must pass
```

## 2. Check the base (do not rebuild it)

wv7r's clean base is still the base. Check that it is still there and still clean:

```sh
W=~/space_cats/ast-real-igs; I=$W/smart-immunizations
python3 -c "import json;m=json.load(open('$I/output-ast/manifest.json'));print(m['inputs']['sourceRevision'], 'notAtRevision' if 'inputsNotAtRevision' in m else 'clean')"
```

It must print `bd7fa726... clean`. If it doesn't, run wv7r step 2 first.

## 3. Run both probes

```sh
cd ~/space_cats/fhir-ig-publisher/ast-export
for P in cql fml; do bash scripts/w7-round.sh $W $P 2>&1 | tee $W/w7r3-$P.txt; done
```

Do not pass `-tx`.

## 4. Record and push

Add a section "Results <date>". For each probe, give:
- `changing:`;
- the `decision` from `$W/w7*/work/plan.json` and its `rebuild` and `loadFromCache` counts;
- every `Round N:` line;
- `Converged` or `Did not converge`;
- `incremental exit N`;
- the last 30 lines of the incremental build;
- `w8 <probe> exit N`.

If the incremental build fails again, give the first `Exception`, or the first `Liquid
Exception` or `Jekyll has failed` line, with its 10 lines before.

```sh
cd $W && tar czf w7r3.tgz w7r3-*.txt w8-*.log w8-*/ smart-immunizations/output-ast/manifest.json \
  $(ls -d w7/plan.json w7/work/plan.json w7/ast w7-fml/plan.json w7-fml/work/plan.json w7-fml/ast 2>/dev/null)
cd ~/space_cats/fhir-ig-publisher && git switch -c ast-results/$(date +%F)-w7r3 origin/claude/ast-export \
  && mkdir -p ast-results && cp $W/w7r3.tgz ast-results/ && git add ast-results \
  && git commit -m "ast-results: W7 round 3 and W8 on smart-immunizations (bean w7r3)" \
  && git push -u origin HEAD
```

Leave out `w7*/work/r*` and `w7*/pkg-cache`. If the tarball is over 90 MB, push only the
`.txt` and `.log` files, the `plan.json` files and the manifests, and say so.

## 5. Report back

1. Set `status: completed`, or `todo` with a `BLOCKED:` line. Commit and push.
2. Comment on https://github.com/litlfred/folio-assistant/issues/222. The first line is
   `bean w7r3: DONE` or `bean w7r3: BLOCKED`, followed by the branch name. End with
   `_Posted by <agent name>_`.
3. Give the owner this line to paste into the "Publisher AST" thread:
   `w7r3 done, results on branch ast-results/<date>-w7r3`

## Done when
- [x] base checked clean
- [x] both probes run (plan, incremental, W8) and results recorded
- [x] results pushed to an `ast-results/<date>-w7r3` branch
- [x] issue #222 comment posted

## Results 2026-10-23

- **Fork (`litlfred/fhir-ig-publisher`, branch `claude/ast-export`):** `d2d4bfe` (`d2d4bfedb52c9ffb4fe3ff7113bff92467d57d65`), `mvn -q compile && mvn -q test`: **65 tests, 0 failures, 0 errors**.
- **Step 2 base check (`$I/output-ast/manifest.json`):** `bd7fa726706efc92d972d0dcebba9505f386b078 clean`
- **Results branch on `litlfred/fhir-ig-publisher`:** `ast-results/2026-10-23-w7r3` (`539c086190ac4fd74d2210cd9b08c28236e75ff5`), `ast-results/w7r3.tgz` (20 MB).

---

### Probe 1: `cql` (`$W/w7r3-cql.txt`)

- **`changing:`:** `changing: input/cql/IMMZAgeConcepts.cql` (commit `48f3f3c`)
- **Acted-on plan (`$W/w7/work/plan.json`):**
  - `decision`: `"incremental"` (`coneFraction`: `0.055`, `seeds`: `1`, `rebuild`: `41`, `loadFromCache`: `95`)
- **`Round N:` lines:** 1 round ran (`r1`, rebuilding 41 resources and loading 95 from cache; header line scrolled past `| tail -80`).
- **Convergence line:**
  ```text
  Converged after 1 round(s): 748 resources in /Users/litlfred/space_cats/ast-real-igs/w7/ast
  ```
- **Incremental exit:** `incremental exit 0`
- **Last 30 lines of the incremental build (`w7r3-cql.txt`):**
  ```text
  * A reference to a manually edited file that hasn't been provided                                    (00:00.000 / 02:08.719, 1Gb)
  Jekyll: Source: /Users/litlfred/space_cats/ast-real-igs/w7/work/r1/temp/pages                        (00:00.790 / 02:09.509, 1Gb)
  Jekyll: Generating...                                                                                (00:00.000 / 02:09.509, 1Gb)
  Jekyll: done in 1.273 seconds.                                                                       (00:01.273 / 02:10.783, 1Gb)

  Installing smart.who.int.immunizations#dev
   done.
   loaded @ /Users/litlfred/space_cats/ast-real-igs/w7/pkg-cache/smart.who.int.immunizations#dev
  Checking Output HTML                                                                                 (00:01.143 / 02:11.926, 1Gb)
  Processed /Users/litlfred/space_cats/ast-real-igs/w7/work/r1/output - % reduction = 92 (10776571 ==> 942435)
  found 999 files                                                                                      (00:00.223 / 02:12.149, 1Gb)
  .........................................
  .........................................
    ... 999 html files, 0 pages invalid xhtml (0%)                                                     (00:03.190 / 02:15.340, 2Gb)
    ... 32036 links, 6591 broken links (20%)                                                           (00:00.000 / 02:15.340, 2Gb)
  Generate fragment-usage-analysis.csv                                                                 (00:00.000 / 02:15.340, 2Gb)
  Build final .zip                                                                                     (00:00.004 / 02:15.345, 2Gb)
  Final .zip built                                                                                     (00:00.811 / 02:16.156, 2Gb)
  Installing hl7.fhir.r4.examples#4.0.1 to the package cache
    Fetching:

  Installing hl7.fhir.r4.examples#4.0.1
   done.
   loaded @ /Users/litlfred/space_cats/ast-real-igs/w7/pkg-cache/hl7.fhir.r4.examples#4.0.1
  Built. Times: loading: 00:02.690, generate: 01:31.049, narrative generation: 00:18.093, realm-rules: 00:00.000, previous-version: 00:13.201, jekyll: 00:02.076, validation: 00:11.883 (#42), template: 00:05.130 (#3) (00:24.532 / 02:40.688, 2Gb)
  Generating QA                                                                                        (00:00.000 / 02:40.688, 2Gb)
  Validation output in /Users/litlfred/space_cats/ast-real-igs/w7/work/r1/output/qa.html
  Errors: 433, Warnings: 107, Info: 87, Broken Links: 6591 (00:00.619 / 02:41.308, 2Gb)
  Finished @ 10/23/26, 10:35 PM. Max Memory Used = 2Gb                                                 (00:00.014 / 02:41.323, 2Gb)
  Converged after 1 round(s): 748 resources in /Users/litlfred/space_cats/ast-real-igs/w7/ast
  ```
- **W8 exit:** `w8 cql exit 0`

---

### Probe 2: `fml` (`$W/w7r3-fml.txt`)

- **`changing:`:** `changing: input/maps/IMMZ.C4.LMToPatient.fml` (commit `c0b8a00`)
- **Acted-on plan (`$W/w7-fml/work/plan.json`):**
  - `decision`: `"incremental"` (`coneFraction`: `0.003`, `seeds`: `1`, `rebuild`: `2`, `loadFromCache`: `5`)
- **`Round N:` lines:** 1 round ran (`r1`, rebuilding 2 resources and loading 5 from cache; header line scrolled past `| tail -80`).
- **Convergence line:**
  ```text
  Converged after 1 round(s): 748 resources in /Users/litlfred/space_cats/ast-real-igs/w7-fml/ast
  ```
- **Incremental exit:** `incremental exit 0`
- **Last 30 lines of the incremental build (`w7r3-fml.txt`):**
  ```text
  * A reference to a manually edited file that hasn't been provided                                    (00:00.000 / 01:53.892, 1Gb)
  Jekyll: Source: /Users/litlfred/space_cats/ast-real-igs/w7-fml/work/r1/temp/pages                    (00:00.441 / 01:54.334, 1Gb)
  Jekyll: Generating...                                                                                (00:00.000 / 01:54.334, 1Gb)
  Jekyll: done in 0.347 seconds.                                                                       (00:00.346 / 01:54.681, 1Gb)

  Installing smart.who.int.immunizations#dev
   done.
   loaded @ /Users/litlfred/space_cats/ast-real-igs/w7-fml/pkg-cache/smart.who.int.immunizations#dev
  Checking Output HTML                                                                                 (00:00.602 / 01:55.283, 1Gb)
  Processed /Users/litlfred/space_cats/ast-real-igs/w7-fml/work/r1/output - % reduction = 95 (642802 ==> 33756)
  found 603 files                                                                                      (00:00.045 / 01:55.329, 1Gb)
  ........................................
  ........................................
    ... 603 html files, 0 pages invalid xhtml (0%)                                                     (00:00.519 / 01:55.848, 1Gb)
    ... 2980 links, 390 broken links (13%)                                                             (00:00.000 / 01:55.848, 1Gb)
  Generate fragment-usage-analysis.csv                                                                 (00:00.000 / 01:55.849, 2Gb)
  Build final .zip                                                                                     (00:00.007 / 01:55.856, 1Gb)
  Final .zip built                                                                                     (00:00.671 / 01:56.528, 1Gb)
  Installing hl7.fhir.r4.examples#4.0.1 to the package cache
    Fetching:

  Installing hl7.fhir.r4.examples#4.0.1
   done.
   loaded @ /Users/litlfred/space_cats/ast-real-igs/w7-fml/pkg-cache/hl7.fhir.r4.examples#4.0.1
  Built. Times: loading: 00:00.385, generate: 00:53.068, narrative generation: 00:00.067, realm-rules: 00:00.000, previous-version: 00:10.738, jekyll: 00:00.797, validation: 00:11.356 (#3), template: 00:04.686 (#3) (00:16.135 / 02:12.663, 2Gb)
  Generating QA                                                                                        (00:00.000 / 02:12.663, 2Gb)
  Validation output in /Users/litlfred/space_cats/ast-real-igs/w7-fml/work/r1/output/qa.html
  Errors: 4, Warnings: 26, Info: 13, Broken Links: 390 (00:00.195 / 02:12.858, 2Gb)
  Finished @ 10/23/26, 10:46 PM. Max Memory Used = 2Gb                                                 (00:00.007 / 02:12.865, 2Gb)
  Converged after 1 round(s): 748 resources in /Users/litlfred/space_cats/ast-real-igs/w7-fml/ast
  ```
- **W8 exit:** `w8 fml exit 0`

## Log
- 2026-10-23T22:29:00+02:00 Claimed bean `folio-assistant-w7r3` (`status: in-progress`); starting Steps 1–5 on `~/space_cats/fhir-ig-publisher` (`claude/ast-export`) and `~/space_cats/ast-real-igs` (Antigravity).
- 2026-10-23T22:57:00+02:00 Completed Steps 1–4 at fork commit `d2d4bfe` (65 tests pass). Base checked clean (`bd7fa726706efc92d972d0dcebba9505f386b078 clean`). Both `cql` (`rebuild: 41, loadFromCache: 95`) and `fml` (`rebuild: 2, loadFromCache: 5`) incremental builds converged in 1 round (`incremental exit 0`, 748 resources each) and both W8 full builds exited `0` (`w8 cql exit 0`, `w8 fml exit 0`). Packaged `ast-results/w7r3.tgz` (20 MB) and pushed to `litlfred/fhir-ig-publisher` branch `ast-results/2026-10-23-w7r3` (`539c0861`) (Antigravity).
