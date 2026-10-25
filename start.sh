#!/bin/sh
set -eu
cd "$(dirname "$0")"

PORT=8032
APP_HOST=127.0.0.1
APP_BASE_URL="http://${APP_HOST}:${PORT}"
export PORT APP_HOST APP_BASE_URL

echo "Starting Signal Stack on ${APP_BASE_URL}/"
exec node server.mjs
