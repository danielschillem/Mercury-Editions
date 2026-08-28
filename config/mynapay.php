<?php

return [
    'base_url' => env('MYNAPAY_BASE_URL', 'https://pay.myna-etoile.com'),
    'api_key' => env('MYNAPAY_API_KEY', ''),
    'environment' => env('MYNAPAY_ENV', 'sandbox'),
    'simulate' => env('MYNAPAY_SIMULATE', env('ORANGE_OM_SIMULATE', false)),
    'country_code' => env('MYNAPAY_COUNTRY_CODE', '226'),
    'timeout' => (int) env('MYNAPAY_TIMEOUT', 30),
];
