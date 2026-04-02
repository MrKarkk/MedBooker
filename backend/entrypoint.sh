#!/bin/sh
set -e

mkdir -p /app/logs
chown -R django:django /app/logs
chmod -R 755 /app/logs

exec su-exec django "$@"
