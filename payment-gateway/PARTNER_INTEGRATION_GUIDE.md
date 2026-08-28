# Guide d'integration partenaire

Ce guide explique comment une application partenaire integre la Payment Gateway MynaPay.

La Gateway expose une API REST JSON pour creer un paiement mobile money, consulter son statut et verifier les operateurs disponibles pour votre compte partenaire.

## Principe

```text
Application partenaire backend
      |
      | HTTPS + Authorization: Bearer <API_KEY>
      v
MynaPay Payment Gateway
      |
      +-- Operateurs mobile money
```

L'integration doit toujours se faire depuis votre backend. Ne placez jamais la cle API dans une application mobile, un navigateur, un front web ou un depot public.

## Choisir le bon endpoint

| Parcours | Endpoint | Resultat |
|---|---|---|
| Paiement sortant simple | `POST /api/v1/payments` | Envoie de l'argent vers un numero mobile money |
| Collecte entrante simple | `POST /api/v1/collections` | Debite le payeur et credite le wallet MynaPay lie au client si configure |
| Application externe configuree | `POST /api/v1/service-payments` | Execute le flow metier configure par MynaPay : collecte seule, paiement seul, collecte puis reversement, collecte puis credit wallet ou settlement differe |

Pour les applications externes avec frais, reversement ou regles metier, MynaPay fournit aussi un `app_id`. Dans ce cas, utilisez `service-payments` plutot que d'appeler directement `payments` et `collections`.

## Informations fournies par MynaPay

Pendant l'onboarding, MynaPay vous fournit :

| Element | Description |
|---|---|
| `client_id` | Identifiant stable de votre application |
| `api_key` | Cle API secrete pour l'authentification |
| `base_url` | URL publique : `https://pay.myna-etoile.com` |
| `environment` | `sandbox` pour les tests, `production` apres activation |
| `app_id` | Identifiant d'application, fourni uniquement si un flow metier `service-payments` est configure |
| Operateurs autorises | Exemple : `orange`, `moov` ou les deux |
| Quota | Nombre de requetes autorisees par minute |

## Authentification

Tous les endpoints proteges utilisent un bearer token :

```http
Authorization: Bearer <API_KEY>
```

La cle API identifie automatiquement votre `client_id`. Le champ `client_id` dans les payloads est donc optionnel. Si vous l'envoyez, il doit correspondre au client lie a votre cle API.

Testez d'abord la cle avec :

```bash
curl -H "Authorization: Bearer $MYNAPAY_API_KEY" \
  https://pay.myna-etoile.com/api/v1/operators/status
```

Une reponse `401 Unauthorized` indique une cle absente ou invalide. Une reponse `200 OK` confirme que la cle est active pour la Gateway.

## Creer un paiement

Endpoint :

```http
POST /api/v1/payments
```

Headers :

```http
Authorization: Bearer <API_KEY>
Content-Type: application/json
Idempotency-Key: <reference_unique>
```

Body recommande :

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

Reponse typique :

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

## Idempotence

Chaque creation de paiement doit avoir une cle d'idempotence unique.

Utilisez une reference metier stable :

- numero de commande ;
- numero de ticket ;
- identifiant de gain ;
- identifiant de facture ;
- identifiant de transaction interne.

Si vous envoyez deux fois la meme requete avec la meme cle, la Gateway retourne le paiement existant sans creer de doublon.

Si vous reutilisez la meme cle avec un montant, numero ou operateur different, la Gateway retourne `409 Conflict`.

## Consulter un paiement

```http
GET /api/v1/payments/{payment_id}
Authorization: Bearer <API_KEY>
```

La reponse retourne le statut connu par la Gateway.

La Gateway publique ne fournit pas d'endpoint de liste `GET /api/v1/payments`. Stockez donc le `payment_id` retourne lors de la creation.

## Verifier le statut

```http
POST /api/v1/payments/{payment_id}/check
Authorization: Bearer <API_KEY>
```

Ce endpoint demande a la Gateway de verifier le statut aupres de l'operateur lorsque cela est disponible.

## Application externe configuree

Endpoint :

```http
POST /api/v1/service-payments
```

Utilisez ce endpoint quand MynaPay a configure une application dans le portail API. Le `app_id` determine le flow, les frais, l'operateur de collecte, l'operateur de reversement et le mode de settlement.

Headers :

```http
Authorization: Bearer <API_KEY>
Content-Type: application/json
Idempotency-Key: SERVICE-2026-0001
```

Body :

```json
{
  "app_id": "8b4e8c2e-0f93-4e8e-92b6-4e9b3ad5f701",
  "external_reference": "SERVICE-2026-0001",
  "payer_phone": "22670123456",
  "amount": 2500,
  "otp": "541847",
  "label": "Paiement service SERVICE-2026-0001"
}
```

Reponse typique :

```json
{
  "service_payment_id": "9de3092a-6452-4326-b80d-9ee91f6066a9",
  "status": "collection_pending",
  "external_reference": "SERVICE-2026-0001",
  "amount": 2500,
  "customer_fee_amount": 50,
  "amount_to_reverse": 2450,
  "collection": {
    "collection_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "pending",
    "operator": "orange",
    "amount": 2550,
    "net_amount": 2500
  }
}
```

Statuts `service-payments` possibles :

| Statut | Signification |
|---|---|
| `created` | Operation creee, pas encore executee |
| `collection_pending` | Collecte en attente |
| `collection_success` | Collecte confirmee, suite du flow en cours ou terminee |
| `collection_failed` | Collecte echouee |
| `payment_pending` | Paiement/reversement en attente |
| `payment_success` | Paiement/reversement confirme |
| `payment_failed` | Paiement/reversement echoue |
| `success` | Flow metier termine avec succes |
| `failed` | Flow metier termine en echec |

Consulter une operation :

```http
GET /api/v1/service-payments/{service_payment_id}
Authorization: Bearer <API_KEY>
```

Pour Moov OTP, envoyez `collection_mode: "moov_otp"` lors de la creation, puis validez l'OTP avec `POST /api/v1/collections/{collection_id}/otp/commit` lorsque le client recoit le code.

## Statuts possibles

| Statut | Signification |
|---|---|
| `pending` | Paiement recu ou en attente de confirmation |
| `success` | Paiement confirme |
| `failed` | Paiement echoue |

Votre application doit accepter que certains paiements restent temporairement en `pending`.

## Recommandations d'integration

- Appelez la Gateway uniquement depuis votre backend.
- Stockez `payment_id`, `external_reference`, `status`, `operator_ref` et `message`.
- Utilisez une cle d'idempotence stable pour chaque paiement.
- Ne changez jamais le payload lors d'un retry avec la meme cle.
- Mettez en place une reconciliation interne entre vos commandes/factures/gains et les paiements Gateway.
- Ne considerez un paiement definitif que lorsque `status=success` ou `status=failed`.

## Exemple curl

```bash
curl -X POST "https://pay.myna-etoile.com/api/v1/payments" \
  -H "Authorization: Bearer $MYNAPAY_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: ORDER-2026-0001" \
  -d '{
    "external_reference": "ORDER-2026-0001",
    "operator": "orange",
    "phone": "22670123456",
    "amount": 2500,
    "label": "Paiement commande ORDER-2026-0001"
  }'
```

## Passage en production

Avant l'activation production :

- les tests sandbox doivent etre valides ;
- les operateurs autorises doivent etre confirmes ;
- les quotas doivent etre valides ;
- les contacts techniques doivent etre communiques ;
- un test de faible montant doit etre planifie ;
- les procedures de support et reconciliation doivent etre connues des deux parties.
