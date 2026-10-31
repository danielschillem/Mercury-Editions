<?php

declare(strict_types=1);

namespace App\Domain\Reader\Contracts;

use App\Models\Book;
use App\Models\User;

/** Target port; intentionally unbound until edition anchors and storage exist. */
interface PrivateAnnotationStore
{
    /** @return list<array{id: string, edition_id: string, locator: array, body: string}> */
    public function listFor(User $owner, Book $book, string $editionId): array;

    /** Must reject an annotation id belonging to another owner or edition. */
    public function saveFor(User $owner, Book $book, string $editionId, array $annotation): string;

    public function deleteFor(User $owner, Book $book, string $annotationId): void;
}
