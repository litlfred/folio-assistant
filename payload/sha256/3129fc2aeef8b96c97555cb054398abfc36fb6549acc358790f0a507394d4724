---
# folio-assistant-wv7r
$schema: bean/1.0.0
title: 'CONNECTED AGENT: W7 round 2, a real incremental rebuild (with -verify-incremental) and W8, on smart-immunizations with tx.fhir.org'
status: completed
type: task
priority: high
created_at: 2026-10-23T18:30:00Z
updated_at: 2026-10-23T21:08:00Z
parent: folio-assistant-a9tx
---

Follows bean `folio-assistant-fpmn`. In that round both W7 plans were decided `full`, so no
incremental build ran. The reasons are in a9tx under "W7/W8 review of bean fpmn". This round
fixes both causes:
- the base is rebuilt from a clean tree;
- `w7-round.sh` passes `-verify-incremental` (the owner chose option A on 2026-10-23).

It runs on the owner's machine, because cloud sessions cannot reach tx.fhir.org or
packages.fhir.org. **You only build and push.** The cloud thread "Publisher AST" does the
diffs and the review.

The rules are as in fpmn:
- do not edit Publisher or library code;
- no GitHub Actions;
- open no PR;
- merge nothing;
- edit beans with plain git commits on `cat/cat-harness/beans`, never `state:push`;
- **do not tick W7 or W8 in a9tx.** The review does that. Report numbers only.

## 0. Claim

Set `status: in-progress` and add a Log line. Commit and push.

## 1. Set up

```sh
cd ~/space_cats/fhir-ig-publisher && git switch claude/ast-export && git pull --ff-only
git rev-parse --short HEAD    # must be 140e494 or later; record it
cd ast-export && mvn -q compile && mvn -q test    # 64 tests, all must pass
```

## 2. A clean base

The old base is dirty, so rebuild it. The clone is a scratch copy, so resetting it loses nothing.

```sh
W=~/space_cats/ast-real-igs; I=$W/smart-immunizations
cd ~/space_cats/fhir-ig-publisher/ast-export; CP="$PWD/target/classes:$(cat $W/cp.txt)"
git -C $I fetch -q && git -C $I reset -q --hard "@{u}" && git -C $I clean -fdq
rm -rf $I/output-ast
(cd $I && java -Xmx8g -cp "$CP" org.hl7.fhir.igtools.ast.AstExportCli -ig . > $W/base-r3.log 2>&1); echo "base exit $?"
grep -c "WARNING: .*differ from the committed revision" $W/base-r3.log    # must print 0
git -C $I status --porcelain --untracked-files=all | wc -l                   # nonzero is fine: the build's own output
```

## 3. Run both probes

```sh
cd ~/space_cats/fhir-ig-publisher/ast-export
for P in cql fml; do bash scripts/w7-round.sh $W $P 2>&1 | tee $W/w7r2-$P.txt; done
```

Each probe resets the clone to the base's revision, cleans it, and commits one edit:
- `cql` appends a comment to a CQL file;
- `fml` renames a rule.

It then plans, runs the incremental build with `-verify-incremental`, and runs the W8 full
build from a clean tree. Do not pass `-tx`. If a step fails, keep its output, add its last
40 lines to the Log, and carry on.

## 4. Record and push

Add a section "Results <date>". For each probe, give:
- the `changing:` line;
- every plan line (`decision`, `computed`, `seeds`, `rebuild`, `load`, and any `full because`);
- the `Round N:` and `Converged` or `Did not converge` lines;
- the last 30 lines of the incremental build;
- the `w8 <probe> exit` line.

`decision` should now read `incremental`. If it reads `full`, say so first and give its
reasons.

```sh
cd $W && tar czf w7r2.tgz base-r3.log w7r2-*.txt w8-*.log w8-*/ smart-immunizations/output-ast/manifest.json \
  $(ls -d w7/plan.json w7/ast w7-fml/plan.json w7-fml/ast 2>/dev/null)
cd ~/space_cats/fhir-ig-publisher && git switch -c ast-results/$(date +%F)-w7r2 origin/claude/ast-export \
  && mkdir -p ast-results && cp $W/w7r2.tgz ast-results/ && git add ast-results \
  && git commit -m "ast-results: W7 round 2 (-verify-incremental) and W8 on smart-immunizations (bean wv7r)" \
  && git push -u origin HEAD
```

