<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Allowed origins are read from CORS_ALLOWED_ORIGINS (comma-separated).
    | In production, set this to your exact frontend domain, e.g.:
    |   CORS_ALLOWED_ORIGINS=https://mercury-editions.bf
    |
    | Multiple origins: CORS_ALLOWED_ORIGINS=https://mercury-editions.bf,https://www.mercury-editions.bf
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(
        array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', env('APP_URL', 'http://localhost:8000'))))
    ),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Content-Type', 'X-Requested-With', 'X-XSRF-TOKEN', 'Accept'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
