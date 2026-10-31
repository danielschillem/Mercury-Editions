# Audio, annotations et communauté

## Audio sur contenu réel

Le lecteur historique lit des métadonnées. Le prototype utilise `engine.text(page)` avec le véritable texte PDF et une voix française déclarée locale ; absence de voix = message, sans fallback vers résumé. Le découpage vocal conserve tous les caractères, y compris les mots longs et les paires UTF-16 ; ce point est testé automatiquement. Il fournit lecture, pause, reprise, arrêt ; pas encore vitesse ni reprise audio durable. Aucun texte de l'ouvrage n'est envoyé par le code prototype à un TTS serveur. Le comportement interne du moteur vocal dépend du navigateur et du système, à qualifier.

Cible : extraire et normaliser le texte versionné à l'import, segmenter par phrase/paragraphes, associer chaque segment à édition/locator. Préserver titres, langues et ordre de lecture ; écarter en-têtes/pieds répétés après vérification éditoriale. Document scanné : OCR en job privé si nécessaire, avec statut de qualité. Les illustrations ne deviennent pas un texte inventé.

L'état audio contient engine/voice/lang/rate, segment_id et char_offset. `boundary` du navigateur peut aider le surlignage mais n'est pas garanti ; fallback au segment. Un seek texte annule la file audio précédente, un changement d'édition invalide l'offset. Le même service progression sauvegarde la position logique ; la position audio ne remplace pas arbitrairement une lecture manuelle concurrente. Changer de voix/vitesse reprend au segment actuel, pas au début du livre.

| Moteur | Atout | Conditions et limites |
| --- | --- | --- |
| Web Speech local | Pas de calcul serveur, voix installées | Langues africaines et disponibilité variables ; vérifier localService, latence, interruption et écran verrouillé |
| Web Speech distant | Plus de voix possibles | Consentement/politique avant transmission ; connexion requise ; confidentialité et droits à vérifier |
| TTS serveur | Contrôle segments et voix, cache d'édition | Licence moteur ET modèle/voix, droits de synthèse, coût et supervision ; clé de cache édition/segment/voix/version/vitesse |
| Audiobook enregistré | Qualité éditoriale | Autorisation et piste propres, streaming privé, manifeste de chapitres et alignement texte-audio facultatif |

Pour une langue non disponible, afficher l'indisponibilité et permettre une voix compatible explicitement choisie ; ne pas promettre une prononciation correcte. Aucun choix de fournisseur ni génération commerciale sur le témoin.

## Notes et surlignages

`PrivateAnnotationStore` prépare une frontière privée, intentionnellement sans adaptateur tant que migrations, locators et validation ne sont pas prêts. Il ne doit pas être exposé comme fonctionnalité livrée. Une note appartient à user/book/edition ; le surlignage est un type d'annotation, le marque-page une position nommée. Les opérations prennent propriétaire depuis session et ne chargent jamais par id seul.

Sélection PDF via texte canonique + rectangles ; EPUB via CFI range. Corps texte brut, longueur bornée, révision et suppression logique selon politique. Résolution d'ancrage explicite ; une note orpheline reste consultable dans une liste avec indication d'édition, sans être déplacée au hasard. Hors connexion futur : file de mutations par compte/édition, operation_id, pas de contenu original durable par défaut. Purge de l'appareil à déconnexion ; aucune note d'un compte proposée au suivant.

## Extraits publics

Action utilisateur distincte : sélectionner, demander prévisualisation d'extrait autorisé, choisir groupe, ajouter réflexion, confirmer publication. Le serveur recharge texte canonique depuis locator, compare la sélection, applique droits de l'édition et quotas cumulés par utilisateur/livre/groupe/fenêtre. Il génère titre/auteur/édition/page-label ou chapitre. Le client ne peut ni choisir un auteur arbitraire ni publier le corps privé de note par effet de bord.

Un plafond de caractères n'autorise pas juridiquement une citation. Politique édition versionnée, partage bloqué si droits inconnus. Le témoin n'est jamais utilisé pour un test de publication publique. Tests d'extraits avec contenu synthétique sous contrôle du projet.

## Réemploi communauté

Conserver ReaderCommunityController, ReadingGroup, ReadingGroupMember et ReadingGroupPost. Ajouter référence extrait aux messages plutôt que réécrire profils/clubs. Qualifier permissions propriétaire/modérateur/membre, statut actif/rejeté, capacité concurrente et visibilité privée. Une licence ne se transfère pas avec un groupe ; un membre peut discuter d'une citation autorisée sans accéder au livre entier.

Prévoir commentaires parent/enfant bornés, signalement, file de modération, retrait et notification ; rendre le retrait réversible et tracé selon règle éditoriale. Notifications sans texte privé. Une note copiée dans une réflexion par choix de l'auteur ne donne aucun droit au système d'exposer les autres notes.

## Flipbook

StPageFlip reste une expérimentation après vue simple. Réutiliser le moteur de rendu/locators et charger peu de pages voisines. Éviter de générer 55 canvas haute résolution simultanément. Traitement tactile, focus, sélection, hit-testing des rectangles et orientation à tester. Respecter prefers-reduced-motion ; bascule vers vue simple conserve page, notes et session. Aucun téléchargement ou moteur d'autorisation propre au flipbook.
