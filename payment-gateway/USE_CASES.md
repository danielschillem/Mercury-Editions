# Cas d'utilisation partenaires

La Payment Gateway MynaPay est concue pour faciliter les transactions mobile money du quotidien au Burkina Faso, via une API unique et controlee.

## 1. Loterie nationale et jeux

Exemple : une plateforme de loterie souhaite payer les gains des joueurs sur leur compte mobile money.

### Paiement d'un gain

```text
Ticket gagnant valide
      |
Validation metier cote loterie
      |
POST /api/v1/payments
      |
Credit mobile money du gagnant
      |
Stockage payment_id + statut
```

Payload exemple :

```json
{
  "external_reference": "GAIN-LOT-2026-000123",
  "operator": "orange",
  "phone": "22670123456",
  "amount": 50000,
  "label": "Paiement gain loterie GAIN-LOT-2026-000123",
  "idempotency_key": "GAIN-LOT-2026-000123"
}
```

Avantages pour la loterie :

- paiement rapide des gains ;
- trace technique de chaque decaissement ;
- prevention des doubles paiements ;
- separation entre validation du gain et execution mobile money ;
- possibilite de suspendre ou limiter l'acces API en cas d'incident.

Point a cadrer : les recharges joueurs peuvent relever d'un flux entrant ou d'un wallet interne. La Gateway actuelle couvre le mouvement mobile money technique ; le partenaire garde la logique du compte joueur.

## 2. E-commerce et marketplaces

Exemple : une startup e-commerce souhaite payer des vendeurs, rembourser un client ou declencher un paiement mobile money lie a une commande.

### Paiement lie a une commande

```json
{
  "external_reference": "ORDER-2026-0001",
  "operator": "moov",
  "phone": "22660123456",
  "amount": 12500,
  "label": "Paiement commande ORDER-2026-0001",
  "idempotency_key": "ORDER-2026-0001"
}
```

Avantages pour l'e-commerce :

- une API unique pour plusieurs operateurs ;
- suivi par numero de commande ;
- integration simple cote backend ;
- reconciliation entre commande, paiement et remboursement ;
- pas de gestion directe des credentials operateurs.

Cas possibles :

- remboursement client ;
- paiement vendeur ;
- paiement livreur ;
- reversement marchand ;
- prime ou commission commerciale.

## 3. Factures, services et utilities

Exemples :

- unite Cash Power ;
- facture ONEA ;
- carburant ;
- frais scolaires ;
- cotisations ;
- abonnement ou service de proximite.

Dans ces cas, l'application partenaire garde la logique metier :

- numero compteur ;
- numero facture ;
- reference client ;
- montant attendu ;
- validation fournisseur ;
- emission du recu final.

La Gateway gere le mouvement mobile money et la trace technique.

Payload exemple :

```json
{
  "external_reference": "ONEA-INV-2026-778899",
  "operator": "orange",
  "phone": "22670123456",
  "amount": 8300,
  "label": "Paiement facture ONEA 778899",
  "idempotency_key": "ONEA-INV-2026-778899"
}
```

## 4. Paiements de masse

Exemples :

- salaires ;
- primes ;
- commissions ;
- remboursements ;
- aides sociales ;
- paiements terrain.

Chaque ligne du lot doit avoir sa propre `external_reference` et sa propre `idempotency_key`.

Avantages :

- controle centralise ;
- suivi paiement par paiement ;
- reprise fiable en cas de timeout ;
- limitation du risque de doublon ;
- journal technique centralise.

## 5. Services du quotidien transactionnel

La Gateway peut devenir le rail technique pour les services qui rythment le quotidien :

- payer une personne ;
- rembourser un client ;
- regler une facture ;
- recevoir un gain ;
- percevoir une commission ;
- payer un prestataire ;
- retribuer un agent terrain.

Pour chaque cas, la regle reste la meme :

- le partenaire garde le metier ;
- MynaPay execute le mouvement mobile money ;
- les deux systemes partagent une reference commune via `external_reference`.

## Limites a clarifier pendant l'onboarding

Certains cas demandent un cadrage fonctionnel avant integration :

- paiement entrant client vers marchand ;
- recharge de wallet joueur ;
- remboursement automatique ;
- paiement avec validation manuelle ;
- plafonds par utilisateur ;
- verification KYC ;
- partage de frais ou commissions ;
- reconciliation comptable.

Ces elements sont definis dans le contrat d'integration et dans le workflow metier du partenaire.
