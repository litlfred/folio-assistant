/**
 * Latent Semantic Indexing over a set of text units — the method node is
 * `methodologies/lsi.md`; this file is the platform's application of it.
 *
 * ## What it computes
 *
 * 1. A term × unit matrix `A`, weighted log-entropy (local `log(1 + tf)`,
 *    global `1 + Σ_j p_ij log p_ij / log n`), the weighting the LSI
 *    literature settled on for retrieval. `tfidf` is available for comparison.
 * 2. A rank-`k` truncated SVD `A ≈ U_k Σ_k V_kᵀ`, by the randomized range
 *    finder (Gaussian sketch, `q` power iterations with re-orthonormalisation)
 *    followed by an exact SVD of the small projected matrix. The sketch is
 *    seeded, so the same inputs produce the same index — a sidecar that
 *    changed on re-run with no input change would be unauditable.
 * 3. Unit coordinates `V_k Σ_k` and a folding-in map for queries,
 *    `q̂ = qᵀ U_k` compared by cosine against the unit coordinates.
 *
 * ## What it does NOT do, on purpose
 *
 * - **It never merges a latent score with a lexical match.** `graph-search.ts`
 *   refuses to rank because a made-up order hides that everything matched
 *   equally. A cosine in the latent space is a DEFINED quantity, not a made-up
 *   one, but it answers a different question ("close in co-occurrence
 *   structure") from "contains the words". Callers report it as its own
 *   provenance — `latent` — beside the lexical result, never folded into it.
 * - **It does not stem or lemmatise.** Stemming is language-specific and the
 *   corpus is multilingual by design (translations). LSI recovers much of what
 *   stemming would, because inflections co-occur; that is part of the method's
 *   claim, and stemming first would hide whether the claim held.
 * - **No model download.** Every step is linear algebra over the corpus
 *   itself — which is why it runs in a sandbox where huggingface.co is a 403
 *   (bean `p2en`).
 */

import { createHash } from "node:crypto";

// ─── Tokenisation ────────────────────────────────────────────────────────────

/** A deliberately short English function-word list. Frequency-based pruning
 *  (`maxDfShare`) removes the rest, and does so for any language. */
const STOP = new Set(
  (
    "a an and are as at be been being but by can could did do does for from had has have he her his how i if in into is it its " +
    "may might more most must no not of on or our shall should so such than that the their them then there these they this " +
    "those to up us was we were what when where which while who whom why will with would you your also any all each other " +
    "only one two three see e.g i.e etc via per within without between over under about after before"
  ).split(/\s+/),
);

/** Strip the markdown and front-matter a unit carries so that syntax does not
 *  become vocabulary (a `|` table rule co-occurs with everything). */
export function plainText(raw: string): string {
  return raw
    .replace(/^---\n[\s\S]*?\n---\n/, " ") // front matter
    .replace(/```[\s\S]*?```/g, " ") // fenced code
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → their text
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/<[^>]+>/g, " ");
}

