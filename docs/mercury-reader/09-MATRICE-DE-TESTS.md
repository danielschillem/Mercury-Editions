# Matrice de qualification

Statut : E = exécuté dans ce lot ; A = automatisation ajoutée ; P = prévu/non qualifié. Le rapport précise réussite et environnement. A ne veut pas dire E tant que commande non exécutée.

| ID | Cas | Attendu | Moyen et état initial |
| --- | --- | --- | --- |
| T01 | Propriétaire achat ebook completed, token périmé | Lecture historique et manifeste v1 autorisés, aucune donnée achat dans manifeste | BookReaderAccessTest, E |
| T02 | B connecté présente token de A | 403 metadata/fichier/progression/v1 ; verify-access=false ; aucune ligne créée | BookReaderAccessTest, E |
| T03 | Visiteur avec token sur v1 | 401 | BookReaderAccessTest, E |
| T04 | Invité legacy et désactivation config | Ancien accès conservé ; query/bearer désactivables ; propriétaire conserve accès | BookReaderAccessTest, E |
| T05 | Commande devient failed | Appel suivant refusé | BookReaderAccessTest, E |
| T06 | Papier, pending, mauvais livre | Aucun droit ebook | BookReaderAccessTest, E |
| T07 | Progression historique | Enregistrement/relecture et dernière lecture attendus | ReadingProgressApiTest, E (dont deux propriétaires du même livre) |
| T08 | Témoin 55 pages exact | SHA-256 exact ; 55 analyses, extractions et rendus | tests/reader/witness.test.mjs, E |
| T09 | Limites document | Pages 0/N+1 refusées ; moteur détruit inutilisable | Tests locator et witness, E |
| T10 | Ancrage | Citation/contexte exacts ; mauvaise édition incompatible ; offsets invalides refusés | tests/reader/locator.test.mjs, E |
| T11 | Outline témoin | Détecter absence sans inventer de sommaire | witness, E ; sommaire visuel à éditer |
| T12 | Navigation mobile | Écran 390x844, pages 1→2→1, zoom et texte réel, aucune fuite réseau | prototype.smoke.mjs, E (viewport simulé) |
| T13 | Deux appareils en concurrence | 409 stale révision ; retry même operation_id sans incrément | Futur v1, P |
| T14 | Coupure/fermeture navigateur | Position en attente signalée et reprise contrôlée ; pas de succès fictif | Futur file locale, P |
| T15 | Notes/surlignages | CRUD propriétaire ; 404 tiers ; aucune publication automatique | Futur stockage, P |
| T16 | Extrait | Autorisation édition, citation canonique, budget et auteur/page automatiques | Futur API sur texte synthétique, P |
| T17 | Groupe privé/rejeté/inactif | Pas d'extrait/message sans permission ; rejet non contournable par join | ReaderCommunityTest partiel et nouveaux scénarios requis |
| T18 | Accès URL original | Direct public/storage, chemin deviné, URL expirée et range non autorisés refusés | Audit futur de stockage qualification, P ; legacy non conforme |
| T19 | Audio page | Pas de résumé ; absence voix locale expliquée ; pause/reprise/vitesse et changement de page | Prototype présent, audio réel device à qualifier P |
| T20 | EPUB malveillant | Pas de scripts, réseau externe, archive explosive ou path traversal | Import/moteur futur, P |
| T21 | Édition remplacée | Notes restent anciennes/orphelines ; aucun collage sur autre passage | Futur réancrage, P |
| T22 | Session/device/révocation | Limites atomiques, expiration et logout avant ressource suivante | Futur licences/sessions, P |
| T23 | Sécurité Web | CSRF, CORS, CSP, no-store, cache intermédiaire, pas de token en logs | Partiel sur en-têtes ; audit mutations requis |
| T24 | Compatibilité | Chrome/Firefox/Safari desktop, Android et iOS réels, clavier et lecteur d'écran | P ; viewport simulé ne suffit pas |
| T25 | Connexion lente | 400 kb/s, RTT 300 ms, perte réseau ; mémoire et délai premier rendu | P ; seuils ci-dessous |
| T26 | Flipbook | Parité position/notes/droits, tactile et reduced-motion | P |
| T27 | Régression générale | Suite backend et build frontend sans modification flux paiement | Résultats dans rapport |

## Objectifs de performance à mesurer

Proposition initiale : API metadata p95 < 300 ms en qualification, page dérivée première vue < 5 s à 400 kb/s après shell chargé, navigation page en cache < 500 ms, pas de chargement simultané du document complet côté offre stricte. Mesurer volume des dérivés, mémoire max, délai worker et coût OCR séparément. Ce sont des budgets de conception non validés. Le témoin original de 18 544 548 octets implique environ 371 s de transfert théorique à 400 kb/s hors overhead : l'ancien chargement blob est incompatible avec un démarrage rapide sur cette liaison.

Ne pas utiliser une mesure de rendu Node locale comme preuve de performance mobile ou réseau. Conserver navigateur/OS/CPU/mémoire, taille corpus, configuration réseau et percentiles dans les prochains rapports.
