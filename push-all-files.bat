@echo off
cd /d "E:\elmeshnebb-"
git add .
git add -A
git add --all
git commit -m "Complete project upload - All files including Firebase optimizations"
git push origin main
pause
