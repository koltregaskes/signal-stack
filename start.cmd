@echo off
setlocal

set "PORT=8032"
set "APP_HOST=127.0.0.1"
set "APP_BASE_URL=http://%APP_HOST%:%PORT%"
set "URL=%APP_BASE_URL%/"

echo Starting Signal Stack on %URL%
start "" %URL%
node server.mjs
