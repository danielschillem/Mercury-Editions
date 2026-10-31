# Plan d'implémentation progressif

## Lot 0 livré : audit et frontières

Branche dédiée, analyse code/migrations, documents 01 à 09 et rapport, ADR. Accès connecté centralisé avec achats existants ; manifeste strict sans contenu ; lecture de position isolée via port ; contrat notes ; PDF.js verrouillé et prototype privé ; tests d'isolation et qualification du témoin. Aucun schéma de paiement/commande/VPS modifié. Consulter le rapport pour résultats réellement exécutés.

## Lots suivants et portes de sortie

| Lot | Travail | Validation bloquant le lot suivant |
| --- | --- | --- |
| 1 : droits et ressources | Inventaire fichiers publics et achats invités ; modèle édition/licence ; migrations additives ; rattachement vérifié ; CSRF/API ; sessions atomiques | Zéro accès intercompte, révocation, achats historiques conservés, originaux inaccessibles publiquement, restauration répétée |
| 2 : PDF strict | Jobs privés PDF vers pages + texte versionné ; manifeste prêt ; moteur de rendu consommant dérivés ; états erreur/réseau | 55 pages témoin en privé, nombre réel, navigation vérifiable, accessibilité, pas de lien original |
| 3 : progression et bibliothèque | Écriture atomique révision/opération sur reading_progress ; reprise/réessais ; projection partagée AccountPage/MyLibrary ; purge tokens localStorage | Deux appareils, conflits, retry sans double comptage, changement compte et édition ; ancien client compatible |
| 4 : EPUB et outils | Import EPUB assaini, CFI, notes/surlignages/marque-pages, réancrage | Fichiers piégés, reflow/zoom, ancrage multi-éditions, notes privées, clavier/lecteur d'écran |
| 5 : audio | Segments réels, voix/langues/vitesse, synchronisation et pistes futures | Pas de résumé substitué ; absence voix/OCR ; interruptions ; consentement TTS distant ; droits revus |
| 6 : communauté | Politique citation, budgets cumulés, référence extrait aux posts, commentaires, modération et notifications | Citation canonique et attribution, absence fuite notes/licence, retrait et quotas |
| 7 : flipbook et charge | Adaptateur StPageFlip ou équivalent, mode sans animation, cache borné | Parité locators/droits, reduced-motion, tactile/clavier, mémoire/latence documentées |

Les lots ne donnent pas de durée ferme avant qualification du stockage et droits. Pas de migration globale Go. Les API cibles et ADR servent de frontières ; OpenAPI exécutable et tests de contrat à livrer avant activation des nouvelles écritures.

## Commandes de développement

Depuis le dépôt, PHP 8.4 et extensions SQLite/XML/mbstring/curl/zip pour tests, Node >=22.13.0 (ou >=24) pour PDF.js 6.4.299 :

```bash
composer install --no-interaction --prefer-dist
# Utiliser une APP_KEY de test locale, jamais une clé de production.
php artisan test --filter='BookReaderAccessTest|ReadingProgressApiTest|ReaderCommunityTest'
npm ci
npm run build
npm run test:reader
npm run build:reader-qualification
npm run dev:reader-qualification
```

Le prototype écoute uniquement sur loopback par défaut. Choisir ensuite le PDF local dans le navigateur ; aucun PDF témoin n'est livré par Vite ou versionné. Ne pas lancer avec host public, proxy public ou tunnel. Pas de test public de l'ouvrage.

Pour la qualification réelle du témoin :

```bash
MERCURY_READER_WITNESS='/chemin/prive/ouvrage.pdf' npm run test:reader
```

Le test vérifie l'empreinte exacte et rend les 55 pages ; sans cette variable, il est explicitement ignoré. Les tests locator restent exécutables sans ouvrage. La dépendance native canvas facultative de PDF.js est nécessaire au test de rendu Node ; installer les dépendances facultatives dans cet environnement. Le navigateur utilise son canvas natif.

## Retour arrière

Aucune migration dans ce lot. Revenir au commit précédent de la branche annule code/documentation ; aucun déploiement autorisé ici. Les options legacy peuvent être désactivées en qualification pour simuler la cible, jamais modifiées en production par ce travail. Pour les lots schéma futurs, prévoir expand/backfill et compatibilité descendante avant tout retrait.

## Décisions restant à valider

Politique sessions/appareils, quota d'extraits et autorisations éditoriales par édition, conservation logs/notes, stockage des dérivés et budget, voix/langues prioritaires, conditions d'une application Android. Ces choix ne bloquent pas audit et prototype local, mais bloquent la promesse commerciale correspondante.

## Smoke test navigateur reproductible

`tests/reader/prototype.smoke.mjs` démarre et arrête Vite sur loopback. Playwright et son navigateur doivent être disponibles sur le poste de qualification ; ils ne sont pas des dépendances de l'application. Il utilise le témoin privé et ne le versionne pas.

```bash
MERCURY_READER_WITNESS='/chemin/prive/ouvrage.pdf' \
MERCURY_READER_PLAYWRIGHT='/chemin/vers/playwright/index.mjs' \
npm run test:reader:browser
```

Si Playwright est résolu localement, omettre MERCURY_READER_PLAYWRIGHT. Un binaire local peut être indiqué via MERCURY_READER_BROWSER_EXECUTABLE et ses arguments via MERCURY_READER_BROWSER_ARGS (tableau JSON). Aucun argument désactivant la sécurité Web n'est nécessaire. Le script contrôle viewport 390×844, navigation/zoom, texte réel, absence de requêtes externes et message d'absence de voix ; il ne valide ni un smartphone réel ni la qualité audible.