Leave out `w7*/work` and `w7*/pkg-cache`. If the tarball is over 90 MB, push only the
`.txt` and `.log` files, the `plan.json` files and the manifests, and say so.

## 5. Report back

1. Set `status: completed`, or `todo` with a `BLOCKED:` line. Commit and push.
2. Comment on https://github.com/litlfred/folio-assistant/issues/222. The first line is
   `bean wv7r: DONE` or `bean wv7r: BLOCKED`, followed by the branch name. End with
   `_Posted by <agent name>_`.
3. Give the owner this line to paste into the "Publisher AST" thread:
   `wv7r done, results on branch ast-results/<date>-w7r2`

## Done when
- [x] clean base built, with no "differ from the committed revision" warning
- [x] both probes run (plan, incremental, W8) and results recorded
- [x] results pushed to an `ast-results/<date>-w7r2` branch
- [x] issue #222 comment posted

## Results 2026-10-23

- **Fork (`litlfred/fhir-ig-publisher`, branch `claude/ast-export`):** `140e494` (`140e4948883a3b2c86134b81bbc4a916a205b4ce`), `mvn -q compile && mvn -q test`: **64 tests, 0 failures, 0 errors**.
- **Clean base (`$W/base-r3.log` on `smart-immunizations` @ `bd7fa726`):**
  - `base exit 0`
  - `grep -c "WARNING: .*differ from the committed revision" $W/base-r3.log`: **`0`**
  - `git -C $I status --porcelain --untracked-files=all | wc -l`: `203`
- **Results branch on `litlfred/fhir-ig-publisher`:** `ast-results/2026-10-23-w7r2` (`d195a788a7746b14485593e00bb067403259b13e`), `ast-results/w7r2.tgz` (20 MB).

### Why `w7-round.sh` plan output printed `decision: full` while `IncrementalBuildCli -verify-incremental` ran `decision: incremental`

1. In `scripts/w7-round.sh` line 54, `AstPlanCli` is invoked **without** `-verify-incremental`, so `$OUT/plan.json` has `decision: full` (`computed: incremental`, `full because: incremental path not yet verified`).
2. In `scripts/w7-round.sh` line 67, `IncrementalBuildCli` is invoked **with** `-verify-incremental`, so `IncrementalBuildCli` wrote `$OUT/work/plan.json` with **`"decision": "incremental"`** (`"fullBuildBecause": []`, `"guard": "guard bypassed by -verify-incremental: this output is for W7 verification against a full build (W8), never a base"`) and ran the real incremental build in `$OUT/work/r1`.
3. In both probes, `IncrementalBuildCli` wrote the cache package `smart.who.int.immunizations.ast-cache#0.0.0-ast.bd7fa726.r1`, assembled the temporary IG in `$OUT/work/r1`, and ran `AstPublisher.execute()` (`IncrementalBuildCli.java:188`), which **failed at the very end in `PublisherGenerator.runJekyll`** (`Exit value: 1`):
   - `Liquid Exception: Could not locate the included file 'menu.xml' in any of [".../work/r1/temp/pages/_includes"].`
   - In `smart-immunizations`, `menu.xml` lives at `fsh-generated/includes/menu.xml`, which `TempIgAssembler` does not copy into `work/r1`.
4. Additional findings during `work/r1` execution:
   - In `cql`: `CQL Translation succeeded for file: '.../w7/work/r1/input/cql/IMMZIndicatorElements.cql', but ELM generation failed with the following error: Unknown FHIRTypes code 'Any'`
   - In `fml`: `Errors occurred attempting to translate CQL content: path '.../w7-fml/work/r1/input/cql' is not a valid directory`
   - In both: `Error generating combined package: .../work/r1/output/package.tgz (No such file or directory)`
5. Because `AstPublisher.execute()` threw `ExecuteException` in `runJekyll` at line 188 of `IncrementalBuildCli.java`, `p.exportAst(partial)` (line 190), `AstMerger.merge(...)` (line 193), and `Converged after ...` (line 203) were not reached, and `w7-round.sh` exited with status `1` at line 68 (`set -euo pipefail`) before reaching `== W8 full build` (line 73).

---

### Probe 1: `cql` (`$W/w7r2-cql.txt`)

