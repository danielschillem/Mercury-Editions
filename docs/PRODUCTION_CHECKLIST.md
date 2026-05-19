# Checklist Production Mercury

## 1) Variables d'environnement obligatoires

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://votre-domaine.tld`
- `LOG_LEVEL=warning` (ou `error`)
- `MAIL_MAILER=smtp` (pas `log`)
- `CACHE_STORE=redis` (ou store robuste de prod)
- `QUEUE_CONNECTION=redis` ou `database` avec worker actif
- `SESSION_DRIVER=redis` ou `database`
- `SESSION_SECURE_COOKIE=true`
- `SESSION_SAME_SITE=lax` (ou `none` si besoin cross-site + HTTPS)
- `ORANGE_OM_SIMULATE=false`
- `ORANGE_OM_ENV=prod`
- `ORANGE_OM_MERCHANT_MSISDN`, `ORANGE_OM_API_USERNAME`, `ORANGE_OM_API_PASSWORD` renseignés

## 2) Pré-déploiement

1. `composer install --no-dev --prefer-dist --optimize-autoloader`
2. `npm ci`
3. `npm run build`
4. `php artisan test`
5. `php artisan migrate --force`

## 3) Optimisation applicative

1. `php artisan config:cache`
2. `php artisan route:cache`
3. `php artisan view:cache`
4. `php artisan event:cache`

## 4) Services runtime

- Démarrer un worker queue (`php artisan queue:work`)
- Vérifier la rotation des logs
- Vérifier les permissions `storage/` et `bootstrap/cache/`

## 5) Vérifications post-déploiement

- Test login admin (`/admin`)
- Test login client + panier + checkout
- Test paiement Orange Money réel sur sandbox/prod contrôlée
- Test ouverture reader eBook après achat
- Vérifier qu'aucun endpoint sensible ne renvoie de jeton d'accès en public
