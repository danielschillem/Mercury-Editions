# FISCA APP — Configuration Gateway de production

Document de remise technique pour configurer le backend FISCA APP avec la
Gateway MynaPay. Ce document ne contient volontairement aucun secret.

## 1. Identifiants et environnement

| Paramètre | Valeur |
|---|---|
| Environnement | `production` |
| Base URL | `https://pay.myna-etoile.com` |
| Préfixe API | `/api/v1` |
| Client ID | `fisca-app` |
| App ID | `e6e9ba53-1326-4396-b83f-04c58dbbca85` |
| Tenant ID MassPay | `bbeb11d8-2bcd-4875-9905-616e0331d875` |
| Tenant | `FISCA APP PROD COLLECT/PAIEMENT` |
| Opérateurs autorisés | `orange,moov` |

Le `Client ID`, l'`App ID` et le `Tenant ID` sont des identifiants, pas des
secrets. Ils ne remplacent jamais la clé API.

## 2. Variables à configurer dans le backend FISCA APP

```env
MYNAPAY_ENV=production
MYNAPAY_BASE_URL=https://pay.myna-etoile.com
MYNAPAY_CLIENT_ID=fisca-app
MYNAPAY_APP_ID=e6e9ba53-1326-4396-b83f-04c58dbbca85
MYNAPAY_API_KEY=<SECRET_TRANSMIS_PAR_CANAL_SECURISÉ>
MYNAPAY_HTTP_TIMEOUT_SECONDS=35
```

La clé API doit être injectée par le gestionnaire de secrets du serveur FISCA
APP. Elle ne doit jamais être placée dans Git, dans le frontend, dans une
application mobile, dans un ticket ou dans les logs.

La Gateway stocke uniquement le hash de la clé existante : MynaPay ne peut pas
la relire en clair. Si FISCA APP ne possède plus la clé remise initialement, il
faut effectuer une rotation depuis l'administration MynaPay et transmettre la
nouvelle valeur une seule fois par un canal sécurisé. La rotation invalide
l'ancienne clé.

## 3. Configuration MassPay actuellement enregistrée

| Paramètre | Valeur |
|---|---|
| Flux | `collection_then_wallet_credit` |
| Règlement | `wallet_credit` |
| Frais de collecte | `1.5 %` |
| Frais supportés par | le client final (`customer_pays`) |
| Opérateur de collecte | automatique |
| OTP requis | oui |
| Limite API | 60 requêtes/minute |
| Statut client | `active` |
| Statut application | `active` |
| Validation go-live | `approved` |

Scopes autorisés :

```text
collections:create
collections:read
collections:check
operators:status
```

Cette configuration n'autorise pas les paiements sortants ni les batchs.

## 4. Endpoint métier recommandé

Pour que la Gateway applique le flow FISCA configuré, notamment les frais et le
crédit du wallet tenant, utiliser :

```http
POST /api/v1/service-payments
Authorization: Bearer <MYNAPAY_API_KEY>
Content-Type: application/json
Idempotency-Key: <REFERENCE_FISCA_UNIQUE>
```

Exemple Orange Money :

```json
{
  "app_id": "e6e9ba53-1326-4396-b83f-04c58dbbca85",
  "external_reference": "FISCA-2026-000001",
  "payer_phone": "226XXXXXXXX",
  "amount": 1000,
  "otp": "<OTP_FOURNI_PAR_LE_PAYEUR>",
  "label": "Paiement FISCA FISCA-2026-000001"
}
```

Consulter ensuite l'opération sans créer un second mouvement :

```http
GET /api/v1/service-payments/{service_payment_id}
Authorization: Bearer <MYNAPAY_API_KEY>
```

Pour une intégration directe de collecte, les endpoints autorisés sont aussi :

```text
POST /api/v1/collections
GET  /api/v1/collections/{collection_id}
POST /api/v1/collections/{collection_id}/check
GET  /api/v1/operators/status
```

Le parcours `service-payments` reste recommandé pour respecter la configuration
métier enregistrée pour FISCA APP.

## 5. Règles d'intégration obligatoires

1. Appeler la Gateway uniquement depuis le backend FISCA APP.
2. Utiliser une référence métier et une `Idempotency-Key` uniques et stables.
3. Réutiliser la même clé d'idempotence après un timeout ; ne jamais recréer
   immédiatement l'opération sous une nouvelle référence.
4. Considérer `pending` comme un résultat financier inconnu et interroger
   l'opération existante avant toute nouvelle tentative.
5. Stocker au minimum `service_payment_id`, `collection_id`,
   `external_reference`, `status`, `operator_ref`, les montants et les dates.
6. Ne jamais enregistrer l'OTP, la clé API ou le header `Authorization` dans les
   logs.
7. Utiliser le format téléphone Burkina Faso `226XXXXXXXX` et des montants FCFA
   entiers, sans décimales.

## 6. Contrôles avant activation finale

- [ ] La clé API de production a été transmise au responsable technique FISCA
  APP par un canal sécurisé.
- [ ] La clé est stockée dans un coffre de secrets côté serveur.
- [ ] L'adresse IP publique sortante du backend FISCA APP a été communiquée à
  MynaPay pour restriction IP.
- [ ] L'URL webhook HTTPS et son secret ont été configurés si FISCA APP utilise
  les notifications ; sinon, le suivi par `GET` est implémenté.
- [ ] Un test d'idempotence sans double mouvement a été validé.
- [ ] Un test Orange à faible montant a été rapproché.
- [ ] Un test Moov à faible montant a été rapproché.
- [ ] Le statut go-live est passé de `approved` à `live` après signature du PV
  de recette.

## 7. Test de connectivité sans mouvement financier

```bash
curl -fsS https://pay.myna-etoile.com/health

curl -fsS \
  -H "Authorization: Bearer $MYNAPAY_API_KEY" \
  https://pay.myna-etoile.com/api/v1/operators/status
```

Le premier appel ne nécessite pas d'authentification. Le second valide la clé,
le scope `operators:status` et l'accès réseau sans déclencher de transaction.

## 8. Documentation complémentaire à remettre

- `PARTNER_INTEGRATION_GUIDE.md`
- `COLLECT_WALLET_ENDPOINTS.md`
- `PARTNER_API_REFERENCE.md`
- `SECURITY_AND_COMPLIANCE.md`
- `openapi.public.yaml`
