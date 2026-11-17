#!/bin/sh
# Runs the webkit project inside the Playwright image: the host's libraries do not carry WebKit.
# SC2 drives a finger through CDP, which Playwright's WebKit has no session for.
set -eu
root=$(git rev-parse --show-superproject-working-tree)
root=${root:-$PWD}
vitest=$(dirname "$(node -p 'require.resolve("vitest/package.json")')")/vitest.mjs
exec docker run --rm --ipc=host --user "$(id -u):$(id -g)" -e HOME=/tmp -e CI=1 \
  -v "$root:$root" -w "$PWD" mcr.microsoft.com/playwright:v1.63.0-noble \
  node "$vitest" run --project webkit --testNamePattern '^(?!.*\bSC2 )' "$@"
