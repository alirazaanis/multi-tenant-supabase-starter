#!/usr/bin/env bash
# Applies branch protection to main from .github/branch-protection.json
# Requires: gh CLI, repo admin access
set -euo pipefail

repo="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
branch="${2:-main}"
config="$(cd "$(dirname "$0")/.." && pwd)/branch-protection.json"

gh api "repos/${repo}/branches/${branch}/protection" \
  -X PUT \
  --input "$config"

echo "Branch protection applied: ${repo}@${branch}"
