<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mercury Editions — Librairie Numérique du Burkina</title>
    <meta name="description" content="La première plateforme dédiée aux auteurs burkinabè. Découvrez, achetez et lisez des œuvres littéraires du Burkina Faso.">
    <meta name="author" content="Mercury Editions">
    <meta name="version" content="1.0.0">
    <meta name="theme-color" content="#B91C1C">

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="Mercury Editions — Librairie Numérique du Burkina">
    <meta property="og:description" content="La première plateforme dédiée aux auteurs burkinabè. Découvrez, achetez et lisez des œuvres littéraires du Burkina Faso.">
    <meta property="og:url" content="{{ url('/') }}">
    <meta property="og:site_name" content="Mercury Editions">
    <meta property="og:locale" content="fr_BF">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Mercury Editions — Librairie Numérique du Burkina">
    <meta name="twitter:description" content="Découvrez, achetez et lisez des œuvres littéraires du Burkina Faso.">

    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="manifest" href="/manifest.webmanifest">
    <link rel="icon" type="image/png" href="/images/logo/logo.png">
    <link rel="apple-touch-icon" href="/images/logo/logo.png">
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Source+Sans+3:wght@300;400;600;700&family=Noto+Serif:wght@400;700&display=swap" rel="stylesheet">
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body>
    <div id="app"></div>
</body>
</html>
