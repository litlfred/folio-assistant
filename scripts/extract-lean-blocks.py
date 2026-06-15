#!/usr/bin/env python3
"""Extract Lean declarations from monolithic files into per-content-block .lean files.

Reads content/quantum-observable-universe/lean/ source files, maps declarations to content blocks,
and writes individual .lean files alongside their .ts/.md siblings.
"""

import re
import os
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

# Declaration start patterns
DECL_RE = re.compile(
    r'^(noncomputable\s+)?(structure|def|theorem|lemma|instance|class|abbrev)\s+'
)
SECTION_COMMENT_RE = re.compile(r'^/-!.*-/')
BLOCK_COMMENT_START = re.compile(r'^/-')
NAMESPACE_RE = re.compile(r'^(namespace|end)\s+')

# Shared imports header for ch1 files (from QuantumObservableUniverse.lean)
CH1_IMPORTS = """\
import QOU.Basic
import QOU.Glossary
import Mathlib.CategoryTheory.Monoidal.Basic
import Mathlib.CategoryTheory.Functor.Basic
import Mathlib.CategoryTheory.NatTrans
import Mathlib.Algebra.Group.Basic
import Mathlib.Algebra.Ring.Basic
import Mathlib.Algebra.Order.Field.Basic
import Mathlib.Data.Real.Basic
import Mathlib.Analysis.SpecialFunctions.Pow.Real
import Mathlib.Topology.Basic
import Mathlib.Topology.ContinuousFunction.Basic
import Mathlib.Geometry.Manifold.SmoothManifoldWithCorners
import Mathlib.Analysis.InnerProductSpace.Basic
import Mathlib.LinearAlgebra.ExteriorAlgebra.Basic

open scoped Topology Manifold CategoryTheory CategoryTheory.MonoidalCategory
"""


def parse_declarations(filepath):
    """Parse a Lean file into a list of (name, start_line, end_line, text) tuples.

    Each declaration includes its preceding doc comment.
    """
    lines = filepath.read_text().split('\n')
    declarations = []

    i = 0
    while i < len(lines):
        line = lines[i]

        # Check if this line starts a declaration
        m = DECL_RE.match(line)
        if m:
            # Find the declaration name (after keyword)
            keyword = m.group(2)
            rest = line[m.end():].strip()
            # Name is the first token (possibly with dots, braces, etc.)
            name_match = re.match(r'([\w.]+)', rest)
            if name_match:
                decl_name = name_match.group(1)
            else:
                decl_name = f"unnamed_{i}"

            # Look backwards for doc comment
            doc_start = i
            j = i - 1
            while j >= 0 and lines[j].strip() == '':
                j -= 1
            if j >= 0:
                # Check if there's a doc comment or -- Ref: comment above
                # Walk back through comment block
                comment_end = j
                if lines[j].strip().endswith('-/') or lines[j].strip().startswith('--'):
                    # Find start of comment block
                    while j >= 0:
                        if lines[j].strip().startswith('/--') or lines[j].strip().startswith('/-'):
                            doc_start = j
                            break
                        if lines[j].strip().startswith('-- Ref:'):
                            doc_start = j
                            break
                        if lines[j].strip().startswith('--') and j > 0 and not lines[j-1].strip().startswith('--') and not lines[j-1].strip().endswith('-/'):
                            doc_start = j
                            break
                        j -= 1

            # Find end of declaration
            # Track brace/where depth
            decl_end = i
            in_where = False
            brace_depth = 0

            for k in range(i, len(lines)):
                line_k = lines[k].strip()
                brace_depth += line_k.count('{') - line_k.count('}')

                if 'where' in line_k:
                    in_where = True

                # Check if next line starts a new top-level declaration or section
                if k > i:
                    next_line = lines[k].strip() if k < len(lines) else ''
                    # A new declaration at column 0
                    if k + 1 < len(lines):
                        next_next = lines[k + 1] if k + 1 < len(lines) else ''
                        if (DECL_RE.match(lines[k + 1]) or
                            (lines[k + 1].strip().startswith('/-') and not lines[k + 1].strip().startswith('/- ')) or
                            lines[k + 1].strip().startswith('end ') or
                            (SECTION_COMMENT_RE.match(lines[k + 1].strip())) or
                            (lines[k + 1].strip().startswith('/-!') )):
                            decl_end = k
                            break

                decl_end = k

            # Extract text
            text = '\n'.join(lines[doc_start:decl_end + 1]).rstrip()
            declarations.append((decl_name, doc_start + 1, decl_end + 1, text))
            i = decl_end + 1
        else:
            i += 1

    return declarations


