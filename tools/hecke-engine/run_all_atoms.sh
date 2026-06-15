#!/bin/bash
# Generate exact (no-strip) F_Pauli certificates for all target atoms
# Usage: ./run_all_atoms.sh [max_A]
# Pass threshold as env var: STRIP=0 (exact) or STRIP=200000 (default)

STRIP=${STRIP:-0}
MAX_A=${1:-20}
ENGINE="./target/release/hecke-modular"

echo "=== Hecke Modular Engine — Batch Certificate Generation ==="
echo "  Strip threshold: $STRIP (0 = exact, no mid-stripping)"
echo "  Max A: $MAX_A"
echo ""

# Target atoms: most abundant stable isotope per element Z=1-20
# Format: Z N  (A = Z + N)
ATOMS=(
  "1 0"    # H-1
  "2 2"    # He-4
  "3 4"    # Li-7
  "4 5"    # Be-9
  "5 6"    # B-11
  "6 6"    # C-12
  "7 7"    # N-14
  "8 8"    # O-16
  "9 10"   # F-19
  "10 10"  # Ne-20
  "11 12"  # Na-23
  "12 12"  # Mg-24
  "13 14"  # Al-27
  "14 14"  # Si-28
  "15 16"  # P-31
  "16 16"  # S-32
  "17 18"  # Cl-35
  "18 22"  # Ar-40
  "19 20"  # K-39
  "20 20"  # Ca-40
)

for entry in "${ATOMS[@]}"; do
  Z=$(echo $entry | cut -d' ' -f1)
  N=$(echo $entry | cut -d' ' -f2)
  A=$((Z + N))

  if [ $A -gt $MAX_A ]; then
    echo "  Skipping Z=$Z N=$N A=$A (exceeds max $MAX_A)"
    continue
  fi

  echo "--- Z=$Z N=$N A=$A ---"
  $ENGINE $Z $N $STRIP 2>&1
  echo ""
done

echo "=== Done ==="
