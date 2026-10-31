---
# folio-assistant-fpmn
$schema: bean/1.0.0
title: 'CONNECTED AGENT: run W7 (incremental rebuild, CQL and FML probes) and the W8 full builds on smart-immunizations, with tx.fhir.org'
status: completed
type: task
priority: high
created_at: 2026-10-23T16:45:00Z
updated_at: 2026-10-23T17:01:00Z
parent: folio-assistant-a9tx
---

Follows bean `folio-assistant-qzex` (round 2 done). It runs on the owner's machine,
because cloud sessions cannot reach tx.fhir.org or packages.fhir.org. **You only build
and push.** The cloud thread "Publisher AST" does the diffs and the review
(`ig-ast.ts diff`, `ig-ast-delta-review.bpmn`).

The rules are as in qzex and a9tx:
- do not edit Publisher or library code;
- no GitHub Actions;
- open no PR;
- merge nothing;
- edit beans with plain git commits on `cat/cat-harness/beans`, never `state:push`.

## 0. Claim

Set `status: in-progress`, add a Log line, then commit and push, as in qzex step 0.

## 1. Set up

```sh
cd ~/space_cats/fhir-ig-publisher && git switch claude/ast-export && git pull --ff-only
git rev-parse --short HEAD    # must be 5607bd7 or later; record it
ls ~/space_cats/ast-real-igs/smart-immunizations/output-ast/manifest.json   # the qzex round-2 base AST; it must exist
```

If the base AST is gone, run qzex step 2 again first. `w7-round.sh` resets the IG clone
to the base AST's own revision before each probe, so the order below is safe.

## 2. Run, in this order

```sh
cd ~/space_cats/fhir-ig-publisher/ast-export && mvn -q compile
W=~/space_cats/ast-real-igs; CP="$PWD/target/classes:$(cat $W/cp.txt)"
for P in cql fml; do mkdir -p $W/w8-$P
  bash scripts/w7-round.sh $W $P 2>&1 | tee $W/w7-$P.txt                     # W7: plan and incremental rebuild
  (cd $W/smart-immunizations && java -Xmx8g -cp "$CP" org.hl7.fhir.igtools.ast.AstExportCli \
     -ig . -ast-out $W/w8-$P/ast > $W/w8-$P.log 2>&1); echo "w8 $P exit $?"  # W8: full build of the same commit
  git -C $W/smart-immunizations rev-parse HEAD > $W/w8-$P/commit.txt
done
```

Do not pass `-tx`, so both builds use tx.fhir.org. Each W8 build takes about as
long as one qzex build. If any step fails, keep its output, record the last 40 lines in
the Log, and carry on with the next step.

## 3. Record and push

Add a section "Results <date>". For each probe (`cql`, `fml`), give:
- the `changing:` line;
- the plan lines: `decision`, `seeds`, `rebuild`, `load`, and every `full because`;
- the last 30 lines of the incremental build;
- the W8 exit code.

Then push:

```sh
cd ~/space_cats/ast-real-igs
tar czf w7w8.tgz w7-*.txt w8-*.log w8-*/ \
  $(ls -d w7/plan.json w7/ast w7-fml/plan.json w7-fml/ast 2>/dev/null)
cd ~/space_cats/fhir-ig-publisher && git switch -c ast-results/$(date +%F)-w7w8 origin/claude/ast-export \
  && mkdir -p ast-results && cp ~/space_cats/ast-real-igs/w7w8.tgz ast-results/ \
  && git add ast-results && git commit -m "ast-results: W7/W8 on smart-immunizations with tx.fhir.org (bean fpmn)" \
  && git push -u origin HEAD
```

Leave out `w7*/work` and `w7*/pkg-cache`, because they are large and rebuildable. If the
tarball is over 90 MB, push only the `.txt` and `.log` files and the `plan.json` files,
and say so.

## 4. Report back

1. Set `status: completed`, or `todo` with a `BLOCKED:` line. Commit and push.
2. Comment on https://github.com/litlfred/folio-assistant/issues/222. The first line is
   `bean fpmn: DONE` or `bean fpmn: BLOCKED`, followed by the branch name. End with
   `_Posted by <agent name>_`.
3. Give the owner this line to paste into the "Publisher AST" thread:
   `fpmn done, results on branch ast-results/<date>-w7w8`.

## Done when
- [x] both probes run, W7 and W8, and results recorded
- [x] results pushed to an `ast-results/<date>-w7w8` branch
- [x] issue #222 comment posted

## Results 2026-10-23

- **Fork commit (`litlfred/fhir-ig-publisher` `claude/ast-export`):** `5607bd7604fec44a78f3a285d1ee3c7a77366a7d` (`5607bd7`)
- **Base AST revision (`smart-immunizations`):** `bd7fa726706efc92d972d0dcebba9505f386b078`
- **Results branch (`litlfred/fhir-ig-publisher`):** `ast-results/2026-10-23-w7w8` (`ast-results/w7w8.tgz`, 20 MB)

