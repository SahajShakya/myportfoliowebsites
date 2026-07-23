<?php
require_once __DIR__ . '/../helpers/uuid.php';

class Journey {
    private $conn;
    private $table = 'journey';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function findAll() {
        $stmt = $this->conn->prepare(
            "SELECT j.*, 
                    bg_doc.relative_path AS background_image_url,
                    icon_doc.relative_path AS icon_url
             FROM {$this->table} j
             LEFT JOIN documents bg_doc ON j.background_document_id = bg_doc.id
             LEFT JOIN documents icon_doc ON j.document_id = icon_doc.id
             ORDER BY j.start_date ASC"
        );
        $stmt->execute();
        $items = $stmt->fetchAll();

        foreach ($items as &$item) {
            $item['icons'] = $this->buildIconData($item);
            $item['contents'] = $this->getContents($item['id']);
        }
        return $items;
    }

    public function findById($id) {
        $stmt = $this->conn->prepare(
            "SELECT j.*, 
                    bg_doc.relative_path AS background_image_url,
                    icon_doc.relative_path AS icon_url
             FROM {$this->table} j
             LEFT JOIN documents bg_doc ON j.background_document_id = bg_doc.id
             LEFT JOIN documents icon_doc ON j.document_id = icon_doc.id
             WHERE j.id = ?"
        );
        $stmt->execute([$id]);
        $item = $stmt->fetch();

        if ($item) {
            $item['icons'] = $this->buildIconData($item);
            $item['contents'] = $this->getContents($item['id']);
        }
        return $item;
    }

