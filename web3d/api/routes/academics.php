<?php
function handleAcademicsRoutes($method, $segments, $db) {
    require_once __DIR__ . '/../models/Academics.php';
    require_once __DIR__ . '/../models/Document.php';
    require_once __DIR__ . '/../middleware/auth.php';
    require_once __DIR__ . '/../middleware/upload.php';

    $model = new Academics($db);
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

        $iconDocs = [];
        $contentDocs = [];
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (strpos($contentType, 'multipart/form-data') !== false) {
            $data = $_POST;
            if (!empty($_FILES['files'])) {
                $uploaded = $uploader->handleUpload($_FILES, 'academics');
                $iconDocs = is_array($uploaded) ? $uploaded : [];
                $data['icons'] = $iconDocs;
            } else {
                $data['icons'] = json_decode($data['icons'] ?? '[]', true);
            }
            if (!empty($_FILES['content_files'])) {
                $contentUploaded = $uploader->handleUpload($_FILES, 'academics');
                $contentDocs = is_array($contentUploaded) ? $contentUploaded : [];
            }
            if (isset($data['contentItems'])) {
                $data['contentItems'] = json_decode($data['contentItems'], true);
            }
        } else {
            $data = json_decode(file_get_contents('php://input'), true);
            $data['icons'] = $data['icons'] ?? [];
            $data['contentItems'] = $data['contentItems'] ?? [];
        }

        $docIds = [];
        foreach ($iconDocs as $fileInfo) {
            $docId = $documentModel->create(
                $userId, $fileInfo['file_name'], $fileInfo['original_name'],
                $fileInfo['relative_path'], $fileInfo['absolute_path'],
                'academic_icon', $fileInfo['mime_type'], $fileInfo['file_size']
            );
            $docIds[] = $docId;
        }
        $data['document_ids'] = $docIds;

        $contentDocIds = [];
        foreach ($contentDocs as $fileInfo) {
            $docId = $documentModel->create(
                $userId, $fileInfo['file_name'], $fileInfo['original_name'],
                $fileInfo['relative_path'], $fileInfo['absolute_path'],
                'academic_content', $fileInfo['mime_type'], $fileInfo['file_size']
            );
            $contentDocIds[] = $docId;
        }
        $data['content_document_ids'] = $contentDocIds;

        $acadId = $model->create($data);
        echo json_encode(["message" => "Academic created", "id" => $acadId]);
        return;
    }

    if ($method === 'PUT' && $id) {
        $authData = $auth->authenticate();
        $userId = $authData['user_id'];

        $iconDocs = [];
        $contentDocs = [];
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (strpos($contentType, 'multipart/form-data') !== false) {
            $data = $_POST;
            if (!empty($_FILES['files'])) {
                $uploaded = $uploader->handleUpload($_FILES, 'academics');
                $iconDocs = is_array($uploaded) ? $uploaded : [];
                $data['icons'] = $iconDocs;
            } else {
                $data['icons'] = json_decode($data['icons'] ?? '[]', true);
            }
            if (!empty($_FILES['content_files'])) {
                $contentUploaded = $uploader->handleUpload($_FILES, 'academics');
                $contentDocs = is_array($contentUploaded) ? $contentUploaded : [];
            }
            if (isset($data['contentItems'])) {
                $data['contentItems'] = json_decode($data['contentItems'], true);
            }
        } else {
            $data = json_decode(file_get_contents('php://input'), true);
            $data['icons'] = $data['icons'] ?? [];
            $data['contentItems'] = $data['contentItems'] ?? [];
        }

        $docIds = [];
        foreach ($iconDocs as $fileInfo) {
            $docId = $documentModel->create(
                $userId, $fileInfo['file_name'], $fileInfo['original_name'],
                $fileInfo['relative_path'], $fileInfo['absolute_path'],
                'academic_icon', $fileInfo['mime_type'], $fileInfo['file_size']
            );
            $docIds[] = $docId;
        }
        $data['document_ids'] = $docIds;

        $contentDocIds = [];
        foreach ($contentDocs as $fileInfo) {
            $docId = $documentModel->create(
                $userId, $fileInfo['file_name'], $fileInfo['original_name'],
                $fileInfo['relative_path'], $fileInfo['absolute_path'],
                'academic_content', $fileInfo['mime_type'], $fileInfo['file_size']
            );
            $contentDocIds[] = $docId;
        }
        $data['content_document_ids'] = $contentDocIds;

        $model->update($id, $data);
        echo json_encode(["message" => "Academic updated"]);
        return;
    }

    if ($method === 'DELETE' && $id) {
        $auth->authenticate();

        $result = $model->delete($id);

        require_once __DIR__ . '/Document.php';
        $docModel = new Document($db);

        if (!empty($result['icons'])) {
            foreach ($result['icons'] as $icon) {
                $docId = $icon['document_id'] ?? null;
                if ($docId) {
                    $doc = $docModel->findById($docId);
                    if ($doc) {
                        $uploader->deleteFileByAbsolute($doc['absolute_path']);
                        $docModel->delete($docId);
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
                    $doc = $docModel->findById($docId);
                    if ($doc) {
                        $uploader->deleteFileByAbsolute($doc['absolute_path']);
                        $docModel->delete($docId);
                    }
                }
            }
        }

        echo json_encode(["message" => "Academic deleted"]);
        return;
    }

    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}
