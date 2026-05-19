<div align="center">

# 📚 Mercury Editions

**Librairie Numérique du Burkina Faso**

[![Version](https://img.shields.io/badge/version-1.2.0--dev-blue.svg)](CHANGELOG.md)
[![Laravel](https://img.shields.io/badge/Laravel-13.x-FF2D20.svg)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19.x-61DAFB.svg)](https://react.dev)
[![PHP](https://img.shields.io/badge/PHP-≥8.4-777BB4.svg)](https://php.net)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

*La première plateforme dédiée à la promotion et la vente d'œuvres littéraires d'auteurs burkinabè.*

</div>

---

## 📋 Table des matières

- [Présentation](#-présentation)
- [MVP — Produit Minimum Viable](#-mvp--produit-minimum-viable)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture technique](#-architecture-technique)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Lancement](#-lancement)
- [Structure du projet](#-structure-du-projet)
- [API — Paiement Orange Money](#-api--paiement-orange-money)
- [Roadmap](#-roadmap)
- [Contribution](#-contribution)
- [Auteur](#-auteur)
- [Licence](#-licence)

---

## 🎯 Présentation

**Mercury Editions** est une application web SPA (Single Page Application) de librairie numérique spécialisée dans la littérature burkinabè. Elle permet de découvrir, acheter et lire des œuvres d'auteurs du Burkina Faso via un paiement mobile Orange Money.

Le projet valorise le patrimoine littéraire local en proposant un catalogue de **12 œuvres** de **6 auteurs** emblématiques couvrant les genres : roman, poésie, essai, conte et littérature jeunesse.

### Auteurs mis en avant

| Auteur | Spécialité | Origine |
|--------|-----------|---------|
| **Norbert Zongo** (1949–1998) | Roman, Journalisme, Satire politique | Koudougou |
| **Monique Ilboudo** (1959–) | Roman, Droit, Essai féministe | Ouagadougou |
| **Joseph Ki-Zerbo** (1922–2006) | Essai, Histoire, Philosophie | Toma |
| **Sophie Heidi Kam** (1970–) | Théâtre, Poésie, Essai | Ouagadougou |
| **Titinga Frédéric Pacéré** (1943–) | Poésie, Droit, Ethnographie | Manéga |
| **Augustin Sondé Bazié** (1965–) | Jeunesse, Conte, Pédagogie | Bobo-Dioulasso |

---

## 🚀 MVP — Produit Minimum Viable

> **Version 1.0.0** — 18 mars 2026

Le MVP livre les fonctionnalités essentielles pour une mise en ligne fonctionnelle :

| # | Fonctionnalité | Statut |
|---|----------------|--------|
| 1 | Catalogue de 12 livres avec recherche et filtrage par catégorie | ✅ Livré |
| 2 | Fiches auteurs détaillées (bio, chronologie, distinctions) | ✅ Livré |
| 3 | Fiche livre complète (description, résumé, citation, specs) | ✅ Livré |
| 4 | Panier d'achat persistant (localStorage) | ✅ Livré |
| 5 | Paiement Orange Money avec OTP (mode simulation + production) | ✅ Livré |
| 6 | Bibliothèque personnelle des achats | ✅ Livré |
| 7 | Lecteur de livres numériques intégré | ✅ Livré |
| 8 | Design responsive (mobile, tablette, desktop) | ✅ Livré |
| 9 | SPA React sans rechargement de page | ✅ Livré |
| 10 | Déploiement Hostinger-ready (archives dist/) | ✅ Livré |

---

## ✨ Fonctionnalités

### Frontend

- **Navigation SPA** — React 19 + système de modales (pas de routing multi-page)
- **Héro animé** — Section d'accueil avec les 3 livres phares
- **Catalogue filtrable** — 5 catégories : Roman, Poésie, Essai, Conte, Jeunesse
- **Sélecteur de format** — eBook ou Physique (+60% pour le physique)
- **Profils auteurs** — Biographie HTML, chronologie interactive, prix littéraires
- **Panier intelligent** — Persistance localStorage + synchronisation serveur
- **Checkout 4 étapes** — Formulaire → USSD code → OTP 6 digits → Confirmation
- **Espace client** — Profil, commandes, bibliothèque, wishlist
- **Bibliothèque personnelle** — Suivi des achats avec accès aux ebooks
- **Lecteur intégré** — Lecteur de livres numériques (PDF/EPUB)
- **Système d'avis** — Notes et commentaires sur les livres
- **Liste de souhaits** — Wishlist synchronisée avec le compte
- **Design premium** — Gradients, animations, responsive

### Backend

- **API REST complète** — 65+ endpoints (catalogue, auth, commandes, admin)
- **Authentification session** — Login/register avec vérification email
- **Gestion des commandes** — Création, suivi, historique
- **Paiement Orange Money** — Protocole XML-RPC avec mode simulation
- **Validation robuste** — Téléphone burkinabè (8 chiffres), OTP (6 chiffres)
- **Dashboard admin** — Statistiques temps réel, gestion CRUD
- **Newsletter** — Inscription avec token de désinscription
- **Contact** — Messagerie avec suivi admin
- **Tests feature** — 20 tests couvrant tous les flux critiques

---

## 🏗 Architecture technique

```
┌─────────────────────────────────────────────────┐
│                    Client                        │
│   React 19 + AppContext (état global)            │
│   Vite 7 (bundler) + Tailwind CSS 4             │
└────────────────────┬────────────────────────────┘
                     │ HTTP (axios)
                     ▼
┌─────────────────────────────────────────────────┐
│               Laravel 13 (PHP 8.4+)              │
│   Route SPA catch-all: GET /{any?} → app.blade   │
│   Route API: POST /api/payments/orange           │
│   PaymentController → XML-RPC                    │
└────────────────────┬────────────────────────────┘
                     │ cURL / XML-RPC
                     ▼
┌─────────────────────────────────────────────────┐
│           API Orange Money Burkina Faso           │
│   Prod: https://apiom.orange.bf/                 │
│   Test: https://testom.orange.bf/                │
└─────────────────────────────────────────────────┘
```

**Stack complète :**

| Couche | Technologie | Version |
|--------|------------|---------|
| Langage backend | PHP | ≥ 8.4 |
| Framework backend | Laravel | 13.x |
| Langage frontend | JavaScript (JSX) | ES2022 |
| Framework frontend | React | 19.x |
| Bundler | Vite | 7.x |
| CSS | Tailwind CSS + CSS custom | 4.x |
| HTTP client | Axios | 1.11.x |
| Base de données | SQLite | — |
| Paiement | Orange Money XML-RPC | — |
| Polices | Google Fonts (Playfair Display, Source Sans 3, Noto Serif) | — |

---

## 📌 Prérequis

| Outil | Version minimum |
|-------|----------------|
| PHP | 8.4+ |
| Composer | 2.x |
| Node.js | 20+ |
| npm | 10+ |

---

## 🔧 Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/votre-org/mercury.git
cd mercury

# 2. Installation automatique (recommandé)
composer setup

# Ou manuellement :
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
npm install
npm run build
```

---

## ⚙ Configuration

### Variables d'environnement (.env)

```env
# Application
APP_NAME=Mercury
APP_URL=http://localhost:8000

# Base de données (SQLite par défaut)
DB_CONNECTION=sqlite

# Orange Money — Paiement
ORANGE_OM_SIMULATE=false         # false recommandé (production)
ORANGE_OM_ENV=test               # test | prod
ORANGE_COUNTRY_CODE=226          # Burkina Faso
ORANGE_OM_URL_PROD=https://apiom.orange.bf/
ORANGE_OM_URL_TEST=https://testom.orange.bf/
ORANGE_OM_MERCHANT_MSISDN=       # Numéro marchand
ORANGE_OM_API_USERNAME=          # Identifiant API
ORANGE_OM_API_PASSWORD=          # Mot de passe API
ORANGE_OM_PROVIDER=101
ORANGE_OM_PROVIDER2=101
ORANGE_OM_PAYID=12
ORANGE_OM_PAYID2=12
```

> **Note :** Activez `ORANGE_OM_SIMULATE=true` uniquement en local/sandbox. En production, gardez `ORANGE_OM_SIMULATE=false`.

Checklist de déploiement recommandée : `docs/PRODUCTION_CHECKLIST.md`.

---

## 🚀 Lancement

```bash
# Développement (serveur + Vite HMR)
composer dev

# Ou manuellement :
php artisan serve --port=8000 &
npm run dev

# Production
npm run build
php artisan serve
```

L'application est accessible à : **http://localhost:8000**

---

## 📁 Structure du projet

```
mercury/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/                   # Contrôleurs admin (Dashboard, CRUD)
│   │   │   ├── AuthorController.php     # API auteurs
│   │   │   ├── BookController.php       # API livres
│   │   │   ├── BookReaderController.php # Lecteur PDF/EPUB
│   │   │   ├── BookReviewController.php # Avis lecteurs
│   │   │   ├── ContactController.php    # Formulaire contact
│   │   │   ├── CustomerAuthController.php # Auth client
│   │   │   ├── NewsletterController.php # Newsletter
│   │   │   ├── OrderController.php      # Commandes
│   │   │   └── PaymentController.php    # API Orange Money
│   │   ├── Middleware/
│   │   └── Traits/
│   └── Models/
│       ├── Author.php                   # Auteurs
│       ├── Book.php                     # Livres
│       ├── BookReview.php               # Avis
│       ├── ContactMessage.php           # Messages contact
│       ├── NewsletterSubscriber.php     # Abonnés newsletter
│       ├── Order.php                    # Commandes
│       ├── OrderItem.php                # Items commande
│       ├── User.php                     # Utilisateurs
│       └── Wishlist.php                 # Liste souhaits
├── config/
│   ├── mercury.php                      # Config Mercury
│   └── orangemoney.php                  # Config Orange Money
├── database/
│   ├── migrations/                      # 15+ migrations
│   └── seeders/                         # Seeders auteurs/livres
├── resources/
│   ├── css/
│   │   ├── app.css                      # Design system Mercury (6000+ lignes)
│   │   └── admin.css                    # Dashboard admin
│   ├── js/
│   │   ├── App.jsx                      # Point d'entrée React
│   │   ├── context/
│   │   │   ├── AppContext.jsx           # État global (panier, modales)
│   │   │   ├── AuthContext.jsx          # Auth utilisateur
│   │   │   ├── ThemeContext.jsx         # Thème
│   │   │   └── ToastContext.jsx         # Notifications
│   │   ├── components/
│   │   │   ├── AccountPage.jsx          # Espace client
│   │   │   ├── AuthModal.jsx            # Connexion/inscription
│   │   │   ├── AuthorsSection.jsx       # Galerie auteurs
│   │   │   ├── CartPanel.jsx            # Panier
│   │   │   ├── Catalog.jsx              # Catalogue livres
│   │   │   ├── Checkout.jsx             # Paiement Orange Money
│   │   │   ├── ContactModal.jsx         # Contact
│   │   │   ├── Hero.jsx                 # Section héro
│   │   │   ├── MyLibrary.jsx            # Bibliothèque perso
│   │   │   ├── Navbar.jsx               # Navigation
│   │   │   └── Reader.jsx               # Lecteur livres
│   │   └── admin/                       # Composants admin
│   └── views/
│       ├── app.blade.php                # Template SPA client
│       └── admin.blade.php              # Template SPA admin
├── routes/
│   ├── api.php                          # Routes API (65+ endpoints)
│   └── web.php                          # Routes web + admin
├── tests/
│   └── Feature/                         # 20 tests feature
├── composer.json
├── package.json
├── vite.config.js
└── README.md
```

---

## 💳 API — Paiement Orange Money

### `POST /api/payments/orange`

**Headers :**
```
Content-Type: application/json
Accept: application/json
```

**Body :**
```json
{
  "phone": "70123456",
  "amount": 3500,
  "otp": "123456",
  "refNumber": "MCR-20260318-ABC123",
  "extTxnId": "TXN-1710745200"
}
```

**Réponse succès (200) :**
```json
{
  "success": true,
  "message": "Paiement effectué avec succès",
  "data": {
    "transactionId": "OM.BF.xxx",
    "refNumber": "MCR-20260318-ABC123",
    "amount": 3500,
    "status": "SUCCESSFUL"
  }
}
```

**Réponse erreur (4xx/5xx) :**
```json
{
  "success": false,
  "message": "Description de l'erreur",
  "error_code": "INVALID_OTP"
}
```

**Codes d'erreur :**

| Code | Description |
|------|-------------|
| `INVALID_PHONE` | Numéro invalide (doit être 8 chiffres) |
| `INVALID_OTP` | Code OTP invalide (doit être 6 chiffres) |
| `INVALID_AMOUNT` | Montant invalide (doit être > 0) |
| `PAYMENT_FAILED` | Échec de la transaction côté Orange Money |
| `SERVICE_UNAVAILABLE` | API Orange Money injoignable |

---

## 🗺 Roadmap

### v1.0.0 — MVP ✅ (Mars 2026)
- [x] Catalogue de 12 livres avec filtrage par catégorie
- [x] 6 profils auteurs détaillés
- [x] Panier d'achat (localStorage + sync serveur)
- [x] Paiement Orange Money (simulation + production)
- [x] Système d'authentification utilisateur (inscription/connexion)
- [x] Vérification email avec lien signé
- [x] Historique de commandes persistant en base de données
- [x] Bibliothèque personnelle des achats
- [x] Lecteur de livres intégré (PDF/EPUB)
- [x] Panneau d'administration complet (CRUD livres, auteurs, commandes, utilisateurs)
- [x] Dashboard admin avec statistiques (revenus, ventes, top livres)
- [x] Système de notes et avis lecteurs
- [x] Liste de souhaits (wishlist)
- [x] Formulaire de contact avec messagerie admin
- [x] Newsletter avec inscription/désinscription
- [x] SPA React responsive (mobile, tablette, desktop)
- [x] Design premium avec animations et gradients
- [x] 20 tests feature couvrant tous les flux critiques
- [x] Déploiement Hostinger-ready

### v1.1.0 — Améliorations UX (Q2 2026) ✅
- [x] Recherche full-text dans le catalogue
- [x] Mode sombre / clair
- [x] Notifications push (nouvelles sorties)
- [x] PWA (Progressive Web App) — usage hors-ligne

### v1.2.0 — Enrichissement catalogue (Q3 2026) 🚧
- [ ] Recommandations personnalisées (basées sur les achats)
- [ ] Catégories dynamiques depuis la base de données
- [ ] Support multi-langue (Français, Mooré, Dioula)
- [ ] Export des achats en PDF

### v2.0.0 — Plateforme sociale (Q4 2026)
- [ ] Profils lecteurs publics
- [ ] Clubs de lecture en ligne
- [ ] Système d'abonnement mensuel
- [ ] Paiement Moov Money et Wave
- [ ] API publique pour les partenaires
- [ ] Application mobile (React Native)

### v3.0.0 — Expansion régionale (2027)
- [ ] Extension aux auteurs d'Afrique de l'Ouest (Mali, Niger, Côte d'Ivoire, Sénégal)
- [ ] Partenariats éditeurs
- [ ] Programme d'auto-publication pour auteurs indépendants
- [ ] Livraison physique intégrée (Burkina Faso)
- [ ] Version API pour bibliothèques universitaires

---

## 🤝 Contribution

Les contributions sont les bienvenues. Pour contribuer :

1. Forkez le projet
2. Créez une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Committez (`git commit -m 'Ajout de ma fonctionnalité'`)
4. Pushez (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une Pull Request

### Conventions
- **Code** : PSR-12 (PHP), ESLint + Prettier (JS)
- **Commits** : [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `docs:`, `chore:`
- **Branches** : `main` (stable), `develop` (intégration), `feature/*`, `fix/*`

---

## 👨‍💻 Auteur

**Mercury Editions** — Développeur Full-Stack

---

## 📄 Licence

Copyright © 2026 Mercury Editions. Tous droits réservés.

Ce projet est distribué sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 📌 Version

| Version | Date | Description |
|---------|------|-------------|
| **1.0.0** | 18 mars 2026 | MVP — Lancement initial |

---

<div align="center">

**Mercury Editions** — *Lire le Burkina, lire le monde* 📚🇧🇫

</div>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