def find_declaration_block(filepath, target_names):
    """Find a contiguous block of Lean code for given declaration names.

    Returns the extracted text for each target name.
    """
    lines = filepath.read_text().split('\n')
    results = {}

    for target in target_names:
        # Strip QOU. prefix for matching
        short_name = target.replace('QOU.', '')

        # Find the declaration line
        decl_line = None
        doc_start = None

        for i, line in enumerate(lines):
            # Match declaration
            if re.match(rf'^(noncomputable\s+)?(structure|def|theorem|lemma|instance|class|abbrev)\s+{re.escape(short_name)}[\s({{:]', line):
                decl_line = i
                break
            # Also match with full path
            if re.match(rf'^(noncomputable\s+)?(structure|def|theorem|lemma|instance|class|abbrev)\s+{re.escape(target)}[\s({{:]', line):
                decl_line = i
                break

        if decl_line is None:
            print(f"  WARNING: Could not find declaration '{target}' in {filepath.name}")
            continue

        # Find doc comment above
        doc_start = decl_line
        j = decl_line - 1
        while j >= 0 and lines[j].strip() == '':
            j -= 1

        if j >= 0:
            # Walk back through comments
            if lines[j].strip().endswith('-/') or lines[j].strip().startswith('--'):
                while j >= 0:
                    stripped = lines[j].strip()
                    if stripped.startswith('/--') or stripped.startswith('/-'):
                        doc_start = j
                        break
                    if stripped.startswith('-- Ref:') and (j == 0 or not lines[j-1].strip().startswith('--')):
                        doc_start = j
                        break
                    if stripped.startswith('--'):
                        doc_start = j
                    j -= 1
                if j >= 0:
                    doc_start = j

        # Find end of declaration
        decl_end = decl_line
        for k in range(decl_line + 1, len(lines)):
            stripped = lines[k].strip()
            # New top-level declaration or section comment
            if (DECL_RE.match(lines[k]) or
                lines[k].startswith('/-!') or
                (lines[k].startswith('/--') and k > decl_line + 1) or
                (lines[k].startswith('-- Ref:') and DECL_RE.match(lines[min(k+1, len(lines)-1)])) or
                lines[k].startswith('end ')):
                decl_end = k - 1
                # Trim trailing blank lines
                while decl_end > decl_line and lines[decl_end].strip() == '':
                    decl_end -= 1
                break
            decl_end = k

        text = '\n'.join(lines[doc_start:decl_end + 1]).rstrip()
        results[target] = text

    return results


