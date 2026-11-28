---
name: online-sequence-and-knot-databases
description: >-
  Mandatory online integer-sequence, knot/link-census, number-theory, and
  high-precision constant-recognition lookup protocol (OEIS JSON API, KnotInfo /
  LinkInfo / SnapPy / Regina, LMFDB, and >= 80 dps PSLQ) whenever computational
  or mathematical research encounters integer sequences, rational series
  coefficients, composite denominators, transcendental constants, or low-dimensional
  topological invariants.
user_invocable: true
satisfies:
  - "req:content-lifecycle#online-sequence-and-invariant-databases"
---

# Online sequence, knot-census, and number-theory database lookup

> Skill id: `online-sequence-and-knot-databases` · Package: `authoring-core`
> Processes: [`processes/content/evidence-gathering-and-provenance.bpmn`](../../../processes/content/evidence-gathering-and-provenance.bpmn) (`Process_EvidenceGatheringAndProvenance`), [`sdlc/processes/research-delegation-and-niche-routing.bpmn`](../../../sdlc/processes/research-delegation-and-niche-routing.bpmn) (`Process_ResearchDelegationAndNicheRouting`)

Whenever computational or mathematical research produces an integer sequence, a
tower of rational series coefficients, a recurring prime-factor denominator
pattern, an unrecognised high-precision constant, or a knot/link/manifold
invariant, **querying the canonical mathematical databases after rescaling to
natural geometric or algebraic units is mandatory before asserting novelty or
leaving opaque composite denominators in prose or formal declarations.**

## Why raw-form lookups miss published structure

Series coefficients extracted from perturbation expansions, saddle-point
asymptotics, or transfer matrices rarely appear in published catalogues in their
raw coordinate gauge:

1. **Unit-gauge obfuscation:** an expansion written in bare powers of $\pi$ or a
   coordinate step $h$ mixes transcendental curvature factors (such as powers of
   $\sqrt{3}$ or $2\pi$) into the rational prefactors, inflating denominators by
   extraneous prime powers that hide the intrinsic arithmetic.
2. **Cumulant vs partition-function duality:** literature catalogues frequently
   index the *exponential* generating series $\exp\!\bigl(\sum_{k \ge 1} c_k x^k\bigr) = \sum_{k \ge 0} A_k \frac{x^k}{k!}$
   while a saddle or free-energy calculation emits the *logged cumulants* $c_k$
   (or vice versa). Searching only one side misses the published entry completely.
3. **Machine-float PSLQ mirages:** running `pslq` or constant recognition at
   53-bit `float64` (~15 digits) produces spurious integer relations with
   three-digit coefficients on almost any four-element basis. Only `>= 80 dps`
   lattice reduction with held-out `>= 160 dps` verification separates genuine
   identities from coincidence.

---

## §1. OEIS protocol (`https://oeis.org/search?fmt=json&q=...`) — STRICT

Query the On-Line Encyclopedia of Integer Sequences via its JSON endpoint,
always following redirects (`curl -sL`):

```sh
curl -sL "https://oeis.org/search?fmt=json&q=1,11,697,724351,278392949"
```

### Mandatory five-transform canonicalization before concluding "not in OEIS"

Never query only the raw numerator or denominator list and stop. For any sequence
of rational coefficients $(r_k)_{k \ge 1}$, generate and query all five canonical
transforms (dropping leading $0$s/$1$s and signs where OEIS conventions vary):

1. **Natural geometric / 1-loop torsion unit rescaling ($r_k \mapsto z_k$):**
   divide out the intrinsic 1-loop Hessian, Reidemeister torsion, discriminant,
   or period unit $u$ so that $r_k u^{-k} = z_k \in \mathbb{Q}$ lies in the base
   rationals rather than a quadratic or cyclotomic extension.
2. **Factorial clearing ($k!\,z_k$ and $(2m)!\,z_{2m}$):** test exponential
   generating-function normalisation $k!\,z_k$, separate even and odd sub-towers
   $z_{2m}, z_{2m+1}$, and check whether $(2m)!\,z_{2m} \in \mathbb{Z}$.
3. **2-3 torsion / Dedekind $\eta$ denominator stripping ($24^k z_k$ or $D^k z_k$):**
   clear the universal 1-loop divisor ($24 = 2^3 \cdot 3$ from $\eta$-function /
   $B_2 = 1/6$ / Gaussian Wick contractions, or the minimal geometric integer
   $D$) and inspect both $\mathrm{num}(D^k z_k)$ and $\mathrm{den}(D^k z_k)$.
   Check residual prime factors against the **von Staudt–Clausen theorem**
   ($p \mid \mathrm{den}(B_{2k}) \iff (p - 1) \mid 2k$, introducing $5, 7, 11, 13, \dots$).
