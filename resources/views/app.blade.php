<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="session-idle-minutes" content="{{ config('session.idle_minutes') }}">
    <meta name="google-client-id" content="{{ config('services.google.client_id') }}">
    {{-- Only with both keys: a site key without its secret would show a box nobody checks. --}}
    <meta name="recaptcha-site-key" content="{{ config('services.recaptcha.secret') ? config('services.recaptcha.site_key') : '' }}">
    <meta name="description" content="SYSCON: catálogo y compras de tecnología para empresas.">
    <meta name="theme-color" content="#1b4279">
    <title>SYSCON Commerce</title>
    {{-- Fuentes con <link> en vez de @import en el CSS: el navegador las pide en paralelo con el CSS. --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap">
    @viteReactRefresh
    @vite('resources/js/app.tsx')
</head>
<body><div id="app"></div></body>
</html>