- **`changing:` line:** `changing: input/cql/IMMZAgeConcepts.cql` (commit `4b428a7`)
- **Plan lines (`$W/w7/plan.json` from `AstPlanCli` without `-verify-incremental`):**
  ```
  decision: full  computed: incremental  coneFraction: 0.055
  seeds: 1  rebuild: 41  load: 95
    full because: incremental path not yet verified
    file: input/cql/IMMZAgeConcepts.cql RESOURCES 1 
  ```
- **Plan in `$W/w7/work/plan.json` (from `IncrementalBuildCli -verify-incremental`):**
  ```
  decision: incremental  computed: incremental  coneFraction: 0.055
  seeds: 1  rebuild: 41  load: 95
  fullBuildBecause: []
  guard: "guard bypassed by -verify-incremental: this output is for W7 verification against a full build (W8), never a base"
  ```
- **`Round N:` and `Converged` / `Did not converge` lines:**
  - `Round 1` ran in `/Users/litlfred/space_cats/ast-real-igs/w7/work/r1` (`rebuilding 41 (0 without a source), loading 95 from cache`; line scrolled past `| tail -80`).
  - Did not reach `Converged` / `Did not converge` because `AstPublisher.execute()` failed in `PublisherGenerator.runJekyll` (`Liquid Exception: Could not locate the included file 'menu.xml'`).
- **Last 30 lines of the incremental build (`w7r2-cql.txt`):**
  ```
  Generate Spreadsheets                                                                                (00:00.392 / 02:07.737, 2Gb)
  Generate Summaries                                                                                   (00:00.000 / 02:07.737, 2Gb)
  Generating Summary Outputs                                                                           (00:00.000 / 02:07.737, 2Gb)
  DB Cumulative Time invested: 00:00:00.40
  Sending Usage Stats to Server                                                                        (00:06.836 / 02:14.574, 3Gb)
  ## Memory (MB): Use = 3429, Free = 478, Total = 3908, Max = 8192                                     (00:00.001 / 02:14.576, 3Gb)
  Reclaiming memory...                                                                                 (00:00.000 / 02:14.576, 3Gb)
  Generating combined package                                                                          (00:00.002 / 02:14.578, 3Gb)
  Error generating combined package: /Users/litlfred/space_cats/ast-real-igs/w7/work/r1/output/package.tgz (No such file or directory) (00:00.001 / 02:14.580, 3Gb)
  ## Memory (MB): Use = 1313, Free = 2594, Total = 3908, Max = 8192                                    (00:00.331 / 02:14.912, 1Gb)
  Run jekyll: jekyll build --destination "/Users/litlfred/space_cats/ast-real-igs/w7/work/r1/output" (in folder /Users/litlfred/space_cats/ast-real-igs/w7/work/r1/temp/pages) (00:00.007 / 02:14.920, 1Gb)
  Troubleshooting Note: usual cases for Jekyll to fail are:                                            (00:00.000 / 02:14.920, 1Gb)
  * A failure to produce a fragment that is already logged in the output above                         (00:00.000 / 02:14.920, 1Gb)
  * A reference to a manually edited file that hasn't been provided                                    (00:00.000 / 02:14.920, 1Gb)
  Jekyll: Source: /Users/litlfred/space_cats/ast-real-igs/w7/work/r1/temp/pages                        (00:00.312 / 02:15.233, 1Gb)
  Jekyll: Generating...                                                                                (00:00.000 / 02:15.233, 1Gb)
  Jekyll has failed. Complete output from running Jekyll:   Liquid Exception: Could not locate the included file 'menu.xml' in any of ["/Users/litlfred/space_cats/ast-real-igs/w7/work/r1/temp/pages/_includes"]. Ensure it exists in one of those directories and, if it is a symlink, does not point outside your  (00:00.353 / 02:15.587, 1Gb)
  Note: Check that Jekyll is installed correctly                                                       (00:00.000 / 02:15.587, 1Gb)
  Exception in thread "main" org.apache.commons.exec.ExecuteException: Process exited with an error: 1 (Exit value: 1)
  	at org.apache.commons.exec.DefaultExecutor.executeInternal(DefaultExecutor.java:404)
  	at org.apache.commons.exec.DefaultExecutor.execute(DefaultExecutor.java:166)
  	at org.apache.commons.exec.DefaultExecutor.execute(DefaultExecutor.java:153)
  	at org.hl7.fhir.igtools.publisher.PublisherGenerator.runJekyll(PublisherGenerator.java:4076)
  	at org.hl7.fhir.igtools.publisher.PublisherGenerator.runTool(PublisherGenerator.java:3963)
  	at org.hl7.fhir.igtools.publisher.PublisherGenerator.generate(PublisherGenerator.java:427)
  	at org.hl7.fhir.igtools.publisher.Publisher.createIg(Publisher.java:426)
  	at org.hl7.fhir.igtools.publisher.Publisher.execute(Publisher.java:226)
  	at org.hl7.fhir.igtools.ast.IncrementalBuildCli.incremental(IncrementalBuildCli.java:188)
  	at org.hl7.fhir.igtools.ast.IncrementalBuildCli.main(IncrementalBuildCli.java:129)
  ```
