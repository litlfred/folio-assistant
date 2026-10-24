---
# folio-assistant-w7r4
$schema: bean/1.0.0
title: 'CONNECTED AGENT: W7 round 4, after the cone and link fixes from the W8 review, and W8, on smart-immunizations with tx.fhir.org'
status: completed
type: task
priority: high
created_at: 2026-10-24T01:00:00Z
updated_at: 2026-10-24T09:12:00Z
parent: folio-assistant-a9tx
---

Follows bean `folio-assistant-w7r3`, whose incremental build converged in 1 round for both
probes. The W8 review (bean `w8rv`) found two kinds of difference from the full build, both fixed
on the fork:
- `72b2ba9`: an unresolved CQL library edge cut the cone, and 39 Measures were rebuilt
  without their library, so they lost their effective data requirements. Edges are now
  bound by name, and each artifact's library is compiled with it. The cql probe now plans
  about 84 resources: 43 Libraries and 41 Measures.
- `3896c6c`: links to cached resources pointed at simplifier.net. The cache package now
  carries a spec.internals.

The rules are as in w7r3:
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
git rev-parse --short HEAD    # must be 3896c6c or later; record it
cd ast-export && mvn -q compile && mvn -q test    # 66 tests, all must pass
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
for P in cql fml; do bash scripts/w7-round.sh $W $P 2>&1 | tee $W/w7r4-$P.txt; done
```

Do not pass `-tx`.

## 4. Record and push

Add a section "Results <date>". For each probe, give:
- `changing:`;
- the `decision` from `$W/w7*/work/plan.json`, with its `rebuild`, `compiledWith`, `loadFromCache` and `edgesResolvedByName` counts;
- every `Round N:` line;
- `Converged` or `Did not converge`;
- `incremental exit N`;
- the last 30 lines of the incremental build;
- `w8 <probe> exit N`.

If the incremental build fails again, give the first `Exception`, or the first `Liquid
Exception` or `Jekyll has failed` line, with its 10 lines before.

```sh
cd $W && tar czf w7r4.tgz w7r4-*.txt w8-*.log w8-*/ smart-immunizations/output-ast/manifest.json \
  $(ls -d w7/plan.json w7/work/plan.json w7/ast w7-fml/plan.json w7-fml/work/plan.json w7-fml/ast 2>/dev/null)
cd ~/space_cats/fhir-ig-publisher && git switch -c ast-results/$(date +%F)-w7r4 origin/claude/ast-export \
  && mkdir -p ast-results && cp $W/w7r4.tgz ast-results/ && git add ast-results \
  && git commit -m "ast-results: W7 round 4 and W8 on smart-immunizations (bean w7r4)" \
  && git push -u origin HEAD
