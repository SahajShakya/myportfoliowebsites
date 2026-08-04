<?php
function handleTestimonialsRoutes($method, $segments, $db) {
    require_once __DIR__ . '/../models/Testimonial.php';
    require_once __DIR__ . '/../models/Document.php';
    require_once __DIR__ . '/../middleware/auth.php';
    require_once __DIR__ . '/../middleware/upload.php';

    $model = new Testimonial($db);
    $auth = new AuthMiddleware();
    $uploader = new UploadMiddleware();
    $documentModel = new Document($db);

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

    $uploadImage = function ($userId) use ($uploader, $documentModel) {
        if (empty($_FILES['image'])) {
            return null;
        }
        $_FILES['files'] = [
            'name' => [$_FILES['image']['name']],
            'type' => [$_FILES['image']['type']],
            'tmp_name' => [$_FILES['image']['tmp_name']],
            'error' => [$_FILES['image']['error']],
            'size' => [$_FILES['image']['size']],
        ];
        $result = $uploader->handleUpload($_FILES, 'testimonials');
        if (isset($result['error'])) {
            return ['error' => $result['error']];
        }
        if (empty($result)) {
            return ['error' => 'No files were uploaded'];
        }
        $fileInfo = $result[0];
        $docId = $documentModel->create(
            $userId,
            $fileInfo['file_name'] ?? '',
            $fileInfo['original_name'] ?? '',
            $fileInfo['relative_path'] ?? '',
            $fileInfo['absolute_path'] ?? '',
            'upload',
            $fileInfo['mime_type'] ?? '',
            $fileInfo['file_size'] ?? 0
        );
        return ['document_id' => $docId];
    };

    $deleteDocument = function ($docId) use ($uploader, $documentModel) {
        if (!$docId) {
            return;
        }
        $doc = $documentModel->findById($docId);
        if ($doc) {
            $uploader->deleteFileByAbsolute($doc['absolute_path']);
            $documentModel->delete($docId);
        }
    };

    if ($method === 'POST') {
        $authData = $auth->authenticate();
        $userId = $authData['user_id'] ?? null;

        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        $data = strpos($contentType, 'multipart/form-data') !== false
            ? $_POST
            : json_decode(file_get_contents('php://input'), true);

        if (strpos($contentType, 'multipart/form-data') !== false) {
            $upload = $uploadImage($userId);
            if (isset($upload['error'])) {
                http_response_code(400);
                echo json_encode(["error" => $upload['error']]);
                return;
            }
            if (!empty($upload['document_id'])) {
                $data['image_id'] = $upload['document_id'];
            }
        }

        $newId = $model->create($data);
        echo json_encode(["message" => "Testimonial created", "id" => $newId]);
        return;
    }

    if ($method === 'PUT' && $id) {
        $authData = $auth->authenticate();
        $userId = $authData['user_id'] ?? null;

        $current = $model->findById($id);
        $oldImageId = $current['image_id'] ?? null;

        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        $data = strpos($contentType, 'multipart/form-data') !== false
            ? $_POST
            : json_decode(file_get_contents('php://input'), true);

        if (strpos($contentType, 'multipart/form-data') !== false) {
            $upload = $uploadImage($userId);
            if (isset($upload['error'])) {
                http_response_code(400);
                echo json_encode(["error" => $upload['error']]);
                return;
            }
            if (!empty($upload['document_id'])) {
                $data['image_id'] = $upload['document_id'];
            }
        }

        if (!array_key_exists('image_id', $data)) {
            $data['image_id'] = $oldImageId;
        }

        $model->update($id, $data);

        if ($data['image_id'] !== $oldImageId) {
            $deleteDocument($oldImageId);
        }

        echo json_encode(["message" => "Testimonial updated"]);
        return;
    }

    if ($method === 'DELETE' && $id) {
        $auth->authenticate();
        $result = $model->delete($id);
        $deleteDocument($result['image_id'] ?? null);
        echo json_encode(["message" => "Testimonial deleted"]);
        return;
    }

    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}
