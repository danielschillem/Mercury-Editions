<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Author;
use App\Models\Book;
use Illuminate\Database\Seeder;

/**
 * Seeder pour les véritables ouvrages Mercury Editions 2026.
 */
class MercuryRealBooksSeeder extends Seeder
{
    public function run(): void
    {
        // Créer d'abord les auteurs Mercury réels
        $authors = [
            [
                'slug'   => 'kassoum-bikienga',
                'name'   => 'Kassoum Bikienga',
                'icon'   => 'briefcase',
                'origin' => 'Burkina Faso',
                'born'   => '1978',
                'died'   => '',
                'color'  => '#1e3a5f',
                'genres' => ['Développement personnel', 'Management', 'Carrière'],
                'bio'    => '<p>Kassoum Bikienga est consultant en management stratégique, développement de projets ainsi qu\'en planification, financement et évaluation du développement. Il est également formateur professionnel, conférencier et coach de dirigeants.</p><p>Économiste et Administrateur des services financiers, il a servi pendant plus 14 ans dans l\'administration publique burkinabè, notamment au Ministère de l\'Économie et des Finances et au Ministère de la Santé, avant de lancer en 2020, le Bureau d\'Études et de Capacitation pour le Développement International - BECADIN.</p><p>Il est titulaire d\'un Master en Finances Publiques, du DESS des Hautes Études en Gestion de la Politique Économique, et d\'un Master en Santé Internationale. Il a été membre dirigeant de plusieurs associations comme le CERFI, Toastmasters International et UACOACHS. Il est auteur du livre "Fiscalité et Développement Économique" publié en 2012. Il parle le mooré, le dioula, le français, l\'anglais et l\'arabe.</p>',
                'timeline' => [
                    ['year' => '2012', 'text' => 'Publication de « Fiscalité et Développement Économique »'],
                    ['year' => '2020', 'text' => 'Fondation du Bureau BECADIN'],
                    ['year' => '2026', 'text' => 'Publication de « Prends ta carrière en main » chez Mercury Editions'],
                ],
                'awards' => [
                    'Master en Finances Publiques',
                    'DESS en Gestion de la Politique Économique',
                    'Master en Santé Internationale',
                ],
            ],
            [
                'slug'   => 'masaaki-kato',
                'name'   => 'Masaaki Kato',
                'icon'   => 'globe',
                'origin' => 'Japon / Burkina Faso',
                'born'   => '1950',
                'died'   => '',
                'color'  => '#b91c1c',
                'genres' => ['Essai', 'Histoire', 'Biographie'],
                'bio'    => '<p>Masaaki Kato est un ancien diplomate japonais, ayant servi comme ambassadeur du Japon au Burkina Faso. S\'appuyant sur son expérience diplomatique et sa profonde connaissance de l\'Afrique de l\'Ouest, il livre un hommage à l\'un des plus grands penseurs africains.</p><p>Son livre « À la recherche de moi-même » retrace l\'évolution de la pensée de Joseph Ki-Zerbo, le "géant du savoir et de l\'action", pour éclairer le cœur des défis auxquels nous sommes confrontés.</p>',
                'timeline' => [
                    ['year' => '2026', 'text' => 'Publication de « À la recherche de moi-même » chez Mercury Editions'],
                ],
                'awards' => [
                    'Ancien Ambassadeur du Japon au Burkina Faso',
                ],
            ],
            [
                'slug'   => 'kabre-sidbewendin-issouf',
                'name'   => 'Kabré Sidbéwendin Issouf',
                'icon'   => 'scale',
                'origin' => 'Ouagadougou, Burkina Faso',
                'born'   => '1975',
                'died'   => '',
                'color'  => '#ea580c',
                'genres' => ['Roman', 'Fiction sociale'],
                'bio'    => '<p>Né le 26 février 1975 à Ouagadougou, Kabré Sidbéwendin Issouf est Avocat inscrit au Barreau du Burkina Faso, après une courte carrière de Magistrat. Il exerce à Ouagadougou.</p><p>Dans son roman « Ce siècle avait treize ans, et ces coutumes mille ans », il aborde avec courage la thématique des violences domestiques à travers le personnage de Sombdèbda, une femme victime de la tyrannie de son mari.</p>',
                'timeline' => [
                    ['year' => '1975', 'text' => 'Naissance à Ouagadougou'],
                    ['year' => '2026', 'text' => 'Publication de son roman chez Mercury Editions'],
                ],
                'awards' => [
                    'Avocat au Barreau du Burkina Faso',
                    'Ancien Magistrat',
                ],
            ],
            [
                'slug'   => 'salifou-idani',
                'name'   => 'Dr Salifou Idani',
                'icon'   => 'book-open',
                'origin' => 'Diapangou, Gourma, Burkina Faso',
                'born'   => '1970',
                'died'   => '',
                'color'  => '#0891b2',
                'genres' => ['Biographie', 'Histoire'],
                'bio'    => '<p>Dr Idani Salifou est natif de Diapangou, région du Gourma. Il est actuellement Maître de conférences en histoire et civilisation africaines à l\'Université Norbert ZONGO de Koudougou.</p><p>L\'auteur du présent livre s\'est toujours distingué par son courage, sa persévérance, ses rigueurs académiques et scientifiques, en plus des valeurs sociales qu\'il incarne. Ainsi, de 2012 à 2017, il est nommé Secrétaire Général de l\'Université Nazi BONI avant d\'occuper le poste de Vice-Président chargé de la Recherche et de la Coopération Internationale (VP/RCI) de l\'Université de Fada N\'Gourma (UFDG) qui a pris la dénomination de Université Yembila Abdoulaye TOGUYENI (UYAT).</p>',
                'timeline' => [
                    ['year' => '2012', 'text' => 'Secrétaire Général de l\'Université Nazi BONI'],
                    ['year' => '2017', 'text' => 'Vice-Président de l\'Université de Fada N\'Gourma'],
                    ['year' => '2026', 'text' => 'Publication de « Amirou Adiouma Thiombiano, Le patriote »'],
                ],
                'awards' => [
                    'Maître de conférences en histoire',
                    'Vice-Président d\'Université',
                ],
            ],
            [
                'slug'   => 'firmin-gouba',
                'name'   => 'Firmin Gouba',
                'icon'   => 'users',
                'origin' => 'Burkina Faso',
                'born'   => '1965',
                'died'   => '',
                'color'  => '#78716c',
                'genres' => ['Essai', 'Communication', 'Relations publiques'],
                'bio'    => '<p>Firmin Gouba est enseignant-chercheur à l\'Université Joseph KI-ZERBO, où il dirige le Laboratoire de recherche Médias et Communications Organisationnelles (LAMCO). Spécialiste de la communication des organisations, des relations publiques et du marketing, il intervient également comme consultant et expert auprès d\'institutions publiques et privées.</p><p>Il a successivement occupé les fonctions de Chef du Département Communication et Journalisme, puis de Directeur de l\'Institut Panafricain d\'Études et de Recherches sur les Médias, l\'Information et la Communication (IPERMIC) à l\'Université Joseph KI-ZERBO. Parallèlement à sa carrière universitaire, il a servi comme Conseiller technique auprès du Ministre de la Justice, des Droits humains et de la Promotion civique du Burkina Faso.</p>',
                'timeline' => [
                    ['year' => '2026', 'text' => 'Publication de « Relations publiques en Afrique »'],
                ],
                'awards' => [
                    'Directeur de l\'IPERMIC',
                    'Conseiller technique ministériel',
                ],
            ],
            [
                'slug'   => 'mariam-ouedraogo-sebego',
                'name'   => 'Mariam Ouédraogo Sébégo',
                'icon'   => 'heart',
                'origin' => 'Burkina Faso',
                'born'   => '1960',
                'died'   => '',
                'color'  => '#db2777',
                'genres' => ['Santé', 'Bien-être', 'Témoignage'],
                'bio'    => '<p>Mariam Ouédraogo / Sébégo est une écrivaine passionnée des contes, elle a écrit six tomes intitulés : « Mon livre de contes africains » ; et « Sagesse du terroir africain », écrit en langue nationale mooré et traduit en français. Juste pour dire que c\'est une fervente défenseuse du patrimoine culturel burkinabè à travers la langue nationale.</p><p>Ancienne chargée de missions du Ministre de la Communication, de la Culture, des Arts et du Tourisme, Mariam Ouédraogo est par ailleurs, Officier de l\'Ordre du Mérite Burkinabè et milite dans des associations de sauvegarde et de valorisation de la culture burkinabè.</p><p>Cependant, le présent ouvrage est basé sur son expérience personnelle d\'un fait qui n\'est autre que la ménopause, il est intitulé « Mieux vivre sa ménopause ».</p>',
                'timeline' => [
                    ['year' => '2026', 'text' => 'Publication de « Mieux vivre sa ménopause »'],
                ],
                'awards' => [
                    'Officier de l\'Ordre du Mérite Burkinabè',
                    'Ancienne chargée de missions ministérielles',
                ],
            ],
            [
                'slug'   => 'adama-tamboura',
                'name'   => 'Adama Tamboura',
                'icon'   => 'book',
                'origin' => 'Djibo, Burkina Faso',
                'born'   => '1987',
                'died'   => '',
                'color'  => '#1e40af',
                'genres' => ['Histoire', 'Anthropologie', 'Essai'],
                'bio'    => '<p>Né le 31 décembre 1987 à Djibo, Adama TAMBOURA effectue l\'ensemble de son parcours scolaire dans sa ville natale. Il y obtient successivement le Certificat d\'Études Primaires (CEP) à l\'école primaire C de Djibo, le Brevet d\'Études du Premier Cycle (BEPC) au collège privé Dubaï/Burkina, puis le Baccalauréat série A en 2007 au Lycée Provincial de Djibo.</p><p>Poussé par sa passion pour les sciences sociales, il poursuit ses études supérieures à l\'Université Joseph Ki-ZERBO de Ouagadougou, où il obtient une licence en Histoire politique et sociale, suivi d\'un Master en Développement et Éducation des Adultes (DEDA), option Pédagogie du Changement Social et Développement (PCSD).</p><p>Professionnel engagé dans le domaine de l\'éducation, Adama Tamboura exerce aujourd\'hui comme professeur certifié d\'Histoire-Géographie à Ouagadougou, où il met ses compétences au service de la formation des jeunes et des adultes.</p>',
                'timeline' => [
                    ['year' => '1987', 'text' => 'Naissance à Djibo'],
                    ['year' => '2007', 'text' => 'Baccalauréat au Lycée Provincial de Djibo'],
                    ['year' => '2026', 'text' => 'Publication de « Fulbé et groupes de peuples noirs »'],
                ],
                'awards' => [
                    'Licence en Histoire politique et sociale',
                    'Master en Développement et Éducation des Adultes',
                    'Professeur certifié d\'Histoire-Géographie',
                ],
            ],
            [
                'slug'   => 'francois-oubida',
                'name'   => 'François Oubida',
                'icon'   => 'globe',
                'origin' => 'Bondoukou, Côte d\'Ivoire',
                'born'   => '1957',
                'died'   => '',
                'color'  => '#dc2626',
                'genres' => ['Essai', 'Culture', 'Tradition'],
                'bio'    => '<p>François Oubida est né le 29 avril 1957 à Bondoukou en République de Côte d\'Ivoire. Ayant perdu son père dès l\'âge de cinq ans, il fut confié à sa Tante, Téné OUBDA dite Pogyanga Sagado dans le village de Kokémnoré. De là, il a fréquenté l\'école primaire de Kanougou de 1962 à 1968. Après ses études secondaires à Ouagadougou couronnées par un baccalauréat série A (lettres-philosophie), il fut admis au concours de l\'École Nationale d\'Administration et de Magistrature (ENAM).</p><p>Intégré au Ministère des Affaires Étrangères après sa formation, il a représenté le Burkina Faso en République de Cuba, aux États-Unis d\'Amérique et au Japon. Au sein de ce ministère, il a occupé plusieurs postes importants dont ceux de Directeur Général des Relations Bilatérales et d\'Ambassadeur extraordinaire et plénipotentiaire au Japon. Il a été primé par la Ville de Yokohama au Japon, du trophée de la personnalité de l\'année 2017 en matière de coopération culturelle avec le Japon.</p>',
                'timeline' => [
                    ['year' => '1957', 'text' => 'Naissance à Bondoukou, Côte d\'Ivoire'],
                    ['year' => '1968', 'text' => 'Fin des études primaires à Kanougou'],
                    ['year' => '2017', 'text' => 'Trophée de la personnalité de l\'année au Japon'],
                    ['year' => '2026', 'text' => 'Publication de « Kisgu ou l\'éducation par les interdits »'],
                ],
                'awards' => [
                    'Ambassadeur extraordinaire et plénipotentiaire',
                    'Directeur Général des Relations Bilatérales',
                    'Trophée Yokohama 2017',
                ],
            ],
            [
                'slug'   => 'hadjaratou-sawadogo-zongo-thomas-savadogo',
                'name'   => 'Hadjaratou Sawadogo épouse Zongo & Thomas Savadogo',
                'icon'   => 'shield',
                'origin' => 'Burkina Faso',
                'born'   => '1980',
                'died'   => '',
                'color'  => '#854d0e',
                'genres' => ['Essai', 'Droits humains', 'Défense'],
                'bio'    => '<p>Juriste et experte reconnue en droits humains au Burkina Faso, Hadjaratou Sawadogo épouse Zongo est titulaire d\'un master en droit international et européen des droits fondamentaux et d\'un diplôme professionnel de Conseiller en Droits Humains. Elle cumule plus de quinze années d\'expériences aux niveaux national, régional et international. Ancienne Directrice générale des droits humains et Conseiller technique, chargée des questions de droits humains à la Brigade des Volontaires pour la Défense de la Patrie, elle s\'est illustrée par son engagement à intégrer les droits humains dans les opérations de lutte contre le terrorisme.</p><p>Thomas Savadogo, officier supérieur d\'infanterie du Burkina Faso, est une figure marquante de la lutte contre le terrorisme et de la défense des droits humains. Diplômé de plusieurs masters en stratégie, sécurité, management et gestion des crises, il conjugue expérience du terrain et expertise académique. Ancien Commandant de la Brigade des VDP, il a été l\'architecte d\'une force citoyenne, enracinée dans la volonté populaire de résister face à la barbarie terroriste.</p>',
                'timeline' => [
                    ['year' => '2026', 'text' => 'Publication de « Droits humains et lutte contre le terrorisme »'],
                ],
                'awards' => [
                    'Chevalier de l\'Ordre du mérite de la justice et des droits humains',
                    'Chevalier de l\'Ordre de l\'Étalon',
                    'Commandeur de l\'Ordre de l\'Étalon',
                    'Médaille d\'Honneur du VDP',
                ],
            ],
            [
                'slug'   => 'regis-dimitri-balima',
                'name'   => 'Régis Dimitri Balima',
                'icon'   => 'newspaper',
                'origin' => 'Burkina Faso',
                'born'   => '1975',
                'died'   => '',
                'color'  => '#0f766e',
                'genres' => ['Essai', 'Journalisme', 'Médias'],
                'bio'    => '<p>Régis Dimitri BALIMA est titulaire d\'un doctorat en sciences de l\'information et de la communication de l\'Université Grenoble-Alpes. Depuis 2018, il est maître de conférences à l\'Institut panafricain d\'étude et de recherche sur les médias, l\'information et la communication (IPERMIC) de l\'Université Joseph KI-ZERBO.</p><p>Il a été successivement Chef du département Communication et Journalisme et Directeur adjoint de l\'école doctorale Lettres, sciences humaines et communication (LESHCO). Dans des sociétés en pleine mutation, l\'auteur s\'intéresse à l\'évolution des médias francophones africains et à leurs publics, tant au niveau des pratiques professionnelles et des usages au niveau de la réception. Depuis deux ans, il est chef de l\'équipe Médias et journalisme du laboratoire Médias et communications organisationnelles (LAMCO).</p>',
                'timeline' => [
                    ['year' => '2018', 'text' => 'Maître de conférences à l\'IPERMIC'],
                    ['year' => '2026', 'text' => 'Publication de « Le journalisme à l\'épreuve du terrorisme »'],
                ],
                'awards' => [
                    'Doctorat en sciences de l\'information',
                    'Chef d\'équipe au LAMCO',
                ],
            ],
        ];

        $authorSlugs = array_column($authors, 'slug');

        foreach ($authors as $data) {
            Author::updateOrCreate(['slug' => $data['slug']], $data);
        }

        $slugToId = Author::pluck('id', 'slug')->toArray();

        // Livres Mercury réels
        $books = [
            [
                'title'       => 'Prends ta carrière en main',
                'author_name' => 'Kassoum Bikienga',
                'author_slug' => 'kassoum-bikienga',
                'price'       => 5000,
                'category'    => 'essai',
                'rating'      => 4.8,
                'local'       => true,
                'color'       => '#1e3a5f',
                'cover_image' => '/images/covers/prends-ta-carriere-en-main.jpg',
                'year'        => 2026,
                'pages'       => 180,
                'publisher'   => 'Mercury Editions',
                'language'    => 'Français',
                'isbn'        => '978-2-38379-058-7',
                'tags'        => ['carrière', 'développement personnel', 'management', 'succès'],
                'description' => "« Prends ta carrière en main » de Kassoum Bikienga est un guide pratique offrant 28 principes clés pour attirer le succès professionnel. Ce livre ambitionne d'aider tout cadre, jeune ou moins jeune, avec ou sans « bras longs », à réussir sa carrière, pour peu qu'il soit assez déterminé à faire ce qui est nécessaire pour y arriver.",
                'summary'     => "Nombreux sont les cadres qui sont désillusionnés après quelques années de carrière. Beaucoup manquent d'objectifs de carrière et connaissent régulièrement des problèmes d'ordre financier, professionnel ou social. Il y en a qui finissent par se laisser avoir par l'alcool où se noie leur avenir professionnel, ou leur avenir tout court. Soudain, le cadre qui était promis à une carrière prestigieuse se retrouve dans un engrenage inextricable. Prends ta carrière en main est une tentative de réponse à ces situations, car comme le dit l'adage, qui veut aller loin ménage sa monture et mieux vaut prévenir que guérir.",
                'quote'       => 'La réussite professionnelle n\'est pas un hasard, c\'est le fruit d\'une préparation méthodique et d\'une détermination sans faille.',
            ],
            [
                'title'       => 'À la recherche de moi-même',
                'author_name' => 'Masaaki Kato',
                'author_slug' => 'masaaki-kato',
                'price'       => 6000,
                'category'    => 'essai',
                'rating'      => 4.9,
                'local'       => false,
                'color'       => '#b91c1c',
                'cover_image' => '/images/covers/a-la-recherche-de-moi-meme.jpg',
                'year'        => 2026,
                'pages'       => 220,
                'publisher'   => 'Mercury Editions',
                'language'    => 'Français',
                'isbn'        => '978-2-38379-092-1',
                'tags'        => ['Joseph Ki-Zerbo', 'histoire', 'Afrique', 'identité', 'philosophie'],
                'description' => "Il fut un historien, un penseur et un homme politique qui osa affronter de front un préjugé colonial tenace : l'idée selon laquelle l'Afrique serait dépourvue d'histoire. Son nom : Joseph Ki-Zerbo. Né au Burkina Faso, au cœur de l'Afrique de l'Ouest, il consacra sa vie à une question essentielle — Qui suis-je ? — et à la quête de l'identité d'un continent dont l'histoire avait été confisquée.",
                'summary'     => "Dans ce roman, les idées de Ki-Zerbo — qui touchent non seulement à l'histoire, mais aussi à la culture, à la liberté et à la démocratie, à la mondialisation, à l'éducation et au développement — sont retracées à travers le regard du protagoniste, Mita. Leur portée contemporaine y est interrogée : pourquoi la discrimination persiste-t-elle ? Les droits humains sont-ils vraiment universels ? Qu'est-ce que la liberté ? Les mécanismes démocratiques fonctionnent-ils encore ? Une société diversifiée peut-elle émerger au-delà du nationalisme ? Quel est le véritable rôle de l'éducation ? Quelles sont les clés d'un développement authentique ? Les questions posées par Ki-Zerbo sont aussi, aujourd'hui, les nôtres.",
                'quote'       => 'On ne développe pas, on se développe.',
            ],
            [
                'title'       => 'Ce siècle avait treize ans, et ces coutumes mille ans',
                'author_name' => 'Kabré Sidbéwendin Issouf',
                'author_slug' => 'kabre-sidbewendin-issouf',
                'price'       => 4500,
                'category'    => 'roman',
                'rating'      => 4.7,
                'local'       => true,
                'color'       => '#ea580c',
                'cover_image' => '/images/covers/ce-siecle-avait-treize-ans.jpg',
                'year'        => 2026,
                'pages'       => 200,
                'publisher'   => 'Mercury Editions',
                'language'    => 'Français',
                'isbn'        => '979-10-97328-88-7',
                'tags'        => ['roman', 'société', 'femme', 'violence domestique', 'tradition'],
                'description' => "Le lit est l'endroit le plus dangereux du monde. C'est ce qu'on raconte à Pitmoiga où 55% des femmes meurent au lit. C'est également ce que Sombdèbda, fille femme de Ouili Nanga, ne va pas tarder à apprendre à ses dépens.",
                'summary'     => "Mais ce qu'elle ignore encore, c'est que les hommes les plus dangereux sont ceux qui frappent leurs femmes tout en les persuadant qu'ils les aiment. Précipitée dans un ménage qui la broie alors que rien, ni dans son éducation ni dans sa personnalité, ne l'a préparée à une semblable épreuve, Sombdèbda doit subir le joug féroce de son mari toujours imaginatif lorsqu'il s'agit du pire. Coups, excuses, pardon, coups encore... Le plan diabolique de Ouili Nanga semble imparable. Sombdèbda souffre en silence le martyre, jusqu'au jour où son chemin croise celui de Maître Monrimda, avocate de renom. Celle-ci décide de s'adjoindre les compétences du roi de la presse lui-même, Yimmio Fa, pour alerter l'opinion et sauver l'épouse malheureuse. Mais réussiront-ils à arracher Sombdèbda des griffes de Ouili Nanga ? Car il est établi que certains prédateurs ne lâchent jamais leur proie.",
                'quote'       => 'Dans ce siècle qui a treize ans, des coutumes millénaires continuent de broyer des destins.',
            ],
            [
                'title'       => 'Amirou Adiouma Thiombiano, Le patriote',
                'author_name' => 'Dr Salifou Idani',
                'author_slug' => 'salifou-idani',
                'price'       => 5500,
                'category'    => 'essai',
                'rating'      => 4.8,
                'local'       => true,
                'color'       => '#0891b2',
                'cover_image' => '/images/covers/amirou-adiouma-thiombiano.jpg',
                'year'        => 2026,
                'pages'       => 240,
                'publisher'   => 'Mercury Editions',
                'language'    => 'Français',
                'isbn'        => '978-2-38379-093-8',
                'tags'        => ['biographie', 'histoire', 'Burkina Faso', 'patriote', 'politique'],
                'description' => "Celui qui rend un hommage appuyé à Amirou Adiouma THIOMBIANO, le patriote, est natif de Diapangou, région du Gourma. Dr Idani Salifou est actuellement Maître de conférences en histoire et civilisation africaines à l'Université Norbert ZONGO de Koudougou.",
                'summary'     => "THIOMBIANO Adiouma Amirou est un personnage emblématique qui a marqué le paysage syndical, politique et professionnel de la Haute-Volta, actuel Burkina Faso. Il est prince de la lignée paternelle (Nungu) et maternelle (Zorgho). Son père est HAM-TIOURI, Roi du Gulmu. Adiouma fut un brillant élève. Il intègre la fonction publique comme Inspecteurs divisionnaires de Douane le 01 juin 1962, après une formation de deux ans à l'École Nationale des Douanes de Neuilly en France. Amirou a dédié sa vie aux âpres luttes pour la souveraineté et l'indépendance des peuples. Avant d'être l'un des tombeurs du régime de Maurice Yaméogo, l'homme a été à la tête de plusieurs importantes structures syndicales et membre-fondateur du PAI. Le pays garde un lourd héritage de patriotisme de cet homme qui lui a tout donné avant de s'endormir définitivement le 13 mars 1975 auprès des héros de la Nation.",
                'quote'       => 'Le patriotisme n\'est pas un mot vide, c\'est un engagement de chaque instant pour la souveraineté des peuples.',
            ],
            [
                'title'       => 'Relations publiques en Afrique',
                'author_name' => 'Firmin Gouba',
                'author_slug' => 'firmin-gouba',
                'price'       => 7000,
                'category'    => 'essai',
                'rating'      => 4.6,
                'local'       => true,
                'color'       => '#78716c',
                'cover_image' => '/images/covers/relations-publiques-en-afrique.jpg',
                'year'        => 2026,
                'pages'       => 320,
                'publisher'   => 'Mercury Editions',
                'language'    => 'Français',
                'isbn'        => '978-2-38379-087-7',
                'tags'        => ['communication', 'relations publiques', 'Afrique', 'stratégie', 'marketing'],
                'description' => "Dans un monde marqué par la mondialisation, la révolution numérique et la montée des crises, la communication et les relations publiques en Afrique occupent une place stratégique. Loin d'être une simple transposition de modèles venus d'ailleurs, elles s'ancrent dans des réalités propres : diversité culturelle, poids des traditions orales, rôle des médias émergents et influence croissante des réseaux sociaux.",
                'summary'     => "Cet ouvrage propose une approche complète et structurée de la communication organisationnelle et des relations publiques en Afrique. Il combine fondements théoriques, stratégies opérationnelles et outils pratiques, tout en les illustrant par des études de cas africains (campagnes institutionnelles, crises d'entreprise, initiatives communautaires, communication digitale). Il met en lumière les spécificités africaines, tout en soulignant les convergences avec les pratiques internationales. Rédigé dans une perspective académique mais accessible, ce livre constitue : un manuel de référence pour les étudiants et chercheurs en communication et sciences sociales; un guide pratique pour les professionnels, décideurs et responsables de communication; une source d'inspiration pour celles et ceux qui veulent comprendre et maîtriser les enjeux des relations publiques à l'ère du numérique.",
                'quote'       => 'Les relations publiques africaines ne sont pas une adaptation, elles sont une création originale ancrée dans nos réalités.',
            ],
            [
                'title'       => 'Mieux vivre sa ménopause',
                'author_name' => 'Mariam Ouédraogo Sébégo',
                'author_slug' => 'mariam-ouedraogo-sebego',
                'price'       => 10000,
                'category'    => 'essai',
                'rating'      => 4.5,
                'local'       => true,
                'color'       => '#db2777',
                'cover_image' => '/images/covers/mieux-vivre-sa-menopause.jpg',
                'year'        => 2026,
                'pages'       => 160,
                'publisher'   => 'Mercury Editions',
                'language'    => 'Français',
                'isbn'        => '978-2-38379-095-2',
                'tags'        => ['santé', 'femme', 'ménopause', 'bien-être', 'témoignage'],
                'description' => "Le présent ouvrage est basé sur l'expérience personnelle de l'auteure d'un fait qui n'est autre que la ménopause. Ce phénomène bien que naturel qui a bouleversé sa vie, suscite aussi émoi et inquiétude sinon la panique et touche la plupart des femmes qui ont la chance d'atteindre un âge avancé.",
                'summary'     => "L'œuvre montre les différentes étapes de la vie féminine avec ses multiples et diverses implications, accompagnées de quelques pistes de solutions. En effet, la période intermédiaire ou transition ménopausique qui va de la pré ménopause à la péri ménopause, draine chez la quasi-totalité des femmes qui ont atteint un certain âge, des perturbations physiques, physiologiques et psychologiques. C'est pourquoi dans ce livre, elle préconise que les femmes âgées prennent des décisions tantôt héroïques, tantôt draconiennes, pour une hygiène de vie salvatrice. Ce sont des choix judicieux qui pourraient contribuer à l'épanouissement des femmes ménopausées. C'est un appel incessant, devenu un cri de cœur, qu'elle ne cessera d'émettre à l'endroit de tous les individus, de toutes les personnes âgées et de toutes les femmes ménopausées : « Soyons auteurs et artisans de notre propre santé ! »",
                'quote'       => 'Soyons auteurs et artisans de notre propre santé !',
            ],
            [
                'title'       => 'Fulbé et groupes de peuples noirs dans le Soum au Burkina Faso',
                'author_name' => 'Adama Tamboura',
                'author_slug' => 'adama-tamboura',
                'price'       => 8000,
                'category'    => 'essai',
                'rating'      => 4.7,
                'local'       => true,
                'color'       => '#1e40af',
                'cover_image' => '/images/covers/fulbe-et-groupes-peuples-noirs.jpg',
                'year'        => 2026,
                'pages'       => 280,
                'publisher'   => 'Mercury Editions',
                'language'    => 'Français',
                'isbn'        => '978-2-38379-094-5',
                'tags'        => ['histoire', 'anthropologie', 'Soum', 'Fulbé', 'chefferies', 'Burkina Faso'],
                'description' => "L'œuvre Fulbé et groupes de peuples noirs met en lumière les relations sociopolitiques qui ont existées entre différents groupes depuis le XIVe siècle jusqu'à nos jours dans la région du Soum au Burkina Faso. À travers une approche historique et anthropologique, l'ouvrage retrace les mécanismes de construction identitaire et les rapports de contrôle de pouvoir et de domination politique qui ont conduit à la construction de chefferies comme le Lorum, le Pela, le Kéli, par les groupes noirs.",
                'summary'     => "Au cœur de l'étude se trouvent également les chefferies Fulbé de Djibo, de Baraboulé et de Tongomay, dont l'ouvrage interroge la genèse, l'évolution et la légitimation du pouvoir politique dans un contexte de changements constants notamment sous l'influence de la colonisation française, de l'islamisation, de l'État moderne mais aussi des crises sociopolitiques récentes. L'auteur met en lumière les enjeux de pouvoir entre groupes sociaux et montre comment les traditions et les institutions locales ont été réinterprétées pour répondre aux défis contemporains offrant ainsi une lecture fine des dynamiques de pouvoir et des tensions identitaires dans une région marquée par la pluralité culturelle et les recompositions historiques.",
                'quote'       => 'Comprendre l\'histoire des peuples, c\'est éclairer les défis du présent.',
            ],
            [
                'title'       => 'Kisgu ou l\'éducation par les interdits',
                'author_name' => 'François Oubida',
                'author_slug' => 'francois-oubida',
                'price'       => 4500,
                'category'    => 'essai',
                'rating'      => 4.6,
                'local'       => true,
                'color'       => '#dc2626',
                'cover_image' => '/images/covers/kisgu-education-par-les-interdits.jpg',
                'year'        => 2026,
                'pages'       => 200,
                'publisher'   => 'Mercury Editions',
                'language'    => 'Français',
                'isbn'        => '978-2-38379-090-7',
                'tags'        => ['éducation', 'tradition', 'culture', 'Kourittenga', 'interdits'],
                'description' => "Éduquer, c'est bâtir pour demain. Éduquer c'est doter chaque enfant des valeurs essentielles pour une harmonie avec la nature et les autres. C'est jeter les fondamentaux pour un monde de paix, de prospérité dans lequel, faible et puissant jouissent d'un même niveau de sécurité.",
                'summary'     => "Le village est souvent perçu comme un espace en déphasage par rapport aux zones urbaines du fait que les villageois n'ont pas eu la chance ou l'occasion d'aller à l'école moderne. Ce qu'on oublie, c'est que notre société traditionnelle n'a rien à envier à l'image que le colonisateur tente de nous imposer. Le village constitue un environnement où les traditions et les coutumes véhiculent les véritables leçons de la vie. Ces leçons bien que orales, sont transmises avec fidélité de génération en génération. Dans cette zone, l'enfant est préparé au quotidien à respecter les autres, à la discrétion, à la retenue, en un mot à savoir quel type de comportement adopter devant chaque situation de manière à préserver la paix et l'harmonie, avec son environnement. Le livre cite un certain nombre de règles et d'interdits et donne des explications de base pour aider à leur compréhension sinon leur interprétation.",
                'quote'       => 'Les interdits ne sont pas des chaînes, mais des guides vers la sagesse.',
            ],
            [
                'title'       => 'Droits humains et lutte contre le terrorisme au Burkina Faso',
                'author_name' => 'Hadjaratou Sawadogo épouse Zongo & Thomas Savadogo',
                'author_slug' => 'hadjaratou-sawadogo-zongo-thomas-savadogo',
                'price'       => 7500,
                'category'    => 'essai',
                'rating'      => 4.8,
                'local'       => true,
                'color'       => '#854d0e',
                'cover_image' => '/images/covers/droits-humains-et-terrorisme.jpg',
                'year'        => 2026,
                'pages'       => 300,
                'publisher'   => 'Mercury Editions',
                'language'    => 'Français',
                'isbn'        => '978-2-38379-100-3',
                'tags'        => ['droits humains', 'terrorisme', 'VDP', 'Burkina Faso', 'défense'],
                'description' => "Dans un contexte où le Burkina Faso tout entier est mobilisé pour affronter l'un des défis majeurs de son histoire marquée par la lutte contre le terrorisme, cet ouvrage met en lumière l'engagement exceptionnel des Volontaires pour la Défense de la Patrie (VDP) aux côtés des Forces Armées Nationales et des Forces de Sécurité Intérieure pour la protection des populations et de leurs biens.",
                'summary'     => "À travers une approche croisée entre expertise en droits humains et expérience militaire, les auteurs dévoilent la réalité sur le lien entre le fondement des droits et celui de l'engagement de ces citoyens ordinaires devenus acteurs essentiels de la lutte contre le terrorisme. Ce livre déconstruit les préjugés, éclaire les débats sur la conciliation entre les impératifs opérationnels et le respect des droits humains, et rend hommage aux divers sacrifices consentis par les VDP, souvent au prix de leur vie. Il rappelle que leur combat n'est pas seulement militaire mais aussi et surtout un combat humain, porteur de dignité, de justice et de liberté. En retraçant des portraits marquants, en analysant le cadre légal et en exposant les défis opérationnels, l'ouvrage offre une compréhension globale des enjeux sécuritaires au Burkina Faso. Plus qu'un témoignage, ce livre est un hommage vibrant à la bravoure, à la résilience et à l'humanité des VDP, symboles d'un peuple debout face à l'adversité.",
                'quote'       => 'Le combat pour la dignité humaine ne connaît pas de trêve.',
            ],
            [
                'title'       => 'Préservation de l\'environnement et logiques communautaires',
                'author_name' => 'Association RELWENDÉ',
                'author_slug' => null,
                'price'       => 5000,
                'category'    => 'essai',
                'rating'      => 4.5,
                'local'       => true,
                'color'       => '#a16207',
                'cover_image' => '/images/covers/preservation-environnement.jpg',
                'year'        => 2026,
                'pages'       => 180,
                'publisher'   => 'Mercury Editions',
                'language'    => 'Français',
                'isbn'        => '978-2-38379-091-4',
                'tags'        => ['environnement', 'reboisement', 'communauté', 'plantes médicinales', 'Burkina Faso'],
                'description' => "Ce travail présente une étude approfondie d'un projet de reboisement communautaire mené dans un contexte de dégradation accélérée des ressources végétales locales, dans le village de Zoango (Province du Bassitenga anciennement Oubritenga) au Burkina Faso.",
                'summary'     => "Face à la disparition progressive d'espèces médicinales et alimentaires, l'association féminine RELWENDÉ, en collaboration avec REVARIS-DEV, les autorités coutumières et administratives, a initié une démarche participative visant à restaurer la biodiversité locale et à renforcer les systèmes de soins traditionnels. L'intervention s'est appuyée sur une méthodologie inclusive : concertation des acteurs, sélection d'un site stratégique, inventaire participatif de plusieurs espèces végétales, et mise en œuvre technique encadrée par le Centre national des semences forestières. Malgré une mobilisation initiale forte et des moyens techniques adaptés, le projet a été confronté à des contraintes hydriques, logistiques et sociales ayant limité la survie des plants à 30%. L'analyse révèle une tension entre l'engagement communautaire et les réalités opérationnelles, traduisant une reconfiguration des priorités locales face aux exigences de l'entretien. Le projet révèle également une réorientation des engagements communautaires vers une logique d'opportunité. Cette expérience met en lumière les conditions nécessaires à la durabilité des projets écologiques à ancrage communautaire, notamment l'importance d'un accompagnement technique soutenu, d'une gouvernance partagée et d'une valorisation des savoirs ou des pratiques endogènes.",
                'quote'       => 'La préservation de l\'environnement passe par l\'implication de chaque communauté.',
            ],
            [
                'title'       => 'Le journalisme à l\'épreuve du terrorisme et de la désinformation au Burkina Faso',
                'author_name' => 'Régis Dimitri Balima',
                'author_slug' => 'regis-dimitri-balima',
                'price'       => 6500,
                'category'    => 'essai',
                'rating'      => 4.7,
                'local'       => true,
                'color'       => '#0f766e',
                'cover_image' => '/images/covers/journalisme-terrorisme-desinformation.jpg',
                'year'        => 2026,
                'pages'       => 250,
                'publisher'   => 'Mercury Editions',
                'language'    => 'Français',
                'isbn'        => '978-2-38379-101-0',
                'tags'        => ['journalisme', 'terrorisme', 'désinformation', 'médias', 'Burkina Faso'],
                'description' => "Cet ouvrage explore les nombreux défis auxquels sont confrontés les journalistes depuis que le terrorisme est devenu la principale préoccupation des médias. Mais avant, l'auteur rappelle le contexte de productions des nouvelles à une époque où les journalistes sont fortement concurrencés par des nouveaux producteurs de contenus.",
                'summary'     => "À la faveur de la démocratisation des nouveaux outils de communication et de l'internet, toute sorte de contenu circule dans l'espace public. La désinformation est devenue une arme pour presque tous et déstabilise à la fois le pays et les individus eux-mêmes. Quelques pistes de solutions pour contrer le fléau sont proposées à la fois à l'État, à la population, aux acteurs des médias et de la société civile. Cet ouvrage s'adresse aux chercheurs en sciences de l'information et de la communication, en sciences politiques, aux producteurs d'informations, aux régulateurs des médias et aux décideurs politiques.",
                'quote'       => 'L\'information est une arme : ceux qui la maîtrisent construisent l\'avenir.',
            ],
        ];

        $bookTitles = array_column($books, 'title');

        foreach ($books as $bookData) {
            $authorSlug = $bookData['author_slug'] ?? null;
            unset($bookData['author_slug']);

            $bookData['author_id'] = $authorSlug ? ($slugToId[$authorSlug] ?? null) : null;

            Book::updateOrCreate(
                ['isbn' => $bookData['isbn']],
                $bookData
            );
        }

        $legacyBooksQuery = Book::query()
            ->whereNotIn('title', $bookTitles)
            ->doesntHave('orderItems');

        $legacyBooksDeleted = (clone $legacyBooksQuery)->count();
        $legacyBooksQuery->delete();

        $legacyAuthorsQuery = Author::query()
            ->whereNotIn('slug', $authorSlugs)
            ->doesntHave('books');

        $legacyAuthorsDeleted = (clone $legacyAuthorsQuery)->count();
        $legacyAuthorsQuery->delete();

        $this->command->info('[OK] ' . count($books) . ' ouvrages Mercury réels créés/mis à jour.');
        $this->command->info('[OK] ' . count($authors) . ' auteurs Mercury réels créés/mis à jour.');
        $this->command->info('[OK] ' . $legacyBooksDeleted . ' ouvrages démo supprimés.');
        $this->command->info('[OK] ' . $legacyAuthorsDeleted . ' auteurs démo supprimés.');
    }
}
