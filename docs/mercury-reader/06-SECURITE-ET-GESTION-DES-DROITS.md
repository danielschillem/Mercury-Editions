# Sécurité et droits de lecture

## Règle centrale et état livré

Un utilisateur connecté est autorisé exclusivement par son achat ebook terminé. Un jeton tiers n'est jamais une identité de substitution. `ReadingAccess` est lié à `PurchaseReadingAccess` et le trait historique délègue au même port, donc Reader, progression et verify-access utilisent cette règle. Aucun cache durable de décision. Le statut de commande est reconsulté à chaque appel de ce port.

Limite : l'adaptateur achat ne gère pas encore licence expirée/révoquée indépendante, appareils et sessions. Le nouveau manifeste refuse toute livraison tant que les dérivés n'existent pas. Il ne possède aucun contournement administrateur implicite.

## Transition des achats invités

Pour ne pas interrompre les achats existants, les anciennes routes acceptent encore les jetons invités : `READER_LEGACY_GUEST_TOKENS=true` et `READER_LEGACY_QUERY_TOKENS=true` par défaut, dans config/reader.php. Ces options sont des exceptions de compatibilité et non une conformité au modèle personnel strict. La query est particulièrement exposée aux historiques et logs. Le bearer reste un secret transférable.

Plan : inventaire en qualification, rattachement vérifié via preuve de compte/achat, notification des clients par un flux à autoriser séparément, désactivation query puis invités, tests de non-régression. Ne jamais rattacher automatiquement au compte présentant un token : cela transférerait une licence volée. Tant que ces routes existent, la promesse de connexion obligatoire ne s'applique qu'à Reader v1. Un client peut se déconnecter et réutiliser un jeton valide sur legacy ; risque résiduel explicite.

## Modèle de menace

Biens : originaux, dérivés, droit personnel, positions, notes, jetons historiques, identité et données d'achat. Acteurs : visiteur, client légitime copiant du contenu, autre compte, membre/modérateur de club, opérateur, document EPUB/PDF malveillant. Frontières : navigateur/API, compte/compte, API/stockage, jobs/fichier non fiable, espace privé/public.

| Menace | Contrôle ou exigence | État |
| --- | --- | --- |
| IDOR et token A utilisé par B | Prédicat propriétaire + ebook + completed dans port ; tests lecture/progression/verify-access | Corrigé pour comptes connectés |
| Fuite token/achat dans manifeste | Suppression du bloc purchase et no-store | Livré sur show et nouveau manifeste ; autres réponses d'achat à traiter |
| Liens publics ou originaux copiables | Inventaire et déplacement contrôlé vers stockage privé ; v1 dérivés uniquement | Conception ; legacy permet encore original/public paths |
| Redistribution par compte légitime | Session courte, débit/volume adaptatif, filigrane pseudonyme | À implémenter ; extraction toujours possible |
| XSS via ouvrage/annotation | PDF.js eval désactivé prototype ; EPUB scripts/URLs externes interdits ; notes texte brut | Partiel ; assainisseur EPUB à qualifier |
| CSRF sur mutation par cookie | Vérifier middleware API et intégrer jeton CSRF/Origin sans casser clients | Non résolu ici ; bloque futures mutations v1 |
| Retry et concurrence multi-appareils | Révision atomique + ledger operation_id + bornage durées | Conception ; legacy dernier écrivain gagne |
| Archive piégée, SSRF et traversée | Import en jobs isolés, chemins internes, limites archive/temps/mémoire, pas de fetch arbitraire | À implémenter |
| Publication d'une note privée | Endpoint extrait distinct, action volontaire, DTO dédié et vérification texte/politique | Conception |
| Copie par captures/vidéo | Aucun blocage Web absolu ; filigrane dissuasif, termes d'usage | Limite reconnue |
| Contournement modération | Autorisation groupe à chaque action, statuts rejet/inactif, quotas et signalement | Existant partiel ; reprise de join à auditer |
| Vol via localStorage/XSS | Cesser de stocker tokens d'achat et notes en clair ; purge au changement de compte | À traiter dans lot bibliothèque/session |

## Distribution et stockage

Aucun secret dans URL v1, query string, logs ou message d'erreur. Sessions Reader opaques dans headers/cookies adaptés, jamais bearer d'achat comme identifiant permanent. Originaux hors racine publique, pas de symlink `public/storage` vers ebooks. Ne pas activer `serve`/URL signée sur originaux sans contrôle par session et droit ; le local disk actuel a serve=true, exposition réelle à auditer. Dérivés privés, Content-Type exact, nosniff, no-store, politique CSP et referrer restrictive ; filtre path/édition côté serveur. Une URL opaque seule n'est pas une autorisation.

PDF original chiffré au repos si infrastructure disponible ; clés gérées hors code/tests. TLS requis. Ce lot n'effectue aucun déplacement de fichiers ni modification de configuration VPS. Une validation HTTP locale ne prouve pas l'absence de copie exposée sur le serveur.

## Sessions, licences, révocation

Politique proposée dans exigences. Appliquer limites dans une transaction unique et nettoyer expirations ; ne pas compter les onglets de façon incohérente. Chaque page/section, audio et publication revalident licence/session/édition. Déconnexion révoque sessions Reader et nettoie caches privés du navigateur ; l'annulation côté client seule ne suffit pas. Une révocation ne peut retirer ce qui a déjà été affiché.

## Journalisation et données personnelles

Proposition initiale : événements d'accès 30 jours, sécurité 90 jours, agrégats sans identifiant ensuite ; durées à valider avant activation selon besoins et obligations applicables. request_id, type d'événement, identifiant pseudonyme, book/edition, résultat, motif et durée. Pas de contenu, téléphone, email, token, IP brute par défaut ou corps des annotations. Restreindre l'accès opérateur et documenter export/suppression ; pas de surveillance détaillée des habitudes sans finalité.

## Android futur, séparé

Étudier FLAG_SECURE pour fenêtres sensibles, masquage dans tâches récentes, stockage interne chiffré avec clés Android Keystore, exclusion des caches de sauvegarde, sessions révocables et gestion d'appareil. Qualifier captures, casting, screen recording selon versions/appareils. FLAG_SECURE protège contre les mécanismes ordinaires pris en charge, pas contre une caméra externe, un appareil compromis ou toute extraction. Ne pas transférer ces garanties à une page Web.

Référence primaire : [Android, activités sensibles et FLAG_SECURE](https://developer.android.com/security/fraud-prevention/activities).
