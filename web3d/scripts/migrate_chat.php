<?php
$useProduction = in_array('production', $argv) || in_array('prod', $argv);

require_once __DIR__ . '/../public/api/config/database.php';

class MigrateDatabase extends Database {
    private $useProd;
    public function __construct($useProd = false) {
        $this->useProd = $useProd;
    }
    public function getConnection() {
        if ($this->useProd) {
            $host = $_ENV['DB_HOST_PROD'] ?? 'localhost';
            $dbName = $_ENV['DB_NAME_PROD'];
            $user = $_ENV['DB_USER_PROD'];
            $pass = $_ENV['DB_PASSWORD_PROD'];
        } else {
            $host = $_ENV['DB_HOST'] ?? 'localhost';
            $dbName = $_ENV['DB_NAME'];
            $user = $_ENV['DB_USER'];
            $pass = $_ENV['DB_PASSWORD'];
        }
        try {
            $conn = new PDO(
                "mysql:host={$host};dbname={$dbName};charset=utf8mb4",
                $user, $pass,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
            );
        } catch (PDOException $e) {
            echo "Database connection failed: " . $e->getMessage() . "\n";
            exit(1);
        }
        return $conn;
    }
}

$db = (new MigrateDatabase($useProduction))->getConnection();
echo "Using " . ($useProduction ? "PRODUCTION" : "LOCAL") . " database\n";

$statements = [
    "CREATE TABLE IF NOT EXISTS chat_sessions (
        id VARCHAR(64) PRIMARY KEY,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

    "CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL,
        role ENUM('user', 'assistant') NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
        INDEX idx_session_created (session_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

    "CREATE TABLE IF NOT EXISTS knowledge_chunks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        source_table VARCHAR(50) NOT NULL,
        source_id INT NOT NULL,
        chunk_text TEXT NOT NULL,
        metadata JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FULLTEXT KEY ft_chunk (chunk_text)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
];

$success = 0;
$errors = 0;

foreach ($statements as $sql) {
    try {
        $db->exec($sql);
        echo "OK\n";
        $success++;
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'already exists') !== false) {
            echo "SKIP (already exists)\n";
            $success++;
        } else {
            echo "ERROR: " . $e->getMessage() . "\n";
            $errors++;
        }
    }
}

echo "\nMigration complete: {$success} succeeded, {$errors} failed\n";
