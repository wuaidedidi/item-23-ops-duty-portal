#!/bin/sh
set -e

python manage.py wait_for_db
python manage.py migrate --noinput
python manage.py bootstrap_data

exec gunicorn portal.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 3 \
  --access-logfile - \
  --error-logfile -
