import os,re,sys,json
EX={'node_modules','.git','vendor','target','build','dist','.lake','output','fsh-generated'}
TS=re.compile(r'^\s*(?:test|it)(?:\.(?:skip|only|todo|each\([^)]*\)|if\([^)]*\)|skipIf\([^)]*\)))?\s*\(',re.M)
PY=re.compile(r'^\s*(?:async\s+)?def\s+test_\w*\s*\(',re.M)
RS=re.compile(r'#\[(?:tokio::)?test\b')
KT=re.compile(r'@Test\b')
SC=re.compile(r'^\s*Scenario(?: Outline)?:',re.M)
def inv(root):
  r=dict(ts=0,tsf=0,py=0,pyf=0,rs=0,kt=0,feat=0,scen=0,tp=0,tpc=0,tpf=0)
  for dp,dn,fn in os.walk(root):
    dn[:]=[d for d in dn if d not in EX]
    for f in fn:
      p=os.path.join(dp,f)
      try: t=open(p,errors='ignore').read() if f.endswith(('.ts','.tsx','.js','.mjs','.py','.rs','.kt','.feature','.json')) else None
      except: continue
      if t is None: continue
      if re.search(r'\.(test|spec)\.(ts|tsx|js|mjs)$',f):
        n=len(TS.findall(t)); r['ts']+=n; r['tsf']+=1
      elif f.endswith('.py') and (f.startswith('test_') or f.endswith('_test.py')):
        n=len(PY.findall(t)); r['py']+=n; r['pyf']+=1
      elif f.endswith('.rs'): r['rs']+=len(RS.findall(t))
      elif f.endswith('.kt'): r['kt']+=len(KT.findall(t))
      elif f.endswith('.feature'): r['feat']+=1; r['scen']+=len(SC.findall(t))
      elif f.endswith('.json') and '"test-plan/v1"' in t[:300]:
        try:
          d=json.loads(t); cs=d.get('testCases',[]); r['tp']+=1; r['tpc']+=len(cs); r['tpf']+=sum(1 for c in cs if c.get('feature'))
        except Exception: pass
  return r
print("| Repo | TS tests (files) | pytest (files) | Rust #[test] | Kotlin @Test | .feature (Scenarios) | test-plan/v1 files | cases | cases naming `feature` |")
print("|---|---|---|---|---|---|---|---|---|")
for n in sys.argv[2:]:
  r=inv(os.path.join(sys.argv[1],n))
  print(f"| {n} | {r['ts']} ({r['tsf']}) | {r['py']} ({r['pyf']}) | {r['rs']} | {r['kt']} | {r['feat']} ({r['scen']}) | {r['tp']} | {r['tpc']} | {r['tpf']} |")
