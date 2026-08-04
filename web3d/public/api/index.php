<?php
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);
header('Content-Type: application/json');

// Dynamic CORS: allow frontend origin
$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:8000',
];
if (!empty($_ENV['FRONTEND_URL'])) {
    $allowedOrigins[] = $_ENV['FRONTEND_URL'];
    // Also allow the http/https variant of the same host
    $allowedOrigins[] = preg_replace('#^https?://#', 'http://', $_ENV['FRONTEND_URL']);
    $allowedOrigins[] = preg_replace('#^https?://#', 'https://', $_ENV['FRONTEND_URL']);
}
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowOrigin = '';
if (!empty($origin)) {
    foreach ($allowedOrigins as $allowed) {
        if (strcasecmp($origin, $allowed) === 0) {
            $allowOrigin = $origin;
            break;
        }
    }
    // Allow any request whose host matches FRONTEND_URL's host
    if (!$allowOrigin) {
        $frontendHost = parse_url($_ENV['FRONTEND_URL'] ?? '', PHP_URL_HOST);
        $originHost = parse_url($origin, PHP_URL_HOST);
        if ($frontendHost && $originHost && strcasecmp($frontendHost, $originHost) === 0) {
            $allowOrigin = $origin;
        }
    }
    // Dev: allow localhost of any port
    if (!$allowOrigin && strpos($originHost ?? '', 'localhost') !== false) {
        $allowOrigin = $origin;
    }
}
if ($allowOrigin) {
    header('Access-Control-Allow-Origin: ' . $allowOrigin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($allowOrigin) {
    header('Access-Control-Allow-Credentials: true');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/routes/auth.php';
require_once __DIR__ . '/routes/upload.php';
require_once __DIR__ . '/routes/academics.php';
require_once __DIR__ . '/routes/journey.php';
require_once __DIR__ . '/routes/projects.php';
require_once __DIR__ . '/routes/achievements.php';
require_once __DIR__ . '/routes/testimonials.php';
require_once __DIR__ . '/routes/settings.php';
require_once __DIR__ . '/routes/photography.php';
require_once __DIR__ . '/routes/contact.php';
require_once __DIR__ . '/routes/chat.php';
require_once __DIR__ . '/routes/knowledge.php';

require_once __DIR__ . '/config/migrate.php';

$db = (new Database())->getConnection();
runMigrations($db);

// Auto-seed: if roles table is empty, seed on first request
autoSeedIfEmpty($db);

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = array_values(array_filter(explode('/', $uri)));

if (isset($segments[0]) && $segments[0] === 'api') {
    array_shift($segments);
}

$resource = $segments[0] ?? '';

// /api/setup?token=XXX — manual setup endpoint
if ($resource === 'setup') {
    handleSetupRoute($method, $segments, $db);
    exit;
}

// /api/migrate-paths?token=XXX — update document paths for InfinityFree
if ($resource === 'migrate-paths') {
    handleMigratePathsRoute($method, $segments, $db);
    exit;
}

switch ($resource) {
    case 'auth':
        handleAuthRoutes($method, $segments, $db);
        break;
    case 'upload':
        handleUploadRoutes($method, $segments, $db);
        break;
    case 'academics':
        handleAcademicsRoutes($method, $segments, $db);
        break;
    case 'journey':
        handleJourneyRoutes($method, $segments, $db);
        break;
    case 'projects':
        handleProjectsRoutes($method, $segments, $db);
        break;
    case 'achievements':
        handleAchievementsRoutes($method, $segments, $db);
        break;
    case 'testimonials':
        handleTestimonialsRoutes($method, $segments, $db);
        break;
    case 'settings':
        handleSettingsRoutes($method, $segments, $db);
        break;
    case 'photography':
        handlePhotographyRoutes($method, $segments, $db);
        break;
    case 'contact':
        handleContactRoutes($method, $segments, $db);
        break;
    case 'chat':
        handleChatRoutes($method, $segments, $db);
        break;
    case 'knowledge':
        handleKnowledgeRoutes($method, $segments, $db);
        break;
    default:
        http_response_code(404);
        echo json_encode(["error" => "Endpoint not found"]);
        break;
}

// ==================== AUTO-SEED ====================

function autoSeedIfEmpty($db) {
    try {
        $stmt = $db->query("SELECT COUNT(*) FROM roles");
        $count = $stmt->fetchColumn();
        if ($count > 0) {
            return; // Already seeded
        }
    } catch (PDOException $e) {
        // Table might not exist yet — migrations will create it, try again next request
        return;
    }

    seedDatabase($db);
    error_log("Auto-seed: Database seeded automatically on first request.");
}

function handleSetupRoute($method, $segments, $db) {
    $token = $_GET['token'] ?? '';
    $expectedToken = $_ENV['SETUP_TOKEN'] ?? '';

    if (empty($expectedToken)) {
        http_response_code(500);
        echo json_encode(["error" => "SETUP_TOKEN not configured in .env"]);
        return;
    }

    if (!hash_equals($expectedToken, $token)) {
        http_response_code(403);
        echo json_encode(["error" => "Invalid setup token"]);
        return;
    }

    // Run migrations + seed
    runMigrations($db);
    $result = seedDatabase($db);

    echo json_encode([
        "message" => "Setup complete!",
        "details" => $result
    ]);
}

function seedDatabase($db) {
    $result = ["roles" => [], "admin" => null];

    // Seed roles
    $roles = [
        [1, 'admin'],
        [2, 'user'],
    ];

    $stmt = $db->prepare("INSERT IGNORE INTO roles (id, name) VALUES (?, ?)");
    foreach ($roles as $role) {
        $stmt->execute($role);
        $result["roles"][] = $role[1];
    }

    // Seed admin user
    $adminEmail = 'saz.shakya@gmail.com';
    $existing = $db->prepare("SELECT id FROM users WHERE email = ?");
    $existing->execute([$adminEmail]);

    if (!$existing->fetch()) {
        $adminId = bin2hex(random_bytes(16));
        $adminPassword = 's@h@j_552574';
        $adminName = 'Sahaj Shakya';
        $passwordHash = password_hash($adminPassword, PASSWORD_BCRYPT);

        $insert = $db->prepare("INSERT INTO users (id, name, email, password_hash, role_id) VALUES (?, ?, ?, ?, ?)");
        $insert->execute([$adminId, $adminName, $adminEmail, $passwordHash, 1]);
        $result["admin"] = ["email" => $adminEmail, "id" => $adminId];
    } else {
        $result["admin"] = "already exists";
    }

    return $result;
}

function handleMigratePathsRoute($method, $segments, $db) {
    $token = $_GET['token'] ?? '';
    $expectedToken = $_ENV['SETUP_TOKEN'] ?? '';

    if (empty($expectedToken) || !hash_equals($expectedToken, $token)) {
        http_response_code(403);
        echo json_encode(["error" => "Invalid or missing setup token"]);
        return;
    }

    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $baseUrl = $protocol . '://' . $host;

    $results = ["updated" => 0, "skipped" => 0, "errors" => []];

    try {
        // Update relative_path: ensure it starts with /uploads/
        $stmt = $db->query("SELECT id, relative_path, absolute_path FROM documents WHERE relative_path != '' AND relative_path IS NOT NULL");
        $docs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $update = $db->prepare("UPDATE documents SET relative_path = ?, absolute_path = ? WHERE id = ?");

        foreach ($docs as $doc) {
            $relPath = $doc['relative_path'];
            $absPath = $doc['absolute_path'];

            // If relative_path doesn't start with /uploads/, fix it
            if (strpos($relPath, '/uploads/') !== 0) {
                // Extract the part after the last /uploads/ if it exists
                $uploadsPos = strrpos($relPath, '/uploads/');
                if ($uploadsPos !== false) {
                    $relPath = substr($relPath, $uploadsPos);
                } else {
                    // Prepend /uploads/ if it's just a bare filename
                    $relPath = '/uploads/' . ltrim($relPath, '/');
                }
            }

            // Update absolute_path to match new hosting
            $newAbsPath = dirname(__DIR__) . $relPath;

            $update->execute([$relPath, $newAbsPath, $doc['id']]);
            $results["updated"]++;
        }

        echo json_encode([
            "message" => "Document paths migrated successfully",
            "details" => $results,
            "base_url" => $baseUrl
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Migration failed: " . $e->getMessage()]);
    }
}
