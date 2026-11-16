@echo off
chcp 65001 > nul
echo ========================================================
echo       ONROUN BD - Syncing & Uploading to GitHub
echo ========================================================
echo.
echo [1/3] Adding files to git...
git add .

echo [2/3] Creating commit...
git commit -m "Auto update: %DATE% %TIME%"

echo [3/3] Pushing to GitHub (main branch)...
git push origin main

echo.
echo ========================================================
echo   [DONE] GitHub-e shob kichu shofolbhabe upload hoyeche!
echo ========================================================
pause
