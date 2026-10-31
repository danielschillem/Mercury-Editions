# ADR-004 : dérivés pour l'offre stricte, prototype local

Date : 31 octobre 2026. Statut : décision de direction ; chaîne de dérivés à qualifier.

Contexte : PDF.js sait afficher l'original et extraire son texte mais n'empêche pas sa copie. L'iframe actuelle offre les fonctions du navigateur.

Décision : prototype PDF.js local isolé pour tester document réel ; aucun téléversement ou versionnement du témoin. Offre stricte ultérieure avec originaux privés et dérivés contrôlés par session/licence ; manifeste read=false jusqu'à disponibilité. EPUB.js et StPageFlip non ajoutés avant qualification respective.

Alternatives : masquer toolbar PDF ou bloquer PrintScreen ne protège pas la ressource ; ne pas présenter cela comme DRM. Streaming range de l'original n'empêche pas reconstitution.

Conséquences : coût des jobs et stockage dérivés, texte accessible toujours extractible, annotations exigent coordonnées/texte versionnés. Le PDF.js ajouté n'intègre pas le bundle applicatif principal ; son coût reste sur prototype isolé. Revoir qualité, accessibilité et coûts sur corpus élargi avant implémentation de distribution.
