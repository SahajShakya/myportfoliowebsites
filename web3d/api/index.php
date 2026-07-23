<?php
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

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
require_once __DIR__ . '/routes/academic_projects.php';
require_once __DIR__ . '/routes/photography.php';
require_once __DIR__ . '/routes/contact.php';
require_once __DIR__ . '/routes/chat.php';

require_once __DIR__ . '/config/migrate.php';

$db = (new Database())->getConnection();
runMigrations($db);
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = array_values(array_filter(explode('/', $uri)));

if (isset($segments[0]) && $segments[0] === 'api') {
    array_shift($segments);
}

$resource = $segments[0] ?? '';

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
    case 'academic_projects':
        handleAcademicProjectsRoutes($method, $segments, $db);
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
    default:
        http_response_code(404);
        echo json_encode(["error" => "Endpoint not found"]);
        break;
}