# Mapping: content block basename -> (lean decl name, source file, extra decls to include)
# Extra decls are helper defs that belong with the main declaration
CONTENT_BLOCKS = {
    # === Chapter 1 (from QuantumObservableUniverse.lean) ===
    'quantum-universe': (['QOU.QuantumUniverse'], 'QOU/QuantumObservableUniverse.lean',
                         ['QOU.FrobeniusHopfData']),
    'quantum-observable-universe': (['QOU.QuantumObservableUniverse'], 'QOU/QuantumObservableUniverse.lean',
                                     ['QOU.QuantumUniverse.gaugeGroup']),
    'higher-forms': (['QOU.HigherForms'], 'QOU/QuantumObservableUniverse.lean', []),
    'involutive-structure': (['QOU.InvolutiveStructure'], 'QOU/QuantumObservableUniverse.lean',
                              ['QOU.InvolutiveStructure.involutivity']),
    'positive-definite-dagger': (['QOU.PositiveDefiniteStructure'], 'QOU/QuantumObservableUniverse.lean', []),
    'categorical-hodge-star': (['QOU.CatHodgeInvolution'], 'QOU/QuantumObservableUniverse.lean',
                                ['QOU.CatHodgeInvolution.IsSelfDual', 'QOU.HodgeInvolution',
                                 'QOU.HodgeInvolution.IsSelfDual', 'QOU.HodgeInvolution.IsAntiSelfDual']),
    'spin-labels': (['QOU.SpinLabels'], 'QOU/QuantumObservableUniverse.lean',
                     ['QOU.SpinLabels.fundamental_dim', 'QOU.SpinLabels.adjoint_dim']),
    'categorical-q-ext-deriv': (['QOU.CategoricalQExtDeriv'], 'QOU/QuantumObservableUniverse.lean',
                                 ['QOU.CategoricalQExtDeriv.proj_H', 'QOU.CategoricalQExtDeriv.dq',
                                  'QOU.CategoricalQExtDeriv.dq_classical']),
    'categorical-instanton': (['QOU.CategoricalInstanton'], 'QOU/QuantumObservableUniverse.lean', []),
    'categorical-irreducible-proof': (['QOU.categorical_irreducible'], 'QOU/QuantumObservableUniverse.lean', []),
    'categorical-self-duality-proof': (['QOU.categorical_self_duality'], 'QOU/QuantumObservableUniverse.lean', []),
    'categorical-dq-squared-proof': (['QOU.categorical_dq_squared'], 'QOU/QuantumObservableUniverse.lean', []),
    'categorical-jet': (['QOU.CategoricalJet'], 'QOU/QuantumObservableUniverse.lean',
                         ['QOU.CategoricalJet.kernelIncl_exact',
                          'QOU.CategoricalJetProlongation', 'QOU.categorical_jet_prolongation']),
    'c-quantum-universe': (['QOU.CRManifoldData'], 'QOU/QuantumObservableUniverse.lean', []),
    'c-quantum-observable-universe': (['QOU.CQuantumObservableUniverse'], 'QOU/QuantumObservableUniverse.lean', []),
    'instanton': (['QOU.InstantonConnection'], 'QOU/QuantumObservableUniverse.lean',
                   ['QOU.InstantonConnection.IsIrreducible']),
    'substrate-parameter': (['QOU.SubstrateParameter'], 'QOU/QuantumObservableUniverse.lean', []),
    'quantum-gauge-group': (['QOU.QuantumGaugeGroup'], 'QOU/QuantumObservableUniverse.lean', []),
    'quantum-planck-constant': (['QOU.quantumPlanckConstant'], 'QOU/QuantumObservableUniverse.lean',
                                 ['QOU.quantumPlanckConstant_nonneg', 'QOU.quantumPlanckConstant_lt_one',
                                  'QOU.planck_classical_limit']),
    'reeb-decomposition': (['QOU.ReebDecomposition'], 'QOU/QuantumObservableUniverse.lean',
                            ['QOU.ReebDecomposition.isPurelyHorizontal']),
    'q-harmonic-form': (['QOU.QHarmonicForm'], 'QOU/QuantumObservableUniverse.lean', []),
    'fermion-boson-decomposition': (['QOU.Fermion'], 'QOU/QuantumObservableUniverse.lean',
                                     ['QOU.Boson', 'QOU.Boson.total_eq_horizontal']),
    'q-ext-deriv': (['QOU.qExtDeriv'], 'QOU/QuantumObservableUniverse.lean',
                     ['QOU.qExtDeriv_classical']),
    'q-lie-bracket': (['QOU.qLieBracket'], 'QOU/QuantumObservableUniverse.lean',
                       ['QOU.qLieBracket_classical']),
    'q-connection': (['QOU.qConnection'], 'QOU/QuantumObservableUniverse.lean',
                      ['QOU.qConnection_classical']),
    'q-reeb-vector-field': (['QOU.qReebVectorField'], 'QOU/QuantumObservableUniverse.lean', []),
    'q-reeb-flow': (['QOU.QReebFlow'], 'QOU/QuantumObservableUniverse.lean', []),
    'q-torsion-leaf': (['QOU.QTorsionLeaf'], 'QOU/QuantumObservableUniverse.lean', []),
    'irreducible-connection': (['QOU.irreducible_connection'], 'QOU/QuantumObservableUniverse.lean', []),
    'self-dual-curvature': (['QOU.self_dual_curvature'], 'QOU/QuantumObservableUniverse.lean', []),
    'main-commutative-diagram-proof': (['QOU.main_commutative_diagram'], 'QOU/QuantumObservableUniverse.lean',
                                        ['QOU.MainCommutativeDiagram']),
    'projective-line-object': (['QOU.ProjectiveLineObject'], 'QOU/QuantumObservableUniverse.lean',
                                ['QOU.FiberAdjointInvolution', 'QOU.fiber_adjoint_involution_sq']),
    'categorical-connection': (['QOU.CategoricalConnection'], 'QOU/QuantumObservableUniverse.lean',
                                ['QOU.ModuleAction']),
    'categorical-action': (['QOU.CategoricalAction'], 'QOU/QuantumObservableUniverse.lean',
                            ['QOU.variational_einstein', 'QOU.variational_yang_mills',
                             'QOU.variational_transport']),
    'observation': (['QOU.Observation'], 'QOU/QuantumObservableUniverse.lean',
                     ['QOU.ArchimedeanObservation']),
    'q-hodge-star': (['QOU.QHodgeStar'], 'QOU/QuantumObservableUniverse.lean', []),
    'q-yang-mills-levi': (['QOU.QYangMillsLevi'], 'QOU/QuantumObservableUniverse.lean', []),

    # === Chapter 2 (from Elaboration.lean — but CategoricalTransport is in QOU.lean) ===
    'categorical-transport': (['QOU.CategoricalTransport'], 'QOU/QuantumObservableUniverse.lean',
                               ['QOU.CategoricalTransport.kernel_condition']),
}

