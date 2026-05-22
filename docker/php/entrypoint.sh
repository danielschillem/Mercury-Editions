#!/usr/bin/env sh
set -eu

cd /var/www/html

if [ ! -f .env ] && [ -f .env.docker ]; then
    cp .env.docker .env
fi

if [ ! -f vendor/autoload.php ]; then
    composer install --no-interaction --prefer-dist
fi

if [ -f artisan ] && ! grep -q '^APP_KEY=base64:' .env 2>/dev/null; then
    php artisan key:generate --force
fi

if [ "${WAIT_FOR_DB:-false}" = "true" ]; then
    php -r '$h=getenv("DB_HOST") ?: "pgsql"; $p=(int)(getenv("DB_PORT") ?: 5432); for ($i=0; $i<60; $i++) { $s=@fsockopen($h, $p); if ($s) { fclose($s); exit(0); } sleep(1); } fwrite(STDERR, "Database not reachable\n"); exit(1);'
fi

if [ "${RUN_MIGRATIONS:-false}" = "true" ] && [ -f artisan ]; then
    php artisan migrate --force
    php artisan storage:link || true
fi

exec "$@"
