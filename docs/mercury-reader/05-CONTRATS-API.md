# Contrats d'API Reader v1

## Statut des routes

**Implémenté dans ce lot** : `GET /api/customer/reader/v1/books/{book}/manifest`, cookie de compte obligatoire, throttle 60/minute. Propriétaire d'un achat ebook terminé requis. Aucun bearer achat ni query token n'ouvre cette route sans compte. Aucun dérivé n'est encore servi.

Réponse 200 fondation :

```json
{
  "schema_version": 1,
  "book": {"id": 42, "title": "Titre", "author_name": "Auteur"},
  "capabilities": {"read": false, "download_original": false, "print": false, "share_excerpt": false},
  "delivery": {"status": "pending_secure_derivatives"}
}
```

401 non connecté, 403 pas d'achat valide, 404 livre inconnu, 429 limite ; `Cache-Control: private, no-store`. Le read=false est volontaire. À disponibilité des dérivés, ajouter édition et format ; ne jamais annoncer lecture prête sur simple présence d'un chemin original.

**Routes historiques conservées** : `/api/books/{book}/reader`, `/reader/{pdf|epub}`, `/api/customer/books/{book}/progress` GET/POST, `/reading-progress` et `/reading-progress/last`, `/books/{book}/verify-access`. Elles ne deviennent pas v1. `show` ne contient plus `purchase`. Les réponses d'erreur historiques restent compatibles. La livraison de l'original n'est pas supprimée dans ce lot.

## Cible contractuelle, non implémentée

Préfixe `/api/customer/reader/v1`. JSON UTF-8 ; IDs opaques pour nouvelles ressources ; dates RFC3339 UTC ; page physique 1-based. Un id client de propriétaire n'est jamais accepté. Session cookie Secure/HttpOnly/SameSite ; protection CSRF sur mutations et Origin/CORS exacts avant activation.

| Méthode/route relative | Corps/paramètres | Résultat et invariants |
| --- | --- | --- |
| POST `/sessions` | book_id, edition_id, device_id | 201 session opaque, expires_at, capabilities ; 409 limite sessions ; aucun token d'achat |
| DELETE `/sessions/{id}` | aucun | 204 idempotent pour sa session ; revalidation propriétaire |
| POST `/sessions/{id}/heartbeat` | operation_id | 200 expiration ; 403 droit révoqué ; n'étend pas une licence expirée |
| GET `/sessions/{id}/pages/{page}` | numéro entier | PDF dérivé image/texte ou ressources explicitement référencées ; aucune URL originale ; 404 hors bornes ; 403 session expirée |
| GET `/sessions/{id}/sections/{id}` | identifiant spine validé | EPUB assaini et ressources locales de l'édition ; pas d'URL arbitraire ni script |
| GET `/books/{id}/position` | édition | 200 position ou null, revision=0 initiale |
| PUT `/books/{id}/position` | edition_id, locator, base_revision, operation_id UUID, session_id, duration_delta bornée | 200 révision suivante ; compare-and-swap transactionnel ; 409 conflit ; retry identique renvoie résultat mémorisé |
| GET/POST `/books/{id}/bookmarks` | édition / locator,label | Liste paginée / 201 ; propriétaire imposé |
| GET/POST `/books/{id}/annotations` | édition / type,locator,body | Liste paginée / 201 privée ; texte brut, taille bornée, pas d'HTML |
| PATCH/DELETE `/annotations/{id}` | révision/patch autorisé | 200/204 ; 404 tiers ; conflit 409 |
| POST `/books/{id}/excerpts` | locator, edition_id, group_id, reflection | 201 après vérification du texte canonique et de politique, ou 403 interdiction citation ; quotas 429 |
| POST `/excerpts/{id}/reports` | reason_code, commentaire borné | 202 modération ; ne publie aucune note privée |
| GET `/books/{id}/audio` | édition, track facultative | Manifeste des segments/voix/pistes autorisés, jamais accès fichier original |

## Exemple de position cible

```json
{
  "edition_id": "edition_opaque",
  "locator": {"type": "pdf", "page": 12, "text_version": 1},
  "base_revision": 4,
  "operation_id": "96a93682-9bad-4441-9424-f820157eed52",
  "session_id": "session_opaque",
  "duration_delta": 15
}
```

Réponse : `{ "position": { "edition_id": "edition_opaque", "locator": {"type":"pdf","page":12,"text_version":1} }, "revision": 5 }`. Total et pourcentage calculés depuis manifeste validé. Validation : champs inconnus rejetés pour mutations v1, page réelle bornée, CFI appartenant à l'édition, taille body et locator bornée. Audio ajoute segment_id et offset ; jamais un deuxième pourcentage concurrent.

## Erreurs cibles

```json
{"error":{"code":"position_conflict","message":"La position a changé sur un autre appareil.","request_id":"opaque"},"current":{"revision":5}}
```

Codes stables : unauthenticated (401), reading_forbidden/license_revoked/session_expired (403), resource_not_found (404), position_conflict/operation_conflict/session_limit (409), invalid_locator (422), rate_limited (429), asset_not_ready (503 avec Retry-After). Les exceptions internes, storage_key, token d'achat et données de paiement ne sortent jamais. Cette enveloppe cible ne remplace pas les erreurs Laravel existantes dans ce lot.

## Compatibilité et portabilité

Déprécier query token puis bearer invité après rattachement des anciens achats avec preuve vérifiée ; ne pas attribuer un achat au premier compte qui présente un jeton. OpenAPI exécutable et tests de conformité Laravel/Go à fournir au lot suivant avant implémentation des mutations v1. Les DTO ne doivent pas refléter une sérialisation Eloquent brute. Pas de version silencieusement réinterprétée entre Laravel et Go.
