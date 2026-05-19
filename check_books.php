<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$books = App\Models\Book::select('title', 'cover_image')->get();
echo "Total: " . count($books) . " livres\n\n";
foreach ($books as $b) {
    echo $b->title . ' => ' . $b->cover_image . PHP_EOL;
}
