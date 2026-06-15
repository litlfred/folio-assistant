"""
HeckeEngine.jl — Julia bindings for `hecke-engine` via the
`hecke-engine-c` C ABI.

Tier-3 wrapper per workplan v2 §3.6 — sibling of `pyhecke-native`,
`hecke-engine-{node,wasm,jvm,r,c,octave}`. The Julia community
(Oscar, Nemo, AbstractAlgebra) is a natural consumer for an
Iwahori-Hecke H_3(q) Gram / Markov-trace surface.

Build:
    cd ../hecke-engine-c
    cargo build --release

The Julia side discovers the resulting `libhecke_engine_c.{so,dylib,dll}`
via the `HECKE_ENGINE_C_LIB` env var, falling back to the conventional
location `../hecke-engine-c/target/release/`.

Usage:
    using HeckeEngine
    q0 = 1.10998
    z  = markov_z(q0)
    G  = gram_matrix(q0)
    d  = gram_det(q0)
"""
module HeckeEngine

using Libdl

# ── Library discovery ──
const _LIB = let
    env = get(ENV, "HECKE_ENGINE_C_LIB", "")
    if !isempty(env)
        env
    else
        # Convention: tools/hecke-engine-julia and tools/hecke-engine-c
        # are siblings. Walk up to the workspace root.
        root = dirname(dirname(@__DIR__))
        for ext in (".so", ".dylib", ".dll")
            cand = joinpath(root, "hecke-engine-c", "target", "release",
                            "libhecke_engine_c$ext")
            if isfile(cand)
                @goto found
            end
        end
        error("""
            HeckeEngine: could not find libhecke_engine_c.{so,dylib,dll}.

            Expected location: tools/hecke-engine-c/target/release/.
            Build it with:    cd tools/hecke-engine-c && cargo build --release

            Or set the HECKE_ENGINE_C_LIB env var to an explicit path.
            """)
        @label found
        cand
    end
end

# ── Public API ──

"""Engine version (matches the underlying hecke-engine-c crate)."""
function version()::String
    ptr = ccall((:qou_hecke_version, _LIB), Ptr{Cchar}, ())
    unsafe_string(ptr)
end

"""Markov parameter z = 1 / (q^{1/2} + q^{-1/2})."""
markov_z(q::Float64)::Float64 = ccall((:qou_hecke_markov_z, _LIB), Float64, (Float64,), q)

"""Hecke relation coefficient h = q − q⁻¹."""
hecke_h(q::Float64)::Float64 = ccall((:qou_hecke_h, _LIB), Float64, (Float64,), q)

"""Markov-trace weights on the NF basis (length-6 vector)."""
function trace_weights(q::Float64)::Vector{Float64}
    out = Vector{Float64}(undef, 6)
    ccall((:qou_hecke_trace_weights, _LIB), Cvoid,
          (Float64, Ptr{Float64}), q, out)
    out
end

"""Gram matrix G_ij = tr_M(b_i · b_j), 6×6 Julia matrix."""
function gram_matrix(q::Float64)::Matrix{Float64}
    flat = Vector{Float64}(undef, 36)
    ccall((:qou_hecke_gram_matrix_flat, _LIB), Cvoid,
          (Float64, Ptr{Float64}), q, flat)
    # Rust emits row-major; Julia matrices are column-major →
    # reshape with row-major layout, then transpose.
    transpose(reshape(flat, 6, 6))
end

"""Gram determinant."""
gram_det(q::Float64)::Float64 = ccall((:qou_hecke_gram_det, _LIB), Float64, (Float64,), q)

# ── Phase B — full surface ──

