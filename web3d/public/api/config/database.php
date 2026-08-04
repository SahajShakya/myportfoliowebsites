<?php

function loadEnv($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        if (!array_key_exists($key, $_ENV)) {
            $_ENV[$key] = $value;
        }
    }
}

// Load environment in priority order:
// 1. public/api/.env (production, uploaded alongside the backend)
// 2. public/api/.env.local
// 3. repo root .env (development)
foreach ([
    __DIR__ . '/../.env',
    __DIR__ . '/../.env.local',
    __DIR__ . '/../../../.env',
] as $envFile) {
    loadEnv($envFile);
}

$isProduction = (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'localhost') === false);

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $port;
    private $conn;

    public function __construct() {
        $isProduction = !empty($_ENV['DB_NAME_PROD']) && (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'localhost') === false);

        if ($isProduction) {
            $this->host = $_ENV['DB_HOST_PROD'] ?? 'localhost';
            $this->db_name = $_ENV['DB_NAME_PROD'];
            $this->username = $_ENV['DB_USER_PROD'];
            $this->password = $_ENV['DB_PASSWORD_PROD'];
            $this->port = $_ENV['DB_PORT_PROD'] ?? '3306';
        } else {
            $this->host = $_ENV['DB_HOST'] ?? 'localhost';
            $this->db_name = $_ENV['DB_NAME'];
            $this->username = $_ENV['DB_USER'];
            $this->password = $_ENV['DB_PASSWORD'];
            $this->port = $_ENV['DB_PORT'] ?? '3306';
        }
    }

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
            exit;
        }
        return $this->conn;
    }
}