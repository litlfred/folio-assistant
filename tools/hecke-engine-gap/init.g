#############################################################################
##  init.g — HeckeEngine package init script.
##
##  Loads the C-extension kernel module (built by the package's
##  configure + make scripts; see README) and the GAP declaration file.

# Load the GAP-language declarations.
ReadPackage( "HeckeEngine", "lib/HeckeEngine.gd" );

# Load the C-extension kernel module.
# `LoadKernelExtension` is GAP's official mechanism for binding to a
# package-supplied .so kernel module. The .so itself is built by
# `cd src && ./configure --with-gaproot=<gap-root> && make`.
if not LoadKernelExtension( "HeckeEngine" ) then
    Info( InfoWarning, 1,
          "HeckeEngine kernel extension failed to load. ",
          "Build it via: cd src && ./configure && make" );
fi;