export function tokenize(raw: string): string[] {
  const out: string[] = [];
  for (const m of plainText(raw).toLowerCase().matchAll(/\p{L}[\p{L}\p{N}'-]*\p{L}|\p{L}{2,}/gu)) {
    const t = m[0].replace(/'s$/, "");
    if (t.length < 3 || STOP.has(t)) continue;
    out.push(t);
  }
  return out;
}

// ─── Deterministic PRNG and small dense linear algebra ───────────────────────

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

/** Column-major dense matrix: `rows × cols`, element (i, j) at `j * rows + i`. */
export interface Dense {
  rows: number;
  cols: number;
  data: Float64Array;
}

export function dense(rows: number, cols: number): Dense {
  return { rows, cols, data: new Float64Array(rows * cols) };
}

/** Modified Gram–Schmidt, in place, twice for stability ("twice is enough"). */
export function orthonormalizeColumns(M: Dense): void {
  const { rows, cols, data } = M;
  for (let pass = 0; pass < 2; pass++) {
    for (let j = 0; j < cols; j++) {
      const oj = j * rows;
      for (let p = 0; p < j; p++) {
        const op = p * rows;
        let dot = 0;
        for (let i = 0; i < rows; i++) dot += data[op + i] * data[oj + i];
        for (let i = 0; i < rows; i++) data[oj + i] -= dot * data[op + i];
      }
      let norm = 0;
      for (let i = 0; i < rows; i++) norm += data[oj + i] * data[oj + i];
      norm = Math.sqrt(norm);
      if (norm < 1e-12) {
        for (let i = 0; i < rows; i++) data[oj + i] = 0;
      } else {
        for (let i = 0; i < rows; i++) data[oj + i] /= norm;
      }
    }
  }
}

/** Cyclic Jacobi eigendecomposition of a small symmetric matrix (row-major,
 *  `n × n`). Returns eigenvalues descending with eigenvectors as columns. */
export function symmetricEigen(S: Float64Array, n: number): { values: Float64Array; vectors: Float64Array } {
  const a = Float64Array.from(S);
  const v = new Float64Array(n * n);
  for (let i = 0; i < n; i++) v[i * n + i] = 1;
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p * n + q] ** 2;
    if (off < 1e-22) break;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        const apq = a[p * n + q];
        if (Math.abs(apq) < 1e-300) continue;
        const theta = (a[q * n + q] - a[p * n + p]) / (2 * apq);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < n; k++) {
          const akp = a[k * n + p];
          const akq = a[k * n + q];
          a[k * n + p] = c * akp - s * akq;
          a[k * n + q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = a[p * n + k];
          const aqk = a[q * n + k];
          a[p * n + k] = c * apk - s * aqk;
          a[q * n + k] = s * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = v[k * n + p];
          const vkq = v[k * n + q];
          v[k * n + p] = c * vkp - s * vkq;
          v[k * n + q] = s * vkp + c * vkq;
        }
      }
    }
  }
  const order = [...Array(n).keys()].sort((i, j) => a[j * n + j] - a[i * n + i]);
  const values = new Float64Array(n);
  const vectors = new Float64Array(n * n);
  order.forEach((src, dst) => {
    values[dst] = a[src * n + src];
    for (let k = 0; k < n; k++) vectors[k * n + dst] = v[k * n + src];
  });
  return { values, vectors };
}

// ─── Sparse term × unit matrix ───────────────────────────────────────────────

/** Compressed sparse columns: one column per unit. */
export interface Csc {
  rows: number; // terms
  cols: number; // units
  colPtr: Int32Array;
  rowIdx: Int32Array;
  vals: Float64Array;
}

/** Y = A · X  (A: m×n sparse, X: n×r dense) → m×r dense. */
export function spmm(A: Csc, X: Dense): Dense {
  const Y = dense(A.rows, X.cols);
  for (let r = 0; r < X.cols; r++) {
    const xo = r * X.rows;
    const yo = r * A.rows;
    for (let j = 0; j < A.cols; j++) {
      const xj = X.data[xo + j];
      if (xj === 0) continue;
      for (let p = A.colPtr[j]; p < A.colPtr[j + 1]; p++) Y.data[yo + A.rowIdx[p]] += A.vals[p] * xj;
    }
  }
  return Y;
}

/** Z = Aᵀ · Y  (A: m×n sparse, Y: m×r dense) → n×r dense. */
export function spmmT(A: Csc, Y: Dense): Dense {
  const Z = dense(A.cols, Y.cols);
  for (let r = 0; r < Y.cols; r++) {
    const yo = r * Y.rows;
    const zo = r * A.cols;
    for (let j = 0; j < A.cols; j++) {
      let s = 0;
      for (let p = A.colPtr[j]; p < A.colPtr[j + 1]; p++) s += A.vals[p] * Y.data[yo + A.rowIdx[p]];
      Z.data[zo + j] = s;
    }
  }
  return Z;
}

// ─── The index ───────────────────────────────────────────────────────────────

export interface LsiUnit {
  /** Stable id — a repo-relative path, a bean id, `pr:1234`. */
  id: string;
  text: string;
}

export interface LsiOptions {
  /** Requested rank. Capped at `min(terms, units) - 1`. Default 100 — the
   *  literature's working range for small collections is 50–300, and
   *  `k` is reported with the variance it retains so a reader can judge it. */
  k?: number;
  weighting?: "log-entropy" | "tfidf" | "raw";
  /** A term must occur in at least this many units to be kept. A term in one
   *  unit can create no co-occurrence and only adds a row. Default 2. */
  minDf?: number;
  /** Drop terms in more than this share of units. Default 0.5. */
  maxDfShare?: number;
  /** Power iterations for the randomized range finder. Default 4. */
  powerIterations?: number;
  seed?: number;
}

