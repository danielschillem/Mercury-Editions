# Rapport de qualification : Mercury Reader

**Date :** 31 octobre 2026, Africa/Ouagadougou.

**Référence auditée :** `fb6f7b12e692b6d2658d22dfca59bcc9db76d131`.

**Branche :** `feat/mercury-reader-foundations`.

**Conclusion :** fondations prêtes pour revue technique ; Mercury Reader strict n'est pas prêt pour une mise en production.

## Travaux réalisés

Les neuf documents de conception, ce rapport et quatre ADR décrivent les composants existants, les exigences, l'architecture modulaire Laravel, les flux d'autorisation/synchronisation, les données, les API, les menaces et les lots suivants. La stratégie Go/Python/PostgreSQL/Redis a été prise en compte sans migration générale.

Les modifications exécutables sont limitées aux fondations Reader :

- `ReadingAccess` et `PurchaseReadingAccess` centralisent la vérification d'achat ebook terminé. Un compte connecté ne peut utiliser le jeton d'un tiers pour ouvrir un livre ou enregistrer sa progression. Le trait existant délègue à ce port.
- `ReadingPositionStore` et son adaptateur réutilisent la table existante en lecture, avec filtrage user/book. L'écriture historique reste inchangée. `PrivateAnnotationStore` est un contrat cible sans stockage ni route active.
- Un manifeste connecté `/api/customer/reader/v1/books/{book}/manifest` retourne des données minimales et `read=false`/`pending_secure_derivatives`. Il ne délivre pas d'original.
- La réponse metadata historique ne renvoie plus le bloc purchase ; les réponses metadata et fichiers autorisés sont `private, no-store`.
- Tous les boutons d'ouverture de source dans un onglet externe sont retirés. Le lecteur n'affiche plus jeton, téléphone ou transaction et n'envoie plus de bearer d'achat pour un compte connecté. Le filigrane textuel « Usage personnel » reste uniquement une indication d'usage, pas une protection technique.
- PDF.js 6.4.299 est verrouillé pour un prototype distinct. Worker local, nombre de pages réel, navigation, zoom et extraction texte. Le port expose page/text/outline/locator/destroy. Les ancres portent l'empreinte d'édition et un sélecteur de citation versionné.
- Le prototype vocal utilise le texte extrait de la page et accepte uniquement une voix française déclarée locale. Il ne substitue pas de résumé. Segmentation sans perte de caractères testée ; pause/reprise/arrêt sont proposés. L'écoute audible et la synchronisation audio persistante ne sont pas qualifiées.

## Environnement de test

PHP 8.4.27, PHPUnit 12.5.14, Laravel 13.0.0 depuis composer.lock, SQLite en mémoire, sessions/cache en mémoire et configuration de test sans secret de production. Node 24.22.1, Vite 7.3.3, PDF.js 6.4.299. Rendu Node par le canvas natif facultatif installé avec PDF.js. Smoke UI : Chromium headless 153.0.8010.0 sur Linux, viewport 390×844 ; sécurité Web non désactivée.

L'installation Composer a d'abord rencontré un problème de configuration des extensions du runtime local ; l'installation a ensuite réussi avec les extensions chargées pour les sous-processus PHP. Le téléchargement initial du navigateur Playwright a échoué ; le smoke a finalement été exécuté avec un binaire Chromium local de qualification. Aucun de ces outils de qualification n'est ajouté aux dépendances applicatives, hormis PDF.js et ses dépendances déclarées.

## Résultats exécutés

| Vérification | Résultat | Portée réelle |
| --- | --- | --- |
| `vendor/bin/phpunit` | **109 tests, 501 assertions, réussite** | Suite backend complète, dont Reader, progression, communauté et régressions des flux existants avec données de test |
| Tests d'accès Reader | Réussite dans la suite | Compte propriétaire, non-propriétaire avec token tiers, invité v1 refusé, compatibilité legacy configurable, pending/failed/papier/mauvais livre refusés |
| Deux propriétaires du même livre | Réussite dans la suite | Deux lignes de progression distinctes ; le token de A présenté par B ne modifie pas l'association d'achat de B et ne lit pas la position de A |
| `npm run test:reader` avec témoin | **4 tests, 4 réussites, 0 ignoré** | Ancres, bornes, fermeture du moteur, segmentation vocale et rendu réel de l'ouvrage |
| Témoin PDF.js | **55 pages analysées, 55 avec texte non vide, 55 rendues** | Rendu canvas à échelle 1 ; exécution locale d'environ 1,8 seconde pour la boucle ; pas de comparaison visuelle pixel à pixel |
| Outline PDF | Absent | `getOutline()` retourne null ; le sommaire visuel ne devient pas automatiquement une table de navigation |
| `npm run build` | Réussite | Application existante compilée ; PDF.js non importé dans ce bundle applicatif |
| `npm run build:reader-qualification` | Réussite avec avertissement de taille | Bundle prototype ~636 ko, worker ~1,26 Mo non compressés ; budget mobile/réseau à optimiser |
| `npm run test:reader:browser` | **Réussite** | Pages 1→2→1, zoom 150 %, texte réel, message si aucune voix locale, pas de débordement horizontal, aucune erreur JS ni requête réseau externe |
| Analyse syntaxique PHP modifié | Réussite | Fichiers de fondations contrôlés par PHP 8.4 ; suite backend valide également leur chargement |
| `git diff --check` | Réussite lors de la revue locale | Absence d'erreurs d'espacement détectées |