- **`w8 cql exit` line:** not reached (`w7-round.sh` exited with code `1` at line 68 after `IncrementalBuildCli` failed in `runJekyll`).

---

### Probe 2: `fml` (`$W/w7r2-fml.txt`)

- **`changing:` line:** `changing: input/maps/IMMZ.C4.LMToPatient.fml` (commit `d135380`)
- **Plan lines (`$W/w7-fml/plan.json` from `AstPlanCli` without `-verify-incremental`):**
  ```
  decision: full  computed: incremental  coneFraction: 0.003
  seeds: 1  rebuild: 2  load: 5
    full because: incremental path not yet verified
    file: input/maps/IMMZ.C4.LMToPatient.fml RESOURCES 1 
  ```
- **Plan in `$W/w7-fml/work/plan.json` (from `IncrementalBuildCli -verify-incremental`):**
  ```
  decision: incremental  computed: incremental  coneFraction: 0.003
  seeds: 1  rebuild: 2  load: 5
  fullBuildBecause: []
  guard: "guard bypassed by -verify-incremental: this output is for W7 verification against a full build (W8), never a base"
  ```
- **`Round N:` and `Converged` / `Did not converge` lines:**
  - `Round 1` ran in `/Users/litlfred/space_cats/ast-real-igs/w7-fml/work/r1` (`rebuilding 2 (0 without a source), loading 5 from cache`; line scrolled past `| tail -80`).
  - Did not reach `Converged` / `Did not converge` because `AstPublisher.execute()` failed in `PublisherGenerator.runJekyll` (`Liquid Exception: Could not locate the included file 'menu.xml'`).
