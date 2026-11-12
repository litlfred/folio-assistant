Feature: lake-cache-fetch and its Python mirrors resolve cache branches from the folio's declaration, and refuse unsafe archives

  @test:scripts/tests/lake-cache-fetch.test.ts::lake-cache-fetch.sh_candidate_order_(bean_rva2)::declaredFamilyFirstThenBuiltIn
  Scenario: the folio's declared family is tried first, then the built-in name
    Given a folio on Lean v4.24.0 that declares the cache family "my/lake-cache/", and a bare remote with no cache branch
    When lake-cache-fetch.sh runs
    Then it tries my/lake-cache/qou-v4-24-0 first
    And cat/folio-assistant-sci/lake-cache/qou-v4-24-0 second

  @test:scripts/tests/lake-cache-fetch.test.ts::lake-cache-fetch.sh_candidate_order_(bean_rva2)::noDeclarationBuiltInFirst
  Scenario: with no declaration the built-in name is tried first
    Given a folio with no declaration
    When lake-cache-fetch.sh runs
    Then the first branch it tries is cat/folio-assistant-sci/lake-cache/qou-v4-24-0

  @test:scripts/tests/lake-cache-fetch.test.ts::lake-cache-fetch.sh_candidate_order_(bean_rva2)::builtInDeclarationNoDuplicate
  Scenario: a declaration naming the built-in family adds no duplicate
    Given a folio that declares the family "cat/folio-assistant-sci/lake-cache/"
    When lake-cache-fetch.sh runs
    Then it tries the built-in branch exactly once

  @test:scripts/tests/lake-cache-fetch.test.ts::the_Python_mirrors_read_the_same_declaration_(bean_rva2)::declaredFamilyThenBuiltIns[${script}]
  Scenario Outline: <script>: the declared family first, then the built-in names
    Given a folio that declares the family "my/lake-cache/", with <script> copied into its scripts/
    When the script is loaded as a Python module
    Then it loads cleanly
    And its CACHE_PREFIXES are "my/lake-cache/" then "cat/folio-assistant-sci/lake-cache/"

    Examples:
      | script                    |
      | lake-cache-fetch-multi.py |
      | lake-cache-produce.py     |

  @test:scripts/tests/lake-cache-fetch.test.ts::the_Python_mirrors_read_the_same_declaration_(bean_rva2)::noDeclarationLeavesBuiltIns[${script}]
  Scenario Outline: <script>: no declaration leaves the built-in names
    Given a folio with no declaration, with <script> copied into its scripts/
    When the script is loaded as a Python module
    Then it loads cleanly
    And its CACHE_PREFIXES are only "cat/folio-assistant-sci/lake-cache/"

    Examples:
      | script                    |
      | lake-cache-fetch-multi.py |
      | lake-cache-produce.py     |

  @test:scripts/tests/lake-cache-fetch.test.ts::lake-cache_archive_member-type_whitelist_(bean_folio-assistant-8eyy)::fetchRefusesSymlinkTarball
  Scenario: lake-cache-fetch.sh refuses a cache tarball containing a symlink
    Given the remote's built-in cache branch holds a tarball of .lake with a symlink to /etc/passwd
    When lake-cache-fetch.sh runs
    Then it exits non-zero
    And it says "non-regular/non-directory entries"

  @test:scripts/tests/lake-cache-fetch.test.ts::lake-cache_archive_member-type_whitelist_(bean_folio-assistant-8eyy)::restoreRefusesSymlinkSplitTarball
  Scenario: lake-cache.sh refuses a split-tarball cache branch containing a symlink
    Given a folio package testpkg whose cache branch holds a split tarball of .lake with a symlink
    When lake-cache.sh restore --package testpkg runs
    Then it exits 3
    And it says "non-regular/non-directory member"

  @test:scripts/tests/lake-cache-fetch.test.ts::lake-cache_archive_member-type_whitelist_(bean_folio-assistant-8eyy)::multiRefusesSymlinkArchive
  Scenario: lake-cache-fetch-multi.py refuses an archive containing a symlink or unsafe path
    Given a tar of .lake holding a symlink
    When lake-cache-fetch-multi.py's validate_tar_archive and extract_tar_checked are run on it
    Then the Python run exits 0
    And extraction reports failure and no .lake is extracted
    And a reported problem says "non-regular/non-directory member"