Sans `MERCURY_READER_WITNESS`, le test du document est explicitement ignoré ; cela ne doit jamais être présenté comme une qualification des 55 pages. Les autres tests Reader restent exécutables. Les commandes et prérequis du smoke navigateur figurent dans [08-PLAN-IMPLEMENTATION.md](08-PLAN-IMPLEMENTATION.md).

## Qualification du document témoin

Fichier privé de **18 544 548 octets**, **55 pages**, SHA-256 `f27813591b7890ab56e71ea46b6b7f1bbebd3fb89ca81d36e477e3574f73c860`. Le fichier contient du texte extractible et des illustrations ; la présence de texte sur chaque page peut inclure titres, en-têtes ou pagination et ne prouve pas une transcription sémantique complète des illustrations.

Le titre et l'auteure utilisés pour le cadrage sont ceux du mandat : *Rites funéraires au Burkina Faso : Voyage au cœur de quelques communautés*, Millogo Tonsouro Cyrielle. Aucune fiche commerciale, licence de lecture commerciale, ISBN, prix, année de publication ou contrat n'a été créé pour cet ouvrage. Le PDF reste hors dépôt et hors catalogue, ouvert localement pour les essais. Aucun extrait de l'ouvrage n'est publié par ce lot.

## Limitations et risques restants

1. **Compatibilité legacy :** les jetons invités, y compris query tokens, restent acceptés par défaut sur les routes historiques. Un visiteur possédant un jeton valide peut donc encore ouvrir l'original. La cible de bibliothèque strictement personnelle exige un rattachement vérifié des anciens achats puis la désactivation de ces accès. Ce compromis est documenté dans ADR-002, pas masqué par le manifeste v1.
2. **Distribution :** les routes historiques peuvent encore servir l'original et accepter des chemins publics. L'inventaire réel du stockage et les dérivés sécurisés ne sont pas implémentés. Retirer les boutons n'empêche pas un téléchargement via outils navigateur.
3. **Progression :** une seule table est conservée, mais les écritures existantes ne sont ni révisionnées ni idempotentes. La synchronisation simultanée, les durées après retries et la reprise après coupure demandent le lot prévu. La navigation de l'iframe historique reste non fiable comme source de position.
4. **Audio :** le lecteur historique utilise toujours ses métadonnées. Seul le prototype extrait le contenu réel ; voix, langues, vitesse, reprise durable et comportement sur mobiles réels restent à qualifier. Le test sans voix vérifie un message, pas une émission audio.
5. **Outils et communauté :** notes, surlignages, plusieurs marque-pages, extraits contrôlés, notifications et modération enrichie sont conçus mais pas livrés. Les groupes existants sont conservés ; les cas de réadhésion après rejet et groupes inactifs nécessitent une revue.
6. **Sécurité transversale :** middleware CSRF du groupe API, CSP, CORS, purge localStorage et minimisation des réponses d'achat restent des chantiers. Les routes d'achat/paiement n'ont pas été modifiées pour les traiter dans ce lot.
7. **Validation :** pas de qualification Android/iOS/Safari/Firefox réels, de connexion lente, de charge, de licences/appareils/sessions révocables ou de Flipbook. Le rendu Node et le viewport Chromium simulé ne remplacent pas ces tests.
8. **Protection Web :** aucune garantie absolue contre capture, vidéo ou extraction du contenu affiché. Android natif est étudié séparément, sans garantie contre caméra externe ou appareil compromis.

## Respect du périmètre

Aucune modification de main, aucun déploiement, aucune modification des paiements, commandes ou configuration VPS, aucune migration ajoutée ou appliquée en production. Les migrations existantes ont été exécutées uniquement par les tests sur SQLite en mémoire. Aucun secret de production utilisé. Le travail reste destiné à la revue d'une branche dédiée.

## Suite prioritaire

Le prochain lot doit réunir les droits/licences d'édition, l'inventaire et la privatisation des assets, le rattachement vérifié des achats invités, les protections API par cookie et la chaîne de dérivés. Il précède l'intégration du moteur dans l'espace client. La progression atomique et sa projection commune AccountPage/MyLibrary viennent ensuite ; les outils privés, l'audio, les extraits et le Flipbook s'appuieront sur ces mêmes frontières.
