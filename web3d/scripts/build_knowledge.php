<?php
$useProduction = in_array('production', $argv) || in_array('prod', $argv);

require_once __DIR__ . '/../public/api/config/database.php';

class KnowledgeDatabase extends Database {
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

$db = (new KnowledgeDatabase($useProduction))->getConnection();

echo "Using " . ($useProduction ? "PRODUCTION" : "LOCAL") . " database\n";

require_once __DIR__ . '/../public/api/services/KnowledgeBuilder.php';
$builder = new KnowledgeBuilder($db);
$count = $builder->buildAll();

echo "Knowledge base rebuilt successfully!\n";
echo "Total chunks: {$count}\n";
