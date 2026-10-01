#!/bin/bash
REPO_ROOT=$(git rev-parse --show-toplevel)
tmp=$(mktemp -d)
echo "test" > $tmp/test.txt
export GIT_INDEX_FILE="$tmp/index"
export GIT_WORK_TREE="$tmp"
export GIT_DIR="$REPO_ROOT/.git"
cd $tmp
git add .
tree=$(git write-tree)
echo "tree is $tree"
