Feature: lake-cache.sh end to end, against a local git remote holding a seeded cache branch

  Every scenario runs against a bare local remote, a working repository with a Lake package testpkg on
  Lean v4.24.0 two levels down, and the branch cat/folio-assistant-sci/lake-cache/testpkg-v4-24-0 seeded
  with a split tarball of a .lake holding 5 dependency oleans and 3 own oleans.

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_resolution::findsLakeRootFromSubdir
  Scenario: finds the Lake root by walking up from a subdirectory
    When status --package testpkg runs from a subdirectory of the Lake root
    Then its output names the Lake root

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_resolution::slugFromLeanToolchain
  Scenario: derives the toolchain slug from lean-toolchain
    When status --package testpkg runs at the Lake root
    Then its output names the slug v4-24-0 and the branch cat/folio-assistant-sci/lake-cache/testpkg-v4-24-0

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_resolution::unknownCommandExits2
  Scenario: unknown command exits 2
    When the script runs with the command "nonsense"
    Then it exits 2

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_status::statusAbsentExits1
  Scenario: exits 1 when no cache is present
    When status runs before anything is restored
    Then it exits 1 and says "cache ABSENT"

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_restore::restoresFromSplitTarball
  Scenario: restores from a split-tarball branch, run from the Lake root
    When restore --package testpkg runs at the Lake root
    Then it exits 0 and says "restored"
    And the Lake root has a .lake

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_restore::reportsOwnOleansSeparately
  Scenario: reports own-package oleans separately from dependencies
    When status runs after the restore
    Then it exits 0, reports "own pkg:    3" and says "cache PRESENT"

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_restore::secondRestoreNoOps
  Scenario: is idempotent — a second restore no-ops
    When restore runs again
    Then it exits 0 and says "already present"

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_restore::missingBranchExits1
  Scenario: a missing branch exits 1, not 0
    Given a fresh Lake root with no cache on disk
    When restore runs against the branch cat/folio-assistant-sci/lake-cache/nope-v9-9-9
    Then it exits 1 and says "not found"

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_gutted_detection::shortfallReportsGutted
  Scenario: a shortfall against the restore stamp reports GUTTED with exit 3
    Given two dependency oleans removed from the restored tree
    When status runs
    Then it exits 3 and says "GUTTED"

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_gutted_detection::restoreRepairsGutted
  Scenario: restore repairs a gutted tree
    When restore runs on the gutted tree
    Then it exits 0
    And status then exits 0

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_seed_guard::seedRefusesWithoutOwnOleans
  Scenario: refuses to seed when the package's own oleans are absent
    Given a Lake root with dependency oleans and none of testpkg's own
    When seed --package testpkg runs
    Then it exits 2 and says "ZERO belong to"

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_seed_guard::seedExemptsMathlib
  Scenario: exempts mathlib, whose dependencies ARE the payload
    Given a Lake root with only dependency oleans
    When seed --package mathlib runs
    Then it does not say "ZERO belong to"

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_seed_guard::statusExemptsMathlib
  Scenario: status applies the same mathlib exemption as seed
    Given a Lake root with only dependency oleans
    When status --package mathlib runs
    Then it says "cache PRESENT" and does not say "ZERO belong to"

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_seed_guard::statusReportsGuttedPackage
  Scenario: status still reports a genuinely gutted per-package cache
    Given a Lake root with only dependency oleans
    When status --package testpkg runs
    Then it says "ZERO belong to"

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_seed_guard::seedRefusesEmptyTree
  Scenario: refuses to seed an empty tree
    Given a Lake root with no .lake
    When seed --package testpkg runs
    Then it exits 2 and says "build before seeding"

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_install-toolchain_(argument_handling)::installDeclinesNightly
  Scenario: declines a nightly rather than guessing an asset name
    When install-toolchain runs for leanprover/lean4:nightly-2025-01-01
    Then it exits 2, says "nightly" and points to "elan toolchain install"

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_install-toolchain_(argument_handling)::installFailsWithoutPin
  Scenario: fails clearly when no pin can be resolved
    Given a git repository with no lean-toolchain
    When install-toolchain runs with no --toolchain
    Then it exits 2 and names --toolchain

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_install-toolchain_(install_path)::installsUnderElanName
  Scenario: installs under elan's real directory name, not the tr '/:' one
    Given zstd is available, and a file:// mirror holding a fake v4.24.0 toolchain with its static libraries
    When install-toolchain runs for leanprover/lean4:v4.24.0 into a fresh ELAN_HOME
    Then it exits 0
    And toolchains/leanprover--lean4---v4.24.0/bin/lean exists, and toolchains/leanprover-lean4-v4.24.0 does not

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_install-toolchain_(install_path)::reportsStaticLibsLanded
  Scenario: reports the static libs it landed
    Given zstd and the same mirror
    When install-toolchain runs into a fresh ELAN_HOME
    Then it reports "static libs: 3"

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_install-toolchain_(install_path)::installIdempotent
  Scenario: is idempotent — a linkable toolchain is left alone
    Given zstd and the same mirror
    When install-toolchain runs twice into the same ELAN_HOME
    Then both exit 0, and the second says "already installed and linkable"

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_install-toolchain_(install_path)::forceReinstalls
  Scenario: --force reinstalls over a linkable toolchain
    Given zstd, the same mirror, and the toolchain already installed
    When install-toolchain runs again with --force
    Then it exits 0 and says "reinstalling"

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_install-toolchain_(install_path)::replacesToolchainWithoutStaticLibs
  Scenario: replaces a toolchain that has NO static libs — the ga7e trap
    Given zstd, the same mirror, and an installed toolchain with a lean binary but only a trace where libleancpp.a should be
    When install-toolchain runs
    Then it exits 0 and says "NO static libraries"
    And libleancpp.a now exists in the toolchain

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_install-toolchain_(install_path)::refusesArchiveWithoutStaticLibs
  Scenario: refuses to publish an archive with no static libs, leaving nothing behind
    Given zstd and a mirror whose toolchain archive has no static libraries
    When install-toolchain runs
    Then it exits 3 and says "no static libraries"
    And no toolchain directory is installed

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_install-toolchain_(install_path)::missingAssetExits1
  Scenario: a missing asset fails with exit 1 and installs nothing
    Given zstd and an empty mirror
    When install-toolchain runs
    Then it exits 1 and no toolchain directory is installed

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_trace_coverage_is_a_real_pairing,_not_a_ratio_of_counts::decoyTracesCapCoverage
  Scenario: decoy traces cannot push coverage above 100%
    Given a Lake root with 5 oleans, each with its own trace, and 20 unrelated traces
    When status runs
    Then it reports "traced:     5/5 oleans  (100%)"
    And the reported percentage is at most 100

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_trace_coverage_is_a_real_pairing,_not_a_ratio_of_counts::countsOnlyOwnTraces
  Scenario: counts only oleans that carry their OWN trace
    Given 10 oleans of which 4 have their own trace, and 30 unrelated traces
    When status runs
    Then it reports "traced:     4/10 oleans  (40%)"

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_trace_coverage_is_a_real_pairing,_not_a_ratio_of_counts::untracedTreeReadsZero
  Scenario: an untraced tree reads 0%, not 'plenty of traces'
    Given 8 oleans with no traces of their own, and 12 unrelated traces
    When status runs
    Then it reports "traced:     0/8 oleans  (0%)"

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_trace_coverage_is_a_real_pairing,_not_a_ratio_of_counts::lakefileOleanTraceCounts
  Scenario: the lakefile.olean form (X.olean -> X.olean.trace) also counts
    Given a .lake holding only lakefile.olean and lakefile.olean.trace
    When status runs
    Then it reports "traced:     1/1 oleans  (100%)"

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_contribute_(agentic_loop)::contributeIsCommand
  Scenario: contribute is a recognised command
    When contribute --package testpkg runs
    Then it does not say "unknown command"

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_contribute_(agentic_loop)::contributeInheritsSeedGuards
  Scenario: contribute inherits the seed guards
    Given a Lake root with no .lake
    When contribute --package testpkg runs
    Then it exits 2 and says "build before seeding"

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_cat/folio-assistant-sci/lake-cache/_only_(beans_32f6,_9io2,_oycs)::fixtureKeyResolvesNewName
  Scenario: the fixture's key resolves to its branch under the new name
    When resolve-branch --key testpkg-v4-24-0 runs
    Then it exits 0 and prints cat/folio-assistant-sci/lake-cache/testpkg-v4-24-0

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_cat/folio-assistant-sci/lake-cache/_only_(beans_32f6,_9io2,_oycs)::absentKeyResolvesNewName
  Scenario: a key that exists nowhere resolves to the new name
    When resolve-branch --key nope-v9-9-9 runs
    Then it prints cat/folio-assistant-sci/lake-cache/nope-v9-9-9

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_cat/folio-assistant-sci/lake-cache/_only_(beans_32f6,_9io2,_oycs)::retiredPrefixResolvesNewName[${legacy}]
  Scenario Outline: a key that exists only under the retired <legacy>/ resolves to the new name
    Given the key otherpkg-v4-24-0 pushed only under <legacy>/
    When resolve-branch runs for it
    Then it prints cat/folio-assistant-sci/lake-cache/otherpkg-v4-24-0

    Examples:
      | legacy         |
      | cat-lake-cache |
      | lake-cache     |

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_cat/folio-assistant-sci/lake-cache/_only_(beans_32f6,_9io2,_oycs)::newNameWinsStatusReportsIt
  Scenario: all three exist: the new name wins, and status reports it
    Given the key pushed under lake-cache/, cat-lake-cache/ and cat/folio-assistant-sci/lake-cache/
    When resolve-branch runs for it
    Then it prints the branch under cat/folio-assistant-sci/lake-cache/
    And status --package otherpkg names that branch

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_cat/folio-assistant-sci/lake-cache/_only_(beans_32f6,_9io2,_oycs)::restoreReadsNewFamilyCache
  Scenario: restore reads a cache under cat/folio-assistant-sci/lake-cache/
    Given the key pushed under cat/folio-assistant-sci/lake-cache/
    When restore --package otherpkg runs into a fresh Lake root
    Then it exits 0 and the fresh root has a .lake

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_cat/folio-assistant-sci/lake-cache/_only_(beans_32f6,_9io2,_oycs)::restoreSkipsRetiredInterimCache
  Scenario: restore does not read a cache left only under the retired cat-lake-cache/
    Given the key pushed only under cat-lake-cache/
    When restore --package otherpkg runs into a fresh Lake root
    Then it exits non-zero and the fresh root has no .lake

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_cat/folio-assistant-sci/lake-cache/_only_(beans_32f6,_9io2,_oycs)::resolveBranchWithoutKeyUsageError
  Scenario: resolve-branch without --key is a usage error
    When resolve-branch runs with no --key
    Then it exits 2

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_cat/folio-assistant-sci/lake-cache/_only_(beans_32f6,_9io2,_oycs)::the_folio's_declared_family_wins_(bean_rva2)::absentKeyResolvesDeclaredName
  Scenario: a key that exists nowhere resolves to the declared name
    Given a folio declaration naming the cache family my/lake-cache/
    When resolve-branch runs for otherpkg-v4-24-0
    Then it prints my/lake-cache/otherpkg-v4-24-0

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_cat/folio-assistant-sci/lake-cache/_only_(beans_32f6,_9io2,_oycs)::the_folio's_declared_family_wins_(bean_rva2)::builtInFoundAsNewestLegacy
  Scenario: a key under the built-in name is still found, as the newest legacy
    Given the declaration, and the key pushed under lake-cache/ and cat/folio-assistant-sci/lake-cache/
    When resolve-branch runs for it
    Then it prints the branch under cat/folio-assistant-sci/lake-cache/

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_cat/folio-assistant-sci/lake-cache/_only_(beans_32f6,_9io2,_oycs)::the_folio's_declared_family_wins_(bean_rva2)::declaredNameWinsOverBuiltIn
  Scenario: the declared name wins over the built-in one when both exist
    Given the declaration, and the key pushed under cat/folio-assistant-sci/lake-cache/ and my/lake-cache/
    When resolve-branch runs for it
    Then it prints my/lake-cache/otherpkg-v4-24-0

  @test:scripts/tests/lake-cache.test.ts::lake-cache.sh_—_cat/folio-assistant-sci/lake-cache/_only_(beans_32f6,_9io2,_oycs)::the_folio's_declared_family_wins_(bean_rva2)::noDeclarationBuiltInUnchanged
  Scenario: with no declaration the built-in name is unchanged
    Then no declaration file exists
    And resolve-branch for otherpkg-v4-24-0 prints the branch under cat/folio-assistant-sci/lake-cache/
