@echo off
setlocal

set "PORT=8032"
set "URL=http://127.0.0.1:%PORT%/"

echo Starting Signal Stack on %URL%
start "" %URL%
node server.mjs