"""
    chi_lambda_braid(shape, word, q) -> Float64

Hecke character χ_λ(β) of partition `shape` on braid word `word`
at substrate `q`.

* `shape` — `Vector{Int}` (weakly decreasing, non-negative).
  Empty vector returns 1.0 (trivial-character convention).
* `word`  — `Vector{Tuple{Int32, UInt32}}`, each pair `(gen, exp)`
  encoding a braid letter `σ_gen ^ exp`.
* `q`     — substrate parameter.
"""
function chi_lambda_braid(shape::AbstractVector{<:Integer},
                          word::AbstractVector{<:Tuple{<:Integer, <:Integer}},
                          q::Float64)::Float64
    shape_u = Csize_t.(shape)
    word_gens = Int32[Int32(w[1]) for w in word]
    word_exps = UInt32[UInt32(w[2]) for w in word]
    ccall((:qou_hecke_chi_lambda_braid, _LIB), Float64,
          (Ptr{Csize_t}, Csize_t,
           Ptr{Int32}, Ptr{UInt32}, Csize_t,
           Float64),
          shape_u, length(shape_u),
          word_gens, word_exps, length(word_gens),
          q)
end

"""
    lr_coefficient(lambda, mu, nu) -> Int64

Littlewood–Richardson coefficient `c^λ_{μν}`. Returns 0 when
`|λ| ≠ |μ| + |ν|` or `μ ⊄ λ`.
"""
function lr_coefficient(lambda::AbstractVector{<:Integer},
                        mu::AbstractVector{<:Integer},
                        nu::AbstractVector{<:Integer})::Int64
    lam_u = Csize_t.(lambda)
    mu_u  = Csize_t.(mu)
    nu_u  = Csize_t.(nu)
    ccall((:qou_hecke_lr_coefficient, _LIB), Int64,
          (Ptr{Csize_t}, Csize_t,
           Ptr{Csize_t}, Csize_t,
           Ptr{Csize_t}, Csize_t),
          lam_u, length(lam_u),
          mu_u,  length(mu_u),
          nu_u,  length(nu_u))
end

"""
    tr_m_atomic_mpfr(word, n_strands, q_str, dps) -> String

Arbitrary-precision Markov trace `tr_M(β)` at q (passed as decimal
string for parser-level precision). Returns the decimal-string
representation of the value at `dps` digits of precision.

* `word`      — `Vector{Tuple{Int8, Int32}}`, each pair `(sign, gen)`
  with `sign ∈ {-1, +1}` and `gen` a 1-based generator index.
* `n_strands` — `n` in `B_n`.
* `q_str`     — `String` decimal representation of `q`.
* `dps`       — `Integer` number of decimal digits of precision.

Throws `ErrorException` if the underlying engine reports an error.
"""
function tr_m_atomic_mpfr(word::AbstractVector{<:Tuple{<:Integer, <:Integer}},
                          n_strands::Integer,
                          q_str::AbstractString,
                          dps::Integer)::String
    word_signs = Int8[Int8(w[1]) for w in word]
    word_gens  = Int32[Int32(w[2]) for w in word]
    # Buffer sized for dps digits + sign + exponent + NUL; grow on
    # truncation (status == 2).
    buf_len = Int(dps) + 64
    buf = Vector{Cchar}(undef, buf_len)
    function call_engine(b)
        ccall((:qou_hecke_tr_m_atomic_mpfr, _LIB), Cint,
              (Ptr{Int8}, Ptr{Int32}, Csize_t,
               Csize_t,
               Cstring, UInt32,
               Ptr{Cchar}, Csize_t),
              word_signs, word_gens, length(word_signs),
              Csize_t(n_strands),
              q_str, UInt32(dps),
              b, length(b))
    end
    status = call_engine(buf)
    if status == 2
        # Truncated; retry with 4x buffer.
        buf = Vector{Cchar}(undef, buf_len * 4)
        status = call_engine(buf)
    end
    s = unsafe_string(Ptr{Cchar}(pointer(buf)))
    if status == 0
        return s
    end
    error("tr_m_atomic_mpfr: status=$status — $s")
end

export version, markov_z, hecke_h, trace_weights, gram_matrix, gram_det,
       chi_lambda_braid, lr_coefficient, tr_m_atomic_mpfr

end # module
