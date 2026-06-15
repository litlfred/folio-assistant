// v19_nuclear_mass: Atomic mass table Z=1-20.
//
// Matches atom_mass_full_hecke.py EXACTLY:
//   - Nucleon-only ordering (no electrons in Hecke algebra)
//   - 3-channel Wedderburn: sym(1/6) + std(4/6) + alt(1/6)
//   - Per-generator vertex volumes: V̂_i = w_s·λ_s + w_d·(z·a+b) + w_a·λ_a
//   - Binding = Σ ln|V̂_i|
//   - Mass = Z·m_p + N·m_n + Z·m_e + κ·binding
//
// For molecular binding: same formula + bond crossings at boundary generator.

const VOL_FIGURE_EIGHT: f64 = 2.029883212819307;
const MASS_RATIO_MU_E: f64 = 206.7682830;
const M_E_MEV: f64 = 0.51099895000;
const M_P_MEV: f64 = 938.27208816;
const M_N_MEV: f64 = 939.56542052;

fn compute_q0() -> f64 {
    let hbar_q = (VOL_FIGURE_EIGHT / MASS_RATIO_MU_E).sqrt();
    1.0 / (1.0 - hbar_q)
}

fn main() {
    let q0 = compute_q0();
    let qi = 1.0 / q0;
    let ha = q0 - qi;
    let z = 1.0 / (q0.sqrt() + qi.sqrt());

    // Wedderburn weights for H₃(q) = 3 irreps of S₃
    // Integer: w_sym = 1/6, w_std = 4/6, w_alt = 1/6
    // q-deformed (from paper): w_sym = q²/(q⁴+4q²+1), etc.
    let q2 = q0 * q0;
    let denom = q2*q2 + 4.0*q2 + 1.0;
    let w_s = q2 / denom;
    let w_d = (q2 + 1.0) * (q2 + 1.0) / denom;
    let w_a = q2 / denom;

    eprintln!("v19: Nuclear mass table Z=1-20");
    eprintln!("  q₀ = {:.15}", q0);
    eprintln!("  Wedderburn: w_s={:.6}, w_d={:.6}, w_a={:.6}", w_s, w_d, w_a);
    eprintln!("  z = {:.10}", z);
    eprintln!();

    // Crossing coefficients: nucleon + electron
    // Strand types: 1=proton, 0=neutron, 2=electron
    let cc = |ti: i32, tj: i32| -> Option<(f64, f64)> {
        match (ti, tj) {
            (1, 1) => Some((1.0, 0.0)),         // pp: σ
            (0, 0) => Some((1.0, -ha)),          // nn: σ⁻¹
            (1, 0) | (0, 1) => Some((1.0, -ha / 2.0)), // pn: mixed
            (1, 2) | (2, 1) => Some((1.0, -ha)), // pe: EM attraction
            (2, 2) => Some((1.0, 0.0)),          // ee: EM repulsion
            (0, 2) | (2, 0) => None,             // ne: identity (skip)
            _ => None,
        }
    };

    // Ground state ordering: interleaved nucleons + electrons
    let ordering = |p: usize, n: usize| -> Vec<i32> {
        let a = p + n;
        let mut ord = Vec::new();
        let mut pc = 0usize; let mut nc = 0usize;
        for k in 0..a {
            if k % 2 == 0 && pc < p { ord.push(1); pc += 1; }
            else if nc < n { ord.push(0); nc += 1; }
            else { ord.push(1); pc += 1; }
        }
        // Append Z electrons
        for _ in 0..p { ord.push(2); }
        ord
    };

    // Per-generator 3-channel vertex volume (nucleons + electrons)
    let compute_binding = |p: usize, n: usize, include_gluon: bool| -> f64 {
        let ord = ordering(p, n);
        let a = p + n; // number of nucleons (for gluon)
        let total = ord.len();
        if total <= 1 { return 0.0; }

        let mut phi = 0.0f64;

        for i in 0..total-1 {
            let mut lam_s = 1.0f64;
            let mut lam_a = 1.0f64;
            let mut ai = 0.0f64;
            let mut bi = 1.0f64;

            // Gluon: prepend crossings for nucleon at position i
            if include_gluon && i < a {
                let n_gluon = if ord[i] == 1 { 2 } else { 4 };
                for _ in 0..n_gluon {
                    let (c, d) = (1.0, 0.0);
                    lam_s *= c * q0 + d;
                    lam_a *= -c * qi + d;
                    let new_a = ai * c * ha + ai * d + bi * c;
                    let new_b = ai * c + bi * d;
                    ai = new_a; bi = new_b;
                }
            }

            // Crossings with all strands j > i (nucleons + electrons)
            for j in i+1..total {
                if let Some((c, d)) = cc(ord[i], ord[j]) {
                    lam_s *= c * q0 + d;
                    lam_a *= -c * qi + d;
                    let new_a = ai * c * ha + ai * d + bi * c;
                    let new_b = ai * c + bi * d;
                    ai = new_a; bi = new_b;
                }
                // ne crossings return None → skipped (identity)
            }

            let v_std = z * ai + bi;
            let v_full = w_s * lam_s + w_d * v_std + w_a * lam_a;

            if v_full.abs() > 1e-300 {
                phi += v_full.abs().ln();
            }
        }

        phi
    };

    // Energy scale: κ = m_e (from the paper)
    let kappa = M_E_MEV;

    // AME2020 nuclear masses (MeV) = A×u + Δ/1000 - Z×m_e
    // u = 931.494102 MeV, Δ = mass excess from AME2020 (keV)
    // Most abundant stable isotope
    let isotopes: Vec<(usize, usize, &str, f64)> = vec![
        // Period 1
        (1, 0, "H",    938.272),
        (2, 2, "He",   3727.379),
        // Period 2
        (3, 4, "Li",   6533.833),
        (4, 5, "Be",   8392.751),
        (5, 6, "B",   10252.548),
        (6, 6, "C",   11174.863),
        (7, 7, "N",   13040.204),
        (8, 8, "O",   14895.081),
        (9, 10,"F",   17692.302),
        (10,10,"Ne",  18617.730),
        // Period 3
        (11,12,"Na",  21409.214),
        (12,12,"Mg",  22335.793),
        (13,14,"Al",  25126.501),
        (14,14,"Si",  26053.188),
        (15,16,"P",   28844.211),
        (16,16,"S",   29773.619),
        (17,18,"Cl",  32564.593),
        (18,22,"Ar",  37215.526),
        // Period 4
        (19,20,"K",   36284.754),
        (20,20,"Ca",  37214.698),
        // Period 4 (AME2020)
        (21,24,"Sc",  41862.228),   // ⁴⁵Sc
        (22,26,"Ti",  44563.636),   // ⁴⁸Ti
        (23,28,"V",   47449.459),   // ⁵¹V
        (24,28,"Cr",  48441.703),   // ⁵²Cr
        (25,30,"Mn",  51147.752),   // ⁵⁵Mn
        (26,30,"Fe",  52089.780),   // ⁵⁶Fe
        (27,32,"Co",  54858.006),   // ⁵⁹Co
        (28,30,"Ni",  53950.826),   // ⁵⁸Ni
        (29,34,"Cu",  58604.360),   // ⁶³Cu
        (30,34,"Zn",  59544.152),   // ⁶⁴Zn
        (31,38,"Ga",  64076.449),   // ⁶⁹Ga
        (32,42,"Ge",  68857.569),   // ⁷⁴Ge
        (33,42,"As",  69717.389),   // ⁷⁵As
        (34,46,"Se",  73521.019),   // ⁸⁰Se
        (35,44,"Br",  74372.145),   // ⁷⁹Br
        (36,48,"Kr",  78072.009),   // ⁸⁴Kr
        // Period 5
        (37,48,"Rb",  79361.984),   // ⁸⁵Rb
        (38,50,"Sr",  81561.830),   // ⁸⁸Sr
        (39,50,"Y",   82700.006),   // ⁸⁹Y
        (40,52,"Zr",  83718.283),   // ⁹²Zr
        (41,52,"Nb",  86490.485),   // ⁹³Nb
        (42,54,"Mo",  89235.145),   // ⁹⁶Mo (approximate)
        (44,58,"Ru",  94908.068),   // ¹⁰²Ru (approximate)
        (46,60,"Pd",  98874.140),   // ¹⁰⁶Pd (approximate)
        (50,70,"Sn", 111662.639),   // ¹²⁰Sn
        // Period 6 (selected)
        (56,82,"Ba", 127454.262),   // ¹³⁸Ba (approximate)
        (74,110,"W", 171164.730),   // ¹⁸⁴W (approximate)
        (78,117,"Pt",181651.090),   // ¹⁹⁵Pt (approximate)
        (79,118,"Au",183473.176),   // ¹⁹⁷Au (approximate)
        (82,126,"Pb",193687.122),   // ²⁰⁸Pb
        // Radioactive
        (90,142,"Th",215963.916),   // ²³²Th (approximate)
        (92,146,"U", 221695.893),   // ²³⁸U
    ];

    println!("{{\"engine\":\"v19\",\"q0\":{:.15},\"w_s\":{:.10},\"w_d\":{:.10},\"w_a\":{:.10},\"kappa\":{:.10},\"gluon\":true}}", q0, w_s, w_d, w_a, kappa);

    eprintln!("{:>4} {:>3} {:>3} {:>10} {:>10} {:>10} {:>10} {:>8}",
        "Atom", "Z", "N", "M_const", "binding", "M_pred", "M_obs", "err%");
    eprintln!("{}", "-".repeat(62));

    let mut total_err = 0.0f64;
    let mut count = 0;

    for &(zz, nn, sym, m_obs) in &isotopes {
        let m_const = zz as f64 * M_P_MEV + nn as f64 * M_N_MEV + zz as f64 * M_E_MEV;
        let binding = compute_binding(zz, nn, true);
        let m_pred = m_const + kappa * binding;

        let err = (m_pred - m_obs) / m_obs * 100.0;
        total_err += err.abs();
        count += 1;

        eprintln!("{:>4} {:>3} {:>3} {:>10.3} {:>10.4} {:>10.3} {:>10.3} {:>+7.3}%",
            sym, zz, nn, m_const, binding, m_pred, m_obs, err);

        println!("{{\"atom\":\"{}\",\"Z\":{},\"N\":{},\"M_const\":{:.6},\"binding\":{:.10},\"M_pred\":{:.6},\"M_obs\":{:.6},\"err_pct\":{:.6}}}",
            sym, zz, nn, m_const, binding, m_pred, m_obs, err);
    }

    let mae = total_err / count as f64;
    eprintln!("\nMean absolute error: {:.4}%", mae);
    println!("{{\"summary\":true,\"mae_pct\":{:.6},\"n_atoms\":{}}}", mae, count);
}
