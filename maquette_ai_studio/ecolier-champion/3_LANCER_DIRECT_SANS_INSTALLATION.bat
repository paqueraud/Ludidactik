@echo off
chcp 65001 > nul
title Écolier Champion - Démarrage direct

echo ========================================================
echo    🎒 DÉMARRAGE DIRECT DE L'APPLICATION ÉCOLIER CHAMPION
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas détecté sur votre ordinateur !
    echo.
    echo Installez gratuitement Node.js depuis : https://nodejs.org/
    echo Puis relancez ce fichier.
    pause
    exit /b
)

echo [INFO] Démarrage du serveur autonome local (sans installation npm requise)...
echo [INFO] Votre navigateur va s'ouvrir sur : http://localhost:3000
echo.
echo (Laissez cette fenêtre ouverte pendant que vous jouez)
echo ========================================================
echo.

node local-server.js

pause
