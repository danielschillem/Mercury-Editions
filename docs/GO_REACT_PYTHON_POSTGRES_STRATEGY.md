# Strategie technique cible - Mercury

> Version 1.0.0 | 22 mai 2026

## Vision

Mercury doit evoluer vers une plateforme editoriale moderne, robuste et intelligente.

La nouvelle orientation technique est :

```txt
React = experience utilisateur et administration
Go = backend principal et API metier
Python = intelligence editoriale et traitements avances
PostgreSQL = base de donnees centrale
Redis = cache, sessions techniques et file de jobs
```

L'objectif n'est pas seulement de refaire le backend existant. L'objectif est de transformer Mercury en plateforme capable de vendre des livres, gerer une maison d'edition, accompagner les auteurs et analyser les manuscrits de facon intelligente.

## Architecture cible

```txt
[React Frontend]
      |
      v
[Go API Backend]
      |
      +--> [PostgreSQL]
      +--> [Storage fichiers]
      +--> [Redis / Queue]
      +--> [Paiement Orange Money]
      +--> [Email / Notifications]
      |
      v
[Python Editorial Intelligence Service]
```

## Role de chaque brique

### React

React reste le front principal.

Responsabilites :

- site public Mercury ;
- catalogue des livres ;
- fiches auteurs ;
- panier et checkout ;
- espace client ;
- bibliotheque client ;
- lecteur ebook ;
- interface admin ;
- tableau de bord editorial ;
- ecrans d'analyse de manuscrits.

React doit consommer uniquement les API exposees par le backend Go. Le front ne doit pas contenir de logique metier sensible.

### Go

Go devient le backend principal.

Responsabilites :

- API publique ;
- API admin ;
- authentification client et admin ;
- gestion des utilisateurs ;
- gestion des auteurs ;
- gestion des livres ;
- collections editoriales ;
- commandes ;
- paiements ;
- acces aux ebooks ;
- soumissions de manuscrits ;
- gestion des fichiers ;
- securite ;
- orchestration avec Python ;
- publication des jobs asynchrones.

Go doit etre le point d'entree central. Meme lorsqu'une fonctionnalite utilise Python, React doit appeler Go, puis Go appelle ou declenche Python.

### Python

Python est reserve a l'intelligence editoriale et aux traitements lourds.

Responsabilites :

- analyse automatique de manuscrits ;
- resume court et long ;
- detection du genre litteraire ;
- detection du style ;
- extraction de mots-cles ;
- scoring editorial ;
- recommandations a l'editeur ;
- generation de description catalogue ;
- suggestions SEO ;
- analyse de lisibilite ;
- preparation de fiches de lecture internes.

Python ne doit pas remplacer le backend principal. Il doit fonctionner comme un service specialise, appele par Go.

### PostgreSQL

PostgreSQL devient la base centrale.

Responsabilites :

- donnees utilisateurs ;
- livres ;
- auteurs ;
- commandes ;
- paiements ;
- soumissions ;
- analyses editoriales ;
- historiques de lecture ;
- avis ;
- newsletters ;
- messages de contact.

PostgreSQL est preferable a long terme pour sa robustesse, ses index avances, ses champs JSONB, sa recherche textuelle et sa capacite a porter des donnees editoriales plus riches.

### Redis

Redis sert aux besoins rapides et asynchrones.

Responsabilites :

- cache API ;
- rate limiting ;
- files de jobs ;
- verrouillages courts ;
- coordination entre Go et Python ;
- stockage temporaire de resultats.

## Principe de couplage Go / Python

Le couplage recommande est le suivant :

```txt
React -> Go -> Queue Redis -> Python -> PostgreSQL -> Go -> React
```

Exemple pour une soumission de manuscrit :

1. L'auteur soumet son manuscrit depuis React.
2. React envoie le fichier et les metadonnees a Go.
3. Go enregistre la soumission dans PostgreSQL.
4. Go stocke le fichier dans le storage.
5. Go publie un job d'analyse dans Redis.
6. Python recupere le job.
7. Python analyse le manuscrit.
8. Python enregistre le resultat dans PostgreSQL ou le renvoie a Go.
9. L'admin consulte l'analyse depuis React via l'API Go.

Cette approche evite de rendre l'interface lente et permet de traiter les manuscrits en arriere-plan.

