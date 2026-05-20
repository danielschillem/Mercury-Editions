<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Nouveau manuscrit</title>
</head>
<body style="font-family: Arial, sans-serif; color: #1c1917; line-height: 1.6;">
    <h1 style="color: #b91c1c;">Nouveau manuscrit reçu</h1>

    <p>
        <strong>{{ $submission->title }}</strong> vient d'être soumis à Mercury Editions.
    </p>

    <h2 style="font-size: 18px;">Auteur</h2>
    <ul>
        <li>Nom: {{ $submission->author_name }}</li>
        <li>Email: {{ $submission->email }}</li>
        @if($submission->phone)
            <li>Téléphone: {{ $submission->phone }}</li>
        @endif
    </ul>

    <h2 style="font-size: 18px;">Projet</h2>
    <ul>
        <li>Collection: {{ $submission->collection }}</li>
        @if($submission->genre)
            <li>Genre: {{ $submission->genre }}</li>
        @endif
        @if($submission->page_count)
            <li>Nombre de pages: {{ $submission->page_count }}</li>
        @endif
        @if($submission->manuscript_url)
            <li>Lien manuscrit: <a href="{{ $submission->manuscript_url }}">{{ $submission->manuscript_url }}</a></li>
        @endif
    </ul>

    <h2 style="font-size: 18px;">Synopsis</h2>
    <p style="white-space: pre-line;">{{ $submission->synopsis }}</p>

    @if($submission->author_note)
        <h2 style="font-size: 18px;">Note auteur</h2>
        <p style="white-space: pre-line;">{{ $submission->author_note }}</p>
    @endif

    <p>
        Ouvrir l'admin Mercury pour affecter un statut de lecture et ajouter les notes internes.
    </p>
</body>
</html>
