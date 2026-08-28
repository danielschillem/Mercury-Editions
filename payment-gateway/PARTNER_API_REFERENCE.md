# Reference API publique

Version : `1.1`

Base URL :

```text
Sandbox:    https://pay.myna-etoile.com
Production: https://pay.myna-etoile.com
```

La distinction sandbox/production est appliquee par la configuration de la cle API partenaire.

## Authentification

```http
Authorization: Bearer <API_KEY>
```

Tous les endpoints `/api/v1/*` exigent cet en-tete.

La cle API est une cle secrete machine-to-machine fournie par MynaPay. Elle doit etre utilisee uniquement cote backend et ne doit jamais etre exposee dans un navigateur, une application mobile ou un depot public.

## Headers recommandes

| Header | Obligatoire | Description |
|---|---:|---|
| `Authorization` | oui | `Bearer <API_KEY>` |
| `Content-Type` | oui pour POST JSON | `application/json` |
| `Idempotency-Key` | oui pour une creation, sauf si fourni dans le JSON | Cle unique et stable de l'operation |

`Idempotency-Key` est obligatoire pour les creations (`payments`, `collections`, `service-payments`) si le champ JSON `idempotency_key` n'est pas fourni.

## Format des montants

Les montants sont exprimes en FCFA, sans decimales.

Exemple :

```json
{
  "amount": 2500
}
```

## Numeros de telephone

Le numero doit etre transmis au format international Burkina Faso :

```text
226XXXXXXXX
```

Exemple :

```text
22670123456
```

## Operateurs

| Valeur | Operateur |
|---|---|
| `orange` | Orange Money Burkina Faso |
| `moov` | Moov Money Burkina Faso |

Un partenaire ne peut utiliser que les operateurs autorises sur son compte.

## GET /health

Health check public du service.

Authentification : non requise.

Reponse `200 OK` :

```json
{
  "status": "ok",
  "service": "payment-gateway"
}
```

## POST /api/v1/payments

Cree un paiement mobile money.

Pour un paiement par lots, le backend partenaire appelle cet endpoint une fois
par beneficiaire. Il n'existe pas d'endpoint bulk unique. Voir
`BATCH_PAYMENTS_GUIDE.md`.

### Request

```http
POST /api/v1/payments
Authorization: Bearer <API_KEY>
Content-Type: application/json
Idempotency-Key: ORDER-2026-0001
```

```json
{
  "external_reference": "ORDER-2026-0001",
  "operator": "orange",
  "phone": "22670123456",
  "amount": 2500,
  "label": "Paiement commande ORDER-2026-0001",
  "idempotency_key": "ORDER-2026-0001"
}
```

### Champs

| Champ | Type | Obligatoire | Description |
|---|---|---:|---|
| `external_reference` | string | oui | Reference metier cote partenaire |
| `operator` | string | oui | `orange` ou `moov` |
| `phone` | string | oui | Numero beneficiaire en `226XXXXXXXX` |
| `amount` | integer | oui | Montant FCFA, minimum 1 |
| `label` | string | non | Libelle lisible du paiement |
| `idempotency_key` | string | non si header present | Cle d'idempotence |
| `client_id` | string | non | Optionnel, derive de la cle API |

### Reponse 202 Accepted

`202 Accepted` confirme que la creation a ete traitee par la Gateway. Le resultat
financier doit etre lu dans `status` : selon la reponse operateur, il peut deja
valoir `success`, `failed` ou `pending`.

```json
{
  "payment_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "client_id": "partner-app",
  "external_reference": "ORDER-2026-0001",
  "operator": "orange",
  "operator_ref": "OM-REF-123456",
  "status": "pending",
  "message": "Paiement transmis a l'operateur"
}
```

### Reponse 200 OK

Retour idempotent : la meme requete a deja ete recue.

```json
{
  "payment_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "client_id": "partner-app",
  "external_reference": "ORDER-2026-0001",
  "operator": "orange",
  "operator_ref": "OM-REF-123456",
  "status": "pending",
  "message": "Paiement existant"
}
```

## GET /api/v1/payments/{payment_id}

Retourne le paiement connu par la Gateway.

Il n'existe pas d'endpoint public de liste `GET /api/v1/payments`. Pour consulter un paiement, utilisez toujours son `payment_id`.

### Request

```http
GET /api/v1/payments/a1b2c3d4-e5f6-7890-abcd-ef1234567890
Authorization: Bearer <API_KEY>
```

### Reponse 200 OK

```json
{
  "payment_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "client_id": "partner-app",
  "external_reference": "ORDER-2026-0001",
  "operator": "orange",
  "operator_ref": "OM-REF-123456",
  "status": "success",
  "message": "Paiement confirme"
}
```

Un partenaire ne peut consulter que ses propres paiements.

## POST /api/v1/payments/{payment_id}/check

