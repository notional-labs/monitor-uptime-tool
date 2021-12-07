#!/bin/sh

# If a command fails then the deploy stops
set -e

# Build the project
printf "\033[0;32mDeploying updates to GitHub...\033[0m\n"
npm run build

echo ""

# Commit and push to GitHub Page repository
printf "\033[0;32mGo to /dist...\033[0m\n"
cd dist
git init
git add .
echo ""
echo "\033[0;32mCommitting changes...\033[0m\n"
git commit -m "deploy"
git push -f --set-upstream git@github.com:MasterPi-2124/uptime-monitor-tool.git master:gh-pages

printf "\033[0;32mChanges are commited and push successfully! Go to https://masterpi-2124.github.io/uptime-monitor-tool to see.\033[0m\n"
printf "\033[0;32mFinishing...\033[0m\n"