4. **Logged cumulants $\leftrightarrow$ unlogged exponential generating series:**
   always pass both directions through `sympy` before querying OEIS:
   - *Cumulants to moments:* $\sum_{k \ge 0} \frac{A_k}{B_k} \frac{v^k}{k!} = \exp\!\Bigl(\sum_{k \ge 1} z_k (D v)^k\Bigr)$;
   - *Moments to cumulants:* $\sum_{k \ge 1} c_k v^k = \ln\!\Bigl(1 + \sum_{k \ge 1} M_k \frac{v^k}{k!}\Bigr)$.
5. **Sub-sequences & first differences:** query even/odd slices separately and,
   for integer sequences, check consecutive ratios, prime factorizations, and
   binomial/Hankel transforms.

### Worked case study — Figure-eight knot $4_1$ asymptotic loop coefficients

In the all-orders Kashaev / state-integral saddle expansion of the figure-eight
knot $4_1$, the raw loop coefficients in powers of $\pi$ read

$$
\omega_1 = \frac{11\sqrt{3}\,\pi}{108},\quad
\omega_2 = \frac{2\,\pi^2}{27},\quad
\omega_3 = \frac{1081\sqrt{3}\,\pi^3}{21870},\quad
\omega_4 = \frac{98\,\pi^4}{729},\quad \dots
$$

with opaque composite denominators $108, 27, 21870, 729, 688905, 295245, 26572050, 18600435, 49718962755$.
Applying Transforms 1–4 exposes the complete arithmetic origin:

- **Transform 1 (1-loop Reidemeister-torsion unit $u = \frac{2\pi}{3\sqrt{3}}$):**
  writing $\omega_k = z_k u^k$ strips $(3\sqrt{3})^{-k}$ completely, collapsing
  the sequence into pure rationals
  $$
  z_1 = \frac{11}{24},\quad
  z_2 = \frac{1}{2},\quad
  z_3 = \frac{1081}{720},\quad
  z_4 = \frac{49}{8},\quad
  z_5 = \frac{110011}{3360},\quad
  z_6 = \frac{51973}{240},\quad
  z_7 = \frac{32729683}{19200},\quad
  z_8 = \frac{69709147}{4480},\quad
  z_9 = \frac{860118209659}{5322240}.
  $$
  Here $z_1 = \frac{11}{24}$ splits cleanly into the 1-loop Gaussian Feynman
  diagram sum $(-\frac{3}{4} + \frac{5}{6}) = \frac{2}{24}$ plus the discrete
  Euler–Maclaurin boundary/$B_2$ sum $(\frac{3}{2} - \frac{3}{8} - \frac{3}{4}) = \frac{9}{24}$.
- **Transform 2 (even-rung factorial integrality):** $(2m)!\,z_{2m} \in \mathbb{Z}$
  for every even rung ($1, 147, 155919, 627382323$ at $2m = 2, 4, 6, 8$), while
  $\mathrm{den}(k!\,z_k)$ is $3$-free for every $k \ge 2, k \neq 3$ (`1, 120, 1, 28, 1, 80, 1, 44`).
- **Transform 3 ($24^k$ denominator law & Bernoulli primes):** for all $k = 1\ldots 9$,
  $\mathrm{den}(24^k z_k) = (1, 1, 5, 1, 35, 5, 25, 35, 385)$ is **coprime to $6$**,
  carrying only von Staudt–Clausen Bernoulli primes $p \ge 5$ ($5, 7, 11$).
- **Transform 4 (unlogged exponential $\to$ exact OEIS hit):** expanding
  $\exp\!\bigl(\sum_{k=1}^{9} z_k (24 v)^k\bigr) = \sum_{k=0}^{9} \frac{A_k}{B_k} \frac{v^k}{k!}$
  yields
  - Numerators $A_k$: `1, 11, 697, 724351, 278392949, 244284791741, 1140363907117019, 212114205337147471, 367362844229968131557, 44921192873529779078383921` — **OEIS `A301732`**;
  - Denominators $B_k$: `1, 1, 1, 5, 5, 7, 35, 5, 5, 275` — **OEIS `A301733`**
  (Garoufalidis, *Quantum Topol.* / `arXiv:1201.3314`; Garoufalidis & Zagier 2023),
  with $697 - 11^2 = 576 = 24^2 \iff z_2 = \frac{1}{2}$.

