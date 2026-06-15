using Test
using HeckeEngine

const Q0 = 1.10998  # substrate q_0

@testset "HeckeEngine.jl smoke" begin
    @testset "version" begin
        v = version()
        @test !isempty(v)
    end

    @testset "markov_z positive" begin
        @test markov_z(Q0) > 0
    end

    @testset "hecke_h matches formula" begin
        h = hecke_h(Q0)
        @test isapprox(h, Q0 - 1 / Q0; atol = 1e-12)
    end

    @testset "trace_weights shape" begin
        # [1, z, z, z², z², z³] — NOT a probability distribution.
        w = trace_weights(Q0)
        @test length(w) == 6
        @test isapprox(w[1], 1.0; atol = 1e-12)
        z = markov_z(Q0)
        @test isapprox(w[2], z; atol = 1e-12)
        @test isapprox(w[6], z^3; atol = 1e-12)
    end

    @testset "gram_matrix is 6x6" begin
        G = gram_matrix(Q0)
        @test size(G) == (6, 6)
        for v in G
            @test isfinite(v)
        end
    end

    @testset "gram_det finite + non-zero" begin
        # Gram at q_0 is indefinite — det sign isn't constrained,
        # only its finiteness + non-degeneracy.
        d = gram_det(Q0)
        @test isfinite(d)
        @test abs(d) > 1e-30
    end

    # ── Phase B ──

    @testset "chi_lambda_braid: identity element on [3] returns 1.0" begin
        @test isapprox(chi_lambda_braid([3], Tuple{Int, Int}[], Q0),
                       1.0; atol = 1e-12)
    end

    @testset "chi_lambda_braid: empty partition returns 1.0" begin
        @test isapprox(chi_lambda_braid(Int[], [(1, 1)], Q0),
                       1.0; atol = 1e-12)
    end

    @testset "lr_coefficient: Pieri c^[2]_{[1],[1]} = 1" begin
        @test lr_coefficient([2], [1], [1]) == 1
    end

    @testset "lr_coefficient: size mismatch returns 0" begin
        @test lr_coefficient([3], [2], [2]) == 0
    end

    @testset "tr_m_atomic_mpfr: 3-strand single crossing returns z" begin
        # Single positive σ_1 on 3 strands at 20-dps. Markov-Ocneanu-Wenzl
        # trace of a single Hecke generator is z = 1/(q^{1/2}+q^{-1/2}),
        # so the string should start with "4.99…" at q_0 ≈ 1.10998.
        # n=3 chosen over n=2 because B_2 trips an upstream edge case
        # in tr_m_word_lq's recursion.
        s = tr_m_atomic_mpfr([(Int8(1), Int32(1))], 3, "1.10998", 20)
        @test !isempty(s)
        @test isa(s, String)
        @test startswith(s, "4.99")
    end
end