```

Leave out `w7*/work/r*` and `w7*/pkg-cache`. If the tarball is over 90 MB, push only the
`.txt` and `.log` files, the `plan.json` files and the manifests, and say so.

## 5. Report back

1. Set `status: completed`, or `todo` with a `BLOCKED:` line. Commit and push.
2. Comment on https://github.com/litlfred/folio-assistant/issues/222. The first line is
   `bean w7r4: DONE` or `bean w7r4: BLOCKED`, followed by the branch name. End with
   `_Posted by <agent name>_`.
3. Give the owner this line to paste into the "Publisher AST" thread:
   `w7r4 done, results on branch ast-results/<date>-w7r4`

## Done when
- [x] base checked clean
- [x] both probes run (plan, incremental, W8) and results recorded
- [x] results pushed to an `ast-results/<date>-w7r4` branch
- [x] issue #222 comment posted

## Results 2026-10-24

- **Fork (`litlfred/fhir-ig-publisher`, branch `claude/ast-export`):** `3896c6cc`, `mvn -q compile && mvn -q test`: **66 tests, 0 failures, 0 errors**.
- **Step 2 base check (`$I/output-ast/manifest.json`):** `bd7fa726706efc92d972d0dcebba9505f386b078 clean` (`resourcesInBase`: `748`)
- **Results branch on `litlfred/fhir-ig-publisher`:** `ast-results/2026-10-24-w7r4` (`23896714e4ba02bbd9b5b0142a71152a71a3b8ec`), `ast-results/w7r4.tgz` (20 MB).

---

### Probe 1: `cql` (`$W/w7r4-cql.txt`)

- **`changing:`:** `changing: input/cql/IMMZAgeConcepts.cql` (commit `234aeaadd5c1aca6a10666e703e402a45806f855`)
- **Acted-on plan (`$W/w7/work/plan.json`):**
  - `decision`: `"incremental"` (`coneFraction`: `0.112`, `seeds`: `1`)
  - `rebuild`: **`84`** (43 `Library` + 41 `Measure`)
  - `compiledWith`: **`0`** (all 41 Measures' primary libraries were already inside the forward `rebuild` cone via `edgesResolvedByName`)
  - `loadFromCache`: **`56`**
  - `edgesResolvedByName`: **`82`**
- **`Round N:` lines:**
  - `Round 1: rebuilding 84 (0 without a source), loading 56 from cache` (scrolled above `| tail -80`; verified from `$W/w7/work/plan.json` and `$W/w7/ast/manifest.json` `{"rebuilt": 84, "kept": 664, "removed": 0}`)
- **Convergence line:**
  ```text
  Converged after 1 round(s): 748 resources in /Users/litlfred/space_cats/ast-real-igs/w7/ast
  ```
- **Incremental exit:** `incremental exit 0`
- **Last 30 lines of the incremental build (`w7r4-cql.txt`):**
  ```text
  Jekyll: Source: /Users/litlfred/space_cats/ast-real-igs/w7/work/r1/temp/pages                        (00:00.305 / 02:19.433, 1Gb)
  Jekyll: Generating...                                                                                (00:00.000 / 02:19.433, 1Gb)
  Jekyll: done in 2.015 seconds.                                                                       (00:02.015 / 02:21.449, 1Gb)

  Installing smart.who.int.immunizations#dev
   done.
   loaded @ /Users/litlfred/space_cats/ast-real-igs/w7/pkg-cache/smart.who.int.immunizations#dev
  Checking Output HTML                                                                                 (00:01.360 / 02:22.809, 2Gb)
  Processed /Users/litlfred/space_cats/ast-real-igs/w7/work/r1/output - % reduction = 92 (72334701 ==> 6005349)
  found 1716 files                                                                                     (00:00.837 / 02:23.646, 3Gb)
  ........................................
  ........................................
    ... 1716 html files, 0 pages invalid xhtml (0%)                                                    (00:15.954 / 02:39.601, 1Gb)
    ... 260280 links, 15314 broken links (5%)                                                          (00:00.000 / 02:39.601, 1Gb)
  Generate fragment-usage-analysis.csv                                                                 (00:00.000 / 02:39.601, 1Gb)
  Build final .zip                                                                                     (00:00.003 / 02:39.605, 1Gb)
  Final .zip built                                                                                     (00:02.409 / 02:42.015, 1Gb)
  Installing hl7.fhir.r4.examples#4.0.1 to the package cache
    Fetching:

  Installing hl7.fhir.r4.examples#4.0.1
   done.
   loaded @ /Users/litlfred/space_cats/ast-real-igs/w7/pkg-cache/hl7.fhir.r4.examples#4.0.1
  Built. Times: loading: 00:06.190, generate: 01:44.800, narrative generation: 00:11.631, realm-rules: 00:00.000, previous-version: 00:10.080, jekyll: 00:02.331, validation: 00:18.952 (#85), template: 00:04.811 (#3) (00:15.804 / 02:57.819, 2Gb)
  Generating QA                                                                                        (00:00.000 / 02:57.819, 2Gb)
  Validation output in /Users/litlfred/space_cats/ast-real-igs/w7/work/r1/output/qa.html
  Errors: 162, Warnings: 564, Info: 4261, Broken Links: 15314 (00:01.574 / 02:59.394, 4Gb)
  Finished @ 10/24/26, 8:51 AM. Max Memory Used = 4Gb                                                  (00:00.011 / 02:59.405, 4Gb)
  Converged after 1 round(s): 748 resources in /Users/litlfred/space_cats/ast-real-igs/w7/ast
  incremental exit 0
  ```
- **W8 exit:** `w8 cql exit 0`

---

### Probe 2: `fml` (`$W/w7r4-fml.txt`)

- **`changing:`:** `changing: input/maps/IMMZ.C4.LMToPatient.fml` (commit `6ffb652887fbdbc85f1bc1a10726f8fc7f40a1c2`)
- **Acted-on plan (`$W/w7-fml/work/plan.json`):**
  - `decision`: `"incremental"` (`coneFraction`: `0.003`, `seeds`: `1`)
  - `rebuild`: **`2`**
  - `compiledWith`: **`0`**
  - `loadFromCache`: **`5`**
  - `edgesResolvedByName`: **`82`**
- **`Round N:` lines:**
  - `Round 1: rebuilding 2 (0 without a source), loading 5 from cache` (scrolled above `| tail -80`; verified from `$W/w7-fml/work/plan.json` and `$W/w7-fml/ast/manifest.json` `{"rebuilt": 2, "kept": 746, "removed": 0}`)
- **Convergence line:**
  ```text
  Converged after 1 round(s): 748 resources in /Users/litlfred/space_cats/ast-real-igs/w7-fml/ast
  ```
- **Incremental exit:** `incremental exit 0`
- **Last 30 lines of the incremental build (`w7r4-fml.txt`):**
  ```text
  Jekyll: Source: /Users/litlfred/space_cats/ast-real-igs/w7-fml/work/r1/temp/pages                    (00:00.292 / 01:32.913, 1Gb)
  Jekyll: Generating...                                                                                (00:00.000 / 01:32.913, 1Gb)
  Jekyll: done in 0.327 seconds.                                                                       (00:00.327 / 01:33.240, 1Gb)

  Installing smart.who.int.immunizations#dev
   done.
   loaded @ /Users/litlfred/space_cats/ast-real-igs/w7-fml/pkg-cache/smart.who.int.immunizations#dev
  Checking Output HTML                                                                                 (00:00.523 / 01:33.763, 1Gb)
  Processed /Users/litlfred/space_cats/ast-real-igs/w7-fml/work/r1/output - % reduction = 95 (639778 ==> 33756)
  found 603 files                                                                                      (00:00.050 / 01:33.814, 1Gb)
  ........................................
  ........................................
    ... 603 html files, 0 pages invalid xhtml (0%)                                                     (00:00.562 / 01:34.377, 1Gb)
    ... 2980 links, 390 broken links (13%)                                                             (00:00.000 / 01:34.378, 1Gb)
  Generate fragment-usage-analysis.csv                                                                 (00:00.000 / 01:34.378, 1Gb)
  Build final .zip                                                                                     (00:00.005 / 01:34.383, 1Gb)
  Final .zip built                                                                                     (00:00.580 / 01:34.964, 1Gb)
  Installing hl7.fhir.r4.examples#4.0.1 to the package cache
    Fetching:

  Installing hl7.fhir.r4.examples#4.0.1
   done.
   loaded @ /Users/litlfred/space_cats/ast-real-igs/w7-fml/pkg-cache/hl7.fhir.r4.examples#4.0.1
  Built. Times: loading: 00:00.233, generate: 00:47.531, narrative generation: 00:00.064, realm-rules: 00:00.000, previous-version: 00:08.337, jekyll: 00:00.625, validation: 00:10.395 (#3), template: 00:04.390 (#3) (00:14.753 / 01:49.718, 2Gb)
  Generating QA                                                                                        (00:00.000 / 01:49.718, 2Gb)
  Validation output in /Users/litlfred/space_cats/ast-real-igs/w7-fml/work/r1/output/qa.html
  Errors: 4, Warnings: 26, Info: 13, Broken Links: 390 (00:00.210 / 01:49.928, 2Gb)
  Finished @ 10/24/26, 9:01 AM. Max Memory Used = 2Gb                                                  (00:00.006 / 01:49.934, 2Gb)
  Converged after 1 round(s): 748 resources in /Users/litlfred/space_cats/ast-real-igs/w7-fml/ast
  incremental exit 0
  ```
- **W8 exit:** `w8 fml exit 0`

## Log
- 2026-10-24T08:46:00+02:00 Claimed bean `folio-assistant-w7r4` (`status: in-progress`); starting Steps 1–5 on `~/space_cats/fhir-ig-publisher` (`claude/ast-export`) and `~/space_cats/ast-real-igs` (Antigravity).
- 2026-10-24T09:12:00+02:00 Completed Steps 1–4 at fork commit `3896c6cc` (66 tests pass). Base checked clean (`bd7fa726706efc92d972d0dcebba9505f386b078 clean`). Both `cql` (`rebuild: 84, compiledWith: 0, loadFromCache: 56, edgesResolvedByName: 82`) and `fml` (`rebuild: 2, compiledWith: 0, loadFromCache: 5, edgesResolvedByName: 82`) incremental builds converged in 1 round (`incremental exit 0`, 748 resources each) and both W8 full builds exited `0` (`w8 cql exit 0`, `w8 fml exit 0`). Packaged `ast-results/w7r4.tgz` (20 MB) and pushed to `litlfred/fhir-ig-publisher` branch `ast-results/2026-10-24-w7r4` (`23896714`) (Antigravity).