- **Last 30 lines of the incremental build (`w7r2-fml.txt`):**
  ```
  Generate Spreadsheets                                                                                (00:00.076 / 01:33.427, 2Gb)
  Generate Summaries                                                                                   (00:00.000 / 01:33.427, 2Gb)
  Generating Summary Outputs                                                                           (00:00.000 / 01:33.427, 2Gb)
  DB Cumulative Time invested: 00:00:00.27
  Sending Usage Stats to Server                                                                        (00:06.708 / 01:40.136, 1Gb)
  ## Memory (MB): Use = 1638, Free = 2069, Total = 3708, Max = 8192                                    (00:00.001 / 01:40.137, 1Gb)
  Reclaiming memory...                                                                                 (00:00.000 / 01:40.137, 1Gb)
  Generating combined package                                                                          (00:00.000 / 01:40.138, 1Gb)
  Error generating combined package: /Users/litlfred/space_cats/ast-real-igs/w7-fml/work/r1/output/package.tgz (No such file or directory) (00:00.001 / 01:40.140, 1Gb)
  ## Memory (MB): Use = 1274, Free = 2433, Total = 3708, Max = 8192                                    (00:00.250 / 01:40.390, 1Gb)
  Run jekyll: jekyll build --destination "/Users/litlfred/space_cats/ast-real-igs/w7-fml/work/r1/output" (in folder /Users/litlfred/space_cats/ast-real-igs/w7-fml/work/r1/temp/pages) (00:00.003 / 01:40.394, 1Gb)
  Troubleshooting Note: usual cases for Jekyll to fail are:                                            (00:00.000 / 02:40.394, 1Gb)
  * A failure to produce a fragment that is already logged in the output above                         (00:00.000 / 01:40.394, 1Gb)
  * A reference to a manually edited file that hasn't been provided                                    (00:00.000 / 01:40.394, 1Gb)
  Jekyll: Source: /Users/litlfred/space_cats/ast-real-igs/w7-fml/work/r1/temp/pages                    (00:00.282 / 01:40.676, 1Gb)
  Jekyll: Generating...                                                                                (00:00.000 / 01:40.676, 1Gb)
  Jekyll has failed. Complete output from running Jekyll:   Liquid Exception: Could not locate the included file 'menu.xml' in any of ["/Users/litlfred/space_cats/ast-real-igs/w7-fml/work/r1/temp/pages/_includes"]. Ensure it exists in one of those directories and, if it is a symlink, does not point outside y (00:00.238 / 01:40.914, 1Gb)
  Note: Check that Jekyll is installed correctly                                                       (00:00.000 / 01:40.915, 1Gb)
  Exception in thread "main" org.apache.commons.exec.ExecuteException: Process exited with an error: 1 (Exit value: 1)
  	at org.apache.commons.exec.DefaultExecutor.executeInternal(DefaultExecutor.java:404)
  	at org.apache.commons.exec.DefaultExecutor.execute(DefaultExecutor.java:166)
  	at org.apache.commons.exec.DefaultExecutor.execute(DefaultExecutor.java:153)
  	at org.hl7.fhir.igtools.publisher.PublisherGenerator.runJekyll(PublisherGenerator.java:4076)
  	at org.hl7.fhir.igtools.publisher.PublisherGenerator.runTool(PublisherGenerator.java:3963)
  	at org.hl7.fhir.igtools.publisher.PublisherGenerator.generate(PublisherGenerator.java:427)
  	at org.hl7.fhir.igtools.publisher.Publisher.createIg(Publisher.java:426)
  	at org.hl7.fhir.igtools.publisher.Publisher.execute(Publisher.java:226)
  	at org.hl7.fhir.igtools.ast.IncrementalBuildCli.incremental(IncrementalBuildCli.java:188)
  	at org.hl7.fhir.igtools.ast.IncrementalBuildCli.main(IncrementalBuildCli.java:129)
  ```
- **`w8 fml exit` line:** not reached (`w7-round.sh` exited with code `1` at line 68 after `IncrementalBuildCli` failed in `runJekyll`).

## Log
- 2026-10-23T20:47:00+02:00 Claimed bean `folio-assistant-wv7r` (`status: in-progress`); starting Steps 1–5 on `~/space_cats/fhir-ig-publisher` (`claude/ast-export`) and `~/space_cats/ast-real-igs` (Antigravity).
- 2026-10-23T21:08:00+02:00 Completed Steps 1–4 at fork commit `140e494` (64 tests pass). Clean base built on `smart-immunizations` (`bd7fa726`, `base exit 0`, `0` `"differ from the committed revision"` warnings). Both `cql` and `fml` probes entered `IncrementalBuildCli.incremental` (`decision: incremental` in `$OUT/work/plan.json`, `cql` `rebuild: 41 load: 95`, `fml` `rebuild: 2 load: 5`) and failed in `PublisherGenerator.runJekyll` (`Liquid Exception: Could not locate the included file 'menu.xml'`). Last 40 lines of `w7r2-cql.txt` and `w7r2-fml.txt` recorded below; packaged `ast-results/w7r2.tgz` (20 MB) and pushed to `litlfred/fhir-ig-publisher` branch `ast-results/2026-10-23-w7r2` (`d195a788`) (Antigravity).

