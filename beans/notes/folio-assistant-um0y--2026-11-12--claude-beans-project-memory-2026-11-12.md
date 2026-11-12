# um0y addendum: merge manager helper scripts (2026-11-12)

Copied from the merge manager's scratchpad so a new merge manager can recreate them. Usage: `source m.sh; source lk.sh; m <repo> <n>` merges a PR on full-tier green (labels `release` + marks ready first). `lk <repo> <n>` prints the only-red checks and new failures. Sweep: `sort -u tapped.txt | grep -vxFf hold-repin.txt > t2; while read r n; do m $r $n | tail -1; done < t2`.

## m.sh

````
# Full-tier rule (owner card 2026-11-11 10:39Z, B): never merge a draft; mark ready, wait for the full tier on the PR.
m(){ r=$1; n=$2; info=$(gh api repos/litlfred/$r/pulls/$n --jq '"\(.state) \(.merged) \(.mergeable_state) \(.head.sha) \(.base.ref) \(.draft)"' 2>&1); set -- $info; st=$1; mg=$2; ms=$3; sha=$4; base=$5; dr=$6
 if [ "$mg" = true ]; then echo "$r#$n already merged"; return; fi
 if [ "$st" != open ]; then echo "$r#$n $st"; return; fi
 if [ "$dr" = true ]; then gh api -X POST repos/litlfred/$r/issues/$n/labels -f 'labels[]=release' >/dev/null 2>&1; gh api -X POST repos/litlfred/$r/pulls/$n/ccr/ready_for_review >/dev/null 2>&1; echo "$r#$n ${sha:0:8} marked READY; waiting for full tier"; return; fi
 runs=$(gh api "repos/litlfred/$r/commits/$sha/check-runs?per_page=100" --jq '.check_runs')
 bad=$(echo "$runs" | jq -r '[.[]|select(.conclusion!="success" and .conclusion!="skipped" and .conclusion!="neutral")|"\(.name):\(.conclusion // .status)"]|join(", ")')
 if [ -n "$bad" ]; then echo "$r#$n NOT GREEN ($ms base=$base): $bad" | cut -c1-300; return; fi
 # full tier must have actually run: a shard job (tests and gates, shard) must be success, not skipped
 full=$(echo "$runs" | jq -r '[.[]|select((.name|test("[0-9]/[0-9]")) and .conclusion=="success")]|length')
 hasfull=$(echo "$runs" | jq -r '[.[]|select(.name|test("shard|[0-9]/[0-9]";"i"))]|length')
 if [ "$hasfull" -gt 0 ] && [ "$full" -eq 0 ]; then gh api -X POST repos/litlfred/$r/issues/$n/labels -f 'labels[]=release' >/dev/null 2>&1; rid=$(gh api "repos/litlfred/$r/actions/runs?head_sha=$sha&event=pull_request&per_page=20" --jq '[.workflow_runs[]|select(.name=="PR checks" or .name=="Harness PR checks")][0].id'); beh=$(gh api repos/litlfred/$r/compare/main...$sha --jq .behind_by); if [ "${beh:-0}" -gt 0 ]; then gh api -X PUT repos/litlfred/$r/pulls/$n/update-branch >/dev/null 2>&1; how="update-branch (behind $beh)"; else how="NOT re-run (inspect shards of run $rid by hand)"; fi; echo "$r#$n ${sha:0:8} full tier not run: labelled release + $how"; return; fi
 echo "$r#$n ${sha:0:8} $(gh api -X PUT repos/litlfred/$r/pulls/$n/merge -f merge_method=merge -f sha=$sha --jq .message 2>&1 | head -c 200)"; }
````

## lk.sh

