@echo off
cd /d "E:\elmeshnebb-"
echo Removing submodule references...
git rm --cached starter-for-react
git submodule deinit --all --force
if exist .gitmodules del .gitmodules
git add .
git commit -m "Remove submodule references completely"
git push origin main
echo Done!
