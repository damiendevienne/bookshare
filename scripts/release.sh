#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <version>  (example: 0.9.1 or v0.9.1)" >&2
  exit 2
fi

version="${1#v}"
if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$ ]]; then
  echo "Invalid version: $version" >&2
  exit 2
fi

if [[ -n "$(git status --short)" ]]; then
  echo "Working tree is not clean. Commit or stash existing changes first." >&2
  exit 1
fi

if git rev-parse "v$version" >/dev/null 2>&1; then
  echo "Tag v$version already exists." >&2
  exit 1
fi

npm --prefix frontend version "$version" --no-git-tag-version
git add frontend/package.json frontend/package-lock.json
git commit -m "Release v$version"
git tag -a "v$version" -m "Release v$version"

echo
echo "Release v$version created. Push it with:"
echo "  git push origin dev --follow-tags"
