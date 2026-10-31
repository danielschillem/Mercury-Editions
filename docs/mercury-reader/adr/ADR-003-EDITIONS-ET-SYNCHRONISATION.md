# ADR-003 : éditions immuables et progression unique

Date : 31 octobre 2026. Statut : cible retenue, migrations et écriture v1 différées.

Contexte : page/CFI seuls deviennent ambigus si fichier change ; écriture existante peut écraser une autre position et doubler les compteurs.

Décision : reading_progress demeure source unique ; locator versionné d'édition, révision atomique et operation_id pour retry. Notes privées séparées des publications, quote selector et géométrie/CFI pour passages. Prototype vérifie empreinte SHA-256.

Alternatives : table reading_positions parallèle et pourcentage audio indépendant écartés ; maximum de page comme fusion écarté car retour en arrière légitime.

Conséquences : changements additifs et ledger nécessaires, protocole conflits explicite ; édition remplacée n'hérite pas automatiquement des ancres. Pas de synchronisation fiable revendiquée avant tests multi-appareils.