export interface LsiIndex {
  k: number;
  weighting: "log-entropy" | "tfidf" | "raw";
  terms: string[];
  unitIds: string[];
  /** Σ_k, descending. */
  singularValues: number[];
  /** Share of ‖A‖²_F retained by the rank-k approximation. */
  retained: number;
  /** m × k, row-major: term coordinates U_k. */
  U: Float64Array;
  /** n × k, row-major: unit coordinates V_k Σ_k. */
  unitCoords: Float64Array;
  /** Global term weights, for folding a query in with the same weighting. */
  globalWeight: Float64Array;
  /** sha256 over the options and the (id, text) of every unit. */
  fingerprint: string;
}

export function fingerprintUnits(units: LsiUnit[], opts: LsiOptions = {}): string {
  const h = createHash("sha256");
  h.update(JSON.stringify({ ...opts, v: 1 }));
  for (const u of [...units].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))) {
    h.update(u.id);
    h.update("\0");
    h.update(u.text);
    h.update("\0");
  }
  return h.digest("hex");
}

/** The weighted term × unit matrix both decompositions start from — LSI takes
 *  its SVD directly, correspondence analysis (`ca.ts`) takes the SVD of its
 *  standardised residuals. Shared so that "the same vocabulary, the same
 *  weighting" is true by construction when the two are compared. */
export interface TermMatrix {
  terms: string[];
  A: Csc;
  globalWeight: Float64Array;
  weighting: "log-entropy" | "tfidf" | "raw";
}

export function buildTermMatrix(units: LsiUnit[], opts: LsiOptions = {}): TermMatrix {
  const weighting = opts.weighting ?? "log-entropy";
  const minDf = opts.minDf ?? 2;
  const maxDfShare = opts.maxDfShare ?? 0.5;
  const n = units.length;
  if (n < 3) throw new Error(`needs at least 3 units, got ${n}`);

  // Term frequencies per unit, then document frequency.
  const tfs = units.map((u) => {
    const m = new Map<string, number>();
    for (const t of tokenize(u.text)) m.set(t, (m.get(t) ?? 0) + 1);
    return m;
  });
  const df = new Map<string, number>();
  for (const m of tfs) for (const t of m.keys()) df.set(t, (df.get(t) ?? 0) + 1);
  const maxDf = Math.max(minDf, Math.floor(maxDfShare * n));
  const terms = [...df.entries()]
    .filter(([, d]) => d >= minDf && d <= maxDf)
    .map(([t]) => t)
    .sort();
  const termIdx = new Map(terms.map((t, i) => [t, i]));
  const m = terms.length;
  if (m < 3) throw new Error(`kept only ${m} terms from ${n} units — the units share no vocabulary`);

  // Global weights.
  const globalWeight = new Float64Array(m);
  if (weighting === "raw") {
    // Deerwester et al. (1990) §5: "each cell indicates the frequency with
    // which each term occurs" — no weighting. Kept so the engine can be
    // checked against the paper's own worked example (lsi.test.ts).
    globalWeight.fill(1);
  } else if (weighting === "tfidf") {
    for (let i = 0; i < m; i++) globalWeight[i] = Math.log(n / df.get(terms[i])!);
  } else {
    const gf = new Float64Array(m);
    for (const tf of tfs) for (const [t, c] of tf) { const i = termIdx.get(t); if (i !== undefined) gf[i] += c; }
    const ent = new Float64Array(m);
    for (const tf of tfs)
      for (const [t, c] of tf) {
        const i = termIdx.get(t);
        if (i === undefined) continue;
        const p = c / gf[i];
        ent[i] += p * Math.log(p);
      }
    const logN = Math.log(n);
    for (let i = 0; i < m; i++) globalWeight[i] = 1 + ent[i] / logN;
  }

  // Assemble CSC.
  const colPtr = new Int32Array(n + 1);
  const rowIdx: number[] = [];
  const vals: number[] = [];
  tfs.forEach((tf, j) => {
    const entries = [...tf].map(([t, c]) => [termIdx.get(t), c] as const).filter((e): e is [number, number] => e[0] !== undefined);
    entries.sort((a, b) => a[0] - b[0]);
    for (const [i, c] of entries) {
      const local = weighting === "log-entropy" ? Math.log1p(c) : c;
      const w = local * globalWeight[i];
      if (w !== 0) { rowIdx.push(i); vals.push(w); }
    }
    colPtr[j + 1] = rowIdx.length;
  });
  const A: Csc = { rows: m, cols: n, colPtr, rowIdx: Int32Array.from(rowIdx), vals: Float64Array.from(vals) };
  return { terms, A, globalWeight, weighting };
}

