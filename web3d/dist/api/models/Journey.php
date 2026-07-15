<?php
class Journey {
    private $conn;
    private $table = 'journey';
    private $iconsTable = 'journey_icons';
    private $contentsTable = 'journey_contents';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function findAll() {
        $stmt = $this->conn->prepare("SELECT * FROM {$this->table} ORDER BY start_date ASC");
        $stmt->execute();
        $items = $stmt->fetchAll();

        foreach ($items as &$item) {
            $item['icons'] = $this->getIcons($item['id']);
            $item['contents'] = $this->getContents($item['id']);
        }
        return $items;
    }

    public function findById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        $item = $stmt->fetch();

        if ($item) {
            $item['icons'] = $this->getIcons($item['id']);
            $item['contents'] = $this->getContents($item['id']);
        }
        return $item;
    }

    public function create($data) {
        $this->conn->beginTransaction();
        try {
            $stmt = $this->conn->prepare(
                "INSERT INTO {$this->table} (title, office_name, designation, start_date, end_date, description, contents, url_of_company, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())"
            );
            $stmt->execute([
                $data['title'], $data['office_name'], $data['designation'],
                $data['startDate'], $data['endDate'] ?? null,
                $data['description'] ?? null, $data['contents'] ?? null,
                $data['urlofCompany']
            ]);
            $id = $this->conn->lastInsertId();

            if (!empty($data['icons'])) {
                $this->insertIcons($id, $data['icons'], $data['document_ids'] ?? []);
            }
            if (!empty($data['contentItems'])) {
                $this->insertContents($id, $data['contentItems'], $data['content_document_ids'] ?? []);
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
            $stmt = $this->conn->prepare(
                "UPDATE {$this->table} SET title = ?, office_name = ?, designation = ?, 
                 start_date = ?, end_date = ?, description = ?, contents = ?, url_of_company = ?, updated_at = NOW() WHERE id = ?"
            );
            $stmt->execute([
                $data['title'], $data['office_name'], $data['designation'],
                $data['startDate'], $data['endDate'] ?? null,
                $data['description'] ?? null, $data['contents'] ?? null,
                $data['urlofCompany'], $id
            ]);

            if (isset($data['icons'])) {
                $oldIcons = $this->getIcons($id);
                $this->deleteIcons($id);
                $this->insertIcons($id, $data['icons'], $data['document_ids'] ?? []);

                require_once __DIR__ . '/Document.php';
                $docModel = new Document($this->conn);
                require_once __DIR__ . '/../middleware/upload.php';
                $uploader = new UploadMiddleware();
                foreach ($oldIcons as $oldIcon) {
                    $docId = $oldIcon['document_id'] ?? null;
                    if ($docId) {
                        $doc = $docModel->findById($docId);
                        if ($doc) {
                            $uploader->deleteFileByAbsolute($doc['absolute_path']);
                            $docModel->delete($docId);
                        }
                    }
                }
            }

            if (isset($data['contentItems'])) {
                $oldContents = $this->getContents($id);
                $this->deleteContents($id);
                $this->insertContents($id, $data['contentItems'], $data['content_document_ids'] ?? []);

                require_once __DIR__ . '/Document.php';
                $docModel = new Document($this->conn);
                require_once __DIR__ . '/../middleware/upload.php';
                $uploader = new UploadMiddleware();
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
            $icons = $this->getIcons($id);
            $contents = $this->getContents($id);
            $this->deleteIcons($id);
            $this->deleteContents($id);

            $stmt = $this->conn->prepare("DELETE FROM {$this->table} WHERE id = ?");
            $stmt->execute([$id]);

            $this->conn->commit();
            return ['icons' => $icons, 'contents' => $contents];
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    private function getIcons($journeyId) {
        $stmt = $this->conn->prepare(
            "SELECT ji.id, ji.icon_url, ji.document_id,
                    d.relative_path, d.absolute_path, d.file_name, d.original_name, d.mime_type
             FROM {$this->iconsTable} ji 
             LEFT JOIN documents d ON ji.document_id = d.id 
             WHERE ji.journey_id = ?"
        );
        $stmt->execute([$journeyId]);
        $icons = $stmt->fetchAll();

        return array_map(function ($icon) {
            $url = $icon['relative_path'] ?? $icon['icon_url'] ?? '';
            return [
                'id' => $icon['id'],
                'icon_url' => $url,
                'document_id' => $icon['document_id'],
            ];
        }, $icons);
    }

    private function insertIcons($journeyId, $icons, $documentIds = []) {
        $stmt = $this->conn->prepare(
            "INSERT INTO {$this->iconsTable} (journey_id, icon_url, document_id) VALUES (?, ?, ?)"
        );
        foreach ($icons as $index => $icon) {
            $url = is_array($icon) ? ($icon['path'] ?? $icon['url'] ?? $icon['relative_path'] ?? $icon['icon_url'] ?? '') : $icon;
            $docId = $documentIds[$index] ?? null;
            if ($url) {
                $stmt->execute([$journeyId, $url, $docId]);
            }
        }
    }

    private function deleteIcons($journeyId) {
        $stmt = $this->conn->prepare("DELETE FROM {$this->iconsTable} WHERE journey_id = ?");
        $stmt->execute([$journeyId]);
    }

    private function getContents($journeyId) {
        $stmt = $this->conn->prepare(
            "SELECT jc.id, jc.content_text, jc.image_url, jc.image_description, jc.document_id, jc.display_order,
                    d.relative_path, d.absolute_path
             FROM {$this->contentsTable} jc 
             LEFT JOIN documents d ON jc.document_id = d.id 
             WHERE jc.journey_id = ? 
             ORDER BY jc.display_order ASC"
        );
        $stmt->execute([$journeyId]);
        $contents = $stmt->fetchAll();

        return array_map(function ($item) {
            $imgUrl = $item['relative_path'] ?? $item['image_url'] ?? '';
            return [
                'id' => $item['id'],
                'content_text' => $item['content_text'],
                'image_url' => $imgUrl,
                'image_description' => $item['image_description'],
                'document_id' => $item['document_id'],
                'display_order' => $item['display_order'],
            ];
        }, $contents);
    }

    private function insertContents($journeyId, $contentItems, $documentIds = []) {
        $stmt = $this->conn->prepare(
            "INSERT INTO {$this->contentsTable} (journey_id, content_text, image_url, image_description, document_id, display_order) VALUES (?, ?, ?, ?, ?, ?)"
        );
        foreach ($contentItems as $index => $item) {
            $imgUrl = '';
            if (isset($item['image_url'])) {
                $imgUrl = is_array($item['image_url'])
                    ? ($item['image_url']['path'] ?? $item['image_url']['url'] ?? $item['image_url']['relative_path'] ?? '')
                    : $item['image_url'];
            }
            $docId = $documentIds[$index] ?? null;
            $stmt->execute([
                $journeyId,
                $item['content_text'] ?? '',
                $imgUrl,
                $item['image_description'] ?? '',
                $docId,
                $item['display_order'] ?? $index,
            ]);
        }
    }

    private function deleteContents($journeyId) {
        $stmt = $this->conn->prepare("DELETE FROM {$this->contentsTable} WHERE journey_id = ?");
        $stmt->execute([$journeyId]);
    }
}
