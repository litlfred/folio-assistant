#!/usr/bin/env python3
"""Simplify verbose markdown cross-references.

Before: quantum observable universe ([Definition](#def:quantum-observable-universe))
After:  ([quantum observable universe](#def:quantum-observable-universe))

For all block types: Definition, Theorem, Lemma, Proposition, Corollary, Remark,
Conjecture, Example.

Phase 1: Change link text from "Type" to human-readable label name
Phase 2: Remove redundant preceding concept names where the label-derived name
         matches text right before the parenthesized link
"""

import re
import glob
import sys

TYPE_MAP = {
    'Definitions': 'def',
    'Definition': 'def',
    'Theorem': 'thm',
    'Lemma': 'lem',
    'Proposition': 'prop',
    'Corollary': 'cor',
    'Remark': 'rem',
    'Conjecture': 'conj',
    'Example': 'ex',
}

# Special-case label → display name mappings for proper nouns,
# abbreviations, and math notation.  Labels not listed here use
# the default conversion (hyphens → spaces).
LABEL_OVERRIDES = {
    # SU(2) / SO(3) labels
    'su2-emergence': 'SU(2) emergence',
    'su2-generators': 'SU(2) generators',
    'su2-basis': 'SU(2) basis',
    'quantum-su2': 'quantum SU(2)',
    'so3-generators': 'SO(3) generators',
    # Proper nouns
    'brings-surface': "Bring's surface",
    'brings-is-qou': "Bring's surface is QOU",
    'brings-curve': "Bring's curve",
    'brings-smoothness': "Bring's surface smoothness",
    'brings-qou-4tuple': "Bring's QOU 4-tuple",
    'brings-qou-axiom-map': "Bring's QOU axiom map",
    'brings-realisations': "Bring's realisations",
    'briggs-klein-chart': 'Briggs--Klein chart',
    'lagrange-resolvents': 'Lagrange resolvents',
    'heisenberg-commutator': 'Heisenberg commutator',
    'schrodinger-jet-coaction': 'Schr\\"{o}dinger jet coaction',
    'yekutieli-lifting': 'Yekutieli lifting',
    'yekutieli-lifting-condition': 'Yekutieli lifting condition',
    'yekutieli-triple': 'Yekutieli triple',
    'descartes': 'Descartes universe',
    'descartes-condition': 'Descartes condition',
    'descartes-chirality': 'Descartes chirality',
    'descartes-leptons': 'Descartes leptons',
    'descartes-cmb': 'Descartes CMB',
    'descartes-braid-structure': 'Descartes braid structure',
    'descartes-calabi-yau': 'Descartes Calabi--Yau',
    'calabi-yau': 'Calabi--Yau',
    'seiberg-witten': 'Seiberg--Witten',
    'reeb-decomposition': 'Reeb decomposition',
    'reeb-exceptional-divisor': 'Reeb exceptional divisor',
    'reeb-physical': 'Reeb physical interpretation',
    'hopf-non-cocommutativity': 'Hopf non-cocommutativity',
    'frobenius-su2': 'Frobenius SU(2)',
    'frobenius-simplification': 'Frobenius simplification',
    'witt-vector-lift': 'Witt vector lift',
    'betti-numbers-brane': 'Betti numbers on branes',
    # q-deformed concepts
    'q-hodge-star': '$q$-Hodge star',
    'q-ext-deriv': '$q$-exterior derivative',
    'q-harmonic-form': '$q$-harmonic form',
    'q-harmonic-basis-brane': '$q$-harmonic basis on branes',
    'q-harmonic-physical': '$q$-harmonic physical interpretation',
    'q-lie-bracket': '$q$-Lie bracket',
    'q-reeb-flow': '$q$-Reeb flow',
    'q-reeb-vector-field': '$q$-Reeb vector field',
    'q-torsion-leaf': '$q$-torsion leaf',
    'q-torsion-existence': '$q$-torsion existence',
    'q-connection': '$q$-connection',
    'q-yang-mills-levi': '$q$-Yang--Mills--Levi functional',
    'categorical-q-ext-deriv': 'categorical $q$-exterior derivative',
    'categorical-q-lie-bracket': 'categorical $q$-Lie bracket',
    'categorical-dq-squared': 'categorical $d_q^2 = 0$',
    'categorical-reeb': 'categorical Reeb derivation',
    # p-adic
    'p-adic-realisation': '$p$-adic realisation',
    # C-realisation labels
    'c-quantum-observable-universe': '$\\mathbb{C}$-quantum observable universe',
    'c-quantum-universe': '$\\mathbb{C}$-quantum universe',
    'c-substrate-via-levi': '$\\mathbb{C}$-substrate via Levi form',
    # Abbreviations
    'ale': 'ALE space',
    # R-matrix
    'r-matrix-braiding': '$R$-matrix braiding',
    # Miscellaneous proper-noun labels
    'qu-to-qou': 'QU-to-QOU lifting',
    'self-dual-2group': 'self-dual 2-group',
    # SU(2) examples
    'connection-su2': 'connection on SU(2)',
    'dagger-su2': 'dagger on SU(2)',
    'fiber-adjoint-su2': 'fibre adjoint on SU(2)',
    'higher-forms-su2': 'higher forms on SU(2)',
    'instanton': 'instanton',
    'maximal-torus-su2': 'maximal torus of SU(2)',
    'projective-line-su2': 'projective line on SU(2)',
    'qou-su2': 'QOU on SU(2)',
    'quantum-universe-su2': 'quantum universe on SU(2)',
    'rigid-monoidal-vect': 'rigid monoidal Vect',
    'spin-labels-su2': 'spin labels on SU(2)',
    'trefoil-operator-algebra': 'trefoil operator algebra',
    'trefoil-knot-group': 'trefoil knot group',
    'finite-field-realisation': 'finite field realisation',
    # Yang--Mills
    'yang-mills-functional': 'Yang--Mills functional',
    # Descent / lifting
    'jet-prolongation': 'jet prolongation',
    'jet-prolongation-C': 'jet prolongation ($\\mathbb{C}$)',
    # Braid
    'braid-action-tensor': 'braid action on tensor products',
    'braid-group-action': 'braid group action',
    'braid-group': 'braid group',
    'braid-twist-flip': 'braid twist-flip',
    'braid-base-field': 'braid base field',
    'braid-lifting-compatibility': 'braid lifting compatibility',
    # Knot
    'knot-eigenbasis-complete': 'knot eigenbasis completeness',
    'skein-mass-relation': 'skein mass relation',
    'skein-decomposition': 'skein decomposition',
    'skein-archimedean-shadow': 'skein archimedean shadow',
    # Surface / geometry
    'coral-elliptic': 'coral elliptic curve',
    'coral-bundles': 'coral bundles',
    'chirality-trefoil': 'chirality and trefoil',
    # Other specific labels
    'genus-maximal-descent': 'genus-maximal descent',
    'euler-char-stability': 'Euler characteristic stability',
    'cosimplicial-crossed-groupoid': 'cosimplicial crossed groupoid',
    'fiber-adjoint-involution': 'fibre adjoint involution',
    'main-commutative-diagram': 'main commutative diagram',
    'two-observer-parallelogram': 'two-observer parallelogram',
    'weight-space-decomposition': 'weight space decomposition',
    'descent-reduction': 'descent reduction',
    'descent-reduction-zero': 'descent reduction to zero',
    'descent-eigenspaces': 'descent eigenspaces',
    'j1e-local-states': '$J^1E$ local states',
    'gr-substrate-geometry': 'GR substrate geometry',
    'prolongation-categorical': 'prolongation (categorical)',
    'self-dual-curvature': 'self-dual curvature',
    'crystal-probe-q': 'crystal probe of $q$',
    'photonic-hall': 'photonic Hall effect',
    'lattice-layout': 'lattice layout',
    'local-substrate-q': 'local substrate $q$',
    'terminal-resolution': 'terminal resolution',
    't-duality-elliptic': 'T-duality on elliptic fibres',
    'holonomy-trefoil': 'holonomy of trefoil',
    'radial-projection': 'radial projection',
    'spectral-dynamics': 'spectral dynamics',
    'color-tube-fibers': 'colour tube fibres',
    'color-tube-coordinates': 'colour tube coordinates',
    'color-tube-interpretation': 'colour tube interpretation',
}


