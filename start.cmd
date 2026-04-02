@echo off
setlocal

set "PORT=8032"
set "URL=http://127.0.0.1:%PORT%/web/"

echo Starting Signal Stack on %URL%
start "" %URL%
python -m http.server %PORT%
