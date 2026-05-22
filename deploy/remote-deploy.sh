#!/usr/bin/env bash
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/var/www/mercury-editions}"
DOMAIN_NAME="${DOMAIN_NAME:-_}"
APP_DIR="$DEPLOY_PATH/current"
SHARED_DIR="$DEPLOY_PATH/shared"
SUDO=""
if [[ "$(id -u)" -ne 0 ]]; then
  SUDO="sudo"
fi

cd "$APP_DIR"

mkdir -p "$SHARED_DIR/storage" "$SHARED_DIR/database"
mkdir -p storage bootstrap/cache

if [[ ! -f "$SHARED_DIR/.env" ]]; then
  echo "Missing $SHARED_DIR/.env. The CI write-remote-env step must run before remote-deploy." >&2
  exit 1
fi

ln -sfn "$SHARED_DIR/.env" .env
rm -rf storage
ln -sfn "$SHARED_DIR/storage" storage

mkdir -p \
  storage/app/public \
  storage/framework/cache/data \
  storage/framework/sessions \
  storage/framework/testing \
  storage/framework/views \
  storage/logs

if grep -q '^DB_CONNECTION=sqlite' "$SHARED_DIR/.env"; then
  touch "$SHARED_DIR/database/database.sqlite"
  mkdir -p database
  ln -sfn "$SHARED_DIR/database/database.sqlite" database/database.sqlite
fi

set -a
source "$SHARED_DIR/.env"
set +a

if [[ "${DB_CONNECTION:-}" == "pgsql" && ( "${DB_HOST:-127.0.0.1}" == "127.0.0.1" || "${DB_HOST:-}" == "localhost" ) ]]; then
  if [[ ! "${DB_DATABASE:-}" =~ ^[A-Za-z_][A-Za-z0-9_]*$ || ! "${DB_USERNAME:-}" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
    echo "DB_DATABASE and DB_USERNAME must be simple PostgreSQL identifiers." >&2
    exit 1
  fi

  password_sql="${DB_PASSWORD//\'/\'\'}"
  sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USERNAME}') THEN
    CREATE ROLE "${DB_USERNAME}" LOGIN PASSWORD '${password_sql}';
  ELSE
    ALTER ROLE "${DB_USERNAME}" WITH LOGIN PASSWORD '${password_sql}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE "${DB_DATABASE}" OWNER "${DB_USERNAME}"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_DATABASE}')\gexec
ALTER DATABASE "${DB_DATABASE}" OWNER TO "${DB_USERNAME}";
SQL
fi

composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
npm ci
npm run build

php artisan migrate --force
php artisan storage:link --force
php artisan optimize:clear
php artisan optimize

PHP_FPM_SOCK="$(find /run/php -maxdepth 1 -name 'php8.4-fpm.sock' -print -quit)"
if [[ -z "$PHP_FPM_SOCK" ]]; then
  echo "php8.4-fpm.sock not found." >&2
  exit 1
fi

sed \
  -e "s#__DOMAIN_NAME__#$DOMAIN_NAME#g" \
  -e "s#__DEPLOY_PATH__#$DEPLOY_PATH#g" \
  -e "s#__PHP_FPM_SOCK__#$PHP_FPM_SOCK#g" \
  deploy/nginx-mercury.conf | $SUDO tee /etc/nginx/sites-available/mercury-editions >/dev/null

$SUDO ln -sfn /etc/nginx/sites-available/mercury-editions /etc/nginx/sites-enabled/mercury-editions
$SUDO rm -f /etc/nginx/sites-enabled/default
$SUDO nginx -t
$SUDO systemctl reload nginx

sed \
  -e "s#__APP_DIR__#$APP_DIR#g" \
  deploy/mercury-queue.service | $SUDO tee /etc/systemd/system/mercury-queue.service >/dev/null

$SUDO systemctl daemon-reload
$SUDO systemctl enable --now mercury-queue.service
$SUDO systemctl restart mercury-queue.service

$SUDO chown -R www-data:www-data "$SHARED_DIR/storage" "$SHARED_DIR/database" bootstrap/cache
$SUDO chmod -R ug+rwX "$SHARED_DIR/storage" "$SHARED_DIR/database" bootstrap/cache

echo "Laravel deployment complete."
