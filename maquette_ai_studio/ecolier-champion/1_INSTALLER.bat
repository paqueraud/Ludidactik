@echo off
chcp 65001 > nul
title Installation - Écolier Champion

echo ========================================================
echo    🎒 INSTALLATION DE L'APPLICATION ÉCOLIER CHAMPION
echo ========================================================
echo.

:: Vérifier si Node.js est installé
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas détecté sur votre ordinateur !
    echo.
    echo Pour faire fonctionner l'application hors-ligne, installez gratuitement Node.js :
    echo Rendez-vous sur : https://nodejs.org/ (choisissez la version LTS).
    echo.
    echo Une fois Node.js installé, relancez ce fichier 1_INSTALLER.bat.
    echo ========================================================
    pause
    exit /b
)

echo [1/2] Node.js détecté avec succès !
echo [2/2] Installation des dépendances en cours (veuillez patienter quelques instants)...
echo.

call npm install --legacy-peer-deps

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo    ✅ INSTALLATION RÉUSSIE AVEC SUCCÈS !
    echo ========================================================
    echo.
    echo Vous pouvez maintenant double-cliquer sur le fichier :
    echo        👉 2_LANCER.bat
    echo pour démarrer l'application dans votre navigateur !
    echo.
) else (
    echo.
    echo [ATTENTION] Tentative avec l'option force...
    call npm install --force
    echo.
    echo Si l'installation s'est terminée, essayez de lancer 2_LANCER.bat.
)

echo ========================================================
pause
