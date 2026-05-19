# Documentation API — Mercury Editions

> Version 1.0.0 | 18 mars 2026

## Base URL

```
Production : https://mercury-editions.bf/api
Local      : http://localhost:8000/api
```

## Authentification

L'API utilise l'authentification par session (cookies). Toutes les requêtes doivent inclure :

```http
Accept: application/json
Content-Type: application/json
X-XSRF-TOKEN: <token> (pour les mutations)
```

---

## Endpoints publics

### Catalogue

#### Lister tous les livres

```http
GET /api/books
```

**Réponse** :
```json
[
  {
    "id": 1,
    "title": "Le Parachutage",
    "author_name": "Norbert Zongo",
    "price": 2500,
    "category": "Roman",
    "rating": 4.5,
    "cover_image": "/storage/covers/parachutage.jpg",
    "year": 1988,
    "pages": 156
  }
]
```

#### Détail d'un livre

```http
GET /api/books/{id}
```

**Réponse** :
```json
{
  "id": 1,
  "title": "Le Parachutage",
  "author_id": 1,
  "author_name": "Norbert Zongo",
  "price": 2500,
  "category": "Roman",
  "rating": 4.5,
  "cover_image": "/storage/covers/parachutage.jpg",
  "year": 1988,
  "pages": 156,
  "publisher": "Éditions Mercury",
  "language": "Français",
  "isbn": "978-2-XXXX-XXXX-X",
  "description": "...",
  "summary": "...",
  "quote": "...",
  "tags": ["politique", "satire"],
  "author": {
    "id": 1,
    "name": "Norbert Zongo",
    "slug": "norbert-zongo"
  }
}
```

#### Avis d'un livre

```http
GET /api/books/{id}/reviews
```

**Réponse** :
```json
[
  {
    "id": 1,
    "rating": 5,
    "comment": "Excellent livre !",
    "user": {
      "id": 1,
      "name": "Jean Dupont"
    },
    "created_at": "2026-03-15T10:30:00Z"
  }
]
```

---

### Auteurs

#### Lister tous les auteurs

```http
GET /api/authors
```

#### Détail d'un auteur

```http
GET /api/authors/{slug}
```

**Réponse** :
```json
{
  "id": 1,
  "name": "Norbert Zongo",
  "slug": "norbert-zongo",
  "birth_year": 1949,
  "death_year": 1998,
  "origin": "Koudougou",
  "photo": "/storage/authors/norbert-zongo.jpg",
  "biography": "<p>...</p>",
  "awards": [...],
  "timeline": [...],
  "books": [...]
}
```

---

## Authentification client

### Inscription

```http
POST /api/customer/register
```

**Body** :
```json
{
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "phone": "70123456",
  "password": "motdepasse123"
}
```

**Réponse (201)** :
```json
{
  "user": {
    "id": 1,
    "name": "Jean Dupont",
    "email": "jean@example.com",
    "phone": "70123456",
    "email_verified": false
  }
}
```

### Connexion

```http
POST /api/customer/login
```

**Body** :
```json
{
  "email": "jean@example.com",
  "password": "motdepasse123"
}
```

### Déconnexion

```http
POST /api/customer/logout
```

*Requiert authentification*

### Utilisateur courant

```http
GET /api/customer/me
```

**Réponse** :
```json
{
  "user": {
    "id": 1,
    "name": "Jean Dupont",
    "email": "jean@example.com",
    "phone": "70123456",
    "email_verified": true
  }
}
```

### Mise à jour profil

```http
PUT /api/customer/profile
```

*Requiert authentification*

**Body** :
```json
{
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "phone": "70123456"
}
```

---

## Commandes

### Créer une commande

```http
POST /api/orders
```

**Body** :
```json
{
  "items": [
    {
      "book_id": 1,
      "format": "ebook",
      "quantity": 1
    }
  ],
  "buyer_name": "Jean Dupont",
  "buyer_phone": "70123456",
  "buyer_email": "jean@example.com",
  "shipping_address": "Ouagadougou, Secteur 15",
  "shipping_city": "Ouagadougou",
  "shipping_country": "Burkina Faso"
}
```

**Réponse (201)** :
```json
{
  "id": 1,
  "reference": "MCR-20260318-ABC123",
  "total_amount": 2500,
  "om_fees": 50,
  "status": "pending",
  "items": [...]
}
```

