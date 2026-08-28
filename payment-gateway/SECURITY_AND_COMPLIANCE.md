# Securite et regles d'exploitation

Ce document decrit les regles minimales pour integrer la Payment Gateway MynaPay en securite.

## Cle API

La cle API est un secret machine-to-machine.

Regles :

- ne jamais l'exposer dans une app mobile ;
- ne jamais l'exposer dans un navigateur ;
- ne jamais la commiter dans Git ;
- ne jamais l'envoyer dans des logs applicatifs ;
- la stocker dans un gestionnaire de secrets ou une variable d'environnement serveur ;
- demander une rotation immediatement en cas de fuite.

## HTTPS

Tous les appels partenaires doivent utiliser HTTPS.

Les appels non chiffres ne sont pas acceptables hors environnement local controle.

## Idempotence

L'idempotence protege contre les doubles paiements.

Regles :

- generer une cle unique par paiement metier ;
- reutiliser la meme cle uniquement pour le retry du meme paiement ;
- ne jamais changer le montant, le numero, l'operateur ou la reference avec la meme cle ;
- stocker localement la cle utilisee.

Exemples de bonnes cles :

```text
ORDER-2026-0001
GAIN-LOT-2026-000123
INVOICE-ONEA-778899
PAYOUT-SELLER-2026-0042
```

## Retries

En cas de timeout ou erreur reseau :

1. Ne considerez jamais le timeout comme un echec financier.
2. Reessayez avec la meme `Idempotency-Key`.
3. Ne modifiez pas le payload et ne creez pas une nouvelle reference.
4. Si la Gateway retourne un identifiant ou une reference operateur, stockez-le.
5. Consultez ensuite la ressource par son identifiant.

Recommandation :

- retry 1 apres 5 secondes ;
- retry 2 apres 30 secondes ;
- retry 3 apres 2 minutes ;
- ensuite passer en reconciliation et contacter MynaPay avant tout paiement par
  un autre canal.

Pour Orange, certains flux ne disposent pas d'un endpoint de statut operateur
separe. Une reponse vide ou un timeout apres envoi exige donc une investigation ;
ne tentez pas de contourner l'incertitude avec une nouvelle cle.

## Gestion des statuts

| Statut | Action recommandee |
|---|---|
| `pending` | Attendre, verifier plus tard, ne pas repayer avec une nouvelle cle |
| `success` | Marquer le paiement comme confirme |
| `failed` | Marquer comme echoue et appliquer votre procedure metier |

Ne considerez jamais un timeout HTTP comme un echec financier. Il peut cacher un paiement en cours.

## Quotas

Chaque partenaire dispose d'un quota par minute.

Si vous recevez :

```json
{
  "error": "quota gateway depasse"
}
```

ralentissez vos appels et contactez MynaPay si votre volume legitime depasse le quota defini.

## Isolation des clients

Chaque cle API est associee a un client.

Un client :

- ne peut creer que pour lui-meme ;
- ne peut lire que ses paiements ;
- ne peut verifier que ses paiements ;
- ne peut utiliser que les operateurs autorises.

## Journalisation cote partenaire

Conservez au minimum :

- `external_reference` ;
- `idempotency_key` ;
- `payment_id` ;
- `operator` ;
- `phone` masque si possible ;
- `amount` ;
- `status` ;
- `operator_ref` ;
- date de creation ;
- date de derniere verification.

Evitez de journaliser :

- cle API ;
- donnees personnelles non necessaires ;
- payloads complets contenant des informations sensibles.

## Reconciliation

Le partenaire doit maintenir sa propre reconciliation metier.

Exemple :

```text
Commande / Ticket / Facture
      |
external_reference
      |
Payment Gateway payment_id
      |
status final
      |
ecriture comptable / recu / notification
```

Pour les paiements par lots, rapprochez chaque ligne individuellement et
conservez les totaux par statut. Voir `BATCH_PAYMENTS_GUIDE.md`.

## Responsabilites

MynaPay est responsable de :

- l'API Gateway ;
- la securite des credentials operateurs ;
- la communication technique avec les operateurs ;
- la trace technique des paiements ;
- l'isolation des clients API ;
- l'idempotence technique.

Le partenaire est responsable de :

- l'identification de ses utilisateurs ;
- la validation metier des demandes ;
- la conformite de son service ;
- la protection de sa cle API ;
- la reconciliation interne ;
- les notifications a ses utilisateurs ;
- les controles antifraude propres a son activite.

## Incident et support

En cas d'incident, fournissez a MynaPay :

- votre `client_id` ;
- `external_reference` ;
- `payment_id` si disponible ;
- date et heure de l'appel ;
- operateur ;
- montant ;
- statut obtenu ;
- extrait de logs sans cle API.
