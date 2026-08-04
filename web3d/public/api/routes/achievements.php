<?php
function handleAchievementsRoutes($method, $segments, $db) {
    require_once __DIR__ . '/../models/Achievement.php';
    require_once __DIR__ . '/../models/Document.php';
    require_once __DIR__ . '/../middleware/auth.php';
    require_once __DIR__ . '/../middleware/upload.php';
    require_once __DIR__ . '/../helpers/retrain_chatbot.php';

    $model = new Achievement($db);
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
            $data['backgroundDocumentId'] = $data['backgroundDocumentId'] ?? null;
            if (isset($data['tags']) && is_string($data['tags'])) {
                $data['tags'] = array_filter(explode(',', $data['tags']));
            }
        } else {
            $data = json_decode(file_get_contents('php://input'), true);
            $data['icons'] = $data['icons'] ?? [];
            $data['contentItems'] = $data['contentItems'] ?? [];
            $data['contentDocumentIds'] = $data['contentDocumentIds'] ?? [];
            $data['backgroundDocumentId'] = $data['backgroundDocumentId'] ?? null;
        }

        $data['icon_document_id'] = $data['icon_document_id'] ?? ($data['icons'][0]['document_id'] ?? null);

        try {
            $achievementId = $model->create($data);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Failed to create achievement: " . $e->getMessage()]);
            return;
        }
        retrainChatbot($db, 'achievements');
        echo json_encode(["message" => "Achievement created", "id" => $achievementId]);
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
            $data['backgroundDocumentId'] = $data['backgroundDocumentId'] ?? null;
            if (isset($data['tags']) && is_string($data['tags'])) {
                $data['tags'] = array_filter(explode(',', $data['tags']));
            }
        } else {
            $data = json_decode(file_get_contents('php://input'), true);
            $data['icons'] = $data['icons'] ?? [];
            $data['contentItems'] = $data['contentItems'] ?? [];
            $data['contentDocumentIds'] = $data['contentDocumentIds'] ?? [];
            $data['backgroundDocumentId'] = $data['backgroundDocumentId'] ?? null;
        }

        $data['icon_document_id'] = $data['icon_document_id'] ?? ($data['icons'][0]['document_id'] ?? null);

        try {
            $model->update($id, $data);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Failed to update achievement: " . $e->getMessage()]);
            return;
        }
        retrainChatbot($db, 'achievements');
        echo json_encode(["message" => "Achievement updated"]);
        return;
    }

    if ($method === 'DELETE' && $id) {
        $auth->authenticate();

        $db->beginTransaction();

        try {
            $result = $model->deleteWithinTransaction($id);

            if (!empty($result['icons'])) {
                foreach ($result['icons'] as $icon) {
                    $docId = $icon['document_id'] ?? null;
                    if ($docId) {
                        $doc = $documentModel->findById($docId);
                        if ($doc) {
                            $uploader->deleteFileByAbsolute($doc['absolute_path']);
                            $documentModel->delete($docId);
                        }
                    }
                }
            }

            $bgDocId = $result['background_document_id'] ?? null;
            if ($bgDocId) {
                $doc = $documentModel->findById($bgDocId);
                if ($doc) {
                    $uploader->deleteFileByAbsolute($doc['absolute_path']);
                    $documentModel->delete($bgDocId);
                }
            }

            if (!empty($result['contents'])) {
                $cleanedDocIds = [];
                foreach ($result['contents'] as $item) {
                    $imageUrlData = json_decode($item['image_url'] ?? '[]', true);
                    if (is_array($imageUrlData)) {
                        foreach ($imageUrlData as $img) {
                            if (is_array($img) && !empty($img['document_id'])) {
                                $cleanedDocIds[] = $img['document_id'];
                            }
                        }
                    }
                }
                $cleanedDocIds = array_unique(array_filter($cleanedDocIds));
                foreach ($cleanedDocIds as $docId) {
                    $doc = $documentModel->findById($docId);
                    if ($doc) {
                        $uploader->deleteFileByAbsolute($doc['absolute_path']);
                        $documentModel->delete($docId);
                    }
                }
            }

            $db->commit();

            retrainChatbot($db, 'achievements');
            echo json_encode(["message" => "Achievement deleted"]);
            return;

        } catch (Exception $e) {
            $db->rollBack();
            error_log("Achievement delete transaction failed for id $id: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(["error" => "Failed to delete achievement: " . $e->getMessage()]);
            return;
        }
    }

    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}
