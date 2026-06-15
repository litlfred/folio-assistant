#############################################################################
##  HeckeEngine.gd — Declarations for the HeckeEngine GAP package.
##
##  The implementation file HeckeEngine.gi wires each declaration to a
##  C-extension function exported from the kernel module
##  src/HeckeEngine.c (which itself ccall-wraps libhecke_engine_c.so).

#############################################################################
##  <#GAPDoc Label="QOU_HeckeEngine_Version">
##  <ManSection>
##  <Func Name="QOU_HeckeEngine_Version" Arg=""/>
##  <Returns>a string</Returns>
##  <Description>
##  Engine version (matches the underlying hecke-engine-c crate).
##  </Description>
##  </ManSection>
##  <#/GAPDoc>
DeclareGlobalFunction( "QOU_HeckeEngine_Version" );

#############################################################################
##  <#GAPDoc Label="QOU_MarkovZ">
##  <ManSection>
##  <Func Name="QOU_MarkovZ" Arg="q"/>
##  <Returns>a double</Returns>
##  <Description>
##  Markov parameter z = 1 / (q^{1/2} + q^{-1/2}).
##  </Description>
##  </ManSection>
##  <#/GAPDoc>
DeclareGlobalFunction( "QOU_MarkovZ" );

#############################################################################
##  <#GAPDoc Label="QOU_HeckeH">
##  <ManSection>
##  <Func Name="QOU_HeckeH" Arg="q"/>
##  <Returns>a double</Returns>
##  <Description>
##  Hecke relation coefficient h = q - q^{-1}.
##  </Description>
##  </ManSection>
##  <#/GAPDoc>
DeclareGlobalFunction( "QOU_HeckeH" );

#############################################################################
##  <#GAPDoc Label="QOU_TraceWeights">
##  <ManSection>
##  <Func Name="QOU_TraceWeights" Arg="q"/>
##  <Returns>a list of 6 doubles</Returns>
##  <Description>
##  Markov-trace weights on the NF basis of <M>H_3(q)</M>.
##  Returns <C>[1, z, z, z^2, z^2, z^3]</C> where
##  <M>z = </M> <Ref Func="QOU_MarkovZ"/>(q).
##  </Description>
##  </ManSection>
##  <#/GAPDoc>
DeclareGlobalFunction( "QOU_TraceWeights" );

#############################################################################
##  <#GAPDoc Label="QOU_GramMatrix">
##  <ManSection>
##  <Func Name="QOU_GramMatrix" Arg="q"/>
##  <Returns>a 6x6 matrix of doubles</Returns>
##  <Description>
##  Gram matrix <M>G_{ij} = \mathrm{tr}_M(b_i \cdot b_j)</M> in the
##  Hoefsmit normal-form basis of <M>H_3(q)</M>.
##  </Description>
##  </ManSection>
##  <#/GAPDoc>
DeclareGlobalFunction( "QOU_GramMatrix" );

#############################################################################
##  <#GAPDoc Label="QOU_GramDet">
##  <ManSection>
##  <Func Name="QOU_GramDet" Arg="q"/>
##  <Returns>a double</Returns>
##  <Description>
##  Determinant of <Ref Func="QOU_GramMatrix"/>(q).
##  At the substrate value <M>q_0 \approx 1.110</M> the Gram matrix is
##  indefinite, so the sign of the determinant is not constrained.
##  </Description>
##  </ManSection>
##  <#/GAPDoc>
DeclareGlobalFunction( "QOU_GramDet" );

#############################################################################
##  Phase B — full surface.
##  CHEVIE adjacency: these three are the natural symbolic-q analogues
##  CHEVIE exposes as `CharTable(HeckeAlg)`, `LRCoefficient`, and the
##  arbitrary-precision Markov-trace evaluator.

#############################################################################
##  <#GAPDoc Label="QOU_ChiLambdaBraid">
##  <ManSection>
##  <Func Name="QOU_ChiLambdaBraid" Arg="shape, word, q"/>
##  <Returns>a double</Returns>
##  <Description>
##  Hecke character <M>\chi_\lambda(\beta)</M> at the substrate
##  parameter <M>q</M>. The partition <A>shape</A> is a list of positive
##  integers in weakly-decreasing order; an empty list returns 1.0.
##  The braid word <A>word</A> is a list of two-element lists
##  <C>[ [ gen, exp ], ... ]</C>, each encoding the braid letter
##  <M>\sigma_{gen}^{exp}</M>.
##  </Description>
##  </ManSection>
##  <#/GAPDoc>
DeclareGlobalFunction( "QOU_ChiLambdaBraid" );

#############################################################################
##  <#GAPDoc Label="QOU_LRCoefficient">
##  <ManSection>
##  <Func Name="QOU_LRCoefficient" Arg="lambda, mu, nu"/>
##  <Returns>an integer</Returns>
##  <Description>
##  Littlewood--Richardson coefficient <M>c^\lambda_{\mu\nu}</M>.
##  Returns <C>0</C> when <M>|\lambda| \neq |\mu| + |\nu|</M> or
##  <M>\mu \not\subseteq \lambda</M>.
##  </Description>
##  </ManSection>
##  <#/GAPDoc>
DeclareGlobalFunction( "QOU_LRCoefficient" );

#############################################################################
##  <#GAPDoc Label="QOU_TraceMpfr">
##  <ManSection>
##  <Func Name="QOU_TraceMpfr" Arg="word, n_strands, q_str, dps"/>
##  <Returns>a string</Returns>
##  <Description>
##  Arbitrary-precision Markov trace <M>\mathrm{tr}_M(\beta)</M> at
##  <M>q</M>. <A>word</A> is a list of two-element lists
##  <C>[ [ sign, gen ], ... ]</C> with sign in <M>\{-1, +1\}</M>;
##  <A>n_strands</A> is <M>n</M> in <M>B_n</M>; <A>q_str</A> is the
##  decimal-string representation of <M>q</M> for parser-level
##  precision; <A>dps</A> is the number of decimal digits of precision.
##  Returns the trace value as a decimal string.
##  </Description>
##  </ManSection>
##  <#/GAPDoc>
DeclareGlobalFunction( "QOU_TraceMpfr" );
