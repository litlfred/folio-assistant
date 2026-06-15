#!/bin/bash
# Run the Hecke engine for all nuclei up to a given A_max.
# Usage: ./run-overnight.sh [A_max]
# Default A_max = 12 (takes hours for A >= 9)

set -e
cd "$(dirname "$0")"

A_MAX=${1:-12}
ENGINE="./target/release/hecke-engine"

# Build if needed
cargo build --release 2>&1

echo "Hecke engine overnight run"
echo "A_max = $A_MAX"
echo "Started: $(date -u)"
echo "=========================="

OUTFILE="overnight-results-$(date +%Y%m%d-%H%M%S).json"
echo "[" > "$OUTFILE"
FIRST=true

for Z in $(seq 1 $((A_MAX / 2 + 1))); do
    N_MIN=$((Z > 1 ? Z - 1 : 1))
    N_MAX=$((Z + 2))

    for N in $(seq $N_MIN $N_MAX); do
        A=$((Z + N))
        if [ $A -lt 2 ] || [ $A -gt $A_MAX ]; then
            continue
        fi

        echo -n "N($Z,$N) A=$A ... "
        START=$(date +%s)

        RESULT=$($ENGINE nucleus $Z $N 2>&1 || echo "TIMEOUT/ERROR")

        END=$(date +%s)
        ELAPSED=$((END - START))
        echo "$RESULT" | head -1
        echo "  (wall: ${ELAPSED}s)"

        # Append to JSON
        if [ "$FIRST" = true ]; then
            FIRST=false
        else
            echo "," >> "$OUTFILE"
        fi
        # Extract the JSON block (everything between { and })
        echo "$RESULT" | sed -n '/^{/,/^}/p' >> "$OUTFILE" 2>/dev/null || \
            echo "{\"z\":$Z,\"n\":$N,\"error\":\"$RESULT\"}" >> "$OUTFILE"
    done
done

echo "]" >> "$OUTFILE"
echo ""
echo "=========================="
echo "Finished: $(date -u)"
echo "Results: $OUTFILE"
