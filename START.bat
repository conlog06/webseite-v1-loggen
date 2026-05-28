@echo off
echo.
echo  Zahnarztpraxis Dr. Loggen -- Praxis-System
echo  =============================================
echo.
echo  Starte Server...
cd /d "%~dp0"
npm install
node server.js
pause