### Last 40 lines of `w7r2-cql.txt`
```
finish ips version                                                                                   (00:00.000 / 01:59.182, 1Gb)
comparisons done                                                                                     (00:00.000 / 01:59.182, 1Gb)
Checking for Bundles to sign                                                                         (00:00.006 / 01:59.189, 1Gb)
Validating Resources                                                                                 (00:00.000 / 01:59.189, 1Gb)
Processing Provenance Records                                                                        (00:00.002 / 01:59.191, 1Gb)
Generating Outputs in /Users/litlfred/space_cats/ast-real-igs/w7/work/r1/output                      (00:00.000 / 01:59.191, 1Gb)
Warning @ Unable to read the git branch: not a git repository (or any of the parent directories): .git
Warning @ Unable to read the git source: not a git repository (or any of the parent directories): .git
Generate Native Outputs                                                                              (00:00.174 / 01:59.366, 1Gb)
Run Template                                                                                         (00:02.246 / 02:01.612, 1Gb)
Generate HTML Outputs                                                                                (00:05.732 / 02:07.344, 1Gb)
Generate Spreadsheets                                                                                (00:00.392 / 02:07.737, 2Gb)
Generate Summaries                                                                                   (00:00.000 / 02:07.737, 2Gb)
Generating Summary Outputs                                                                           (00:00.000 / 02:07.737, 2Gb)
DB Cumulative Time invested: 00:00:00.40
Sending Usage Stats to Server                                                                        (00:06.836 / 02:14.574, 3Gb)
## Memory (MB): Use = 3429, Free = 478, Total = 3908, Max = 8192                                     (00:00.001 / 02:14.576, 3Gb)
Reclaiming memory...                                                                                 (00:00.000 / 02:14.576, 3Gb)
Generating combined package                                                                          (00:00.002 / 02:14.578, 3Gb)
Error generating combined package: /Users/litlfred/space_cats/ast-real-igs/w7/work/r1/output/package.tgz (No such file or directory) (00:00.001 / 02:14.580, 3Gb)
## Memory (MB): Use = 1313, Free = 2594, Total = 3908, Max = 8192                                    (00:00.331 / 02:14.912, 1Gb)
Run jekyll: jekyll build --destination "/Users/litlfred/space_cats/ast-real-igs/w7/work/r1/output" (in folder /Users/litlfred/space_cats/ast-real-igs/w7/work/r1/temp/pages) (00:00.007 / 02:14.920, 1Gb)
Troubleshooting Note: usual cases for Jekyll to fail are:                                            (00:00.000 / 02:14.920, 1Gb)
* A failure to produce a fragment that is already logged in the output above                         (00:00.000 / 02:14.920, 1Gb)
* A reference to a manually edited file that hasn't been provided                                    (00:00.000 / 02:14.920, 1Gb)
Jekyll: Source: /Users/litlfred/space_cats/ast-real-igs/w7/work/r1/temp/pages                        (00:00.312 / 02:15.233, 1Gb)
Jekyll: Generating...                                                                                (00:00.000 / 02:15.233, 1Gb)
Jekyll has failed. Complete output from running Jekyll:   Liquid Exception: Could not locate the included file 'menu.xml' in any of ["/Users/litlfred/space_cats/ast-real-igs/w7/work/r1/temp/pages/_includes"]. Ensure it exists in one of those directories and, if it is a symlink, does not point outside your  (00:00.353 / 02:15.587, 1Gb)
Note: Check that Jekyll is installed correctly                                                       (00:00.000 / 02:15.587, 1Gb)
Exception in thread "main" org.apache.commons.exec.ExecuteException: Process exited with an error: 1 (Exit value: 1)
	at org.apache.commons.exec.DefaultExecutor.executeInternal(DefaultExecutor.java:404)
	at org.apache.commons.exec.DefaultExecutor.execute(DefaultExecutor.java:166)
	at org.apache.commons.exec.DefaultExecutor.execute(DefaultExecutor.java:153)
	at org.hl7.fhir.igtools.publisher.PublisherGenerator.runJekyll(PublisherGenerator.java:4076)
	at org.hl7.fhir.igtools.publisher.PublisherGenerator.runTool(PublisherGenerator.java:3963)
	at org.hl7.fhir.igtools.publisher.PublisherGenerator.generate(PublisherGenerator.java:427)
	at org.hl7.fhir.igtools.publisher.Publisher.createIg(Publisher.java:426)
	at org.hl7.fhir.igtools.publisher.Publisher.execute(Publisher.java:226)
	at org.hl7.fhir.igtools.ast.IncrementalBuildCli.incremental(IncrementalBuildCli.java:188)
	at org.hl7.fhir.igtools.ast.IncrementalBuildCli.main(IncrementalBuildCli.java:129)
```

