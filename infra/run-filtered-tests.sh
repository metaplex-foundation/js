#!/bin/bash

# error output colour
RED() { echo $'\e[1;31m'$1$'\e[0m'; }

if [ ! -z "$1" ]; then
  for file in $(find . -path './packages/*/test/*/'$1'.test.ts' -type f); do
    esr $file | tap-spec
  done
else
  echo "$(RED "Error: ")Please specify a test file pattern"
  exit 1
fi
