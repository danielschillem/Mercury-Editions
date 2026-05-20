# Checklist Production Mercury

## 1) Variables d'environnement obligatoires

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_KEY=` — vérifier qu'une clé est générée (`php artisan key:generate --force` si vide)
- `APP_URL=https://votre-domaine.tld`
- `APP_TIMEZONE=UTC`
- `LOG_LEVEL=warning` (ou `error`)
- `MAIL_MAILER=smtp` (pas `log`) + `MAIL_PORT=587` ou `465`
- `MERCURY_EDITORIAL_EMAIL` renseigné pour recevoir les nouvelles soumissions de manuscrits
- `CACHE_STORE=redis` (ou store robuste de prod)
- `QUEUE_CONNECTION=redis` ou `database` avec worker actif
- `SESSION_DRIVER=redis` ou `database`
- `SESSION_SECURE_COOKIE=true`
- `SESSION_SAME_SITE=lax` (ou `none` si besoin cross-site + HTTPS)
- `ORANGE_OM_SIMULATE=false`
- `ORANGE_OM_ENV=prod`
- `ORANGE_OM_MERCHANT_MSISDN`, `ORANGE_OM_API_USERNAME`, `ORANGE_OM_API_PASSWORD` renseignés

## 2) Pré-déploiement

```bash
# Sauvegarder la base de données avant toute migration
cp database/database.sqlite database/database.sqlite.bak  # SQLite
# ou mysqldump / pg_dump selon le driver

composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
npm ci
npm run build
php artisan test
```

## 3) Migration et données

```bash
php artisan migrate --force
# php artisan db:seed --force   ← uniquement sur un fresh deploy (éviter en prod existante)
php artisan storage:link
```

## 4) Optimisation applicative (Laravel 11+)

```bash
php artisan optimize          # config + route + view + event cache en une commande
# Ou séparément :
# php artisan config:cache
# php artisan route:cache
# php artisan view:cache
# php artisan event:cache
```

## 5) Vérifications infra

- [ ] Permissions `storage/` et `bootstrap/cache/` : `chmod -R 775 storage bootstrap/cache`
- [ ] Lien symbolique `public/storage` créé (`php artisan storage:link`)
- [ ] Fichier `public/hot` absent — sa présence force le chargement depuis Vite (mort en prod)
- [ ] Worker queue démarré (`php artisan queue:work --daemon`)
- [ ] Rotation des logs configurée (logrotate ou `LOG_CHANNEL=daily`)
- [ ] HTTPS actif, certificat valide

## 6) Vérifications post-déploiement

- [ ] Test login admin (`/admin`)
- [ ] Test login client + panier + checkout
- [ ] Test paiement Orange Money réel sur sandbox/prod contrôlée
- [ ] Test ouverture reader eBook après achat
- [ ] Aucun endpoint sensible ne renvoie de jeton en clair
- [ ] `APP_DEBUG=false` confirmé (pas de stack trace publique)
