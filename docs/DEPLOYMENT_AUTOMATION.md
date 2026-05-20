# Automated Deployment

This project deploys from GitHub Actions to a DigitalOcean droplet through SSH. DNS can be updated automatically through the Hostinger API when the Hostinger variables are present.

## Required GitHub Secrets

Set these in GitHub: `Settings` -> `Secrets and variables` -> `Actions` -> `Secrets`.

- `SSH_PRIVATE_KEY`: private key allowed to SSH into the droplet
- `APP_KEY`: Laravel app key for production

## Built-in Defaults

- `DROPLET_IP`: `64.226.123.122`
- `DOMAIN_NAME`: `editionsmercury.com`

## Optional GitHub Variables

Set these in GitHub: `Settings` -> `Secrets and variables` -> `Actions` -> `Variables`.

- `DEPLOY_USER`: defaults to `root`
- `DEPLOY_PATH`: defaults to `/var/www/mercury-editions`
- `DROPLET_IP`: overrides the default droplet IP
- `DOMAIN_NAME`: overrides the default production domain
- `APP_TIMEZONE`, `APP_LOCALE`, `LOG_CHANNEL`, `LOG_LEVEL`
- `DB_CONNECTION`, `SESSION_DRIVER`, `QUEUE_CONNECTION`, `CACHE_STORE`

## Optional GitHub Secrets

- `HOSTINGER_TOKEN`: enables DNS automation
- `DIGITALOCEAN_TOKEN`: verifies that `DROPLET_IP` belongs to an accessible DigitalOcean droplet before deploy
- `MAIL_HOST`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`
- `ORANGE_OM_MERCHANT_MSISDN`, `ORANGE_OM_API_USERNAME`, `ORANGE_OM_API_PASSWORD`

## Pipeline Behavior

On `main`, `master`, or a manual workflow dispatch, GitHub Actions will:

1. validate Composer metadata and PHP syntax;
2. build Vite assets with Node 22;
3. verify the droplet through DigitalOcean when `DIGITALOCEAN_TOKEN` is set;
4. update Hostinger `A` records for `@` and `www` when `HOSTINGER_TOKEN` is set;
5. provision the droplet with Nginx, PHP 8.4, Composer, Node 22, Supervisor and SQLite;
6. sync the repository to the droplet;
7. write the production `.env` from GitHub secrets and variables;
8. run Composer, npm build, migrations, storage link, Laravel optimization, Nginx reload and queue worker restart.

## First Server Preparation

Before the first deployment, add the public SSH key matching `SSH_PRIVATE_KEY` to the droplet user:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "ssh-ed25519 AAAA..." >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

After DNS points to the droplet, install HTTPS with Certbot on the server:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
```
