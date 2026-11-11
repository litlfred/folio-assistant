Feature: scanDecls — the declaration scanner behind the duplicate-declaration audit

  @test:scripts/tests/check-duplicate-decls.test.ts::scanDecls::scansEveryFlatNamespaceKind
  Scenario: every kind that occupies the flat namespace is scanned
    Given one declaration each of abbrev, def, structure, class, instance, theorem, lemma, inductive, opaque and axiom
    When scanDecls scans them
    Then it reports all ten kinds

  @test:scripts/tests/check-duplicate-decls.test.ts::scanDecls::namedSectionKeepsNamespace
  Scenario: a named section does not corrupt the namespace of later declarations
    Given namespace QOU with "inside" in section Helpers and "after" following it
    Then the names are QOU.inside and QOU.after

  @test:scripts/tests/check-duplicate-decls.test.ts::scanDecls::anonymousSectionPopped
  Scenario: an anonymous section is popped too
    Given namespace QOU with a in an anonymous section and b following it
    Then the names are QOU.a and QOU.b

  @test:scripts/tests/check-duplicate-decls.test.ts::scanDecls::nestedNamespacesConcatenate
  Scenario: nested namespaces concatenate
    Given R_q in namespace BraidKnot inside namespace QOU
    Then the name is QOU.BraidKnot.R_q

  @test:scripts/tests/check-duplicate-decls.test.ts::scanDecls::twoNamespacesOwnPrefixes
  Scenario: two namespaces in one file each get their own prefix
    Given R_q in namespace QOU and again in namespace QOU.Braiding
    Then the names are QOU.R_q and QOU.Braiding.R_q

  @test:scripts/tests/check-duplicate-decls.test.ts::scanDecls::skipsBlockAndLineComments
  Scenario: block comments and line comments are skipped
    Given a def inside a block comment, a def after "--", and a real def
    Then the only name is QOU.real

  @test:scripts/tests/check-duplicate-decls.test.ts::scanDecls::oneLineBlockCommentNoRegion
  Scenario: a single-line block comment does not open a comment region
    Given a one-line docstring above def kept
    Then the name is QOU.kept

  @test:scripts/tests/check-duplicate-decls.test.ts::scanDecls::modifiersAttributesKeepDecl
  Scenario: modifiers and attributes do not hide a declaration
    Given declarations with @[simp], noncomputable, private and protected noncomputable
    Then the names are QOU.a, QOU.b, QOU.c and QOU.d

  @test:scripts/tests/check-duplicate-decls.test.ts::scanDecls::recordsLine
  Scenario: records the line so a finding can be clicked to source
    Given a def on the fourth line
    Then its recorded line is 4

  @test:scripts/tests/check-duplicate-decls.test.ts::scanDecls::keywordPrefixNotDecl
  Scenario: a name that merely starts with a keyword is not a declaration
    Given the line "defaultWeight := 1"
    Then no declaration is found

  @test:scripts/tests/check-duplicate-decls.test.ts::dotted_declaration_names::dottedNameCapturedWhole
  Scenario: a dotted name is captured whole, not truncated at the first dot
    Given class SurrealField, theorem SurrealField.IsFinite.pow and def SurrealField.finiteSubring in namespace QOU
    Then the names are QOU.SurrealField, QOU.SurrealField.IsFinite.pow and QOU.SurrealField.finiteSubring

  @test:scripts/tests/check-duplicate-decls.test.ts::dotted_declaration_names::dottedNameGetsNamespace
  Scenario: a dotted name still picks up the enclosing namespace
    Given theorem C.d in namespace A.B
    Then the name is A.B.C.d