````
# lk repo n : report whether a PR's only red is lock:coherence (Q-LOCK-1 A)
lk(){ r=$1; n=$2; sha=$(gh api repos/litlfred/$r/pulls/$n -q .head.sha); 
 runs=$(gh api "repos/litlfred/$r/commits/$sha/check-runs?per_page=100" -q '.check_runs|group_by(.name)|map(max_by(.started_at))|.[]|"\(.id)\t\(.name)\t\(.conclusion // .status)"');
 other=$(echo "$runs" | awk -F'\t' '$3!="success" && $3!="skipped" && $3!="neutral" && $2!~/No new failures/ {print $2"="$3}' | grep -v '\${{' );
 nn=$(echo "$runs" | awk -F'\t' '$2=="checks / No new failures (tests and gates)" || $2=="Tests (no new failures)" {print $1"\t"$3}' | head -1);
 nid=${nn%%	*}; nst=${nn##*	};
 newg=""; [ "$nst" = failure ] && newg=$(gh api repos/litlfred/$r/actions/jobs/$nid/logs | grep -E '\| (NEW FAILURE|failing on main too, and NEW)' | grep -oE '`[^`]+`' | tr '\n' ' ');
 newt=""; [ "$nst" = failure ] && newt=$(gh api repos/litlfred/$r/actions/jobs/$nid/logs | grep -oE '\*\*New failures: [0-9]+' | head -1);
 echo "$r#$n ${sha:0:8} nnf=$nst other=[${other//$'\n'/ }] newgates=[$newg] $newt"; }
````

## render-watch.sh

````
#!/bin/bash
# Render watch: flag site repos whose main is >2h ahead of gh-pages, or whose latest main publish/main-qa run failed.
now=$(date -u +%s)
REPOS="smart-trust smart-trust-demo who-iris smart-ips-pilgrimage dth-hrh dth-pc dth-sc dth-phc dpi-h smart-base smart-fp smart-anc smart-immunizations smart-immunizations-uganda smart-trust-phw smart-ra sci fhir-harness folio-assistant cat-harness folio-assistant-core cat-harness-tools bootstrap guideline-portfolio vaxlink"
NOSITE=" fhir-harness bootstrap dth-pc "  # gh-pages = namespace context only / no scaffold (rollout thread 20:06Z 11-11)
for r in $REPOS; do
  p=$(gh api repos/litlfred/$r/commits/gh-pages -q .commit.committer.date 2>/dev/null) || continue
  [ -z "$p" ] && continue
  m=$(gh api repos/litlfred/$r/commits/main -q .commit.committer.date 2>/dev/null) || continue
  ps=$(date -ud "$p" +%s); ms=$(date -ud "$m" +%s)
  lag=$(( (ms-ps)/3600 )); age=$(( (now-ms)/3600 ))
  flag=""
  if [[ "$NOSITE" != *" $r "* ]] && [ $ms -gt $ps ] && [ $(( now-ms )) -gt 7200 ]; then flag="STALE main ${m} > pages ${p} (${lag}h)"; fi
  bad=$(gh api "repos/litlfred/$r/actions/runs?branch=main&per_page=30" -q '[.workflow_runs[]|select(.event=="push" and .status=="completed" and .conclusion!="cancelled" and .conclusion!="skipped")]|group_by(.name)|map(max_by(.created_at))|.[]|select(.conclusion!="success")|"\(.name)@\(.head_sha[:8])"' 2>/dev/null | tr '\n' ' ')
  [ -n "$flag$bad" ] && echo "$r | ${flag:-pages ok} | red: ${bad:-none}"
done
````

## tapped.txt

````
cat-harness 1248
cat-harness-tools 1905
cat-harness-tools 1907
cat-harness-tools 1909
cat-harness-tools 1916
cat-harness-tools 1922
dth-hrh 109
dth-hrh 114
dth-hrh 116
dth-pc 14
dth-phc 31
fhir-harness 377
fhir-harness 381
fhir-harness 384
folio-assistant 3075
folio-assistant 3080
folio-assistant 3083
folio-assistant-core 749
smart-base 346
smart-base 347
smart-base 349
smart-immunizations 136
smart-immunizations-uganda 27
smart-ips-pilgrimage 66
smart-ra 151
smart-ra 152
smart-ra 154
smart-ra 156
smart-ra 158
smart-ra 185
smart-ra 189
smart-ra 190
smart-ra 191
smart-ra 192
smart-ra 193
smart-ra 194
smart-ra 195
smart-ra 196
smart-ra 197
smart-ra 241
smart-ra 97
smart-trust 198
smart-trust-phw 60
who-iris 239
who-iris 243
who-iris 245
who-iris 247
cat-harness-tools 1924
cat-harness-tools 1926
smart-ips-pilgrimage 68
who-iris 251
smart-trust-phw 61
who-iris 249
smart-ra 183
smart-ra 204
smart-ra 199
smart-ra 203
smart-ra 221
smart-ra 218
smart-ra 236
dth-hrh 69
dth-hrh 70
dth-sc 5
dth-sc 4
dth-sc 24
dth-sc 15
dth-phc 4
dth-phc 11
cat-harness-tools 1928
cat-harness 1258
cat-harness-tools 1921
smart-trust-demo 128
folio-assistant-core 760
cat-harness-tools 1930
fhir-harness 390
cat-harness-tools 1932
cat-harness-tools 1933
cat-harness-tools 1934
cat-harness-tools 1935
cat-harness 1259
folio-assistant 3086
fhir-harness 392
dth-hrh 118
dth-hrh 85
cat-harness 1260
cat-harness 1261
cat-harness-tools 1936
dth-hrh 119
cat-harness-tools 1937
cat-harness-tools 1938
cat-harness-tools 1940
folio-assistant-core 761
smart-trust-demo 130
cat-harness-tools 1941
smart-trust-demo 131
cat-harness-tools 1943
cat-harness-tools 1945
cat-harness-tools 1926
cat-harness-tools 1941
cat-harness-tools 1947
cat-harness-tools 1952
````

## hold-repin.txt

````
dth-hrh 114
smart-base 347
fhir-harness 381
cat-harness-tools 1905
smart-trust-phw 61
cat-harness 1259
````
