---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-021-verification-infrastructure
section_title: "Verification Infrastructure"
section_number: null
pages: 16-16
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
Verification typically uses pytest with the CTRF (Common Test Report Format) output (85 of 87 tasks;
the remaining two drive a Python checker script directly); every task’s test.sh writes its reward
to /logs/verifier/reward.txt. The canonical test.sh installs dependencies, runs pytest, and
writes a binary reward in the minimal pass/fail case:
#!/ bin/bash
pip3
install
--break -system -packages
pytest
pytest -json -ctrf
mkdir -p /logs/verifier
pytest
--ctrf /logs/verifier/ctrf.json \
/verifier/ test_outputs .py -rA -v
if [ $? -eq 0 ]; then
echo 1 > /logs/verifier/reward.txt
else
echo 0 > /logs/verifier/reward.txt
fi
exit 0
A task passes if and only if all assertions in test_outputs.py succeed (reward = 1); otherwise the
verifier records a fail (reward = 0).
B.4
