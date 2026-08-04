<?php
function handleUploadRoutes($method, $segments, $db) {
    require_once __DIR__ . '/../middleware/upload.php';
    require_once __DIR__ . '/../models/Document.php';
    require_once __DIR__ . '/../middleware/auth.php';

    $uploader = new UploadMiddleware();
    $documentModel = new Document($db);

    if ($method === 'POST') {
        $basePath = $_POST['basePath'] ?? '';

        $userId = null;
        try {
            $auth = new AuthMiddleware();
            $authData = $auth->authenticate();
            $userId = $authData['user_id'];
        } catch (Exception $e) {
            $userId = 'system';
        }

        $result = $uploader->handleUpload($_FILES, $basePath);

        if (isset($result['error'])) {
            http_response_code(400);
            echo json_encode(["error" => $result['error']]);
            return;
        }

        if (empty($result)) {
            http_response_code(400);
            echo json_encode(["error" => "No files were uploaded"]);
            return;
        }

        $db->beginTransaction();
        $createdDocs = [];
        $uploadedFiles = [];

        try {
            foreach ($result as $fileInfo) {
                $host = $_SERVER['HTTP_HOST'] ?? 'localhost:8000';
                $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
                $relativePath = is_array($fileInfo) ? ($fileInfo['relative_path'] ?? '') : $fileInfo;

                if (!is_array($fileInfo) || empty($relativePath)) {
                    throw new Exception("Invalid file info received from upload handler");
                }

                $docId = $documentModel->create(
                    $userId,
                    $fileInfo['file_name'] ?? '',
                    $fileInfo['original_name'] ?? '',
                    $fileInfo['relative_path'] ?? $relativePath,
                    $fileInfo['absolute_path'] ?? '',
                    'upload',
                    $fileInfo['mime_type'] ?? '',
                    $fileInfo['file_size'] ?? 0
                );

                if (!$docId) {
                    throw new Exception("Failed to create document record for: " . ($fileInfo['original_name'] ?? 'unknown'));
                }

                $createdDocs[] = [
                    'doc_id' => $docId,
                    'absolute_path' => $fileInfo['absolute_path'] ?? '',
                ];

                $uploadedFiles[] = [
                    'url' => $protocol . '://' . $host . $relativePath,
                    'path' => $relativePath,
                    'file_name' => $fileInfo['file_name'] ?? '',
                    'original_name' => $fileInfo['original_name'] ?? '',
                    'mime_type' => $fileInfo['mime_type'] ?? '',
                    'file_size' => $fileInfo['file_size'] ?? 0,
                    'absolute_path' => $fileInfo['absolute_path'] ?? '',
                    'document_id' => $docId,
                ];
            }

            $db->commit();

            echo json_encode(["files" => $uploadedFiles, "count" => count($uploadedFiles)]);
            return;

        } catch (Exception $e) {
            $db->rollBack();

            foreach ($createdDocs as $doc) {
                try {
                    $documentModel->delete($doc['doc_id']);
                } catch (Exception $cleanupErr) {
                    error_log("Failed to cleanup document record {$doc['doc_id']}: " . $cleanupErr->getMessage());
                }
            }

            foreach ($result as $fileInfo) {
                if (is_array($fileInfo) && !empty($fileInfo['absolute_path'])) {
                    $uploader->deleteFileByAbsolute($fileInfo['absolute_path']);
                }
            }

            error_log("Upload transaction failed: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(["error" => "Upload failed: " . $e->getMessage()]);
            return;
        }
    }

    if ($method === 'DELETE') {
        $data = json_decode(file_get_contents('php://input'), true);
        $filePath = $data['path'] ?? $data['url'] ?? '';
        $documentId = $data['document_id'] ?? null;

        if (!$filePath) {
            http_response_code(400);
            echo json_encode(["error" => "File path required"]);
            return;
        }

        // parse_url may fail on unencoded spaces, so encode first
        $encoded = str_replace(' ', '%20', $filePath);
        $parsed = parse_url($encoded);
        $path = isset($parsed['path']) ? rawurldecode($parsed['path']) : $filePath;

        $deleted = $uploader->deleteFile($path);

        if ($documentId) {
            $doc = $documentModel->findById($documentId);
            if ($doc) {
                if (!$deleted && !empty($doc['absolute_path'])) {
                    $uploader->deleteFileByAbsolute($doc['absolute_path']);
                }
                $documentModel->delete($documentId);
            }
        }

        if ($deleted) {
            echo json_encode(["message" => "File deleted successfully"]);
        } else {
            echo json_encode(["message" => "File removed"]);
        }
        return;
    }

    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}
