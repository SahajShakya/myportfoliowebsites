<?php
function handlePhotographyRoutes($method, $segments, $db) {
    require_once __DIR__ . '/../models/Photography.php';
    require_once __DIR__ . '/../models/Document.php';
    require_once __DIR__ . '/../middleware/auth.php';
    require_once __DIR__ . '/../middleware/upload.php';

    $model = new Photography($db);
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
        $userId = $authData['user_id'];

        $photoDocs = [];
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (strpos($contentType, 'multipart/form-data') !== false) {
            $data = $_POST;
            if (!empty($_FILES['photos'])) {
                $remappedFiles = ['files' => $_FILES['photos']];
                $uploaded = $uploader->handleUpload($remappedFiles, 'photography');
                $photoDocs = is_array($uploaded) ? $uploaded : [];
            }
            if (isset($data['photos'])) {
                $data['photos'] = json_decode($data['photos'], true);
            }
            if (isset($data['tags'])) {
                $data['tags'] = json_decode($data['tags'], true);
            }
        } else {
            $data = json_decode(file_get_contents('php://input'), true);
            $data['photos'] = $data['photos'] ?? [];
            $data['tags'] = $data['tags'] ?? [];
        }

        if (!empty($photoDocs)) {
            $photoItems = $data['photos'] ?? [];
            $mergedPhotos = [];
            $docIndex = 0;
            for ($i = 0; $i < count($photoItems); $i++) {
                $photo = $photoItems[$i];
                if (isset($photo['type']) && $photo['type'] === 'new' && $docIndex < count($photoDocs)) {
                    $doc = $photoDocs[$docIndex];
                    $docId = $documentModel->create(
                        $userId, $doc['file_name'], $doc['original_name'],
                        $doc['relative_path'], $doc['absolute_path'],
                        'photography_photo', $doc['mime_type'], $doc['file_size']
                    );
                    $mergedPhotos[] = [
                        'photo_url' => $doc['relative_path'],
                        'caption' => $photo['caption'] ?? '',
                        'display_order' => $photo['display_order'] ?? $i,
                        'document_id' => $docId,
                    ];
                    $docIndex++;
                } elseif (isset($photo['url'])) {
                    $mergedPhotos[] = [
                        'photo_url' => $photo['url'],
                        'caption' => $photo['caption'] ?? '',
                        'display_order' => $photo['display_order'] ?? $i,
                        'document_id' => $photo['document_id'] ?? null,
                    ];
                }
            }
            $data['photos'] = $mergedPhotos;
        }

        $newId = $model->create($data);
        echo json_encode(["message" => "Photography post created", "id" => $newId]);
        return;
    }

    if ($method === 'PUT' && $id) {
        $authData = $auth->authenticate();
        $userId = $authData['user_id'];

        $photoDocs = [];
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (strpos($contentType, 'multipart/form-data') !== false) {
            $data = $_POST;
            if (!empty($_FILES['photos'])) {
                $remappedFiles = ['files' => $_FILES['photos']];
                $uploaded = $uploader->handleUpload($remappedFiles, 'photography');
                $photoDocs = is_array($uploaded) ? $uploaded : [];
            }
            if (isset($data['photos'])) {
                $data['photos'] = json_decode($data['photos'], true);
            }
            if (isset($data['tags'])) {
                $data['tags'] = json_decode($data['tags'], true);
            }
        } else {
            $data = json_decode(file_get_contents('php://input'), true);
            $data['photos'] = $data['photos'] ?? [];
            $data['tags'] = $data['tags'] ?? [];
        }

        if (!empty($photoDocs)) {
            $photoItems = $data['photos'] ?? [];
            $mergedPhotos = [];
            $docIndex = 0;
            for ($i = 0; $i < count($photoItems); $i++) {
                $photo = $photoItems[$i];
                if (isset($photo['type']) && $photo['type'] === 'new' && $docIndex < count($photoDocs)) {
                    $doc = $photoDocs[$docIndex];
                    $docId = $documentModel->create(
                        $userId, $doc['file_name'], $doc['original_name'],
                        $doc['relative_path'], $doc['absolute_path'],
                        'photography_photo', $doc['mime_type'], $doc['file_size']
                    );
                    $mergedPhotos[] = [
                        'photo_url' => $doc['relative_path'],
                        'caption' => $photo['caption'] ?? '',
                        'display_order' => $photo['display_order'] ?? $i,
                        'document_id' => $docId,
                    ];
                    $docIndex++;
                } elseif (isset($photo['url'])) {
                    $mergedPhotos[] = [
                        'photo_url' => $photo['url'],
                        'caption' => $photo['caption'] ?? '',
                        'display_order' => $photo['display_order'] ?? $i,
                        'document_id' => $photo['document_id'] ?? null,
                    ];
                }
            }
            $data['photos'] = $mergedPhotos;
        }

        $model->update($id, $data);
        echo json_encode(["message" => "Photography post updated"]);
        return;
    }

    if ($method === 'DELETE' && $id) {
        $auth->authenticate();

        $result = $model->delete($id);

        if (!empty($result['photos'])) {
            foreach ($result['photos'] as $photo) {
                $docId = $photo['document_id'] ?? null;
                if ($docId) {
                    $doc = $documentModel->findById($docId);
                    if ($doc) {
                        $uploader->deleteFileByAbsolute($doc['absolute_path']);
                        $documentModel->delete($docId);
                    }
                } else {
                    $photoUrl = $photo['photo_url'] ?? null;
                    if ($photoUrl) {
                        $parsed = parse_url($photoUrl);
                        $path = $parsed['path'] ?? $photoUrl;
                        $uploader->deleteFile($path);
                    }
                }
            }
        }

        echo json_encode(["message" => "Photography post deleted"]);
        return;
    }

    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}