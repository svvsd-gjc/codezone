#!/usr/bin/env bash
# Wrapper around cypress-parallel that relocates runner-results/ to cypress/results/
set -u
npx cypress-parallel -s cy:run -t 4 -d cypress/e2e
status=$?
if [ -d runner-results ]; then
  rm -rf cypress/results
  mv runner-results cypress/results
fi
exit $status
