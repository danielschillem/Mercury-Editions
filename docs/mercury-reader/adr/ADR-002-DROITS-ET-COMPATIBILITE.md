# ADR-002 : un moteur de droits, transition invitée

Date : 31 octobre 2026. Statut : retenu avec dette de compatibilité explicite.

Contexte : jetons d'achat avant identité créent usage intercompte ; anciens achats invités et clients à conserver.

Décision : identité connectée prioritaire, accès limité à ses achats ebook completed via ReadingAccess. Legacy invité configurable ; manifeste v1 exige compte. Ne pas utiliser le token comme preuve suffisante pour rattacher un achat à un compte.

Alternative : supprimer tous les jetons immédiatement romprait accès invités. Laisser le jeton contourner compte est rejeté.

Conséquences : faille intercompte corrigée, mais visiteur avec token peut encore accéder au legacy ; non-conformité strict assumée jusqu'au lot de rattachement vérifié. Aucune promesse DRM. Désactivation query puis bearer après qualification, sans changer paiements dans ce lot.
