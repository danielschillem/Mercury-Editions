<?php

return [
    'simulate'         => env('ORANGE_OM_SIMULATE', false),
    'env'              => env('ORANGE_OM_ENV', 'test'),
    'country_code'     => env('ORANGE_COUNTRY_CODE', '226'),
    'url_prod'         => env('ORANGE_OM_URL_PROD', 'https://apiom.orange.bf/'),
    'url_test'         => env('ORANGE_OM_URL_TEST', 'https://testom.orange.bf/'),
    'merchant_msisdn'  => env('ORANGE_OM_MERCHANT_MSISDN', ''),
    'api_username'     => env('ORANGE_OM_API_USERNAME', ''),
    'api_password'     => env('ORANGE_OM_API_PASSWORD', ''),
    'provider'         => env('ORANGE_OM_PROVIDER', '101'),
    'provider2'        => env('ORANGE_OM_PROVIDER2', '101'),
    'payid'            => env('ORANGE_OM_PAYID', '12'),
    'payid2'           => env('ORANGE_OM_PAYID2', '12'),
];
