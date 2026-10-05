@echo off
chcp 65001 > nul
title Écolier Champion - Lancement en cours...

echo ========================================================
echo    🎒 LANCEMENT DE L'APPLICATION ÉCOLIER CHAMPION
echo ========================================================
echo.

:: Vérifier si node_modules existe
if not exist "node_modules\" (
    echo [INFO] Premier lancement détecté : installation des composants...
    call 1_INSTALLER.bat
)

echo [INFO] Démarrage du serveur local hors-ligne...
echo [INFO] Votre navigateur va s'ouvrir automatiquement sur :
echo        👉 http://localhost:3000
echo.
echo (Laissez cette fenêtre ouverte pendant que vous utilisez l'application).
echo ========================================================
echo.

:: Ouvrir automatiquement le navigateur après 2 secondes
start "" cmd /c "timeout /t 2 >nul & start http://localhost:3000"

:: Lancer le serveur local Vite
call npm run dev

pause
