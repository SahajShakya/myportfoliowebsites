<?php
function handleUploadRoutes($method, $segments, $db) {
    require_once __DIR__ . '/../middleware/upload.php';

    $uploader = new UploadMiddleware();

    if ($method === 'POST') {
        $basePath = $_POST['basePath'] ?? '';
        $result = $uploader->handleUpload($_FILES, $basePath);

        if (isset($result['error'])) {
            http_response_code(400);
            echo json_encode($result);
            return;
        }

        $urls = array_map(function ($fileInfo) {
            $host = $_SERVER['HTTP_HOST'] ?? 'localhost:8000';
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $relativePath = is_array($fileInfo) ? ($fileInfo['relative_path'] ?? $fileInfo) : $fileInfo;
            return [
                'url' => $protocol . '://' . $host . $relativePath,
                'path' => $relativePath,
                'file_name' => is_array($fileInfo) ? ($fileInfo['file_name'] ?? '') : '',
                'original_name' => is_array($fileInfo) ? ($fileInfo['original_name'] ?? '') : '',
                'mime_type' => is_array($fileInfo) ? ($fileInfo['mime_type'] ?? '') : '',
                'file_size' => is_array($fileInfo) ? ($fileInfo['file_size'] ?? 0) : 0,
                'absolute_path' => is_array($fileInfo) ? ($fileInfo['absolute_path'] ?? '') : '',
            ];
        }, $result);

        echo json_encode(["files" => $urls, "count" => count($urls)]);
        return;
    }

    if ($method === 'DELETE') {
        $data = json_decode(file_get_contents('php://input'), true);
        $filePath = $data['path'] ?? $data['url'] ?? '';

        if (!$filePath) {
            http_response_code(400);
            echo json_encode(["error" => "File path required"]);
            return;
        }

        $parsed = parse_url($filePath);
        $path = $parsed['path'] ?? $filePath;

        $deleted = $uploader->deleteFile($path);
        if ($deleted) {
            echo json_encode(["message" => "File deleted successfully"]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "File not found"]);
        }
        return;
    }

    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}
