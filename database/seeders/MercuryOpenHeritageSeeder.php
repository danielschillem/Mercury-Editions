<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Author;
use App\Models\Book;
use App\Models\EditorialCollection;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MercuryOpenHeritageSeeder extends Seeder
{
    public function run(): void
    {
        $collection = EditorialCollection::updateOrCreate(
            ['slug' => 'patrimoines-savoirs-libres'],
            [
                'name' => 'Mercury Patrimoines & Savoirs libres',
                'description' => 'Classiques, patrimoines et ressources sous licence ouverte, sélectionnés, vérifiés et édités par Mercury.',
                'icon' => 'scroll',
                'color' => '#7C3AED',
                'sort_order' => 40,
                'is_active' => true,
            ]
        );

        $works = [
            ['Les Misérables', 'Victor Hugo', 1802, 1885, 'roman', 1862],
            ['Germinal', 'Émile Zola', 1840, 1902, 'roman', 1885],
            ['Candide ou l’Optimisme', 'Voltaire', 1694, 1778, 'roman', 1759],
            ['Madame Bovary', 'Gustave Flaubert', 1821, 1880, 'roman', 1857],
            ['Le Rouge et le Noir', 'Stendhal', 1783, 1842, 'roman', 1830],
            ['Le Tour du monde en quatre-vingts jours', 'Jules Verne', 1828, 1905, 'jeunesse', 1872],
            ['Les Fleurs du mal', 'Charles Baudelaire', 1821, 1867, 'poesie', 1857],
            ['Poésies complètes', 'Arthur Rimbaud', 1854, 1891, 'poesie', 1895],
            ['Calligrammes', 'Guillaume Apollinaire', 1880, 1918, 'poesie', 1918],
            ['Histoires ou Contes du temps passé', 'Charles Perrault', 1628, 1703, 'conte', 1697],
            ['Fables', 'Jean de La Fontaine', 1621, 1695, 'conte', 1668],
            ['Contes d’une grand-mère', 'George Sand', 1804, 1876, 'jeunesse', 1873],
            ['Les Petites Filles modèles', 'Comtesse de Ségur', 1799, 1874, 'jeunesse', 1858],
            ['Discours de la méthode', 'René Descartes', 1596, 1650, 'essai', 1637],
            ['Du contrat social', 'Jean-Jacques Rousseau', 1712, 1778, 'essai', 1762],
            ['De l’esprit des lois', 'Montesquieu', 1689, 1755, 'essai', 1748],
            ['De la démocratie en Amérique', 'Alexis de Tocqueville', 1805, 1859, 'essai', 1835],
            ['Essais', 'Michel de Montaigne', 1533, 1592, 'developpement', 1580],
            ['Réflexions ou sentences et maximes morales', 'La Rochefoucauld', 1613, 1680, 'developpement', 1665],
            ['Introduction à la vie dévote', 'François de Sales', 1567, 1622, 'spiritualite', 1609],
        ];

        foreach ($works as $index => [$title, $authorName, $born, $died, $category, $year]) {
            $author = Author::updateOrCreate(
                ['slug' => Str::slug($authorName)],
                [
                    'name' => $authorName,
                    'icon' => 'book',
                    'origin' => 'À documenter',
                    'born' => (string) $born,
                    'died' => (string) $died,
                    'color' => '#7C3AED',
                    'genres' => [ucfirst($category), 'Patrimoine'],
                    'bio' => 'Notice biographique à relire et enrichir avant publication.',
                    'timeline' => [],
                    'awards' => [],
                ]
            );

            Book::updateOrCreate(
                ['isbn' => sprintf('MPSL-DRAFT-%03d', $index + 1)],
                [
                    'author_id' => $author->id,
                    'editorial_collection_id' => $collection->id,
                    'title' => $title,
                    'author_name' => $authorName,
                    'price' => 0,
                    'category' => $category,
                    'rating' => 0,
                    'is_featured' => false,
                    'publication_status' => 'legal_review',
                    'rights_status' => 'public_domain_review',
                    'commercial_distribution_allowed' => false,
                    'source_url' => 'https://www.gutenberg.org/ebooks/search/?query=' . rawurlencode($title . ' ' . $authorName),
                    'license_name' => 'Domaine public — validation Burkina Faso et édition source requises',
                    'author_death_year' => $died,
                    'rights_notes' => 'Vérifier le texte, les illustrations, la traduction éventuelle et la déclaration/redevance BBDA avant toute publication ou vente.',
                    'local' => false,
                    'color' => '#7C3AED',
                    'cover_image' => null,
                    'year' => $year,
                    'pages' => 1,
                    'publisher' => 'Mercury Editions',
                    'editorial_director' => null,
                    'language' => 'Français',
                    'tags' => [$category, 'patrimoine', 'domaine public à vérifier'],
                    'description' => 'Candidat pour la collection Mercury Patrimoines & Savoirs libres. Notice éditoriale à préparer.',
                    'summary' => 'Dossier de préparation non publié. Le texte et ses droits doivent être validés avant diffusion.',
                    'public_excerpt' => null,
                    'quote' => 'Édition Mercury en préparation.',
                ]
            );
        }
    }
}
