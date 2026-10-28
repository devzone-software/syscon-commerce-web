<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="google-client-id" content="{{ config('services.google.client_id') }}">
    <meta name="description" content="SYSCON: catálogo y compras de tecnología para empresas.">
    <meta name="theme-color" content="#00265d">
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
