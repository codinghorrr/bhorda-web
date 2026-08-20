#!/usr/bin/env bash
# Push this repository to GitHub.
# Requires GH_TOKEN (or `gh auth login`) with repo scope.
#
# Usage:
#   GH_TOKEN=ghp_... bash scripts/push-to-github.sh
#   GH_TOKEN=ghp_... GITHUB_REPO=your-org/bhorda-web bash scripts/push-to-github.sh
set -euo pipefail

cd "$(dirname "$0")/.."

GITHUB_REPO="${GITHUB_REPO:-codinghorrr/bhorda-web}"
GITHUB_HOST="${GITHUB_HOST:-github.com}"
GITHUB_BRANCH="${GITHUB_BRANCH:-main}"

if ! command -v gh >/dev/null 2>&1; then
	echo "ERROR: GitHub CLI (gh) is required." >&2
	exit 1
fi

if [[ -z "${GH_TOKEN:-}" ]] && ! gh auth status >/dev/null 2>&1; then
	echo "ERROR: Set GH_TOKEN or run 'gh auth login' first." >&2
	exit 1
fi

export GH_TOKEN="${GH_TOKEN:-}"

gh auth setup-git

if gh repo view "$GITHUB_REPO" >/dev/null 2>&1; then
	echo "GitHub repo $GITHUB_REPO already exists."
else
	echo "Creating GitHub repo $GITHUB_REPO ..."
	gh repo create "$GITHUB_REPO" --public --description "Gayatri Kamdhenu Sevatirth, Bhorda — bilingual Cloudflare Workers site"
fi

if git remote get-url github >/dev/null 2>&1; then
	git remote set-url github "https://${GITHUB_HOST}/${GITHUB_REPO}.git"
else
	git remote add github "https://${GITHUB_HOST}/${GITHUB_REPO}.git"
fi

echo "Pushing ${GITHUB_BRANCH}, all branches, and tags to GitHub ..."
git push github "${GITHUB_BRANCH}" --tags
git push github --all

echo "Done: https://${GITHUB_HOST}/${GITHUB_REPO}"
