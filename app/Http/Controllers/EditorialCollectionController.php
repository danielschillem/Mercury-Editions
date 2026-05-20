<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\EditorialCollection;
use Illuminate\Http\JsonResponse;

class EditorialCollectionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            EditorialCollection::query()
                ->where('is_active', true)
                ->ordered()
                ->get(['id', 'name', 'slug', 'description', 'icon', 'color'])
        );
    }
}
