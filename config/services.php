<?php

return [

    'java' => [
        // API de la plataforma Laravel. JAVA_API_URL es el nombre anterior y se acepta mientras
        // los despliegues existentes no definan PLATFORM_API_URL.
        'url' => env('PLATFORM_API_URL', env('JAVA_API_URL', 'http://localhost')),
        'jwt_secret' => env('JWT_SECRET'),
    ],

    // Public OAuth client id for Google Identity Services; empty hides the Google button.
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
