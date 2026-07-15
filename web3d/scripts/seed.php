#!/usr/bin/env php
<?php

$envFile = __DIR__ . '/../.env';
if (!file_exists($envFile)) {
    echo "Error: .env file not found\n";
    exit(1);
}

$env = [];
$lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
foreach ($lines as $line) {
    if (strpos(trim($line), '#') === 0) continue;
    if (strpos($line, '=') === false) continue;
    list($key, $value) = explode('=', $line, 2);
    $env[trim($key)] = trim($value);
}

$isProd = isset($argv[1]) && $argv[1] === 'production';

if ($isProd) {
    $host = $env['DB_HOST_PROD'] ?? 'localhost';
    $dbName = $env['DB_NAME_PROD'];
    $user = $env['DB_USER_PROD'];
    $password = $env['DB_PASSWORD_PROD'];
    echo "Seeding PRODUCTION database...\n";
} else {
    $host = $env['DB_HOST'] ?? 'localhost';
    $dbName = $env['DB_NAME'];
    $user = $env['DB_USER'];
    $password = $env['DB_PASSWORD'];
    echo "Seeding DEVELOPMENT database...\n";
}

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbName;charset=utf8mb4",
        $user,
        $password,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    echo "Database connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

echo "Connected to database: $dbName\n\n";

// Seed roles
$roles = [
    [1, 'admin'],
    [2, 'user'],
];

echo "Seeding roles...\n";
$stmt = $pdo->prepare("INSERT IGNORE INTO roles (id, name) VALUES (?, ?)");
foreach ($roles as $role) {
    $stmt->execute($role);
    echo "  - Role: {$role[1]} (id: {$role[0]})\n";
}

// Seed admin user
$adminId = bin2hex(random_bytes(16));
$adminEmail = 'saz.shakya@gmail.com';
$adminPassword = 's@h@j_552574';
$adminName = 'Sahaj Shakya';
$adminRole = 1; // admin
$passwordHash = password_hash($adminPassword, PASSWORD_BCRYPT);

echo "\nSeeding admin user...\n";

$existing = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$existing->execute([$adminEmail]);

if ($existing->fetch()) {
    echo "  - Admin user already exists (email: $adminEmail), skipping.\n";
} else {
    $stmt = $pdo->prepare("
        INSERT INTO users (id, name, email, password_hash, role_id)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$adminId, $adminName, $adminEmail, $passwordHash, $adminRole]);
    echo "  - Admin user created successfully!\n";
    echo "    Email:    $adminEmail\n";
    echo "    Password: $adminPassword\n";
    echo "    Role:     admin\n";
    echo "    ID:       $adminId\n";
}

echo "\nSeeding complete!\n";
