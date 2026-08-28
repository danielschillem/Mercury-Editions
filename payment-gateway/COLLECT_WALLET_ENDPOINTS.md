# Collect / Recharge Wallet - Endpoints Partenaire

Ce document donne les endpoints publics a utiliser pour debiter un compte mobile money payeur et crediter le wallet MynaPay associe au partenaire.

## Base URL

```text
https://pay.myna-etoile.com
```

La distinction `sandbox` / `production` est appliquee par la cle API fournie par MynaPay.

## Authentification

Toutes les routes ci-dessous exigent :

```http
Authorization: Bearer <API_KEY>
Content-Type: application/json
Idempotency-Key: <reference_unique>
```

La cle API doit rester cote backend partenaire. Elle ne doit jamais etre exposee dans une application mobile, un navigateur ou un depot public.

## Scopes requis

| Operation | Scope requis |
|---|---|
| Creer une collecte | `collections:create` |
| Lire une collecte | `collections:read` |
| Verifier une collecte | `collections:check` |
| Generer / renvoyer OTP Moov | `collections:create` |
| Commit OTP Moov | `collections:create` |

## 1. Collecte Orange Money avec OTP

Orange ne fournit pas actuellement de push-to-pay sans OTP dans notre integration. Pour recharger un wallet par Orange Money, le payeur genere un OTP Orange par USSD, puis le partenaire envoie cet OTP a MynaPay.

L'OTP doit correspondre au numero payeur et au montant transmis. Il est destine
a une seule tentative metier : en cas de timeout, ne demandez pas un nouvel OTP
et ne changez pas de reference avant d'avoir verifie l'operation existante.

### Generation OTP par le payeur

| Environnement | Code USSD |
|---|---|
| Test | `*865*4*6*montant#` |
| Production | `*144*4*6*montant#` |

### Endpoint

```http
POST /api/v1/collections
```

### Payload

```json
{
  "external_reference": "WALLET-TOPUP-2026-0001",
  "operator": "orange",
  "payer_phone": "22670123456",
  "amount": 25000,
  "fee_amount": 375,
  "otp": "541847",
  "label": "Recharge wallet",
  "idempotency_key": "WALLET-TOPUP-2026-0001"
}
```

`fee_amount` est optionnel. Si absent, MynaPay applique le taux configure pour le client.

### Exemple curl

```bash
curl -X POST "https://pay.myna-etoile.com/api/v1/collections" \
  -H "Authorization: Bearer $MYNAPAY_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: WALLET-TOPUP-2026-0001" \
  -d '{
    "external_reference": "WALLET-TOPUP-2026-0001",
    "operator": "orange",
    "payer_phone": "22670123456",
    "amount": 25000,
    "fee_amount": 375,
    "otp": "541847",
    "label": "Recharge wallet"
  }'
```

## 2. Collecte Moov Money par push-to-pay

Pour Moov, le mode par defaut est le push USSD. Le payeur recoit une demande de confirmation sur son telephone et valide avec son PIN Moov.

### Endpoint

```http
POST /api/v1/collections
```

### Payload

```json
{
  "external_reference": "WALLET-TOPUP-2026-0002",
  "operator": "moov",
  "payer_phone": "22670123456",
  "amount": 25000,
  "fee_amount": 375,
  "label": "Recharge wallet",
  "idempotency_key": "WALLET-TOPUP-2026-0002"
}
```

Ne pas envoyer `otp` pour le mode push.

### Exemple curl

```bash
curl -X POST "https://pay.myna-etoile.com/api/v1/collections" \
  -H "Authorization: Bearer $MYNAPAY_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: WALLET-TOPUP-2026-0002" \
  -d '{
    "external_reference": "WALLET-TOPUP-2026-0002",
    "operator": "moov",
    "payer_phone": "22670123456",
    "amount": 25000,
    "fee_amount": 375,
    "label": "Recharge wallet"
  }'
```

## 3. Collecte Moov Money par OTP

Utiliser ce parcours si le type de transaction ou le parcours utilisateur exige un OTP Moov.

### 3.1 Generer l'OTP Moov

```http
POST /api/v1/moov/otp/generate
```

```json
{
  "external_reference": "WALLET-TOPUP-OTP-2026-0003",
  "payer_phone": "22670123456",
  "amount": 25000,
  "label": "Recharge wallet OTP Moov"
}
```

Reponse :

```json
{
  "collection_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "trans_id": "CCP2000LV0",
  "status": "otp_generated",
  "message": "SUCCESS"
}
```

### 3.2 Renvoyer l'OTP Moov

```http
POST /api/v1/moov/otp/resend
```

