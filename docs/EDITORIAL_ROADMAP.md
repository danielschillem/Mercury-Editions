# Roadmap de transformation — Mercury maison d'édition

> Version 1.0 | 20 mai 2026 | Mercury Editions

## Cap

Mercury doit passer d'une plateforme de vente de livres à une maison d'édition complète: sélection des textes, accompagnement des auteurs, fabrication des ouvrages, diffusion papier et numérique, animation d'un catalogue vivant.

La vision opérationnelle: **publier moins au hasard, mieux accompagner, mieux vendre, mieux archiver**.

## Principes

- **Ligne éditoriale claire**: chaque livre publié doit entrer dans une collection identifiable.
- **Qualité avant volume**: priorité à la direction éditoriale, à la correction, aux métadonnées et à la fabrication.
- **Double diffusion**: chaque titre doit exister en numérique et, quand le projet le justifie, en papier.
- **Auteurs accompagnés**: Mercury ne vend pas seulement un fichier; Mercury construit une relation avec les auteurs.
- **Catalogue piloté par la donnée**: ventes, lectures, avis, paniers et demandes manuscrits doivent guider les décisions.

## Phases

### Phase 0 — Socle maison d'édition (mai-juin 2026)

Objectif: rendre la promesse éditoriale lisible et crédible.

| Chantier | Livrable | Statut |
|----------|----------|--------|
| Positionnement public | Hero + section "Maison d'édition" + footer édition | En cours |
| Collections fondatrices | Littérature & récits, Savoirs & société, Jeunesse & transmission | Livré |
| Emails métier | `manuscrits@`, `droits@`, `partenaires@` | À configurer |
| Page/processus manuscrits | Critères, délais, formats acceptés, réponse type | À faire |
| Kit auteur | Modèle de fiche auteur, modèle de fiche livre, checklist manuscrit | À faire |

Critères de sortie:
- Le site explique en moins de 30 secondes ce que Mercury publie.
- Un auteur sait comment soumettre un manuscrit.
- L'équipe sait comment classer un projet dans une collection.

### Phase 1 — Pipeline éditorial interne (juin-août 2026)

Objectif: transformer les manuscrits en projets suivis.

| Chantier | Livrable | Statut |
|----------|----------|--------|
| Module manuscrits admin | Réception, statut, notes internes, pièces jointes | En cours |
| Statuts éditoriaux | Reçu, en lecture, accepté, refusé, en correction, en production, publié | En cours |
| Comité éditorial | Grille de lecture et scoring | À faire |
| Contrats et droits | Champs auteur, droits, durée, territoire, royalties | À cadrer juridiquement |
| Calendrier éditorial | Dates de remise, correction, BAT, sortie | À faire |

Critères de sortie:
- Aucun manuscrit ne se perd dans une boîte mail.
- Chaque projet a un statut, un responsable et une prochaine action.
- Les décisions éditoriales sont historisées.

### Phase 2 — Fabrication et métadonnées (août-octobre 2026)

Objectif: produire des livres mieux référencés, mieux vendables et mieux conservés.

| Chantier | Livrable | Statut |
|----------|----------|--------|
| Fiche livre enrichie | Collection, directeur éditorial, format, ISBN, mots-clés, extrait | Livré |
| Gestion des fichiers | Manuscrit source, couverture, PDF, EPUB, BAT, fichiers finaux | À faire |
| Collections dynamiques | Collections administrables au lieu de catégories fixes | Livré |
| Extraits publics | Aperçu contrôlé avant achat | À faire |
| Qualité catalogue | Images optimisées, métadonnées SEO, slugs propres | À faire |

Critères de sortie:
- Chaque livre Mercury a une fiche bibliographique complète.
- Les fichiers de production sont traçables.
- Les collections deviennent un vrai outil de navigation.

### Phase 3 — Diffusion, ventes et relation lecteurs (octobre-décembre 2026)

Objectif: faire circuler les livres au-delà du simple catalogue.

