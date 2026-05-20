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

if grep -q '^DB_CONNECTION=sqlite' "$SHARED_DIR/.env"; then
  touch "$SHARED_DIR/database/database.sqlite"
  mkdir -p database
  ln -sfn "$SHARED_DIR/database/database.sqlite" database/database.sqlite
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