```json
{
  "collection_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### 3.3 Valider le paiement avec OTP

```http
POST /api/v1/collections/{collection_id}/otp/commit
```

```json
{
  "otp": "041071"
}
```

Reponse :

```json
{
  "collection_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "client_id": "partner-wallet",
  "external_reference": "WALLET-TOPUP-OTP-2026-0003",
  "operator": "moov",
  "operator_ref": "CCP2000LV0",
  "status": "success",
  "amount": 25000,
  "fee_amount": 375,
  "net_amount": 24625,
  "message": "SUCCESS"
}
```

## Reponse standard de creation collecte

Le serveur retourne normalement HTTP `202`. Lisez toujours le champ `status` :
la reponse peut deja etre `success` ou `failed` si l'operateur a repondu
immediatement ; `202` ne signifie donc pas automatiquement `pending`.

```json
{
  "collection_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "client_id": "partner-wallet",
  "external_reference": "WALLET-TOPUP-2026-0001",
  "operator": "orange",
  "operator_ref": "OM-COL-123456",
  "status": "pending",
  "amount": 25000,
  "fee_amount": 375,
  "net_amount": 24625,
  "message": "Collection transmise a l'operateur",
  "environment": "sandbox",
  "simulated": true
}
```

## Statuts

| Statut | Signification |
|---|---|
| `pending` | Collecte creee, en attente de confirmation operateur ou payeur |
| `success` | Collecte confirmee ; le wallet partenaire est credite si le client API est lie a un tenant |
| `failed` | Collecte rejetee ou expiree |

Un timeout reseau n'est pas un statut `failed`. Reutilisez la meme
`Idempotency-Key` et le meme payload, puis consultez la collecte retournee. Ne
demarrez jamais une seconde collecte avec une nouvelle reference tant que le
resultat financier de la premiere est incertain.

En sandbox :

| Condition | Resultat |
|---|---|
| Montant `1` | `success` |
| Montant `2` | `failed` |
| Montant `3` | `pending` |
| Numero terminant par `0000` | `failed` |
| Autre cas | `success` |

## Lire une collecte

```http
GET /api/v1/collections/{collection_id}
```

```bash
curl -H "Authorization: Bearer $MYNAPAY_API_KEY" \
  "https://pay.myna-etoile.com/api/v1/collections/a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

## Verifier le statut

```http
POST /api/v1/collections/{collection_id}/check
```

```bash
curl -X POST \
  -H "Authorization: Bearer $MYNAPAY_API_KEY" \
  "https://pay.myna-etoile.com/api/v1/collections/a1b2c3d4-e5f6-7890-abcd-ef1234567890/check"
```

Notes operateurs :

| Operateur | Verification statut |
|---|---|
| Orange | Pas d'endpoint statut separe exploitable dans la documentation actuelle ; MynaPay conserve le retour de l'appel OTP |
| Moov push | MynaPay interroge `SearchTransactionByExtID` cote Moov |
| Moov OTP | Le commit OTP retourne le statut de paiement |

## Webhooks

Evenements emis :

| Event | Declencheur |
|---|---|
| `collection.created` | Collecte creee |
| `collection.pending` | Collecte en attente |
| `collection.success` | Collecte confirmee et wallet credite si applicable |
| `collection.failed` | Collecte echouee |

Headers webhook :

```http
X-MynaPay-Event: collection.success
X-MynaPay-Signature: sha256=<hmac_hex>
Content-Type: application/json
```

Payload type :

```json
{
  "event": "collection.success",
  "collection_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "client_id": "partner-wallet",
  "external_reference": "WALLET-TOPUP-2026-0001",
  "operator": "orange",
  "operator_ref": "OM-COL-123456",
  "amount": 25000,
  "fee_amount": 375,
  "net_amount": 24625,
  "status": "success"
}
```

Le partenaire doit traiter les webhooks de facon idempotente et repondre HTTP `2xx`.

## Differences Orange vs Moov

| Sujet | Orange | Moov |
|---|---|---|
| Mode par defaut recharge wallet | OTP Orange fourni par le payeur | Push-to-pay USSD |
| Push sans OTP | Non disponible dans notre integration actuelle | Oui |
| OTP | Obligatoire pour collecte Orange | Optionnel selon parcours |
| Endpoint partenaire principal | `POST /api/v1/collections` | `POST /api/v1/collections` |
| Parcours OTP dedie | OTP genere par USSD Orange | `/moov/otp/generate` puis `/collections/{id}/otp/commit` |

## Erreurs frequentes

| HTTP | Cause probable |
|---|---|
| `400` | Champ manquant, montant invalide, OTP Orange absent |
| `401` | API key absente ou invalide |
| `403` | Operateur non autorise, scope manquant ou client suspendu |
| `404` | Collection introuvable ou appartenant a un autre client |
| `409` | Meme `Idempotency-Key` reutilisee avec un payload different |
| `429` | Quota API depasse |
| `500` | Erreur technique temporaire |

En cas d'incertitude, fournissez au support MynaPay `client_id`,
`external_reference`, `collection_id`, `operator_ref` si disponible, montant,
operateur, date/heure et logs sans cle API ni OTP.
