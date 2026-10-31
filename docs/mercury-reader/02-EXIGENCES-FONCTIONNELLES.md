# Exigences et critères d'acceptation

Version de cadrage : 31 octobre 2026. Les critères sont des cibles ; consulter le rapport pour les résultats exécutés.

| ID | Exigence | Acceptation observable | Priorité |
| --- | --- | --- | --- |
| R01 | Bibliothèque personnelle | B ne voit ni position ni notes de A et ne peut lire avec le jeton de A ; achat papier/pending/failed ne donne aucun droit ebook | P0 |
| R02 | Lecture PDF | Le moteur donne le nombre réel de pages ; navigation, reprise et extrait désignent la page affichée, de 1 à N | P0 |
| R03 | Lecture EPUB | Chapitre, sommaire, recherche, thème et CFI stables indépendamment des dimensions écran ; scripts de l'ouvrage désactivés | P1 |
| R04 | Reprise synchronisée | Deux appareils partent d'une révision commune ; écriture périmée reçoit 409 ; aucun remplacement silencieux | P0 |
| R05 | Interruption | Position en attente réessayée avec même operation_id ; déconnexion ferme le contenu et purge données du compte sur appareil partagé | P1 |
| R06 | Audio réel | Texte de la page/section extraite, jamais un résumé substitué ; pause/reprise/vitesse et choix voix ; absence voix/OCR expliquée | P1 |
| R07 | Outils privés | Plusieurs marque-pages, notes et surlignages avec propriétaire et édition ; aucune publication automatique | P1 |
| R08 | Extraits communautaires | Courte citation vérifiée côté serveur, autorisation éditoriale, budget cumulé, référence automatique ; pas de fichier/jeton | P1 |
| R09 | Discussions | Réutiliser groupes/messages, contrôle de membre, signalement et modération ; citation retirée peut laisser discussion masquée | P2 |
| R10 | Flipbook optionnel | Même ancre et mêmes droits que vue simple ; tactile ; reduced-motion et clavier sans animation | P2 |
| R11 | Protection | Pas de commande téléchargement/impression originale ; ni lien public ni redirection vers original dans Reader v1 ; chaque page vérifie droit actif | P0 |
| R12 | Accessibilité | Clavier, focus, labels, texte alternatif, zoom et lecteurs d'écran ; thèmes clair/sombre/confort ; responsive sans défilement horizontal involontaire | P1 |
| R13 | Observabilité | Métriques de refus/latence sans jetons, extraits, corps de notes ni téléphone | P0 |

## Politiques proposées, à valider avant activation

- Qualification en ligne uniquement. Reprise après incident signifie sauvegarder la position ; aucune bibliothèque complète hors ligne n'est incluse.
- Maximum proposé : 3 appareils enregistrés et 1 session de contenu active par licence, TTL inactivité 15 minutes, heartbeat 60 secondes. Tester accessibilité et usages réels avant de fixer ces valeurs. Révocation visible à l'opération suivante ; les pixels déjà livrés ne sont pas récupérables.
- Publication d'extrait désactivée par défaut pour une édition non revue. Un quota technique, par exemple 300 caractères par citation, n'est pas une autorisation juridique. Les plafonds exacts dépendent du contrat éditorial.
- Ne pas confondre disponibilité commerciale et droit déjà acquis : un retrait de catalogue ne révoque pas mécaniquement les achats ; blocage éditorial urgent exige une décision tracée spécifique.

## Témoin de qualification

Titre fourni : *Rites funéraires au Burkina Faso : Voyage au cœur de quelques communautés*. Auteure fournie : Millogo Tonsouro Cyrielle. 55 pages vérifiées. Pas d'ISBN, prix, année commerciale ou contrat ajoutés. Le fichier reste hors dépôt et hors catalogue, dans un poste de qualification privé. Aucune autorisation de diffusion présumée.

## Hors du présent lot

Lecteur final, DRM garanti, blocage absolu capture, nouvelle facturation, changement de commandes/paiement, migration Go complète et mise en production. Les ports et contrats préparés ne signifient pas que les fonctionnalités correspondantes sont livrées.
