<?php
function handleProjectsRoutes($method, $segments, $db) {
    require_once __DIR__ . '/../models/Project.php';
    require_once __DIR__ . '/../models/Document.php';
    require_once __DIR__ . '/../middleware/auth.php';
    require_once __DIR__ . '/../middleware/upload.php';

    $model = new Project($db);
    $documentModel = new Document($db);
    $auth = new AuthMiddleware();
    $uploader = new UploadMiddleware();

    $id = $segments[1] ?? null;
    $sub = $segments[2] ?? null;

    if ($method === 'GET' && !$id) {
        $items = $model->findAll();
        echo json_encode(["data" => $items]);
        return;
    }

    if ($method === 'GET' && $id && $sub === 'details') {
        $details = $model->findDetails($id);
        echo json_encode(["data" => $details]);
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

        $iconDocId = null;
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (strpos($contentType, 'multipart/form-data') !== false) {
            $data = $_POST;
            if (!empty($_FILES['files'])) {
                $uploaded = $uploader->handleUpload($_FILES, 'projects');
                if (!empty($uploaded)) {
                    $fileInfo = $uploaded[0];
                    $iconDocId = $documentModel->create(
                        $userId, $fileInfo['file_name'], $fileInfo['original_name'],
                        $fileInfo['relative_path'], $fileInfo['absolute_path'],
                        'project_icon', $fileInfo['mime_type'], $fileInfo['file_size']
                    );
                    $data['icons'] = $fileInfo['relative_path'];
                    $data['document_id'] = $iconDocId;
                }
            }
            if (isset($data['tags']) && is_string($data['tags'])) {
                $data['tags'] = array_filter(explode(',', $data['tags']));
            }
            if (isset($data['details']) && is_string($data['details'])) {
                $data['details'] = json_decode($data['details'], true);
            }
        } else {
            $data = json_decode(file_get_contents('php://input'), true);
        }

        if (!empty($_FILES['detail_files'])) {
            $detailUploaded = $uploader->handleUpload($_FILES, 'projects');
            $detailFiles = is_array($detailUploaded) ? $detailUploaded : [];
        } else {
            $detailFiles = [];
        }

        $projectId = $model->create($data);

        if (!empty($data['details']) && is_array($data['details'])) {
            foreach ($data['details'] as $idx => $detail) {
                $detailDocId = null;
                if (isset($detailFiles[$idx])) {
                    $fi = $detailFiles[$idx];
                    $detailDocId = $documentModel->create(
                        $userId, $fi['file_name'], $fi['original_name'],
                        $fi['relative_path'], $fi['absolute_path'],
                        'project_detail', $fi['mime_type'], $fi['file_size']
                    );
                    $detail['image_url'] = $fi['relative_path'];
                    $detail['document_id'] = $detailDocId;
                }
                $model->createDetail($projectId, $detail);
            }
        }

        echo json_encode(["message" => "Project created", "id" => $projectId]);
        return;
    }

    if ($method === 'PUT' && $id) {
        $authData = $auth->authenticate();
        $userId = $authData['user_id'];

        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (strpos($contentType, 'multipart/form-data') !== false) {
            $data = $_POST;
            if (!empty($_FILES['files'])) {
                $uploaded = $uploader->handleUpload($_FILES, 'projects');
                if (!empty($uploaded)) {
                    $fileInfo = $uploaded[0];
                    $iconDocId = $documentModel->create(
                        $userId, $fileInfo['file_name'], $fileInfo['original_name'],
                        $fileInfo['relative_path'], $fileInfo['absolute_path'],
                        'project_icon', $fileInfo['mime_type'], $fileInfo['file_size']
                    );
                    $data['icons'] = $fileInfo['relative_path'];
                    $data['document_id'] = $iconDocId;
                }
            }
            if (isset($data['tags']) && is_string($data['tags'])) {
                $data['tags'] = array_filter(explode(',', $data['tags']));
            }
            if (isset($data['details']) && is_string($data['details'])) {
                $data['details'] = json_decode($data['details'], true);
            }
        } else {
            $data = json_decode(file_get_contents('php://input'), true);
        }

        if (!empty($_FILES['detail_files'])) {
            $detailUploaded = $uploader->handleUpload($_FILES, 'projects');
            $detailFiles = is_array($detailUploaded) ? $detailUploaded : [];
        } else {
            $detailFiles = [];
        }

        if (!empty($data['details']) && is_array($data['details'])) {
            foreach ($data['details'] as $idx => $detail) {
                if (isset($detailFiles[$idx])) {
                    $fi = $detailFiles[$idx];
                    $detailDocId = $documentModel->create(
                        $userId, $fi['file_name'], $fi['original_name'],
                        $fi['relative_path'], $fi['absolute_path'],
                        'project_detail', $fi['mime_type'], $fi['file_size']
                    );
                    $detail['image_url'] = $fi['relative_path'];
                    $detail['document_id'] = $detailDocId;
                }
            }
        }

        $model->update($id, $data);
        echo json_encode(["message" => "Project updated"]);
        return;
    }

    if ($method === 'DELETE' && $id) {
        $auth->authenticate();

        require_once __DIR__ . '/Document.php';
        $docModel = new Document($db);

        $result = $model->delete($id);

        if (!empty($result['details'])) {
            foreach ($result['details'] as $detail) {
                $docId = $detail['document_id'] ?? null;
                if ($docId) {
                    $doc = $docModel->findById($docId);
                    if ($doc) {
                        $uploader->deleteFileByAbsolute($doc['absolute_path']);
                        $docModel->delete($docId);
                    }
                }
            }
        }

        echo json_encode(["message" => "Project deleted"]);
        return;
    }

    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}
