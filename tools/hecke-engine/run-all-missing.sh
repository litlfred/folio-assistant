#!/bin/bash
# Run Rust engine for all missing certificates.
# Expected runtime: 5-30 min each for A=23-40.
# Run with: nohup bash run-all-missing.sh &

ENGINE="$(dirname "$0")/target/release/hecke-bigint"
OUTDIR="$(dirname "$0")"
cd "$OUTDIR/.."  # run from repo root so certs go to right place

for spec in "9 10" "11 12" "12 12" "13 14" "14 14" "15 16" "16 16" "17 18" "18 22" "19 20"; do
  Z=$(echo $spec | cut -d' ' -f1)
  N=$(echo $spec | cut -d' ' -f2)
  A=$((Z + N))
  CERT="tools/hecke-engine/certificate-${A}*.json"
  if ls $CERT 1>/dev/null 2>&1; then
    echo "SKIP: Z=$Z N=$N A=$A (cert exists)"
    continue
  fi
  echo "$(date): Starting Z=$Z N=$N A=$A..."
  "$ENGINE" $Z $N 500
  # Move cert to tools dir if generated in repo root
  mv certificate-*.json tools/hecke-engine/ 2>/dev/null
  echo "$(date): Done Z=$Z N=$N"
done

echo "$(date): All done."