export function buildLsi(units: LsiUnit[], opts: LsiOptions = {}): LsiIndex {
  const q = opts.powerIterations ?? 4;
  const { terms, A, globalWeight, weighting } = buildTermMatrix(units, opts);
  const m = A.rows;
  const n = A.cols;
  let frob2 = 0;
  for (const v of A.vals) frob2 += v * v;

  // Randomized range finder (Halko–Martinsson–Tropp), oversampled by 10.
  const k = Math.max(1, Math.min(opts.k ?? 100, Math.min(m, n) - 1));
  const r = Math.min(k + 10, Math.min(m, n));
  const rand = mulberry32(opts.seed ?? 1990);
  const Omega = dense(n, r);
  for (let i = 0; i < Omega.data.length; i++) Omega.data[i] = gaussian(rand);
  let Y = spmm(A, Omega);
  orthonormalizeColumns(Y);
  for (let it = 0; it < q; it++) {
    const Z = spmmT(A, Y);
    orthonormalizeColumns(Z);
    Y = spmm(A, Z);
    orthonormalizeColumns(Y);
  }
  // B = Qᵀ A (r × n); SVD of B via eigen of B Bᵀ (r × r).
  const Bt = spmmT(A, Y); // n × r, = Bᵀ
  const G = new Float64Array(r * r);
  for (let a = 0; a < r; a++)
    for (let b = a; b < r; b++) {
      let s = 0;
      const oa = a * n;
      const ob = b * n;
      for (let j = 0; j < n; j++) s += Bt.data[oa + j] * Bt.data[ob + j];
      G[a * r + b] = s;
      G[b * r + a] = s;
    }
  const { values, vectors } = symmetricEigen(G, r);

  const sigma = new Float64Array(k);
  for (let c = 0; c < k; c++) sigma[c] = Math.sqrt(Math.max(values[c], 0));
  // U_k = Q · W_k ; V_k Σ_k = Bᵀ W_k.
  const U = new Float64Array(m * k);
  for (let c = 0; c < k; c++)
    for (let a = 0; a < r; a++) {
      const w = vectors[a * r + c];
      if (w === 0) continue;
      const oa = a * m;
      for (let i = 0; i < m; i++) U[i * k + c] += Y.data[oa + i] * w;
    }
  const unitCoords = new Float64Array(n * k);
  for (let c = 0; c < k; c++)
    for (let a = 0; a < r; a++) {
      const w = vectors[a * r + c];
      if (w === 0) continue;
      const oa = a * n;
      for (let j = 0; j < n; j++) unitCoords[j * k + c] += Bt.data[oa + j] * w;
    }
  // Fix the sign of each dimension (an SVD is unique only up to sign) so that
  // the largest-magnitude term loading is positive — otherwise the committed
  // per-dimension summaries flip between runs on different hardware.
  for (let c = 0; c < k; c++) {
    let best = 0;
    for (let i = 0; i < m; i++) if (Math.abs(U[i * k + c]) > Math.abs(best)) best = U[i * k + c];
    if (best < 0) {
      for (let i = 0; i < m; i++) U[i * k + c] = -U[i * k + c];
      for (let j = 0; j < n; j++) unitCoords[j * k + c] = -unitCoords[j * k + c];
    }
  }
  let kept = 0;
  for (const s of sigma) kept += s * s;

  return {
    k,
    weighting,
    terms,
    unitIds: units.map((u) => u.id),
    singularValues: [...sigma],
    retained: frob2 > 0 ? kept / frob2 : 0,
    U,
    unitCoords,
    globalWeight,
    fingerprint: fingerprintUnits(units, opts),
  };
}

// ─── Queries ─────────────────────────────────────────────────────────────────

