#!/usr/bin/env bash
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/var/www/mercury-editions}"
NODE_VERSION="${NODE_VERSION:-22}"
SUDO=""
if [[ "$(id -u)" -ne 0 ]]; then
  SUDO="sudo"
fi
CURRENT_USER="$(id -un)"

export DEBIAN_FRONTEND=noninteractive

$SUDO apt-get update -qq
$SUDO apt-get install -yqq ca-certificates curl gnupg lsb-release software-properties-common unzip git rsync nginx supervisor sqlite3

if ! apt-cache show php8.4-cli >/dev/null 2>&1; then
  $SUDO add-apt-repository -y ppa:ondrej/php
  $SUDO apt-get update -qq
fi

$SUDO apt-get install -yqq \
  php8.4-cli php8.4-fpm php8.4-sqlite3 php8.4-mbstring php8.4-xml \
  php8.4-curl php8.4-zip php8.4-bcmath php8.4-intl

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | sed 's/^v//' | cut -d. -f1)" != "$NODE_VERSION" ]]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | $SUDO bash -
  $SUDO apt-get install -yqq nodejs
fi

if ! command -v composer >/dev/null 2>&1; then
  EXPECTED_SIGNATURE="$(curl -fsSL https://composer.github.io/installer.sig)"
  php -r "copy('https://getcomposer.org/installer', '/tmp/composer-setup.php');"
  ACTUAL_SIGNATURE="$(php -r "echo hash_file('sha384', '/tmp/composer-setup.php');")"
  if [[ "$EXPECTED_SIGNATURE" != "$ACTUAL_SIGNATURE" ]]; then
    rm -f /tmp/composer-setup.php
    echo "Invalid Composer installer signature." >&2
    exit 1
  fi
  $SUDO php /tmp/composer-setup.php --install-dir=/usr/local/bin --filename=composer --quiet
  rm -f /tmp/composer-setup.php
fi

$SUDO mkdir -p "$DEPLOY_PATH/current" "$DEPLOY_PATH/shared/storage" "$DEPLOY_PATH/shared/database"
$SUDO chown -R "$CURRENT_USER":"$CURRENT_USER" "$DEPLOY_PATH"

echo "Droplet provisioning complete."