# Blocks NOT in QuantumObservableUniverse.lean — need special handling
SPECIAL_BLOCKS = {
    # These reference declarations not found in the main file, need stubs
    'categorical-point': 'QOU.CategoricalPoint',
    'categorical-q-connection': 'QOU.CategoricalQConnection',
    'categorical-q-lie-bracket': 'QOU.CategoricalQLieBracket',
    'categorical-reeb': 'QOU.CategoricalReeb',
    'maximal-torus': 'QOU.MaximalTorus',
    'weight-decomposition': 'QOU.WeightDecomposition',
    'rigid-monoidal-category': 'QOU.RigidMonoidalCategory',
}

CH1_DIR = REPO / 'content' / 'quantum-observable-universe' / 'quantum-universes'
CH2_DIR = REPO / 'content' / 'quantum-observable-universe' / 'quantum-observable-universes'
CH4_DIR = REPO / 'content' / 'quantum-observable-universe' / 'braids-and-knots'
CH11_DIR = REPO / 'content' / 'quantum-observable-universe' / 'q-geometric-langlands'


def write_lean_file(output_path, decl_name, body_text, imports=CH1_IMPORTS, namespace='QOU'):
    """Write a content-block .lean file."""
    content = f"""\
/-!
# {decl_name}

Extracted from content/quantum-observable-universe/lean/ for content-block co-location.
Source: content/quantum-observable-universe/lean/{decl_name.replace('.', '/')}.lean (monolithic)
-/

{imports}
namespace {namespace}

universe u v

{body_text}

end {namespace}
"""
    output_path.write_text(content)
    print(f"  Created: {output_path.relative_to(REPO)}")