function cosine(a: Float64Array, ao: number, b: Float64Array, bo: number, k: number): number {
  let d = 0, na = 0, nb = 0;
  for (let c = 0; c < k; c++) {
    d += a[ao + c] * b[bo + c];
    na += a[ao + c] ** 2;
    nb += b[bo + c] ** 2;
  }
  return na && nb ? d / Math.sqrt(na * nb) : 0;
}

/** Fold arbitrary text into the latent space: `q̂ = qᵀ U_k`, weighted as the
 *  corpus was. Terms outside the vocabulary contribute nothing — and a query
 *  made only of such terms folds to the zero vector, which scores 0 against
 *  everything rather than pretending to a match. */
export function foldIn(index: LsiIndex, text: string): Float64Array {
  const termIdx = new Map(index.terms.map((t, i) => [t, i]));
  const tf = new Map<number, number>();
  for (const t of tokenize(text)) { const i = termIdx.get(t); if (i !== undefined) tf.set(i, (tf.get(i) ?? 0) + 1); }
  const out = new Float64Array(index.k);
  for (const [i, c] of tf) {
    const w = (index.weighting === "log-entropy" ? Math.log1p(c) : c) * index.globalWeight[i];
    for (let d = 0; d < index.k; d++) out[d] += w * index.U[i * index.k + d];
  }
  // Scale into the same frame as unit coordinates (V Σ = Aᵀ U).
  return out;
}

export interface LsiHit {
  id: string;
  cosine: number;
}

export function query(index: LsiIndex, text: string, top = 10): LsiHit[] {
  const q = foldIn(index, text);
  return rank(index, q, top);
}

export function rank(index: LsiIndex, q: Float64Array, top = 10, exclude?: Set<string>): LsiHit[] {
  const hits: LsiHit[] = [];
  for (let j = 0; j < index.unitIds.length; j++) {
    if (exclude?.has(index.unitIds[j])) continue;
    hits.push({ id: index.unitIds[j], cosine: cosine(q, 0, index.unitCoords, j * index.k, index.k) });
  }
  return hits.sort((a, b) => b.cosine - a.cosine || (a.id < b.id ? -1 : 1)).slice(0, top);
}

export function unitVector(index: LsiIndex, id: string): Float64Array | undefined {
  const j = index.unitIds.indexOf(id);
  if (j < 0) return undefined;
  return index.unitCoords.slice(j * index.k, (j + 1) * index.k);
}

/** Nearest neighbours of a unit, excluding itself. */
export function neighboursOf(index: LsiIndex, id: string, top = 5): LsiHit[] {
  const v = unitVector(index, id);
  return v ? rank(index, v, top, new Set([id])) : [];
}

/** Mean of several unit vectors, each first normalised so that a long unit
 *  does not dominate the centroid by length alone. */
export function centroid(index: LsiIndex, ids: string[]): Float64Array {
  const c = new Float64Array(index.k);
  for (const id of ids) {
    const v = unitVector(index, id);
    if (!v) continue;
    let norm = 0;
    for (const x of v) norm += x * x;
    norm = Math.sqrt(norm) || 1;
    for (let d = 0; d < index.k; d++) c[d] += v[d] / norm;
  }
  return c;
}

export function cosineVectors(a: Float64Array, b: Float64Array): number {
  return cosine(a, 0, b, 0, Math.min(a.length, b.length));
}

/** The highest-loading terms on each of the first `dims` dimensions — the
 *  human-readable face of a latent axis, and the part of an index a reviewer
 *  can actually judge. Positive and negative poles are listed separately
 *  because a dimension is a contrast, not a topic. */
export function dimensionSummaries(index: LsiIndex, dims = 10, perPole = 8): Array<{ dim: number; sigma: number; positive: string[]; negative: string[] }> {
  const out = [];
  for (let c = 0; c < Math.min(dims, index.k); c++) {
    const loads = index.terms.map((t, i) => [t, index.U[i * index.k + c]] as const);
    loads.sort((a, b) => b[1] - a[1]);
    out.push({
      dim: c + 1,
      sigma: Number(index.singularValues[c].toFixed(4)),
      positive: loads.slice(0, perPole).filter((l) => l[1] > 0).map((l) => l[0]),
      negative: loads.slice(-perPole).reverse().filter((l) => l[1] < 0).map((l) => l[0]),
    });
  }
  return out;
}