### Last 40 lines of `w7r2-fml.txt`
```
finish ips version                                                                                   (00:00.000 / 01:27.530, 2Gb)
comparisons done                                                                                     (00:00.000 / 01:27.530, 2Gb)
Checking for Bundles to sign                                                                         (00:00.001 / 01:27.531, 2Gb)
Validating Resources                                                                                 (00:00.000 / 01:27.531, 2Gb)
Processing Provenance Records                                                                        (00:00.000 / 01:27.531, 2Gb)
Generating Outputs in /Users/litlfred/space_cats/ast-real-igs/w7-fml/work/r1/output                  (00:00.000 / 01:27.532, 2Gb)
Warning @ Unable to read the git branch: not a git repository (or any of the parent directories): .git
Warning @ Unable to read the git source: not a git repository (or any of the parent directories): .git
Generate Native Outputs                                                                              (00:00.233 / 01:27.765, 2Gb)
Run Template                                                                                         (00:00.525 / 01:28.291, 2Gb)
Generate HTML Outputs                                                                                (00:05.060 / 01:33.351, 2Gb)
Generate Spreadsheets                                                                                (00:00.076 / 01:33.427, 2Gb)
Generate Summaries                                                                                   (00:00.000 / 01:33.427, 2Gb)
Generating Summary Outputs                                                                           (00:00.000 / 01:33.427, 2Gb)
DB Cumulative Time invested: 00:00:00.27
Sending Usage Stats to Server                                                                        (00:06.708 / 01:40.136, 1Gb)
## Memory (MB): Use = 1638, Free = 2069, Total = 3708, Max = 8192                                    (00:00.001 / 01:40.137, 1Gb)
Reclaiming memory...                                                                                 (00:00.000 / 01:40.137, 1Gb)
Generating combined package                                                                          (00:00.000 / 01:40.138, 1Gb)
Error generating combined package: /Users/litlfred/space_cats/ast-real-igs/w7-fml/work/r1/output/package.tgz (No such file or directory) (00:00.001 / 01:40.140, 1Gb)
## Memory (MB): Use = 1274, Free = 2433, Total = 3708, Max = 8192                                    (00:00.250 / 01:40.390, 1Gb)
Run jekyll: jekyll build --destination "/Users/litlfred/space_cats/ast-real-igs/w7-fml/work/r1/output" (in folder /Users/litlfred/space_cats/ast-real-igs/w7-fml/work/r1/temp/pages) (00:00.003 / 01:40.394, 1Gb)
Troubleshooting Note: usual cases for Jekyll to fail are:                                            (00:00.000 / 02:40.394, 1Gb)
* A failure to produce a fragment that is already logged in the output above                         (00:00.000 / 01:40.394, 1Gb)
* A reference to a manually edited file that hasn't been provided                                    (00:00.000 / 01:40.394, 1Gb)
Jekyll: Source: /Users/litlfred/space_cats/ast-real-igs/w7-fml/work/r1/temp/pages                    (00:00.282 / 01:40.676, 1Gb)
Jekyll: Generating...                                                                                (00:00.000 / 01:40.676, 1Gb)
Jekyll has failed. Complete output from running Jekyll:   Liquid Exception: Could not locate the included file 'menu.xml' in any of ["/Users/litlfred/space_cats/ast-real-igs/w7-fml/work/r1/temp/pages/_includes"]. Ensure it exists in one of those directories and, if it is a symlink, does not point outside y (00:00.238 / 01:40.914, 1Gb)
Note: Check that Jekyll is installed correctly                                                       (00:00.000 / 01:40.915, 1Gb)
Exception in thread "main" org.apache.commons.exec.ExecuteException: Process exited with an error: 1 (Exit value: 1)
	at org.apache.commons.exec.DefaultExecutor.executeInternal(DefaultExecutor.java:404)
	at org.apache.commons.exec.DefaultExecutor.execute(DefaultExecutor.java:166)
	at org.apache.commons.exec.DefaultExecutor.execute(DefaultExecutor.java:153)
	at org.hl7.fhir.igtools.publisher.PublisherGenerator.runJekyll(PublisherGenerator.java:4076)
	at org.hl7.fhir.igtools.publisher.PublisherGenerator.runTool(PublisherGenerator.java:3963)
	at org.hl7.fhir.igtools.publisher.PublisherGenerator.generate(PublisherGenerator.java:427)
	at org.hl7.fhir.igtools.publisher.Publisher.createIg(Publisher.java:426)
	at org.hl7.fhir.igtools.publisher.Publisher.execute(Publisher.java:226)
	at org.hl7.fhir.igtools.ast.IncrementalBuildCli.incremental(IncrementalBuildCli.java:188)
	at org.hl7.fhir.igtools.ast.IncrementalBuildCli.main(IncrementalBuildCli.java:129)
```
