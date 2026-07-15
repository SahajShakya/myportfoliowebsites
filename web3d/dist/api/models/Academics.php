<?php
class Academics {
    private $conn;
    private $table = 'academics';
    private $iconsTable = 'academic_icons';
    private $contentsTable = 'academics_contents';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function findAll() {
        $stmt = $this->conn->prepare("SELECT * FROM {$this->table} ORDER BY start_date ASC");
        $stmt->execute();
        $academics = $stmt->fetchAll();

        foreach ($academics as &$academic) {
            $academic['icons'] = $this->getIcons($academic['id']);
            $academic['contents'] = $this->getContents($academic['id']);
        }
        return $academics;
    }

    public function findById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        $academic = $stmt->fetch();

        if ($academic) {
            $academic['icons'] = $this->getIcons($academic['id']);
            $academic['contents'] = $this->getContents($academic['id']);
        }
        return $academic;
    }

    public function create($data) {
        $this->conn->beginTransaction();
        try {
            $stmt = $this->conn->prepare(
                "INSERT INTO {$this->table} (title, university_name, college_name, start_date, end_date, description, contents, github_link, url_of_company) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $stmt->execute([
                $data['title'], $data['university_name'], $data['college_name'],
                $data['startDate'], $data['endDate'],
                $data['description'] ?? null, $data['contents'] ?? null,
                $data['github_link'] ?? null, $data['urlofCompany']
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
                "UPDATE {$this->table} SET title = ?, university_name = ?, college_name = ?, 
                 start_date = ?, end_date = ?, description = ?, contents = ?, github_link = ?, url_of_company = ? WHERE id = ?"
            );
            $stmt->execute([
                $data['title'], $data['university_name'], $data['college_name'],
                $data['startDate'], $data['endDate'],
                $data['description'] ?? null, $data['contents'] ?? null,
                $data['github_link'] ?? null, $data['urlofCompany'], $id
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

    private function getIcons($academicId) {
        $stmt = $this->conn->prepare(
            "SELECT ai.id, ai.icon_url, ai.document_id,
                    d.relative_path, d.absolute_path, d.file_name, d.original_name, d.mime_type
             FROM {$this->iconsTable} ai 
             LEFT JOIN documents d ON ai.document_id = d.id 
             WHERE ai.academic_id = ?"
        );
        $stmt->execute([$academicId]);
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

    private function insertIcons($academicId, $icons, $documentIds = []) {
        $stmt = $this->conn->prepare(
            "INSERT INTO {$this->iconsTable} (academic_id, icon_url, document_id) VALUES (?, ?, ?)"
        );
        foreach ($icons as $index => $icon) {
            $url = is_array($icon) ? ($icon['path'] ?? $icon['url'] ?? $icon['relative_path'] ?? $icon['icon_url'] ?? '') : $icon;
            $docId = $documentIds[$index] ?? null;
            if ($url) {
                $stmt->execute([$academicId, $url, $docId]);
            }
        }
    }

    private function deleteIcons($academicId) {
        $stmt = $this->conn->prepare("DELETE FROM {$this->iconsTable} WHERE academic_id = ?");
        $stmt->execute([$academicId]);
    }

    private function getContents($academicId) {
        $stmt = $this->conn->prepare(
            "SELECT ac.id, ac.content_text, ac.image_url, ac.image_description, ac.document_id, ac.display_order,
                    d.relative_path, d.absolute_path
             FROM {$this->contentsTable} ac 
             LEFT JOIN documents d ON ac.document_id = d.id 
             WHERE ac.academic_id = ? 
             ORDER BY ac.display_order ASC"
        );
        $stmt->execute([$academicId]);
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

    private function insertContents($academicId, $contentItems, $documentIds = []) {
        $stmt = $this->conn->prepare(
            "INSERT INTO {$this->contentsTable} (academic_id, content_text, image_url, image_description, document_id, display_order) VALUES (?, ?, ?, ?, ?, ?)"
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
                $academicId,
                $item['content_text'] ?? '',
                $imgUrl,
                $item['image_description'] ?? '',
                $docId,
                $item['display_order'] ?? $index,
            ]);
        }
    }

    private function deleteContents($academicId) {
        $stmt = $this->conn->prepare("DELETE FROM {$this->contentsTable} WHERE academic_id = ?");
        $stmt->execute([$academicId]);
    }
}
