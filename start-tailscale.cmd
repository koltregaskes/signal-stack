@echo off
setlocal

if not "%~1"=="" set "APP_HOST=%~1"
if "%APP_HOST%"=="" (
  echo Please provide your Tailscale IP or set APP_HOST first.
  echo Example: start-tailscale.cmd 100.x.y.z
  exit /b 1
)

if "%PORT%"=="" set "PORT=8044"
set "APP_BASE_URL=http://%APP_HOST%:%PORT%"

echo Starting Signal Stack on %APP_BASE_URL%
echo This keeps the studio on your private Tailscale network instead of all interfaces.
node server.mjs
