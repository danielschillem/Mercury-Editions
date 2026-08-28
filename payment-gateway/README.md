# MynaPay Partner Payment Gateway

Ce dossier contient la documentation publique a transmettre aux partenaires qui souhaitent integrer la Payment Gateway MynaPay.

La documentation est volontairement separee de la documentation interne. Elle ne contient pas de details d'infrastructure, de secrets, de noms de conteneurs, de chemins serveur ou de configuration operateur.

## Documents

| Document | Usage |
|---|---|
| `PARTNER_INTEGRATION_GUIDE.md` | Guide de demarrage pour les developpeurs partenaires |
| `PARTNER_API_REFERENCE.md` | Reference technique des endpoints |
| `COLLECT_WALLET_ENDPOINTS.md` | Fiche directe pour collect/recharge wallet : Orange OTP, Moov push, Moov OTP |
| `BATCH_PAYMENTS_GUIDE.md` | Paiements par lots : orchestration, idempotence, reprise et rapprochement |
| `USE_CASES.md` | Cas d'utilisation : loterie, e-commerce, factures, services quotidiens |
| `SECURITY_AND_COMPLIANCE.md` | Regles de securite, idempotence, retries, responsabilites |
| `openapi.public.yaml` | Specification OpenAPI publique |
| `postman_collection.json` | Collection Postman importable |

## Lecture rapide pour une application externe

Pour une integration backend, choisissez d'abord le parcours metier :

| Besoin applicatif | Endpoint principal | Quand l'utiliser |
|---|---|---|
| Payer un beneficiaire mobile money | `POST /api/v1/payments` | Payout simple vers un numero Orange ou Moov |
| Payer plusieurs beneficiaires | un `POST /api/v1/payments` par ligne | Batch orchestre cote backend avec une cle d'idempotence par beneficiaire |
| Encaisser un payeur et crediter un wallet MynaPay | `POST /api/v1/collections` | Recharge wallet, collecte facture, depot client |
| Encaisser puis appliquer une regle metier configuree | `POST /api/v1/service-payments` | Application externe configuree dans le portail API : taxes, factures, marketplace, loterie, service public |
| Verifier l'etat d'une operation | `GET /api/v1/.../{id}` ou `POST /api/v1/.../{id}/check` | Reconciliation ou relance statut |

Les applications mobiles et frontends publics ne doivent jamais appeler directement la Gateway avec la cle API. Ils appellent le backend partenaire, qui appelle ensuite MynaPay.

## Ce que la Gateway couvre

La Payment Gateway permet a une application partenaire backend de creer et suivre des paiements mobile money via une API unique.

Elle centralise :

- l'authentification machine-to-machine ;
- les appels operateurs mobile money ;
- l'idempotence contre les doubles paiements ;
- l'orchestration applicative optionnelle via `service-payments` ;
- la tracabilite technique des paiements ;
- les permissions par client ;
- les quotas par client ;
- le suivi des statuts.

## Ce que la Gateway ne remplace pas

Le partenaire reste responsable de :

- ses utilisateurs finaux ;
- son wallet ou registre metier ;
- ses regles KYC/KYB si applicables ;
- ses plafonds metier ;
- sa comptabilite ;
- ses notifications client ;
- la reconciliation metier avec ses commandes, tickets, factures ou gains.

## Environnements

| Environnement | Usage |
|---|---|
| Sandbox | Tests d'integration sans mouvement financier reel |
| Production | Paiements reels apres validation contractuelle et technique |

Base URL publique :

```text
https://pay.myna-etoile.com
```

La distinction sandbox/production est appliquee par la configuration du compte partenaire et de sa cle API. Une cle sandbox ne doit pas etre reutilisee pour la production.

## Onboarding partenaire

1. MynaPay attribue un `client_id`.
2. MynaPay genere une cle API dediee.
3. MynaPay configure les operateurs autorises et le quota.
4. Le partenaire integre l'API cote backend uniquement.
5. Le partenaire effectue les tests sandbox.
6. MynaPay valide les tests et active la production.

## Verification rapide

Une fois la cle API recue, le premier test recommande est :

```bash
curl -H "Authorization: Bearer <API_KEY>" \
  https://pay.myna-etoile.com/api/v1/operators/status
```

Une reponse `200 OK` confirme que l'URL, la cle API et le routage gateway sont corrects.

Cette route confirme la configuration et l'autorisation du compte. Elle ne
garantit pas a elle seule qu'une transaction operateur reussira : validez un
montant reel minimal avant le go-live, selon la procedure convenue avec MynaPay.
