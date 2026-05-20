<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Manuscrit reçu</title>
</head>
<body style="font-family: Arial, sans-serif; color: #1c1917; line-height: 1.6;">
    <h1 style="color: #b91c1c;">Manuscrit reçu</h1>

    <p>Bonjour {{ $submission->author_name }},</p>

    <p>
        Nous avons bien reçu votre manuscrit <strong>{{ $submission->title }}</strong>.
        Il entre maintenant dans le circuit éditorial Mercury.
    </p>

    <p>
        Notre équipe procèdera à une première lecture et reviendra vers vous après examen.
        Le délai cible de réponse est de moins de 30 jours.
    </p>

    <h2 style="font-size: 18px;">Récapitulatif</h2>
    <ul>
        <li>Collection: {{ $submission->collection }}</li>
        @if($submission->genre)
            <li>Genre: {{ $submission->genre }}</li>
        @endif
        @if($submission->page_count)
            <li>Nombre de pages: {{ $submission->page_count }}</li>
        @endif
        <li>Statut: reçu</li>
    </ul>

    <p>
        Merci de faire confiance à Mercury Editions pour porter votre texte.
    </p>

    <p style="margin-top: 32px;">
        L'équipe éditoriale<br>
        Mercury Editions
    </p>
</body>
</html>
