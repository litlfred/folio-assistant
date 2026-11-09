Feature: check-lean-dirs — a lean directory holds what its kind says, and nothing orphaned

  @test:scripts/check-lean-dirs.test.ts::a_lean_directory_holds_what_its_kind_says,_and_nothing_orphaned::readTemplateWithReadmeClean
  Scenario: a template a module reads, with a README, is clean
    Given a directory with README.md and a.lean.tmpl
    And module sources that name 'a.lean.tmpl'
    When judgeLeanDir judges the directory
    Then there are no findings

  @test:scripts/check-lean-dirs.test.ts::a_lean_directory_holds_what_its_kind_says,_and_nothing_orphaned::unreadTemplateIsFinding
  Scenario: a template nothing reads is a finding
    Given a directory with README.md and b.lean.tmpl
    And module sources that do not name it
    When judgeLeanDir judges the directory
    Then a finding says "b.lean.tmpl is read by no module"

  @test:scripts/check-lean-dirs.test.ts::a_lean_directory_holds_what_its_kind_says,_and_nothing_orphaned::lakePackageWithoutToolchainIsFinding
  Scenario: a Lake package without its toolchain is a finding
    Given a directory with README.md and lakefile.toml but no lean-toolchain
    When judgeLeanDir judges the directory
    Then a finding says "no lean-toolchain"

  @test:scripts/check-lean-dirs.test.ts::a_lean_directory_holds_what_its_kind_says,_and_nothing_orphaned::missingReadmeIsFinding
  Scenario: no README is a finding
    Given a directory with lakefile.lean and lean-toolchain but no README.md
    When judgeLeanDir judges the directory
    Then a finding says "no README.md"