## Domaines metier a reconstruire en Go

### Domaine catalogue

- livres ;
- auteurs ;
- collections editoriales ;
- categories ;
- tags ;
- images de couverture ;
- extraits ;
- disponibilite physique / numerique.

### Domaine client

- inscription ;
- connexion ;
- profil ;
- panier ;
- wishlist ;
- bibliotheque ;
- historique d'achat ;
- progression de lecture.

### Domaine commande

- creation de commande ;
- verification panier ;
- calcul total ;
- frais de livraison ;
- statut commande ;
- items commande ;
- confirmation email.

### Domaine paiement

- integration Orange Money ;
- mode simulation ;
- verification callback ;
- reconciliation paiement / commande ;
- journalisation des transactions ;
- protection contre les doubles validations.

### Domaine ebook

- fichiers prives ;
- controle d'acces ;
- ouverture apres achat ;
- suivi progression ;
- protection minimale contre l'acces direct non autorise.

### Domaine editorial

- soumission de manuscrit ;
- pieces jointes ;
- statut de traitement ;
- analyse IA ;
- notes internes ;
- decision editoriale ;
- conversion vers livre catalogue.

### Domaine admin

- dashboard ;
- gestion livres ;
- gestion auteurs ;
- gestion commandes ;
- gestion clients ;
- gestion soumissions ;
- gestion messages ;
- gestion analyses editoriales.

## Actions a mener

### Socle Docker local

- [x] Ajouter un environnement Docker de developpement pour l'existant Laravel/React.
- [x] Ajouter PostgreSQL comme base locale cible.
- [x] Ajouter Redis pour cache, sessions techniques et queue.
- [x] Ajouter un worker de queue separe.
- [x] Documenter les commandes de lancement dans le README.

### Phase 1 - Cadrage technique

- [ ] Valider officiellement la stack : React, Go, Python, PostgreSQL, Redis.
- [ ] Choisir le framework Go : Gin, Echo, Fiber ou net/http structure.
- [ ] Choisir l'acces base Go : sqlc, GORM ou pgx.
- [ ] Choisir le service Python : FastAPI recommande.
- [ ] Choisir la strategie de jobs : Redis queue, Asynq, RabbitMQ ou autre.
- [ ] Definir les conventions API : REST, format JSON, erreurs, pagination.
- [ ] Definir la strategie d'authentification : JWT, sessions serveur ou cookies securises.

### Phase 2 - Cartographie de l'existant Laravel

- [ ] Lister tous les endpoints Laravel actuels.
- [ ] Lister tous les modeles existants.
- [ ] Lister toutes les migrations et relations.
- [ ] Identifier les endpoints utilises par React.
- [ ] Identifier les flux critiques : paiement, commande, ebook, auth.
- [ ] Identifier les donnees a migrer vers PostgreSQL.
- [ ] Documenter les contrats API a conserver.

### Phase 3 - Modele PostgreSQL

- [ ] Redessiner le schema relationnel cible.
- [ ] Creer les tables principales : users, authors, books, orders, order_items.
- [ ] Creer les tables editoriales : manuscript_submissions, editorial_analyses.
- [ ] Creer les tables lecture : reading_progress, wishlists, reviews.
- [ ] Ajouter les indexes utiles.
- [ ] Prevoir les champs JSONB pour metadonnees editoriales souples.
- [ ] Ecrire les premieres migrations PostgreSQL.

### Phase 4 - Socle backend Go

- [ ] Creer le nouveau service Go.
- [ ] Mettre en place la configuration par variables d'environnement.
- [ ] Connecter PostgreSQL.
- [ ] Ajouter logs structures.
- [ ] Ajouter middleware CORS.
- [ ] Ajouter middleware auth.
- [ ] Ajouter validation des payloads.
- [ ] Ajouter format standard de reponse erreur.
- [ ] Ajouter tests unitaires et tests API.

### Phase 5 - API catalogue

- [ ] Implementer `GET /api/books`.
- [ ] Implementer `GET /api/books/{id}`.
- [ ] Implementer `GET /api/authors`.
- [ ] Implementer `GET /api/authors/{slug}`.
- [ ] Brancher React sur ces endpoints Go.
- [ ] Comparer les reponses avec les anciennes reponses Laravel.

### Phase 6 - Authentification et espace client

