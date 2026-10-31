# Mercury Reader : fondations

Travail du 31 octobre 2026, depuis `fb6f7b12e692b6d2658d22dfca59bcc9db76d131`, sur `feat/mercury-reader-foundations`.

Commencer par le [rapport de qualification](RAPPORT-DE-QUALIFICATION.md). Ce lot pose des frontières et corrige des contrôles d'accès ; il ne termine pas le lecteur protégé. Le manifeste v1 reste sans livraison de contenu.

1. [État des lieux](01-ETAT-DES-LIEUX.md)
2. [Exigences](02-EXIGENCES-FONCTIONNELLES.md)
3. [Architecture](03-ARCHITECTURE-CIBLE.md)
4. [Données](04-MODELE-DE-DONNEES.md)
5. [API](05-CONTRATS-API.md)
6. [Sécurité et droits](06-SECURITE-ET-GESTION-DES-DROITS.md)
7. [Audio, annotations et communauté](07-LECTURE-AUDIO-ANNOTATIONS-COMMUNAUTE.md)
8. [Implémentation et commandes](08-PLAN-IMPLEMENTATION.md)
9. [Matrice de tests](09-MATRICE-DE-TESTS.md)

Décisions : [monolithe modulaire](adr/ADR-001-MONOLITHE-MODULAIRE.md), [droits et compatibilité](adr/ADR-002-DROITS-ET-COMPATIBILITE.md), [éditions et synchronisation](adr/ADR-003-EDITIONS-ET-SYNCHRONISATION.md), [distribution et prototype](adr/ADR-004-DISTRIBUTION-ET-PROTOTYPE.md).

Prototype : `npm run dev:reader-qualification`, fichier choisi localement. Il n'est pas raccordé au lecteur client ni au catalogue ; le PDF témoin n'est pas inclus. Licence PDF.js Apache-2.0 conservée dans `dev/reader-qualification/public/licenses/PDFjs-LICENSE.txt`, copie distribuée avec le build de qualification.