| Chantier | Livrable | Statut |
|----------|----------|--------|
| Lancements éditoriaux | Pages de sortie, compte à rebours, précommandes | À faire |
| Service presse | Liste médias, envoi d'extraits, dossiers de presse | À faire |
| Clubs et écoles | Offres bibliothèques, écoles, universités | À cadrer |
| Recommandations | Suggestions par collection, auteur, historique d'achat | À faire |
| Newsletter éditoriale | Segments lecteurs, nouveautés, appel à manuscrits | À faire |

Critères de sortie:
- Une nouvelle parution a un plan de lancement.
- Les lecteurs reçoivent des recommandations pertinentes.
- Les institutions peuvent acheter ou demander un partenariat.

### Phase 4 — Échelle régionale (2027)

Objectif: faire de Mercury une maison d'édition et de diffusion ouest-africaine.

| Chantier | Livrable | Statut |
|----------|----------|--------|
| Coéditions | Partenariats avec éditeurs, libraires et imprimeurs | À faire |
| Droits étrangers | Suivi traductions, territoires, cessions | À faire |
| Multi-paiement | Moov Money, Wave, carte bancaire selon marché | À faire |
| Multi-langue | Français, mooré, dioula, anglais éditorial | À faire |
| API partenaires | Catalogue pour bibliothèques, librairies, universités | À faire |

Critères de sortie:
- Mercury peut vendre et diffuser hors Burkina Faso.
- Les droits et partenariats sont suivis comme des actifs éditoriaux.
- Le catalogue est exploitable par des partenaires.

## Backlog produit priorisé

### Priorité 1

- Créer une page ou section "Soumettre un manuscrit" avec critères, délais, formats et contact. **En cours: formulaire public livré.**
- Ajouter dans l'admin un premier modèle `ManuscriptSubmission`. **Livré: réception, filtres, statuts et notes internes.**
- Ajouter les statuts éditoriaux aux livres ou à un nouveau modèle `PublishingProject`.
- Rendre les collections administrables. **Livré: API publique, CRUD admin et formulaire manuscrit connectés.**

### Priorité 2

- Ajouter des champs éditoriaux aux fiches livres: collection, ISBN, extrait, date de parution, directeur éditorial. **Livré: collection, date de parution, extrait public et direction éditoriale.**
- Ajouter une vue calendrier éditoriale côté admin.
- Ajouter un workflow d'envoi newsletter ciblé par collection.
- Ajouter des pages de lancement pour les nouveautés Mercury.

### Priorité 3

- Ajouter contrats, royalties et reporting auteur.
- Ajouter gestion des droits de diffusion.
- Ajouter API partenaires et exports ONIX/CSV simplifiés.
- Ajouter offres institutionnelles pour bibliothèques et écoles.

## Indicateurs de pilotage

| Domaine | Indicateur | Cible fin 2026 |
|---------|------------|----------------|
| Éditorial | Manuscrits reçus et qualifiés | 50+ |
| Éditorial | Projets acceptés en production | 8-12 |
| Catalogue | Titres Mercury avec fiche complète | 100% |
| Ventes | Taux de conversion catalogue → achat | > 5% |
| Lecture | Taux d'ouverture reader après achat ebook | > 60% |
| Auteurs | Délai moyen de réponse manuscrit | < 30 jours |
| Diffusion | Partenariats écoles/bibliothèques | 5+ |

## Décisions à prendre

- Mercury accepte-t-elle uniquement des manuscrits burkinabè ou une ligne ouest-africaine plus large dès 2026 ?
- Les livres papier sont-ils imprimés à la demande ou produits en petits tirages ?
- Quel modèle auteur: achat de droits, royalties, compte d'éditeur, coédition ?
- Quelle collection doit devenir prioritaire commercialement ?
- Quels titres 2026 deviennent les titres vitrines de la maison ?

## Prochaine itération recommandée

Construire le **module de soumission de manuscrit**:
- formulaire public, **livré**
- table dédiée en base, **livrée**
- vue admin avec statuts, **livrée**
- notification admin, **livrée par email**
- email de réception automatique, **livré**

Ce module est le premier vrai passage de "site qui vend des livres" à "maison qui reçoit, sélectionne et accompagne des auteurs".
