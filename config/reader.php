<?php

return [
    // Compatibility only for the existing /api/books/{book}/reader routes.
    // Disable after existing guest purchases have a verified account-claim flow.
    'legacy_guest_tokens' => env('READER_LEGACY_GUEST_TOKENS', true),
    'legacy_query_tokens' => env('READER_LEGACY_QUERY_TOKENS', true),
];