### Probe 1: `cql` (`207eed39545c2df93f227aa506b67771c989f735`)

- **`changing:` line:** `changing: input/cql/IMMZAgeConcepts.cql`
- **Plan lines (`w7/plan.json` / `w7-cql.txt`):**
  ```text
  decision: full  computed: full  coneFraction: 0.055
  seeds: 1  rebuild: 41  load: 95
    full because: base AST's inputDigest e199bea4c7e500026f6c3b52e5ca2067c80aa238fd5c0de9d7e7b98f109d8c00 is not the input digest of bd7fa726706efc92d972d0dcebba9505f386b078 (3910eeba3a2dd35e038a34ae9948a11156c788b586415f7dcae1d16b15ce03e5)
    full because: incremental path not yet verified
    file: input/cql/IMMZAgeConcepts.cql RESOURCES 1
  ```
- **Last 30 lines of the incremental build (`w7-cql.txt`):**
  ```text
  Generating combined package                                                                          (00:00.172 / 04:41.098, 2Gb)
  Error generating combined package: /Users/litlfred/space_cats/ast-real-igs/smart-immunizations/output/package.tgz (No such file or directory) (00:00.002 / 04:41.101, 2Gb)
  ## Memory (MB): Use = 2633, Free = 3514, Total = 6148, Max = 8192                                    (00:00.545 / 04:41.646, 2Gb)
  Run jekyll: jekyll build --destination "/Users/litlfred/space_cats/ast-real-igs/smart-immunizations/output" (in folder /Users/litlfred/space_cats/ast-real-igs/smart-immunizations/temp/pages) (00:00.001 / 04:41.648, 2Gb)
  Troubleshooting Note: usual cases for Jekyll to fail are:                                            (00:00.000 / 04:41.648, 2Gb)
  * A failure to produce a fragment that is already logged in the output above                         (00:00.000 / 04:41.648, 2Gb)
  * A reference to a manually edited file that hasn't been provided                                    (00:00.000 / 04:41.648, 2Gb)
  Jekyll: Source: /Users/litlfred/space_cats/ast-real-igs/smart-immunizations/temp/pages               (00:00.342 / 04:41.990, 2Gb)
  Jekyll: Generating...                                                                                (00:00.000 / 04:41.990, 2Gb)
  Jekyll: done in 14.78 seconds.                                                                       (00:14.780 / 04:56.771, 2Gb)

  Installing smart.who.int.immunizations#dev
   done.
   loaded @ /Users/litlfred/.fhir/packages/smart.who.int.immunizations#dev
  Checking Output HTML                                                                                 (00:10.564 / 05:07.335, 3Gb)
  Processed /Users/litlfred/space_cats/ast-real-igs/smart-immunizations/output - % reduction = 92 (468502521 ==> 39066624)
  found 10819 files                                                                                    (00:05.753 / 05:13.089, 3Gb)
  ........................................
  ........................................
    ... 10819 html files, 3 pages invalid xhtml (0%)                                                   (01:35.728 / 06:48.817, 2Gb)
    ... 1458601 links, 8 broken links (0%)                                                             (00:00.001 / 06:48.818, 2Gb)
  Generate fragment-usage-analysis.csv                                                                 (00:00.000 / 06:48.819, 2Gb)
  Build final .zip                                                                                     (00:00.006 / 06:48.825, 2Gb)
  Final .zip built                                                                                     (00:16.175 / 07:05.001, 2Gb)
  Built. Times: loading: 00:24.281, generate: 05:34.956, narrative generation: 00:04.191, realm-rules: 00:00.000, previous-version: 00:15.994, jekyll: 00:15.169, validation: 00:50.759 (#748), template: 00:03.573 (#3) (00:08.499 / 07:13.500, 4Gb)
  Generating QA                                                                                        (00:00.000 / 07:13.500, 4Gb)
  Validation output in /Users/litlfred/space_cats/ast-real-igs/smart-immunizations/output/qa.html
  Errors: 751, Warnings: 1749, Info: 6339, Broken Links: 8 (00:02.029 / 07:15.530, 6Gb)
  Finished @ 10/23/26, 6:36 PM. Max Memory Used = 6Gb                                                  (00:00.059 / 07:15.589, 6Gb)
  AST written to /Users/litlfred/space_cats/ast-real-igs/w7/ast
  ```
- **W8 exit code (`w8 cql`):** `0` (`w8 cql exit 0`, AST written to `w8-cql/ast`)

### Probe 2: `fml` (`15bd8afd2b289d211c810ddde67e37c9c7d55f66`)