### Détail d'une commande

```http
GET /api/orders/{id}
```

*Requiert authentification (propriétaire de la commande ou admin)*

> Note: le champ `items[].access_token` n'est pas exposé par cet endpoint.

### Compléter une commande

```http
PATCH /api/orders/{id}/complete
```

*Requiert authentification*

**Body** :
```json
{
  "om_transaction_id": "OM260318.1430.C12345",
  "ext_txn_id": "TXN-1710766800",
  "ref_number": "MCR-20260318-ABC123"
}
```

Contraintes:
- `ref_number` doit correspondre a la reference de la commande.
- `ext_txn_id` doit correspondre a une preuve de paiement backend valide (cache 30 min) creee par `POST /api/payments/orange`.
- La preuve est a usage unique (consommee a la completion).

### Marquer comme échouée

```http
PATCH /api/orders/{id}/fail
```

*Requiert authentification*

> Seul le proprietaire de la commande (ou un admin) peut modifier son statut.

---

## Paiement Orange Money

### Initier le paiement

```http
POST /api/payments/orange
```

**Body** :
```json
{
  "phone": "70123456",
  "amount": 2550,
  "otp": "123456",
  "refNumber": "MCR-20260318-ABC123",
  "extTxnId": "TXN-1710766800"
}
```

**Réponse succès (200)** :
```json
{
  "status": "success",
  "transId": "OM260318.1430.C12345",
  "message": "Transaction validée.",
  "amount": 2550,
  "phone": "22670123456",
  "date": "2026-03-18 14:30:00"
}
```

**Réponse erreur (400)** :
```json
{
  "status": "error",
  "errorCode": "INVALID_OTP",
  "message": "Code OTP invalide."
}
```

---

## Espace client (authentifié)

### Historique des commandes

```http
GET /api/customer/orders
```

### Achats (bibliothèque)

```http
GET /api/customer/purchases
```

**Réponse** :
```json
[
  {
    "bookId": 1,
    "format": "ebook",
    "accessToken": "...",
    "txnId": "OM260318.1430.C12345",
    "buyerPhone": "70123456",
    "purchaseDate": "2026-03-18T14:30:00Z",
    "readSessions": 0
  }
]
```

### Vérifier accès à un livre

```http
GET /api/customer/books/{id}/verify-access
```

**Réponse** :
```json
{
  "access": true
}
```

### Panier synchronisé

```http
GET /api/customer/cart
PUT /api/customer/cart
```

### Liste de souhaits

```http
GET /api/customer/wishlist
POST /api/customer/wishlist/{bookId}
DELETE /api/customer/wishlist/{bookId}
```

### Poster un avis

```http
POST /api/customer/books/{id}/reviews
```

*L'utilisateur doit avoir acheté le livre*

**Body** :
```json
{
  "rating": 5,
  "comment": "Excellent livre, je recommande !"
}
```

---

## Newsletter & Contact

### Inscription newsletter

```http
POST /api/newsletter/subscribe
```

**Body** :
```json
{
  "email": "jean@example.com"
}
```

### Désinscription newsletter

```http
GET /api/newsletter/unsubscribe/{token}
```

### Envoyer un message

```http
POST /api/contact
```

**Body** :
```json
{
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "subject": "Question sur une commande",
  "message": "..."
}
```

---

## Lecteur de livres

### Accéder au lecteur

```http
GET /api/books/{id}/reader
```

*Requiert achat ou access token valide*

### Télécharger le fichier

```http
GET /api/books/{id}/reader/{format}
```

**Paramètres** :
- `format` : `pdf` ou `epub`

---

## Codes d'erreur HTTP

| Code | Description |
|------|-------------|
| 200 | Succès |
| 201 | Créé |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Accès refusé |
| 404 | Ressource non trouvée |
| 422 | Erreur de validation |
| 429 | Trop de requêtes (rate limit) |
| 500 | Erreur serveur |

---

## Rate Limiting

| Endpoint | Limite |
|----------|--------|
| `/customer/register` | 5 req/min |
| `/customer/login` | 5 req/min |
| `/newsletter/subscribe` | 5 req/min |
| `/contact` | 3 req/min |

---

*Documentation API v1.0.0 — Mercury Editions*
