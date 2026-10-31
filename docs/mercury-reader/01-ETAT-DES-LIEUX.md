# Mercury Reader : état des lieux

Audit du 31 octobre 2026. Référence : `fb6f7b12e692b6d2658d22dfca59bcc9db76d131`, branche de travail `feat/mercury-reader-foundations`. Les constats ci-dessous décrivent le code de référence ; les changements de cette branche sont séparés en fin de document. Aucun audit du VPS ou de données de production.

## Périmètre et preuves

Lecture des contrôleurs Reader, Progress, CustomerAuth, Community, du trait d'accès, des modèles Book, OrderItem, ReadingProgress et groupes ; migrations ; routes ; Reader.jsx, AccountPage.jsx, MyLibrary.jsx, ReaderCommunity.jsx, AuthContext.jsx, AppContext.jsx ; configurations auth, stockage, bootstrap, package/composer et tests associés.

| Domaine | État constaté | Preuve et limite |
| --- | --- | --- |
| Authentification | Implémentée, qualification Reader partielle | Session Laravel `web`, middleware `auth` sur routes customer. `bootstrap/app.php` ajoute les cookies et sessions au groupe API. Aucun contrôle CSRF explicite ajouté à ce groupe : audit transversal requis avant de nouvelles mutations. |
| Bibliothèque | Partielle | `CustomerAuthController::purchases` filtre achats terminés du compte. `AccountPage` et `MyLibrary` construisent chacun leurs vues. `AppContext` persiste achats et jetons dans localStorage : ce cache ne constitue pas une autorisation. |
| Autorisation | Partielle, risque élevé | Trait `ResolvesBookReaderAccess` cherche un jeton AVANT le compte. Un jeton de A peut donc autoriser B, notamment dans `ReadingProgressController`. Invité autorisé par bearer ou query. Pas de licence révocable autonome. |
| Distribution | Partielle | Chemins privés possibles ; le trait accepte également `public://`, `/storage/` et anciens chemins URL. `BookReaderController::file` transmet l'original complet. Chemins cachés dans réponses publiques catalogue par les ressources existantes ; présence de fichiers publics réels non vérifiée sur serveur. |
| Minimisation | Insuffisante | `BookReaderController::show` renvoie jeton, téléphone, transaction. `purchases` renvoie aussi ces informations pour le compte ; traitement ultérieur pour ne pas modifier les flux d'achat pendant ce lot. |
| PDF | Partiel | `Reader.jsx` charge blobs puis iframe native. Le compteur React est indépendant des déplacements internes à l'iframe. `totalPages` vient de progression, pas d'une analyse du document. |
| EPUB | Partiel | Blob dans iframe, pas de moteur EPUB.js installé. La capacité du navigateur à afficher l'EPUB n'est pas garantie. |
| Ouverture externe | Présente | `openCurrentFormat` ouvre blob original dans nouvel onglet, contraire au mandat. |
| Progression | Partielle | Table `reading_progress`, unicité user/book, CFI, temps/sessions. Lecture et écriture en base existantes. Pourcentage fourni par client, pas de révision, idempotence ou verrou optimiste ; double retry peut compter deux fois. CFI validé à 500 caractères mais colonne string par défaut 255. |
| Reprise | Partielle | Poll sauvegarde 30 s, appel beforeunload non garanti. Pas de file durable ni arbitrage entre deux appareils. Réutilisation des blobs au changement de livre à revoir : refs indexées par format et non par édition. |
| Audio | Partiel, ne lit pas l'ouvrage | `getTextToRead` lit titre, résumé, description, citation et éditeur. `speechSynthesis` présent, sans correspondance texte/page réelle. |
| Notes/surlignages/marque-pages | Absents dans schéma audité | Aucune table dédiée trouvée. La progression n'est pas un marque-page multiple. |
| Communauté | Partielle, réutilisable | Profils, groupes, adhésions, messages, approbation/rejet existants. Contrôles de membre pour publier. Pas de ressource extrait licencié, commentaires structurés, signalements ou notifications dédiées constatés. Rejoin après rejet, concurrence de capacité et groupes inactifs à qualifier. |
| Flipbook | Absent | Aucune dépendance page-flip dans package initial. |
| Droits éditoriaux | Partiels | Book possède `rights_status`, publication et distribution ; defaults de migration `contracted` et distribution true ne prouvent aucun contrat. Le témoin ne doit pas être créé avec ces valeurs implicites. |
| Tests | Présents, couverture partielle | BookReaderAccessTest, ReadingProgressApiTest, ReaderCommunityTest notamment. Le test invité initial confirme volontairement la livraison de l'original ; ce comportement ne qualifie pas Reader strict. |

## Stratégie technologique existante

`docs/GO_REACT_PYTHON_POSTGRES_STRATEGY.md` est une orientation, avec étapes Go encore ouvertes. Le code audité est Laravel 13/PHP ^8.4, React ^19.2.4/JavaScript/Vite, pas une API Go. Configuration locale PostgreSQL/Redis prévue par le projet ; la base de production n'a pas été interrogée. Les tests utilisent SQLite mémoire. Ne pas convertir l'ensemble pour introduire Reader.

## Correctifs de ce lot

- Port `ReadingAccess` et adaptateur achat central : pour un compte connecté, seul un achat ebook terminé de ce compte peut autoriser ; jeton tiers ignoré.
- Trait existant délègue au port : Reader, vérification client et progression partagent cette règle.
- Compatibilité invités explicite par configuration sur routes historiques ; sa suppression exige un rattachement vérifié des anciens achats.
- Métadonnées lecteur sans informations de paiement ni jeton ; cache `no-store` ; retrait de tous les boutons d'ouverture externe et des données d'achat affichées dans le lecteur ; aucun bearer d'achat envoyé par Reader pour un compte connecté.
- Manifeste v1 connecté sans livraison originale, capacité read=false tant que dérivés sécurisés absents.
- Port de lecture des positions existantes, contrat de notes privées non lié à un stockage, adaptateur PDF.js et prototype local isolé.

Ces correctifs ne rendent pas le lecteur historique conforme à toutes les exigences de protection. Les originaux et iframes restent un chantier prioritaire.
