# Guide partenaire — Paiements par lots

Ce guide explique comment exécuter plusieurs paiements mobile money avec la
Gateway MynaPay sans créer de doublons et sans perdre la trace d'une opération.

## Principe

La Gateway ne propose pas un endpoint `bulk` unique. Un lot est orchestré par
le backend partenaire en appelant une fois `POST /api/v1/payments` pour chaque
bénéficiaire.

Chaque paiement reste indépendant :

- un `payment_id` MynaPay ;
- une référence métier partenaire ;
- une clé d'idempotence stable ;
- un statut ;
- une référence opérateur lorsqu'elle est disponible.

Cette granularité permet de reprendre uniquement les éléments concernés sans
rejouer tout le lot.

## Identifiants recommandés

Attribuez deux identifiants immuables :

- `batch_reference` : référence globale du lot dans votre système ;
- `item_reference` : référence unique de la ligne dans le lot.

Utilisez `item_reference` comme `external_reference` et
`Idempotency-Key`. Par exemple :

```text
batch_reference = PAYROLL-2026-07
item_reference  = PAYROLL-2026-07-000042
```

Ne réutilisez jamais la clé d'une ligne pour un autre numéro, un autre montant
ou un autre opérateur.

## Appel par ligne

```bash
curl -X POST "https://pay.myna-etoile.com/api/v1/payments" \
  -H "Authorization: Bearer $MYNAPAY_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: PAYROLL-2026-07-000042" \
  -d '{
    "external_reference": "PAYROLL-2026-07-000042",
    "operator": "orange",
    "phone": "22670123456",
    "amount": 25000,
    "label": "Salaire juillet 2026"
  }'
```

Un HTTP `202 Accepted` signifie que la création a été traitée par la Gateway.
Il ne faut pas déduire le résultat financier du seul code HTTP : lisez toujours
le champ JSON `status`, qui peut déjà valoir `success`, `failed` ou `pending`.

## Concurrence et quotas

Commencez avec une concurrence faible et augmentez-la uniquement après accord
avec MynaPay :

- pilote : 1 à 2 requêtes simultanées ;
- production : limite convenue pendant l'onboarding ;
- respectez le quota par minute du client API ;
- sur `429`, ralentissez avec un backoff et rejouez la même opération avec la
  même clé.

Une forte concurrence non validée peut dépasser les capacités du compte
opérateur ou les limites contractuelles, même si l'API partenaire reste
accessible.

## Données à conserver

Pour chaque ligne, conservez au minimum :

| Champ | Utilité |
|---|---|
| `batch_reference` | regrouper le lot côté partenaire |
| `external_reference` | retrouver la ligne métier |
| `idempotency_key` | empêcher un double paiement |
| `payment_id` | consulter l'opération MynaPay |
| `operator` | identifier le rail utilisé |
| téléphone masqué | support et rapprochement |
| `amount` | rapprochement financier |
| `status` | décision métier |
| `operator_ref` | preuve et rapprochement opérateur |
| dates de création/mise à jour | audit et investigation |

Ne journalisez jamais la clé API ni des numéros complets dans des logs destinés
à un public large.

## Traitement des réponses

| Résultat | Action partenaire |
|---|---|
| HTTP `202`, `status=success` | finaliser la ligne en succès |
| HTTP `202`, `status=failed` | enregistrer l'échec et ne pas changer de clé pour relancer la même opération |
| HTTP `202`, `status=pending` | conserver en attente et consulter le paiement |
| HTTP `200` | opération idempotente déjà connue ; utiliser l'objet retourné |
| HTTP `409` | arrêter : la clé est associée à un payload différent |
| HTTP `429` | ralentir et réessayer avec la même clé et le même payload |
| timeout/erreur réseau | résultat inconnu ; réutiliser la même clé, jamais une nouvelle |

Un timeout HTTP n'est pas une preuve d'échec financier.

## Reprise sûre

En cas d'erreur réseau :

1. ne créez pas une nouvelle référence ;
2. renvoyez exactement le même payload avec la même `Idempotency-Key` ;
3. si un `payment_id` est connu, consultez
   `GET /api/v1/payments/{payment_id}` ;
4. après les tentatives prévues, placez la ligne en investigation et contactez
   MynaPay ;
5. ne payez pas la ligne par un autre canal avant confirmation de son état.

Pour Orange CashIn, la Gateway ne dispose pas actuellement d'un endpoint de
statut opérateur séparé exploitable. La référence et la réponse initiales sont
donc particulièrement importantes pour le rapprochement.

## Fin d'un lot

Un lot ne doit être déclaré terminé que lorsque toutes les lignes sont dans un
état final explicite :

- `success` ;
- `failed` certain ;
- ou investigation manuelle documentée.

Produisez un récapitulatif avec :

- nombre et montant demandés ;
- nombre et montant réussis ;
- nombre et montant échoués ;
- nombre et montant en attente/investigation ;
- liste des `payment_id` et `operator_ref` ;
- écarts entre votre registre et la Gateway.

## Test avant production

Avant un lot important :

1. validez les payloads en sandbox ;
2. testez le retour idempotent avec la même clé et le même payload ;
3. testez le `409` avec la même clé et un payload modifié ;
4. exécutez un mini-lot réel à faible montant ;
5. confirmez la réception auprès des bénéficiaires ;
6. rapprochez chaque ligne avec MynaPay et le relevé opérateur ;
7. faites approuver les limites de concurrence et de volume.

## Support

Pour une ligne incertaine, transmettez à MynaPay sans inclure de secret :

- `client_id` ;
- `batch_reference` ;
- `external_reference` ;
- `payment_id` si disponible ;
- `operator_ref` si disponible ;
- opérateur, montant, date et heure ;
- statut et code HTTP reçus ;
- extrait de logs avec téléphone masqué.
