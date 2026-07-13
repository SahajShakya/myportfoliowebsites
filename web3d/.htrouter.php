<?php
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

if ($uri === '/') {
    $uri = '/index.html';
}

if (strpos($uri, '/api/') === 0) {
    require __DIR__ . '/api/index.php';
    return true;
}

if (strpos($uri, '/uploads/') === 0) {
    $filePath = __DIR__ . $uri;
    if (file_exists($filePath) && is_file($filePath)) {
        $mimeTypes = [
            'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png',
            'gif' => 'image/gif', 'webp' => 'image/webp', 'svg' => 'image/svg+xml',
            'pdf' => 'application/pdf', 'mp4' => 'video/mp4', 'webm' => 'video/webm',
        ];
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mime = $mimeTypes[$ext] ?? 'application/octet-stream';
        header('Content-Type: ' . $mime);
        header('Access-Control-Allow-Origin: *');
        readfile($filePath);
        return true;
    }
    http_response_code(404);
    echo json_encode(["error" => "File not found"]);
    return true;
}

$filePath = __DIR__ . $uri;
if (file_exists($filePath) && is_file($filePath)) {
    return false;
}

http_response_code(404);
echo json_encode(["error" => "Not found"]);