Demande une verification active du statut.

### Request

```http
POST /api/v1/payments/a1b2c3d4-e5f6-7890-abcd-ef1234567890/check
Authorization: Bearer <API_KEY>
```

### Reponse 200 OK

```json
{
  "payment_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "client_id": "partner-app",
  "external_reference": "ORDER-2026-0001",
  "operator": "orange",
  "operator_ref": "OM-REF-123456",
  "status": "success",
  "message": "Paiement confirme"
}
```

Limite operateur : le parcours Orange CashIn valide ne fournit pas actuellement
d'endpoint de statut separe exploitable. Pour Orange, cette route conserve le
statut final deja connu ou retourne l'etat stocke ; elle ne doit pas etre utilisee
pour relancer un paiement avec une nouvelle reference.

## POST /api/v1/collections

Cree une demande de collecte entrante depuis le wallet mobile money du payeur.

Pour le parcours complet collect/recharge wallet, voir aussi
`COLLECT_WALLET_ENDPOINTS.md`.

Modes supportes :

| Operateur | Mode | OTP |
|---|---|---|
| Orange | Online Payment OTP | Obligatoire, genere par USSD par le payeur |
| Moov | Push-to-pay USSD | Non requis |
| Moov | Paiement OTP | Generation OTP puis commit |

### Request

```http
POST /api/v1/collections
Authorization: Bearer <API_KEY>
Content-Type: application/json
Idempotency-Key: FACTURE-2026-001
```

```json
{
  "external_reference": "FACTURE-2026-001",
  "operator": "orange",
  "payer_phone": "22670123456",
  "amount": 25000,
  "fee_amount": 375,
  "otp": "541847",
  "label": "Paiement facture juin 2026",
  "idempotency_key": "FACTURE-2026-001"
}
```

Si `fee_amount` est absent, MynaPay calcule les frais avec le taux configure.
Pour Orange, `otp` est requis. Le payeur genere ce code par USSD avant validation du paiement (`*865*4*6*montant#` en test, `*144*4*6*montant#` en production).
Pour Moov push-to-pay, ne pas envoyer `otp`.

### Reponse 202 Accepted

Comme pour les paiements, le code HTTP `202` n'implique pas necessairement un
statut `pending`. Le champ JSON `status` est la source de verite pour la reponse
courante.

```json
{
  "collection_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "client_id": "partner-app",
  "external_reference": "FACTURE-2026-001",
  "operator": "orange",
  "operator_ref": "OM-COL-123456",
  "status": "pending",
  "amount": 25000,
  "fee_amount": 375,
  "net_amount": 24625,
  "message": "Collection transmise a l'operateur"
}
```

## GET /api/v1/collections/{collection_id}

Retourne une collection connue par la Gateway.

## POST /api/v1/collections/{collection_id}/check

Demande une verification active du statut collection.

## POST /api/v1/moov/otp/generate

Genere un OTP Moov et cree une collection en attente.

```json
{
  "external_reference": "WALLET-TOPUP-OTP-2026-0003",
  "payer_phone": "22670123456",
  "amount": 25000,
  "label": "Recharge wallet OTP Moov"
}
```

## POST /api/v1/moov/otp/resend

Renvoie l'OTP Moov pour une collection existante.

