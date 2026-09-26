#!/usr/bin/env bash
# Checks a pull request against the merge-commit rules in AGENTS.md
# (Versioning and Releases):
#
# - the PR title is a Conventional Commit, because it becomes the title of the
#   merge commit on main and the changelog line
# - no commit on the branch uses a release type (feat, fix, perf, refactor,
#   revert) or marks a breaking change, because release-please would list the
#   change a second time
#
# Usage: check-pr-conventions.sh "<pr title>" <base sha> <head sha>
set -euo pipefail

title=$1
base=$2
head=$3

types='feat|fix|perf|refactor|revert|docs|test|ci|build|style|chore'
release_types='feat|fix|perf|refactor|revert'
failed=0

if ! grep -qE "^(${types})(\([a-z0-9-]+\))?!?: [^ ]" <<<"$title"; then
  echo "::error::The PR title must follow Conventional Commits, e.g. 'feat(spaces): filter spaces by rooms'. It becomes the changelog line."
  failed=1
fi

# release-please also reads Conventional Commit lines in commit bodies, so check
# every line of each message, not only the subject.
for sha in $(git rev-list --no-merges "${base}..${head}"); do
  message=$(git log -1 --format=%B "$sha")
  commit=$(git log -1 --format='%h %s' "$sha")
  if grep -qE "^(${release_types})(\([^)]*\))?!?: " <<<"$message"; then
    echo "::error::Commit ${commit} uses a release type. Use test, docs, chore, ci, build or style on the branch; the PR title is the changelog line."
    failed=1
  fi
  if grep -qE "^[a-z]+(\([^)]*\))?!: |^BREAKING[ -]CHANGE: " <<<"$message"; then
    echo "::error::Commit ${commit} marks a breaking change. Mark it with ! in the PR title instead, e.g. 'feat!: …'."
    failed=1
  fi
done

if [ "$failed" -eq 0 ]; then
  echo "The PR title and the branch commits follow the merge commit rules."
fi
exit "$failed"