def label_to_name(label):
    """Convert label to human-readable display name."""
    if label in LABEL_OVERRIDES:
        return LABEL_OVERRIDES[label]
    return label.replace('-', ' ')


# Match [Type](#prefix:label)
LINK_RE = re.compile(
    r'\[(' + '|'.join(TYPE_MAP.keys()) + r')\]'
    r'\(#(' + '|'.join(TYPE_MAP.values()) + r'):([a-zA-Z0-9_-]+)\)'
)

# Pattern to strip trailing math expressions like $...$
TRAILING_MATH_RE = re.compile(r'(\s*\$[^$]+\$)+\s*$')


def strip_trailing_math(text):
    """Remove trailing $...$ math expressions and return (stripped_text, math_suffix)."""
    m = TRAILING_MATH_RE.search(text)
    if m:
        return text[:m.start()].rstrip(), text[m.start():]
    return text, ''


def normalize_for_match(text):
    """Normalize text for fuzzy matching: lowercase, strip possessives."""
    t = text.lower()
    t = t.replace("'s ", "s ").replace("\u2019s ", "s ")
    # Handle possessive at end of string
    if t.endswith("'s") or t.endswith("\u2019s"):
        t = t[:-2] + "s"
    return t


def process_file(filepath, dry_run=False):
    with open(filepath, 'r') as f:
        content = f.read()

    original = content
    matches = list(LINK_RE.finditer(content))

    for match in reversed(matches):
        type_name = match.group(1)
        prefix = match.group(2)
        label = match.group(3)
        name = label_to_name(label)
        full_ref = f"{prefix}:{label}"

        start = match.start()
        end = match.end()

        new_link = f'[{name}](#{full_ref})'

        has_open_paren = start > 0 and content[start-1] == '('
        has_close_paren = end < len(content) and content[end] == ')'
        in_parens = has_open_paren and has_close_paren

        if in_parens:
            paren_start = start - 1
            paren_end = end + 1

            before = content[:paren_start]
            before_stripped = before.rstrip(' \t')

            # Handle newline before paren
            if before_stripped.endswith('\n'):
                before_check = before_stripped.rstrip('\n\r').rstrip(' \t')
            else:
                before_check = before_stripped

            # Try direct match first
            found_redundancy = False
            # Also try after stripping trailing math like $q_0$, $\star_q$
            before_no_math, math_suffix = strip_trailing_math(before_check)

            # Only remove redundancy when concept name directly precedes
            # the paren (no intervening math notation).
            simple_name = label.replace('-', ' ')

            # Direct match only (no math between name and paren)
            normalized = normalize_for_match(before_check.rstrip())
            normalized_name = normalize_for_match(simple_name)
            if normalized.endswith(normalized_name):
                text_stripped = before_check.rstrip()
                # Walk back to find actual length of matched text
                norm_len = len(normalized_name)
                actual_match_len = 0
                norm_pos = len(normalized)
                orig_pos = len(text_stripped)
                while norm_pos > len(normalized) - norm_len and orig_pos > 0:
                    orig_pos -= 1
                    norm_pos -= 1
                    actual_match_len += 1
                    # Skip apostrophe that got collapsed in normalize
                    if (orig_pos > 0 and
                        text_stripped[orig_pos] == 's' and
                        text_stripped[orig_pos-1] in ("'", "\u2019")):
                        orig_pos -= 1
                        actual_match_len += 1

                name_start_pos = len(text_stripped) - actual_match_len
                text_before_name = text_stripped[:name_start_pos].rstrip(' \t')

                # Determine separator
                if text_before_name.endswith('\n'):
                    sep = ''
                elif '\n' in before[len(text_before_name):paren_start]:
                    sep = '\n'
                else:
                    sep = ' '

                content = (text_before_name + sep +
                          '(' + new_link + ')' +
                          content[paren_end:])
                found_redundancy = True

            if not found_redundancy:
                content = content[:start] + new_link + content[end:]
        else:
            content = content[:start] + new_link + content[end:]

    if content != original:
        if not dry_run:
            with open(filepath, 'w') as f:
                f.write(content)
        return True
    return False


if __name__ == '__main__':
    dry_run = '--dry-run' in sys.argv

    changed = 0
    for md_file in sorted(glob.glob('content/**/*.md', recursive=True)):
        if process_file(md_file, dry_run=dry_run):
            changed += 1
            print(f"{'Would modify' if dry_run else 'Modified'}: {md_file}")

    print(f"\nTotal files {'would be ' if dry_run else ''}modified: {changed}")