---

## §2. Knot, link, and 3-manifold censuses (KnotInfo, LinkInfo, SnapPy, Regina)

Whenever research touches a knot, link, braid closure, or hyperbolic 3-manifold,
cross-check all topological, algebraic, and geometric invariants against
published censuses rather than hand-transcribing or guessing conventions:

| resource | canonical interface | invariants to cross-check |
|---|---|---|
| **KnotInfo & LinkInfo** | `https://knotinfo.math.indiana.edu/`, `https://linkinfo.sitehost.iu.edu/` (CSV/JSON tables & `database_knotinfo` Python package) | Crossing number, braid index & minimum braid word, Alexander / Jones / HOMFLY-PT / Kauffman polynomials (noting variable conventions!), signature, determinant, unknotting number, symmetry type (chiral, reversible, full/negative amphichiral) |
| **SnapPy censuses** | `snappy.Manifold("<name>")`, `OrientableCuspedCensus`, `LinkExteriors`, `HTLinkExteriors` (`>= 50-80 dps` `high_precision()` / `.tetrahedra_shapes('rect')`) | Complete hyperbolic volume, Chern–Simons invariant ($\bmod\,\pi^2$ / $\bmod\,\frac{1}{2}$), cusp shapes, Neumann–Zagier gluing matrices, Dehn surgery slopes, symmetry group, and canonical ideal triangulation |
| **Snap / SnapPy arithmetic invariants & Regina** | Snap trace-field tables, `regina` 3-manifold triangulation census | Invariant trace field $K = \mathbb{Q}(\mathrm{tr}\,\Gamma)$ (for example $\mathbb{Q}(\sqrt{-3})$ for $4_1$, cubic field of discriminant $-23$ for $5_2$), invariant quaternion algebra, Bloch–Wigner dilogarithm class in $\mathcal{B}(K)$, and cusp field |

**Convention check (`STRICT`):** always verify orientation, mirror convention
($K$ vs $\overline{K}$ flips $\mathrm{CS}(K)$ and $q \leftrightarrow q^{-1}$ in
Jones/HOMFLY-PT), and normalisation (unreduced vs unknot-normalised coloured
Jones) on $3_1$ and $4_1$ before ingesting or asserting an identity across a
table of knots.

---

## §3. LMFDB (`https://www.lmfdb.org/api/`) — number fields, $L$-values & modular forms

When exact arithmetic, trace fields, Galois parities, special $L$-values, or
$q$-series arise, query the L-functions and Modular Forms Database REST API:

```sh
# Example: query number fields of degree 2 and |disc| <= 12 in JSON format
curl -sL "https://www.lmfdb.org/api/nf_fields/?degree=2&_format=json&_limit=10"
```

Use LMFDB to verify and cite:

1. **Number fields (`nf_fields`):** discriminant, signature $(r_1, r_2)$, ring of
   integers, class number, fundamental units, regulator, and Galois group —
   keeping imaginary quadratic trace fields such as $\mathbb{Q}(\sqrt{-3})$
   (discriminant $-3$, Eisenstein units) cleanly separated from real quadratic
   sub-expressions $\mathbb{Q}(\sqrt{3})$ arising after factoring out $i = \sqrt{-1}$.
2. **Dirichlet characters & special $L$-values (`artin_representations`,
   `lfunc_lfunctions`):** conductor, parity, Gauss sums, and exact algebraic
   parts of $L(k, \chi)$ (for example $L(2, \chi_{-3}) = \frac{2}{3\sqrt{3}}\,\mathrm{Cl}_2(\pi/3)$
   and $L(2, \chi_{-4}) = G_{\mathrm{Catalan}}$).
3. **Modular, Jacobi & quantum modular forms (`mf_newforms`, ` mf_hecke_nf`):**
   $q$-expansion coefficients, weight, level, Nebentypus character, CM status,
   and Eichler–Shimura / Habiro completion data.
4. **Elliptic curves & higher-genus curves (`ec_curvedata`, `hgcwa_passports`):**
   conductor, isogeny class, $L$-series, automorphism group passports, and Prym /
   Jacobian isogeny decompositions.

---

## §4. High-precision constant recognition (`mpmath.pslq` / `identify` at `>= 80 dps`)

Whenever a numerical computation produces an unexplained real or complex
constant, asymptotic slope, Stokes multiplier, or subleading intercept:

