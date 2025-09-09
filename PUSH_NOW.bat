@echo off
echo ========================================
echo    PUSHING TO GITHUB - MANDOUBI REPO
echo ========================================
echo.

echo Step 1: Setting up Git credentials...
git config user.name "tahaayman116"
git config user.email "tahaayman116@gmail.com"

echo Step 2: Adding all files...
git add .

echo Step 3: Creating commit...
git commit -m "Updated Mandoub project with Firebase optimizations and UI improvements"

echo Step 4: Setting remote URL...
git remote set-url origin https://github.com/tahaayman116/mandoubi.git

echo Step 5: Pushing to GitHub...
git push -u origin main

echo.
echo ========================================
echo    PUSH COMPLETE!
echo ========================================
pause
