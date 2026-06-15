#############################################################################
##  PackageInfo.g — GAP package metadata for HeckeEngine.
##
##  Tier-3 wrapper per workplan v2 §3.6 + user request — GAP fits QOU
##  perfectly because CHEVIE (the de facto Iwahori-Hecke implementation
##  in GAP) is the canonical consumer for our H_3(q) Gram + Markov-trace.
##
##  This package is a thin wrapper around the hecke-engine-c C ABI
##  (tools/hecke-engine-c/), exposed to GAP via GAP's C-extension API.
##

SetPackageInfo( rec(

  PackageName := "HeckeEngine",
  Subtitle    := "QOU Iwahori-Hecke H_3(q) Gram + Markov-trace primitives",
  Version     := "0.1.0",
  Date        := "24/05/2026",
  License     := "MIT",

  Persons := [
    rec(
      LastName      := "QOU contributors",
      FirstNames    := "",
      IsAuthor      := true,
      IsMaintainer  := true,
      Email         := "noreply@anthropic.com",
      WWWHome       := "https://github.com/litlfred/qou",
    ),
  ],

  Status         := "dev",
  CommunicatedBy := "",
  AcceptDate     := "",

  PackageWWWHome := "https://github.com/litlfred/qou/tree/main/tools/hecke-engine-gap",
  README_URL     := Concatenation( ~.PackageWWWHome, "/README.md" ),
  PackageInfoURL := Concatenation( ~.PackageWWWHome, "/PackageInfo.g" ),
  SourceRepository := rec(
    Type := "git",
    URL  := "https://github.com/litlfred/qou",
  ),
  IssueTrackerURL := "https://github.com/litlfred/qou/issues",

  ArchiveURL := Concatenation( ~.PackageWWWHome, "/", ~.PackageName, "-", ~.Version ),
  ArchiveFormats := ".tar.gz",

  AbstractHTML :=
    "GAP bindings to the QOU <code>hecke-engine</code> Rust crate via the \
     C-ABI shim <code>hecke-engine-c</code>. Exposes the Iwahori-Hecke \
     H_3(q) Gram matrix, Markov-trace weights, and substrate-q \
     convenience functions. Targets CHEVIE / rep-theory consumers \
     in the discrete-algebra community.",

  PackageDoc := rec(
    BookName  := "HeckeEngine",
    SixFile   := "doc/manual.six",
    Autoload  := true,
  ),

  Dependencies := rec(
    GAP            := ">=4.12",
    NeededOtherPackages := [],
    SuggestedOtherPackages := [ [ "CHEVIE", ">=2.5" ] ],
    ExternalConditions := [
      ["GMP development headers (libgmp-dev)"],
      ["MPFR development headers (libmpfr-dev)"],
      ["Cargo / Rust toolchain (for building hecke-engine-c)"],
    ],
  ),

  AvailabilityTest := function() return true; end,

  TestFile := "tst/smoke.tst",

  Keywords := [
    "Iwahori-Hecke algebra", "Markov trace", "Gram matrix",
    "Wedderburn", "CHEVIE", "QOU",
  ],

) );