    public function create($data) {
        $this->conn->beginTransaction();
        try {
            $id = generateUUID();

            $stmt = $this->conn->prepare(
                "INSERT INTO {$this->table} (id, title, office_name, designation, start_date, end_date, description, contents, url_of_company, background_document_id, document_id, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())"
            );
            $stmt->execute([
                $id,
                $data['title'], $data['office_name'], $data['designation'],
                $data['startDate'], $data['endDate'] ?? null,
                $data['description'] ?? null, $data['contents'] ?? null,
                $data['urlofCompany'] ?? null,
                $data['backgroundDocumentId'] ?? null,
                $data['document_id'] ?? null
            ]);

            if (!empty($data['contentItems'])) {
                $this->insertContents($id, $data['contentItems'], $data['contentDocumentIds'] ?? []);
            }

            $this->conn->commit();
            return $id;
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    public function update($id, $data) {
        $this->conn->beginTransaction();
        try {
            $oldRecord = $this->findById($id);
            $oldBgDocId = $oldRecord['background_document_id'] ?? null;
            $oldIconDocId = $oldRecord['document_id'] ?? null;

            $stmt = $this->conn->prepare(
                "UPDATE {$this->table} SET title = ?, office_name = ?, designation = ?, 
                 start_date = ?, end_date = ?, description = ?, contents = ?, url_of_company = ?, background_document_id = ?, document_id = ?, updated_at = NOW() WHERE id = ?"
            );
            $stmt->execute([
                $data['title'], $data['office_name'], $data['designation'],
                $data['startDate'], $data['endDate'] ?? null,
                $data['description'] ?? null, $data['contents'] ?? null,
                $data['urlofCompany'] ?? null,
                $data['backgroundDocumentId'] ?? null,
                $data['document_id'] ?? null, $id
            ]);

            require_once __DIR__ . '/Document.php';
            $docModel = new Document($this->conn);
            require_once __DIR__ . '/../middleware/upload.php';
            $uploader = new UploadMiddleware();

            if ($oldBgDocId && $oldBgDocId !== ($data['backgroundDocumentId'] ?? null)) {
                $doc = $docModel->findById($oldBgDocId);
                if ($doc) {
                    $uploader->deleteFileByAbsolute($doc['absolute_path']);
                    $docModel->delete($oldBgDocId);
                }
            }

            if ($oldIconDocId && $oldIconDocId !== ($data['document_id'] ?? null)) {
                $doc = $docModel->findById($oldIconDocId);
                if ($doc) {
                    $uploader->deleteFileByAbsolute($doc['absolute_path']);
                    $docModel->delete($oldIconDocId);
                }
            }

            if (isset($data['contentItems'])) {
                $oldContents = $this->getContents($id);
                $this->deleteContents($id);
                $this->insertContents($id, $data['contentItems'], $data['contentDocumentIds'] ?? []);

                foreach ($oldContents as $oldItem) {
                    $docId = $oldItem['document_id'] ?? null;
                    if ($docId) {
                        $doc = $docModel->findById($docId);
                        if ($doc) {
                            $uploader->deleteFileByAbsolute($doc['absolute_path']);
                            $docModel->delete($docId);
                        }
                    }
                }
            }

            $this->conn->commit();
            return true;
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    public function delete($id) {
        $this->conn->beginTransaction();
        try {
            $contents = $this->getContents($id);
            $this->deleteContents($id);

            $stmt = $this->conn->prepare("DELETE FROM {$this->table} WHERE id = ?");
            $stmt->execute([$id]);

            $this->conn->commit();
            return ['contents' => $contents];
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    private function buildIconData($item) {
        $docId = $item['document_id'] ?? null;
        $iconUrl = $item['icon_url'] ?? null;
        if (!$docId || !$iconUrl) {
            return [];
        }
        return [
            [
                'id' => $docId,
                'icon_url' => $iconUrl,
                'document_id' => $docId,
            ]
        ];
    }

    private function getContents($journeyId) {
        $stmt = $this->conn->prepare(
            "SELECT ec.id, ec.heading, ec.content_text, ec.image_url, ec.image_description, ec.document_id, ec.image_ids, ec.display_order
             FROM entity_contents ec 
             WHERE ec.entity_type = 'journey' AND ec.entity_id = ? 
             ORDER BY ec.display_order ASC"
        );
        $stmt->execute([$journeyId]);
        $contents = $stmt->fetchAll();

        return array_map(function ($item) {
            $images = [];

            if (!empty($item['image_ids'])) {
                $ids = json_decode($item['image_ids'], true);
                if (is_array($ids) && count($ids) > 0) {
                    $placeholders = implode(',', array_fill(0, count($ids), '?'));
                    $docStmt = $this->conn->prepare(
                        "SELECT id, relative_path FROM documents WHERE id IN ($placeholders)"
                    );
                    $docStmt->execute($ids);
                    $docs = $docStmt->fetchAll(PDO::FETCH_KEY_PAIR);

                    $titles = [];
                    if (!empty($item['image_url'])) {
                        $parsed = json_decode($item['image_url'], true);
                        if (is_array($parsed)) {
                            foreach ($parsed as $entry) {
                                $titles[] = is_array($entry) ? ($entry['title'] ?? '') : '';
                            }
                        }
                    }

                    foreach ($ids as $idx => $docId) {
                        if (isset($docs[$docId])) {
                            $images[] = [
                                'url' => $docs[$docId]['relative_path'],
                                'title' => $titles[$idx] ?? '',
                                'document_id' => $docId,
                            ];
                        }
                    }
                }
            }

            if (empty($images) && !empty($item['image_url'])) {
                $parsed = json_decode($item['image_url'], true);
                if (is_array($parsed)) {
                    $images = array_map(function ($entry) {
                        return [
                            'url' => is_array($entry) ? ($entry['url'] ?? '') : $entry,
                            'title' => is_array($entry) ? ($entry['title'] ?? '') : '',
                            'document_id' => is_array($entry) ? ($entry['document_id'] ?? null) : null,
                        ];
                    }, $parsed);
                } else {
                    $images[] = [
                        'url' => $item['image_url'],
                        'title' => $item['image_description'] ?? '',
                        'document_id' => $item['document_id'] ?? null,
                    ];
                }
            }

            return [
                'id' => $item['id'],
                'heading' => $item['heading'] ?? '',
                'content_text' => $item['content_text'],
                'image_url' => json_encode($images),
                'image_description' => $item['image_description'],
                'document_id' => $item['document_id'],
                'display_order' => $item['display_order'],
            ];
        }, $contents);
    }

    private function insertContents($journeyId, $contentItems, $documentIds = []) {
        $stmt = $this->conn->prepare(
            "INSERT INTO entity_contents (id, entity_type, entity_id, heading, content_text, image_url, image_description, document_id, image_ids, display_order) VALUES (?, 'journey', ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        foreach ($contentItems as $index => $item) {
            $imgUrl = '';
            if (isset($item['image_url'])) {
                if (is_string($item['image_url']) && ($item['image_url'][0] ?? '') === '[') {
                    $imgUrl = $item['image_url'];
                } elseif (is_array($item['image_url'])) {
                    $imgUrl = json_encode($item['image_url']);
                } else {
                    $imgUrl = $item['image_url'];
                }
            }
            $sectionDocIds = $documentIds[$index] ?? [];
            $docId = is_array($sectionDocIds) ? ($sectionDocIds[0] ?? null) : $sectionDocIds;
            $imageIdsJson = is_array($sectionDocIds) ? json_encode(array_filter($sectionDocIds)) : null;
            $stmt->execute([
                generateUUID(),
                $journeyId,
                $item['heading'] ?? '',
                $item['content_text'] ?? '',
                $imgUrl,
                $item['image_description'] ?? '',
                $docId,
                $imageIdsJson,
                $item['display_order'] ?? $index,
            ]);
        }
    }

    private function deleteContents($journeyId) {
        $stmt = $this->conn->prepare("DELETE FROM entity_contents WHERE entity_type = 'journey' AND entity_id = ?");
        $stmt->execute([$journeyId]);
    }
}
