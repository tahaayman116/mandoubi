@echo off
echo Fixing Git submodule issue completely...
cd /d "E:\elmeshnebb-"

echo Step 1: Remove all submodule references
git rm --cached starter-for-react 2>nul
git submodule deinit --all --force 2>nul
if exist .gitmodules del .gitmodules

echo Step 2: Add starter-for-react as regular folder
git add starter-for-react
git add .

echo Step 3: Commit changes
git commit -m "FINAL FIX: Remove all submodule references and add starter-for-react as regular folder"

echo Step 4: Force push to GitHub
git push --force origin main

echo Done! Submodule issue should be resolved.
pause