```json
{
  "collection_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

## POST /api/v1/collections/{collection_id}/otp/commit

Valide une collection Moov OTP.

```json
{
  "otp": "041071"
}
```

## POST /api/v1/service-payments

Execute un flow d'application externe configure par MynaPay.

Utilisez ce endpoint lorsque MynaPay vous a fourni un `app_id`. Le `app_id` porte la configuration metier : type d'application, flow, frais, operateurs, mode de reversement et settlement.

Flows possibles selon configuration :

| Flow | Description |
|---|---|
| `collection_only` | Encaisse le payeur uniquement |
| `payment_only` | Envoie un paiement vers le numero de settlement configure |
| `collection_then_payment` | Encaisse le payeur puis reverse vers le numero de settlement |
| `collection_then_wallet_credit` | Encaisse le payeur puis credite le wallet MynaPay |
| `collection_then_deferred_settlement` | Encaisse le payeur, settlement effectue plus tard hors appel API |

### Request

```http
POST /api/v1/service-payments
Authorization: Bearer <API_KEY>
Content-Type: application/json
Idempotency-Key: SERVICE-2026-0001
```

```json
{
  "app_id": "8b4e8c2e-0f93-4e8e-92b6-4e9b3ad5f701",
  "external_reference": "SERVICE-2026-0001",
  "payer_phone": "22670123456",
  "amount": 2500,
  "otp": "541847",
  "label": "Paiement service SERVICE-2026-0001",
  "idempotency_key": "SERVICE-2026-0001"
}
```

Pour Moov OTP, ajoutez :

```json
{
  "collection_mode": "moov_otp"
}
```

### Champs

| Champ | Type | Obligatoire | Description |
|---|---|---:|---|
| `app_id` | uuid | oui | Identifiant application fourni par MynaPay |
| `external_reference` | string | oui | Reference metier cote partenaire |
| `payer_phone` | string | oui | Numero payeur en `226XXXXXXXX` |
| `amount` | integer | oui | Montant metier en FCFA |
| `otp` | string | selon flow | Requis pour collecte Orange si OTP active |
| `collection_mode` | string | non | `moov_otp` pour demarrer le parcours OTP Moov |
| `label` | string | non | Libelle lisible |
| `idempotency_key` | string | non si header present | Cle d'idempotence |

### Reponse 202 Accepted

```json
{
  "service_payment_id": "9de3092a-6452-4326-b80d-9ee91f6066a9",
  "status": "collection_pending",
  "external_reference": "SERVICE-2026-0001",
  "amount": 2500,
  "customer_fee_amount": 50,
  "operator_fee_ht": 20,
  "operator_tax_amount": 3,
  "operator_fee_ttc": 23,
  "platform_gross_commission": 27,
  "platform_net_commission": 4,
  "amount_to_reverse": 2450,
  "collection": {
    "collection_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "client_id": "partner-app",
    "external_reference": "SERVICE-2026-0001-col",
    "operator": "orange",
    "status": "pending",
    "amount": 2550,
    "fee_amount": 50,
    "net_amount": 2500,
    "environment": "sandbox"
  }
}
```

### Reponse 200 OK

Retour idempotent : la meme operation a deja ete recue.

## GET /api/v1/service-payments/{service_payment_id}

Retourne l'etat courant d'un service payment.

```http
GET /api/v1/service-payments/9de3092a-6452-4326-b80d-9ee91f6066a9
Authorization: Bearer <API_KEY>
```

Statuts possibles :

| Statut | Signification |
|---|---|
| `created` | Operation creee |
| `collection_pending` | Collecte en attente |
| `collection_success` | Collecte reussie |
| `collection_failed` | Collecte echouee |
| `payment_pending` | Paiement/reversement en attente |
| `payment_success` | Paiement/reversement reussi |
| `payment_failed` | Paiement/reversement echoue |
| `success` | Flow termine avec succes |
| `failed` | Flow termine en echec |

## GET /api/v1/operators/status

Retourne les operateurs disponibles pour le partenaire authentifie.

### Request

```http
GET /api/v1/operators/status
Authorization: Bearer <API_KEY>
```

### Reponse 200 OK

```json
{
  "operators": [
    {
      "operator": "orange",
      "configured": true,
      "allowed": true
    },
    {
      "operator": "moov",
      "configured": true,
      "allowed": false
    }
  ]
}
```

`configured=true` signifie que l'operateur est configure cote MynaPay. `allowed=true` signifie que votre compte partenaire est autorise a l'utiliser.

## Codes HTTP

| Code | Signification |
|---|---|
| `200 OK` | Requete reussie ou retour idempotent |
| `202 Accepted` | Creation traitee ; lire `status` dans le JSON pour le resultat courant |
| `400 Bad Request` | Payload invalide |
| `401 Unauthorized` | Cle API absente ou invalide |
| `403 Forbidden` | Client suspendu, operateur non autorise ou `client_id` incoherent |
| `404 Not Found` | Paiement introuvable ou non accessible a ce client |
| `409 Conflict` | Cle d'idempotence deja utilisee avec un payload different |
| `429 Too Many Requests` | Quota par minute depasse |
| `500 Internal Server Error` | Erreur technique temporaire |
| `503 Service Unavailable` | Service temporairement indisponible |

## Timeouts et reprise

Un timeout HTTP n'est jamais une preuve que le paiement a echoue. En cas de
timeout ou de rupture reseau :

1. ne creez pas une nouvelle reference ;
2. reutilisez exactement la meme `Idempotency-Key` et le meme payload ;
3. conservez tout `payment_id`, `collection_id` ou `operator_ref` recu ;
4. consultez ensuite la ressource par son identifiant ;
5. si le statut reste incertain, contactez MynaPay avant tout paiement par un
   autre canal.

## Erreurs courantes

```json
{
  "error": "authentification gateway requise"
}
```

La cle API est absente de l'en-tete `Authorization`.

```json
{
  "error": "authentification gateway invalide"
}
```

La cle API fournie n'est pas active ou ne correspond a aucun compte partenaire.

```json
{
  "error": "idempotency_key requis"
}
```

```json
{
  "error": "operateur non autorise pour ce client"
}
```

```json
{
  "error": "idempotency_key deja utilisee avec une requete differente"
}
```

```json
{
  "error": "quota gateway depasse"
}
```
