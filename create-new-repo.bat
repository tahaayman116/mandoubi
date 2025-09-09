@echo off
echo Creating fresh repository without submodule history...
cd /d "E:\elmeshnebb-"

echo Step 1: Remove .git folder to start fresh
rmdir /s /q .git 2>nul

echo Step 2: Initialize new git repository
git init

echo Step 3: Configure git
git config user.name "tahaayman116"
git config user.email "tahaayman116@gmail.com"

echo Step 4: Add all files
git add .

echo Step 5: Create initial commit
git commit -m "Initial commit: Mandoub Election System with Firebase optimizations"

echo Step 6: Add remote origin
git remote add origin https://github.com/tahaayman116/mandoubi.git

echo Step 7: Push to GitHub (force)
git push -u --force origin main

echo Done! Fresh repository created without submodule issues.
pause