1. **Precision floor (`>= 80 dps`, zero `float64`):** compute the target number
   at **`>= 80` decimal places** (never `float64`!). Set `mp.dps` explicitly
   before constructing any operand.
2. **Structured basis PSLQ (`mpmath.pslq`):** test integer linear relations
   against a domain-motivated transcendental basis — for example
   $\{1, \pi, \pi^2, \sqrt{3}\,\pi, \mathrm{Cl}_2(\pi/3), G_{\mathrm{Catalan}}, \zeta(3), \ln 2, \ln 3\}$
   or logarithmic/polylogarithmic periods of the relevant number field — requiring
   small integer coefficients ($\max |c_i| \ll 10^{\mathrm{dps}/4}$).
3. **Held-out doubling confirmation (`>= 160 dps`):** re-evaluate both sides of
   any candidate PSLQ relation at **double the working precision (`>= 160 dps`)**
   and require the residual to drop to `< 10^{-150}`. Any relation whose
   residual stalls near `10^{-75}` is a lattice-reduction artefact and MUST be
   discarded.
4. **Database cross-verification:** pass every recovered rational ratio $p/q$
   through §1 (OEIS + Bernoulli prime factorisation) and §3 (LMFDB $L$-value
   normalisation), then ingest the primary literature source via
   [`evidence-gathering-and-provenance`](evidence-gathering-and-provenance.md)
   and prove the algebraic skeleton formally where applicable.

---

## §5. Provenance & Knowledge Graph recording (`STRICT`)

Every hit or structured negative result from §§1–4 MUST leave a durable,
checkable record rather than staying in chat prose:

- **OEIS / LMFDB / KnotInfo / SnapPy identifiers:** record exact sequence IDs
  (`OEIS A301732`, `OEIS A301733`), LMFDB labels (`2.0.3.1`), and census names
  (`m004` / `4_1`, `L6a4`) in compute docstrings, `*.witness.json` metadata,
  block `authorNotes`, and formal Lean module docstrings (`-- Ref: [...]`).
- **Primary paper ingestion:** an OEIS or LMFDB entry almost always cites the
  paper that proved the formula; retrieve and ingest that primary paper into
  `references/` and `library/` via
  [`evidence-gathering-and-provenance`](evidence-gathering-and-provenance.md)
  so the theorem is cited to its proof as well as its catalogue ID.
- **Negative search log:** if all five OEIS transforms, KnotInfo/SnapPy tables,
  LMFDB queries, and `>= 80 dps` PSLQ bases return no match, record the exact
  transformed query strings and basis vectors tested in the work item or audit
  note so future sessions do not repeat the search.

## Checklist before closing a sequence, constant, or invariant investigation

- [ ] Rescaled raw coefficients into natural 1-loop torsion / geometric units before querying.
- [ ] Tested all five OEIS transforms (`curl -sL "https://oeis.org/search?fmt=json&q=..."`): raw, unit-rescaled, factorial-cleared $k!\,z_k$, $24^k$ / torsion-cleared, and both logged cumulants and unlogged $\exp(\sum c_k x^k)$.
- [ ] Checked denominator prime factorisations against von Staudt–Clausen Bernoulli primes and stripped extraneous $2, 3, \sqrt{d}$ gauge factors.
- [ ] Cross-checked knot/link/3-manifold invariants (volume, CS, polynomials, symmetry, trace field) against KnotInfo / LinkInfo / SnapPy / Regina with explicit orientation/mirror verification.
- [ ] Queried LMFDB (`https://www.lmfdb.org/api/`) for number fields, Dirichlet $L$-values, and modular/quantum-modular $q$-series where applicable.
- [ ] Ran `mpmath.pslq` / `identify` at `>= 80 dps` (`0` `float64`) and confirmed any candidate relation at held-out `>= 160 dps`.
- [ ] Recorded catalogue IDs (`OEIS Axxxxxx`, LMFDB labels, census IDs) and ingested the primary literature source via `evidence-gathering-and-provenance`.

## Related skills

- [`evidence-gathering-and-provenance`](evidence-gathering-and-provenance.md) — five-step topic shortlist, scholarly retrieval, KG ingestion, relevancy assessment, and authoring provenance.
- [`literature-search`](../../../library/skills/library-core/literature-search.md) — three-state open-access lookup and bibliographic retrieval.
- [`library-ingestion`](../../../library/skills/library-core/library-ingestion.md) — ingesting primary papers surfaced by OEIS, KnotInfo, or LMFDB into `library/`.
- [`scientific-accuracy`](scientific-accuracy.md) — precision, normalisation, and convention verification in authored prose.