- **`changing:` line:** `changing: input/maps/IMMZ.C4.LMToPatient.fml`
- **Plan lines (`w7-fml/plan.json` / `w7-fml.txt`):**
  ```text
  decision: full  computed: full  coneFraction: 0.003
  seeds: 1  rebuild: 2  load: 5
    full because: base AST's inputDigest e199bea4c7e500026f6c3b52e5ca2067c80aa238fd5c0de9d7e7b98f109d8c00 is not the input digest of bd7fa726706efc92d972d0dcebba9505f386b078 (3910eeba3a2dd35e038a34ae9948a11156c788b586415f7dcae1d16b15ce03e5)
    full because: incremental path not yet verified
    file: input/maps/IMMZ.C4.LMToPatient.fml RESOURCES 1
  ```
- **Last 30 lines of the incremental build (`w7-fml.txt`):**
  ```text
  Generating combined package                                                                          (00:00.179 / 04:45.023, 5Gb)
  Error generating combined package: /Users/litlfred/space_cats/ast-real-igs/smart-immunizations/output/package.tgz (No such file or directory) (00:00.002 / 04:45.025, 5Gb)
  ## Memory (MB): Use = 2633, Free = 3418, Total = 6052, Max = 8192                                    (00:00.601 / 04:45.626, 2Gb)
  Run jekyll: jekyll build --destination "/Users/litlfred/space_cats/ast-real-igs/smart-immunizations/output" (in folder /Users/litlfred/space_cats/ast-real-igs/smart-immunizations/temp/pages) (00:00.001 / 04:45.627, 2Gb)
  Troubleshooting Note: usual cases for Jekyll to fail are:                                            (00:00.000 / 04:45.627, 2Gb)
  * A failure to produce a fragment that is already logged in the output above                         (00:00.000 / 04:45.627, 2Gb)
  * A reference to a manually edited file that hasn't been provided                                    (00:00.000 / 04:45.627, 2Gb)
  Jekyll: Source: /Users/litlfred/space_cats/ast-real-igs/smart-immunizations/temp/pages               (00:00.383 / 04:46.010, 2Gb)
  Jekyll: Generating...                                                                                (00:00.000 / 04:46.010, 2Gb)
  Jekyll: done in 14.334 seconds.                                                                      (00:14.333 / 05:00.344, 2Gb)

  Installing smart.who.int.immunizations#dev
   done.
   loaded @ /Users/litlfred/.fhir/packages/smart.who.int.immunizations#dev
  Checking Output HTML                                                                                 (00:10.055 / 05:10.399, 3Gb)
  Processed /Users/litlfred/space_cats/ast-real-igs/smart-immunizations/output - % reduction = 92 (468502361 ==> 39066592)
  found 10819 files                                                                                    (00:06.162 / 05:16.562, 3Gb)
  ........................................
  ........................................
    ... 10819 html files, 3 pages invalid xhtml (0%)                                                   (01:41.611 / 06:58.174, 2Gb)
    ... 1458601 links, 8 broken links (0%)                                                             (00:00.001 / 06:58.176, 2Gb)
  Generate fragment-usage-analysis.csv                                                                 (00:00.000 / 06:58.176, 2Gb)
  Build final .zip                                                                                     (00:00.007 / 06:58.184, 2Gb)
  Final .zip built                                                                                     (00:16.080 / 07:14.264, 2Gb)
  Built. Times: loading: 00:25.353, generate: 05:41.425, narrative generation: 00:04.080, realm-rules: 00:00.000, previous-version: 00:16.441, jekyll: 00:14.760, validation: 00:51.382 (#748), template: 00:03.563 (#3) (00:09.395 / 07:23.660, 4Gb)
  Generating QA                                                                                        (00:00.000 / 07:23.660, 4Gb)
  Validation output in /Users/litlfred/space_cats/ast-real-igs/smart-immunizations/output/qa.html
  Errors: 751, Warnings: 1749, Info: 6339, Broken Links: 8 (00:01.636 / 07:25.297, 6Gb)
  Finished @ 10/23/26, 6:52 PM. Max Memory Used = 6Gb                                                  (00:00.083 / 07:25.381, 6Gb)
  AST written to /Users/litlfred/space_cats/ast-real-igs/w7-fml/ast
  ```
- **W8 exit code (`w8 fml`):** `0` (`w8 fml exit 0`, AST written to `w8-fml/ast`)

## Log

- `2026-10-23T16:28:00Z` — Claimed by `antigravity`.
- `2026-10-23T17:01:00Z` — Completed W7 and W8 for both `cql` (`207eed39`) and `fml` (`15bd8afd`) probes on `smart-immunizations` with `tx.fhir.org` at fork commit `5607bd76`; pushed 20 MB `ast-results/w7w8.tgz` to `litlfred/fhir-ig-publisher` branch `ast-results/2026-10-23-w7w8`.
