@echo off
chcp 65001 >nul
title Cantine Scolaire - Application
cd /d "%~dp0"

echo ================================================================
echo   🍽️  LANCEMENT DE L'APPLICATION DE GESTION DE CANTINE SCOLAIRE
echo ================================================================
echo.
echo Ouverture automatique de votre navigateur dans 2 secondes...
echo (L'application fonctionne même sans connexion Internet)
echo.

start http://localhost:3000

node serveur.js
if errorlevel 1 (
    call npm.cmd run dev
)

pause
