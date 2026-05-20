# Documentation Métier — Mercury Editions

> Version 1.0.0 | 18 mars 2026 | Mercury Editions

## Table des matières

- [1. Contexte et Vision](#1-contexte-et-vision)
- [2. Acteurs du système](#2-acteurs-du-système)
- [3. Processus métier](#3-processus-métier)
- [4. Règles de gestion](#4-règles-de-gestion)
- [5. Catalogue produits](#5-catalogue-produits)
- [6. Système de paiement](#6-système-de-paiement)
- [7. Gestion des commandes](#7-gestion-des-commandes)
- [8. Glossaire](#8-glossaire)

---

## 1. Contexte et Vision

### 1.1 Contexte

Le Burkina Faso possède un patrimoine littéraire riche mais peu accessible au grand public. Les œuvres des auteurs burkinabè sont souvent difficiles à trouver, que ce soit en format physique ou numérique. Mercury Editions répond à ce besoin en devenant une maison d'édition et de diffusion: sélection des textes, accompagnement éditorial, fabrication des livres, vente, lecture numérique et circulation auprès des lecteurs.

### 1.2 Vision

**"Lire le Burkina, lire le monde"**

Mercury Editions ambitionne de devenir la référence pour l'édition et l'accès à la littérature burkinabè et ouest-africaine, en combinant :
- Une ligne éditoriale claire portée par des collections identifiables
- Un accompagnement des auteurs, du manuscrit à la publication
- Un catalogue de qualité mettant en valeur les auteurs locaux
- Une expérience d'achat simplifiée adaptée au contexte africain
- Un système de paiement mobile (Orange Money) populaire au Burkina Faso
- Une accessibilité via ebooks pour une diffusion mondiale

### 1.3 Objectifs stratégiques

| Objectif | Indicateur | Cible v1.0 |
|----------|------------|------------|
| Visibilité des auteurs | Nombre d'auteurs référencés | 6 auteurs |
| Richesse du catalogue | Nombre de livres disponibles | 12 livres |
| Structuration éditoriale | Collections fondatrices | 3 collections |
| Relation auteurs | Délai de réponse manuscrit | < 30 jours |
| Conversion | Taux d'achat après visite | > 5% |
| Satisfaction client | Avis positifs | > 80% |

---

## 2. Acteurs du système

### 2.1 Visiteur (non authentifié)

**Description** : Utilisateur naviguant sur la plateforme sans compte.

**Droits** :
- Consulter le catalogue de livres
- Voir les fiches détaillées des livres
- Découvrir les profils des auteurs
- Ajouter des livres au panier (localStorage)
- Accéder au formulaire de contact
- S'inscrire à la newsletter

**Restrictions** :
- Ne peut pas finaliser un achat
- Ne peut pas accéder aux ebooks
- Ne peut pas laisser d'avis

### 2.2 Client (authentifié)

**Description** : Utilisateur avec un compte validé.

**Droits** :
- Tous les droits du visiteur
- Finaliser un achat via Orange Money
- Accéder à son espace personnel
- Consulter l'historique de ses commandes
- Télécharger/lire ses ebooks achetés
- Laisser des avis sur les livres achetés
- Gérer sa liste de souhaits (wishlist)
- Synchroniser son panier entre appareils

**Données personnelles** :
- Nom complet
- Email (vérifié)
- Téléphone (8 chiffres, format Burkina Faso)
- Adresse de livraison (optionnelle)

### 2.3 Administrateur

**Description** : Gestionnaire de la plateforme.

**Droits** :
- Accès au dashboard administratif
- Gestion du catalogue (CRUD livres)
- Gestion des auteurs (CRUD)
- Suivi des commandes (visualisation, mise à jour du statut)
- Gestion des utilisateurs
- Consultation des messages de contact
- Statistiques de ventes (revenus, top livres, évolution)

**Accès** : Interface dédiée `/admin`

---

## 3. Processus métier

### 3.1 Parcours d'achat

```
┌─────────────────────────────────────────────────────────────────┐
│                    PARCOURS D'ACHAT CLIENT                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [1] DÉCOUVERTE                                                  │
│      │                                                           │
│      ├── Accès au catalogue                                      │
│      ├── Filtrage par catégorie (Roman, Poésie, Essai...)       │
│      ├── Consultation fiche livre                                │
│      └── Consultation profil auteur                              │
│                                                                  │
│  [2] SÉLECTION                                                   │
│      │                                                           │
│      ├── Choix du format (eBook / Physique)                      │
│      ├── Ajout au panier                                         │
│      └── Modification quantités                                  │
│                                                                  │
│  [3] AUTHENTIFICATION (si non connecté)                          │
│      │                                                           │
│      ├── Connexion                                               │
│      └── Ou inscription (nom, email, téléphone, mot de passe)    │
│                                                                  │
│  [4] CHECKOUT (4 étapes)                                         │
│      │                                                           │
│      ├── Étape 1 : Vérification panier + infos client            │
│      ├── Étape 2 : Saisie code USSD (#144*82#)                   │
│      ├── Étape 3 : Saisie OTP (6 chiffres reçus par SMS)         │
│      └── Étape 4 : Confirmation paiement                         │
│                                                                  │
│  [5] POST-ACHAT                                                  │
│      │                                                           │
│      ├── Email de confirmation                                   │
│      ├── Accès bibliothèque (ebooks)                             │
│      └── Possibilité de laisser un avis                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Processus de paiement Orange Money

```
┌──────────────────────────────────────────────────────────────────┐
│                  FLUX PAIEMENT ORANGE MONEY                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  CLIENT                    MERCURY                   ORANGE MONEY │
│    │                          │                          │        │
│    │──[1] Initier paiement───▶│                          │        │
│    │                          │                          │        │
│    │◀─[2] Afficher USSD──────│                          │        │
│    │                          │                          │        │
│    │──[3] Composer USSD──────────────────────────────────▶        │
│    │      #144*82#                                       │        │
│    │                                                     │        │
│    │◀────────────────────────────────[4] SMS OTP─────────│        │
│    │                                                     │        │
│    │──[5] Saisir OTP────────▶│                          │        │
│    │                          │                          │        │
│    │                          │──[6] Valider paiement───▶│        │
│    │                          │      (XML-RPC)           │        │
│    │                          │                          │        │
│    │                          │◀─[7] Réponse transaction─│        │
│    │                          │                          │        │
│    │◀─[8] Confirmation───────│                          │        │
│    │                          │                          │        │
└──────────────────────────────────────────────────────────────────┘
```

### 3.3 États d'une commande

| État | Code | Description | Actions possibles |
|------|------|-------------|-------------------|
| En attente | `pending` | Commande créée, paiement en cours | Annuler, Compléter |
| Complétée | `completed` | Paiement validé | Voir détails |
| Échouée | `failed` | Paiement refusé | Réessayer |
| Annulée | `cancelled` | Annulée par client/admin | — |
| Expédiée | `shipped` | Livre physique envoyé | Suivre |
| Livrée | `delivered` | Livre physique reçu | — |

---

## 4. Règles de gestion

### 4.1 Catalogue

| Règle | Code | Description |
|-------|------|-------------|
| RG-CAT-01 | Prix minimum | Un livre doit avoir un prix ≥ 500 FCFA |
| RG-CAT-02 | Format physique | Le format physique coûte +60% du prix ebook |
| RG-CAT-03 | Catégories | 5 catégories : Roman, Poésie, Essai, Conte, Jeunesse |
| RG-CAT-04 | Auteur requis | Un livre doit être associé à un auteur |
| RG-CAT-05 | ISBN unique | L'ISBN doit être unique s'il est renseigné |

### 4.2 Utilisateurs

| Règle | Code | Description |
|-------|------|-------------|
| RG-USR-01 | Email unique | Un email ne peut être associé qu'à un seul compte |
| RG-USR-02 | Téléphone format | Téléphone burkinabè : 8 chiffres (sans indicatif) |
| RG-USR-03 | Téléphone unique | Un numéro ne peut être associé qu'à un seul compte |
| RG-USR-04 | Mot de passe | Minimum 6 caractères |
| RG-USR-05 | Vérification email | Email vérifié requis pour certaines actions |

### 4.3 Commandes

| Règle | Code | Description |
|-------|------|-------------|
| RG-CMD-01 | Référence | Format : MCR-YYYYMMDD-XXXXXX (auto-généré) |
| RG-CMD-02 | Montant minimum | Montant total ≥ 100 FCFA |
| RG-CMD-03 | Authentification | Client authentifié requis pour commander |
| RG-CMD-04 | OTP | Code OTP : exactement 6 chiffres |
| RG-CMD-05 | Expiration | Transaction expire après 10 minutes |

### 4.4 Avis

| Règle | Code | Description |
|-------|------|-------------|
| RG-AVS-01 | Achat requis | Seuls les acheteurs peuvent laisser un avis |
| RG-AVS-02 | Note | Note de 1 à 5 étoiles |
| RG-AVS-03 | Unique | Un client = un avis par livre |
| RG-AVS-04 | Commentaire | Commentaire optionnel (max 1000 caractères) |

---

## 5. Catalogue produits

### 5.1 Catégories

| Catégorie | Description | Couleur badge |
|-----------|-------------|---------------|
| Roman | Fiction narrative longue | Rouge |
| Poésie | Œuvres poétiques | Bleu |
| Essai | Textes argumentatifs, réflexions | Vert |
| Conte | Récits traditionnels | Orange |
| Jeunesse | Littérature pour enfants | Violet |

### 5.2 Formats disponibles

| Format | Description | Supplément |
|--------|-------------|------------|
| eBook | Fichier numérique (PDF/EPUB) | Prix de base |
| Physique | Livre imprimé avec livraison | +60% |

### 5.3 Auteurs référencés (v1.0)

| Auteur | Période | Spécialités | Œuvres |
|--------|---------|-------------|--------|
| Norbert Zongo | 1949–1998 | Roman, journalisme, satire | 2 |
| Monique Ilboudo | 1959– | Roman, droit, féminisme | 2 |
| Joseph Ki-Zerbo | 1922–2006 | Essai, histoire | 2 |
| Sophie Heidi Kam | 1970– | Théâtre, poésie | 2 |
| Titinga Frédéric Pacéré | 1943– | Poésie, ethnographie | 2 |
| Augustin Sondé Bazié | 1965– | Jeunesse, conte | 2 |

---

## 6. Système de paiement

### 6.1 Orange Money Burkina Faso

**Opérateur** : Orange Burkina Faso  
**Protocole** : XML-RPC  
**Environnements** :
- Test : `https://testom.orange.bf/`
- Production : `https://apiom.orange.bf/`

### 6.2 Flux de données

| Paramètre | Type | Description |
|-----------|------|-------------|
| customer_msisdn | String | Numéro client (226XXXXXXXX) |
| merchant_msisdn | String | Numéro marchand |
| amount | Integer | Montant en FCFA |
| otp | String | Code OTP (6 chiffres) |
| reference_number | String | Référence commande |
| ext_txn_id | String | ID transaction externe |

### 6.3 Codes de réponse

| Code | Signification | Action |
|------|---------------|--------|
| 200 / SUCCESS | Paiement réussi | Valider commande |
| INVALID_OTP | OTP incorrect | Redemander OTP |
| INSUFFICIENT_FUNDS | Solde insuffisant | Informer client |
| TIMEOUT | Délai dépassé | Réessayer |
| SERVICE_ERROR | Erreur API | Retry ou contact support |

### 6.4 Mode simulation

En environnement de développement (`ORANGE_OM_SIMULATE=true`) :
- Aucun appel réel à l'API Orange Money
- Réponse simulée après 200ms de délai
- Transaction ID généré automatiquement
- Permet de tester le flux complet sans frais

---

## 7. Gestion des commandes

### 7.1 Cycle de vie

```
                    ┌─────────────┐
                    │   CRÉÉE     │
                    │  (pending)  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │  ÉCHOUÉ  │ │ COMPLÉTÉ │ │ ANNULÉ   │
       │ (failed) │ │(completed)│ │(cancelled)│
       └──────────┘ └────┬─────┘ └──────────┘
                         │
                         │ (si format physique)
                         ▼
                  ┌──────────────┐
                  │   EXPÉDIÉ    │
                  │  (shipped)   │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │   LIVRÉ      │
                  │ (delivered)  │
                  └──────────────┘
```

### 7.2 Notifications

| Événement | Canal | Contenu |
|-----------|-------|---------|
| Commande créée | — | — |
| Paiement validé | Email | Confirmation + récapitulatif |
| Commande expédiée | Email | Numéro de suivi (si dispo) |
| Commande livrée | — | — |

### 7.3 Accès aux contenus

| Format acheté | Accès immédiat | Accès différé |
|---------------|----------------|---------------|
| eBook | Lecteur intégré | Téléchargement PDF/EPUB |
| Physique | — | Livraison sous 3-7 jours |

---

## 8. Glossaire

| Terme | Définition |
|-------|------------|
| **FCFA** | Franc CFA, monnaie utilisée au Burkina Faso |
| **Orange Money (OM)** | Service de paiement mobile d'Orange |
| **OTP** | One-Time Password, code à usage unique |
| **USSD** | Protocole de communication mobile (*#codes#) |
| **eBook** | Livre électronique (format PDF ou EPUB) |
| **SPA** | Single Page Application, application web sans rechargement |
| **Wishlist** | Liste de souhaits, livres sauvegardés pour plus tard |
| **ISBN** | International Standard Book Number, identifiant unique d'un livre |

---

## Annexe A — Contacts

| Rôle | Contact |
|------|---------|
| Support technique | support@mercury-editions.bf |
| Service client | contact@mercury-editions.bf |
| Partenariats éditeurs | partenaires@mercury-editions.bf |

---

## Annexe B — Historique des versions

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | 18 mars 2026 | Version initiale — MVP |

---

*Document généré le 18 mars 2026 — Mercury Editions*
