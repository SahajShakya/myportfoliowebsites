<?php
function handleJourneyRoutes($method, $segments, $db) {
    require_once __DIR__ . '/../models/Journey.php';
    require_once __DIR__ . '/../models/Document.php';
    require_once __DIR__ . '/../middleware/auth.php';
    require_once __DIR__ . '/../middleware/upload.php';
    require_once __DIR__ . '/../helpers/retrain_chatbot.php';

    $model = new Journey($db);
    $documentModel = new Document($db);
    $auth = new AuthMiddleware();
    $uploader = new UploadMiddleware();

    $id = $segments[1] ?? null;

    if ($method === 'GET' && !$id) {
        $items = $model->findAll();
        echo json_encode(["data" => $items]);
        return;
    }

    if ($method === 'GET' && $id) {
        $item = $model->findById($id);
        if (!$item) {
            http_response_code(404);
            echo json_encode(["error" => "Not found"]);
            return;
        }
        echo json_encode(["data" => $item]);
        return;
    }

    if ($method === 'POST') {
        $authData = $auth->authenticate();

        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (strpos($contentType, 'multipart/form-data') !== false) {
            $data = $_POST;
            $data['icons'] = json_decode($data['icons'] ?? '[]', true);
            $data['contentItems'] = json_decode($data['contentItems'] ?? '[]', true);
            $data['contentDocumentIds'] = json_decode($data['contentDocumentIds'] ?? '[]', true);
            $data['links'] = json_decode($data['links'] ?? '[]', true);
            $data['promotions'] = json_decode($data['promotions'] ?? '[]', true);
            $data['backgroundDocumentId'] = $data['backgroundDocumentId'] ?? null;
        } else {
            $data = json_decode(file_get_contents('php://input'), true);
            $data['icons'] = $data['icons'] ?? [];
            $data['contentItems'] = $data['contentItems'] ?? [];
            $data['contentDocumentIds'] = $data['contentDocumentIds'] ?? [];
            $data['links'] = $data['links'] ?? [];
            $data['promotions'] = $data['promotions'] ?? [];
            $data['backgroundDocumentId'] = $data['backgroundDocumentId'] ?? null;
        }

        try {
            $newId = $model->create($data);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Failed to create journey: " . $e->getMessage()]);
            return;
        }
        retrainChatbot($db, 'journey');
        echo json_encode(["message" => "Journey created", "id" => $newId]);
        return;
    }

    if ($method === 'PUT' && $id) {
        $authData = $auth->authenticate();

        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (strpos($contentType, 'multipart/form-data') !== false) {
            $data = $_POST;
            $data['icons'] = json_decode($data['icons'] ?? '[]', true);
            $data['contentItems'] = json_decode($data['contentItems'] ?? '[]', true);
            $data['contentDocumentIds'] = json_decode($data['contentDocumentIds'] ?? '[]', true);
            $data['links'] = json_decode($data['links'] ?? '[]', true);
            $data['promotions'] = json_decode($data['promotions'] ?? '[]', true);
            $data['backgroundDocumentId'] = $data['backgroundDocumentId'] ?? null;
        } else {
            $data = json_decode(file_get_contents('php://input'), true);
            $data['icons'] = $data['icons'] ?? [];
            $data['contentItems'] = $data['contentItems'] ?? [];
            $data['contentDocumentIds'] = $data['contentDocumentIds'] ?? [];
            $data['links'] = $data['links'] ?? [];
            $data['promotions'] = $data['promotions'] ?? [];
            $data['backgroundDocumentId'] = $data['backgroundDocumentId'] ?? null;
        }

        try {
            $model->update($id, $data);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Failed to update journey: " . $e->getMessage()]);
            return;
        }
        retrainChatbot($db, 'journey');
        echo json_encode(["message" => "Journey updated"]);
        return;
    }

    if ($method === 'DELETE' && $id) {
        $auth->authenticate();

        $result = $model->delete($id);

        if (!empty($result['icons'])) {
            foreach ($result['icons'] as $icon) {
                $docId = $icon['document_id'] ?? null;
                if ($docId) {
                    $doc = $documentModel->findById($docId);
                    if ($doc) {
                        $uploader->deleteFileByAbsolute($doc['absolute_path']);
                        $documentModel->delete($docId);
                    }
                } else {
                    $iconUrl = $icon['icon_url'] ?? null;
                    if ($iconUrl) {
                        $parsed = parse_url($iconUrl);
                        $path = $parsed['path'] ?? $iconUrl;
                        $uploader->deleteFile($path);
                    }
                }
            }
        }
        if (!empty($result['contents'])) {
            foreach ($result['contents'] as $item) {
                $docId = $item['document_id'] ?? null;
                if ($docId) {
                    $doc = $documentModel->findById($docId);
                    if ($doc) {
                        $uploader->deleteFileByAbsolute($doc['absolute_path']);
                        $documentModel->delete($docId);
                    }
                }
            }
        }

        retrainChatbot($db, 'journey');
        echo json_encode(["message" => "Journey deleted"]);
        return;
    }

    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}
