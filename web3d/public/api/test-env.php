<?php
/**
 * TEMPORARY diagnostic script — DELETE after debugging.
 * Visit: https://sahajshakya.com.np/api/test-env.php
 */
header('Content-Type: application/json');

$out = ['http_host' => $_SERVER['HTTP_HOST'] ?? '(none)'];

// 1. Which .env files exist?
$paths = [
    __DIR__ . '/.env',                       // htdocs/api/.env
    __DIR__ . '/.env.local',                 // htdocs/api/.env.local
    __DIR__ . '/config/.env',                // htdocs/api/config/.env
    dirname(__DIR__, 2) . '/.env',           // htdocs/.env
];
$out['env_files'] = [];
foreach ($paths as $p) {
    $out['env_files'][$p] = file_exists($p) ? 'EXISTS' : 'missing';
}

// 2. What did the loader pick up?
require_once __DIR__ . '/config/database.php';

$out['loaded'] = [
    'DB_HOST_PROD'   => $_ENV['DB_HOST_PROD'] ?? '(NOT SET)',
    'DB_NAME_PROD'   => $_ENV['DB_NAME_PROD'] ?? '(NOT SET)',
    'DB_USER_PROD'   => isset($_ENV['DB_USER_PROD']) && $_ENV['DB_USER_PROD'] !== '' ? '(SET)' : '(NOT SET)',
    'DB_PASSWORD_PROD' => isset($_ENV['DB_PASSWORD_PROD']) && $_ENV['DB_PASSWORD_PROD'] !== '' ? '(SET)' : '(NOT SET)',
    'DB_PORT_PROD'   => $_ENV['DB_PORT_PROD'] ?? '(NOT SET)',
];

// 3. Try the connection with the same logic
$db = new Database();
$ref = new ReflectionClass($db);
try {
    $conn = $db->getConnection();
    $out['db'] = 'CONNECTED';
} catch (Throwable $e) {
    $out['db'] = 'FAILED: ' . $e->getMessage();
}

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