- [ ] Implementer inscription client.
- [ ] Implementer connexion client.
- [ ] Implementer deconnexion.
- [ ] Implementer profil client.
- [ ] Implementer protection des routes privees.
- [ ] Mettre a jour React pour utiliser l'auth Go.

### Phase 7 - Commandes et paiements

- [ ] Implementer panier cote backend si necessaire.
- [ ] Implementer creation commande.
- [ ] Implementer statuts commande.
- [ ] Implementer integration Orange Money.
- [ ] Implementer callbacks paiement.
- [ ] Implementer emails de confirmation.
- [ ] Ajouter tests de securite paiement.

### Phase 8 - Service Python IA

- [ ] Creer service Python FastAPI.
- [ ] Definir endpoint interne d'analyse manuscrit.
- [ ] Connecter Python a Redis ou a l'API Go.
- [ ] Implementer extraction de texte.
- [ ] Implementer resume automatique.
- [ ] Implementer scoring editorial.
- [ ] Implementer generation de fiche de lecture.
- [ ] Stocker les analyses dans PostgreSQL.
- [ ] Afficher les analyses dans l'admin React.

### Phase 9 - Admin React

- [ ] Brancher dashboard admin sur Go.
- [ ] Brancher gestion livres.
- [ ] Brancher gestion auteurs.
- [ ] Brancher gestion commandes.
- [ ] Brancher gestion soumissions.
- [ ] Ajouter ecran d'analyse editoriale.
- [ ] Ajouter actions de validation ou refus de manuscrit.

### Phase 10 - Migration finale

- [ ] Migrer les donnees Laravel vers PostgreSQL.
- [ ] Verifier integrite utilisateurs.
- [ ] Verifier integrite livres et auteurs.
- [ ] Verifier commandes et paiements.
- [ ] Verifier acces ebooks.
- [ ] Verifier fichiers stockes.
- [ ] Passer progressivement le trafic API vers Go.
- [ ] Garder Laravel en secours pendant la periode de transition.
- [ ] Retirer Laravel seulement apres validation complete.

## Ordre recommande de migration

Ne pas commencer par les paiements.

Ordre recommande :

1. Catalogue public.
2. Auteurs.
3. Collections editoriales.
4. Auth client.
5. Espace client.
6. Soumission de manuscrits.
7. Intelligence editoriale Python.
8. Admin.
9. Commandes.
10. Paiements.
11. Acces ebooks.

Les paiements et les ebooks doivent venir tard, car ils portent les risques les plus sensibles.

## Decisions techniques recommandees

### Backend Go

Recommandation :

```txt
Go + pgx/sqlc + net/http ou Gin + JWT/cookies securises
```

`sqlc` est interessant car il genere du code Go type a partir de requetes SQL. Cela garde le controle sur PostgreSQL sans cacher la base derriere un ORM trop magique.

### Python

Recommandation :

```txt
Python + FastAPI + worker async + Redis
```

FastAPI est simple pour exposer un service interne. Pour les traitements longs, utiliser un worker separe plutot qu'une requete HTTP bloquante.

### PostgreSQL

Recommandation :

```txt
PostgreSQL + migrations versionnees + backups automatiques
```

Prevoir tres tot les backups, les indexes et la restauration.

### Frontend

Recommandation :

```txt
React + Vite + client API centralise
```

Toutes les requetes doivent passer par un client API unique pour faciliter le remplacement progressif de Laravel par Go.

## Regles d'or

- React ne parle jamais directement a Python.
- Python ne devient pas le backend principal.
- Go reste le point d'entree metier.
- PostgreSQL devient la source de verite.
- Redis sert au rapide et au temporaire, pas aux donnees definitives.
- Les paiements doivent etre testes avant toute mise en production.
- Les donnees existantes doivent etre sauvegardees avant migration.
- La migration doit etre progressive, endpoint par endpoint.

## Resultat attendu

A la fin de la refonte, Mercury doit disposer de :

- un frontend React moderne ;
- une API Go rapide et robuste ;
- une base PostgreSQL propre ;
- un moteur Python d'intelligence editoriale ;
- un admin capable d'aider les decisions editoriales ;
- un parcours client complet ;
- une architecture prete pour evoluer vers plus d'automatisation.

Le vrai avantage competitif de Mercury sera l'alliance entre edition, commerce, lecture numerique et intelligence editoriale.
