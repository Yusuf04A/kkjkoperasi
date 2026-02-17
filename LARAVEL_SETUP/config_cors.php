<?php
// File: config/cors.php
// Replace dengan file ini jika ingin custom CORS config

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure CORS settings for your application.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',    // React Vite dev server
        'http://localhost:3000',    // React dev server (create-react-app)
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        // Tambahkan domain production Anda di sini
    ],

    'allowed_origins_patterns' => [
        // '#^https://(.*)\.example\.com$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [
        'Authorization',
        'X-Total-Count',
    ],

    'max_age' => 0,

    'supports_credentials' => true,

];