def main():
    archive = REPO / 'content/quantum-observable-universe/lean'
    qou_file = archive / 'QOU' / 'QuantumObservableUniverse.lean'

    if not qou_file.exists():
        print(f"ERROR: {qou_file} not found")
        return

    source_text = qou_file.read_text()
    source_lines = source_text.split('\n')

    created = 0

    # Process main blocks from QuantumObservableUniverse.lean
    for block_name, (main_decls, source_file, extra_decls) in CONTENT_BLOCKS.items():
        src = archive / source_file
        if not src.exists():
            print(f"WARNING: {src} not found, skipping {block_name}")
            continue

        all_decls = main_decls + extra_decls
        found = find_declaration_block(src, all_decls)

        if not found:
            print(f"WARNING: No declarations found for {block_name}")
            continue

        # Combine all found declaration texts
        body_parts = []
        for decl in all_decls:
            if decl in found:
                body_parts.append(found[decl])

        body = '\n\n'.join(body_parts)

        # Determine output directory
        if block_name == 'categorical-transport':
            output_dir = CH2_DIR
        else:
            output_dir = CH1_DIR

        output_path = output_dir / f"{block_name}.lean"
        write_lean_file(output_path, main_decls[0], body)
        created += 1

    # Handle special blocks (not in QuantumObservableUniverse.lean)
    # Check other source files
    for block_name, decl_name in SPECIAL_BLOCKS.items():
        # Try to find in other lean files
        found_text = None

        if block_name == 'rigid-monoidal-category':
            src = archive / 'QOU' / 'Category' / 'Rigid.lean'
            if src.exists():
                found = find_declaration_block(src, [decl_name])
                if decl_name in found:
                    found_text = found[decl_name]

        if found_text is None:
            # Search all QOU lean files
            for lean_file in sorted(archive.rglob('QOU/**/*.lean')):
                text = lean_file.read_text()
                short = decl_name.replace('QOU.', '')
                if re.search(rf'(structure|def|theorem|lemma|class)\s+{re.escape(short)}\b', text):
                    found = find_declaration_block(lean_file, [decl_name])
                    if decl_name in found:
                        found_text = found[decl_name]
                        print(f"  Found {decl_name} in {lean_file.relative_to(archive)}")
                        break

        if found_text:
            output_path = CH1_DIR / f"{block_name}.lean"
            write_lean_file(output_path, decl_name, found_text)
            created += 1
        else:
            # Create a stub
            print(f"  STUB: {block_name} — {decl_name} not found in any source file")
            stub = f"""\
-- TODO: Formalize {decl_name}
-- This declaration was referenced in the content manifest but not found
-- in the content/quantum-observable-universe/lean/ source files. It may need to be written from scratch.
-- Ref: [manuscript]
sorry"""
            output_path = CH1_DIR / f"{block_name}.lean"
            write_lean_file(output_path, decl_name, stub)
            created += 1

    # === Chapter 4 ===
    print("\n=== Chapter 4 ===")
    pi_file = archive / 'QOU' / 'PathIntegrals.lean'
    if pi_file.exists():
        found = find_declaration_block(pi_file, ['QOU.PathIntegrals.KnotEigenbasisComplete'])
        if found:
            for decl, text in found.items():
                output_path = CH4_DIR / 'knot-eigenbasis-complete-proof.lean'
                content = f"""\
/-!
# QOU.PathIntegrals.KnotEigenbasisComplete

Extracted from content/quantum-observable-universe/lean/ for content-block co-location.
Source: content/quantum-observable-universe/lean/QOU/PathIntegrals.lean (monolithic)
-/

import QOU.Basic
import Mathlib.Data.Real.Basic
import Mathlib.Algebra.Group.Basic

namespace QOU.PathIntegrals

universe u v

{text}

end QOU.PathIntegrals
"""
                output_path.write_text(content)
                print(f"  Created: {output_path.relative_to(REPO)}")
                created += 1

    # === Chapter 11 ===
    print("\n=== Chapter 11 ===")
    hm_file = archive / 'QOU' / 'HadronicMass.lean'
    if hm_file.exists():
        for block_name, decl_name in [
            ('skein-mass-relation-proof', 'QOU.HadronicMass.SkeinMassRelation'),
            ('terminal-resolution-proof', 'QOU.HadronicMass.terminal_resolution_hadronic_mass'),
        ]:
            # For HadronicMass, declarations are in QOU.HadronicMass namespace
            short = decl_name.replace('QOU.HadronicMass.', '')
            found = find_declaration_block(hm_file, [short])
            if not found:
                found = find_declaration_block(hm_file, [decl_name])

            if found:
                text = list(found.values())[0]
                output_path = CH11_DIR / f'{block_name}.lean'
                content = f"""\
/-!
# {decl_name}

Extracted from content/quantum-observable-universe/lean/ for content-block co-location.
Source: content/quantum-observable-universe/lean/QOU/HadronicMass.lean (monolithic)
-/

import QOU.Basic
import Mathlib.Data.Real.Basic
import Mathlib.Algebra.Group.Basic

namespace QOU.HadronicMass

{text}

end QOU.HadronicMass
"""
                output_path.write_text(content)
                print(f"  Created: {output_path.relative_to(REPO)}")
                created += 1
            else:
                print(f"  WARNING: Could not find {decl_name} in HadronicMass.lean")

    print(f"\n=== Done: {created} files created ===")


if __name__ == '__main__':
    main()
