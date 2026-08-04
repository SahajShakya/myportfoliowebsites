<?php
/**
 * PHP Router for Development Server
 * Tells PHP's built-in server how to route requests
 * Usage: php -S localhost:8000 .htrouter.php
 *
 * Mirrors the production layout:
 *   /api/*       -> public/api/index.php
 *   /uploads/*   -> public/uploads/*
 *   static files -> public/ then dist/
 *   everything else -> dist/index.html (or index.html in dev)
 */

$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Route /api/* requests to public/api/index.php
if (strpos($requestPath, '/api/') === 0 || $requestPath === '/api') {
    $_GET['request'] = substr($requestPath, 5);
    require __DIR__ . '/public/api/index.php';
    return true;
}

// Serve static files from public/ (uploads, mypic.png, etc.)
$publicFile = __DIR__ . '/public' . $requestPath;
if (is_file($publicFile)) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $publicFile) ?: 'application/octet-stream';
    header('Content-Type: ' . $mimeType);
    header('Content-Length: ' . filesize($publicFile));
    readfile($publicFile);
    return true;
}

// Serve built frontend assets from dist/
$distFile = __DIR__ . '/dist' . $requestPath;
if (is_file($distFile)) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $distFile) ?: 'application/octet-stream';
    header('Content-Type: ' . $mimeType);
    header('Content-Length: ' . filesize($distFile));
    readfile($distFile);
    return true;
}

// SPA fallback: production build if present, otherwise dev index.html
if (is_file(__DIR__ . '/dist/index.html')) {
    include __DIR__ . '/dist/index.html';
    return true;
}

include __DIR__ . '/index.html';
return true;
