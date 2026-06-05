#!/usr/bin/env bash
# Creates or updates the main branch ruleset from .github/ruleset-main.json
# Requires: gh CLI, repo admin access
set -euo pipefail

repo="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
config="$(cd "$(dirname "$0")/.." && pwd)/ruleset-main.json"
ruleset_name="$(jq -r .name "$config")"

existing_id="$(gh api "repos/${repo}/rulesets" --jq ".[] | select(.name == \"${ruleset_name}\") | .id" | head -1)"

if [ -n "$existing_id" ]; then
  gh api "repos/${repo}/rulesets/${existing_id}" -X PUT --input "$config"
  echo "Ruleset updated: ${repo} #${existing_id} (${ruleset_name})"
else
  gh api "repos/${repo}/rulesets" -X POST --input "$config"
  echo "Ruleset created: ${repo} (${ruleset_name})"
fi

echo "Remove legacy branch protection if present:"
echo "  gh api repos/${repo}/branches/main/protection -X DELETE"
