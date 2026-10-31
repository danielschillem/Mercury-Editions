# ADR-001 : monolithe modulaire

Date : 31 octobre 2026. Statut : retenu pour les fondations.

Contexte : Laravel et communauté déjà présents ; stratégie Go/Python future mais non réalisée. Une réécriture retarderait droits et qualification.

Décision : domaines Reader à ports explicites dans Laravel ; API JSON versionnée réutilisable par Go. Réutiliser achats et reading_progress ; aucune migration générale.

Alternatives : microservices immédiats écartés faute de charge et équipe d'exploitation démontrées ; logique d'autorisation React écartée car client non fiable.

Conséquences : livraison progressive, transactions locales simples ; discipline de dépendances nécessaire. L'adaptateur de lecture actuel retourne ReadingProgress, couplage Eloquent transitoire interne, pas un DTO d'API Go. Revoir si domaine stable et charge/équipe justifient extraction.
