<?php
class AcademicProject {
    private $conn;
    private $table = 'academic_projects';
    private $tagsTable = 'academic_project_tags';
    private $detailsTable = 'academic_project_details';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function findAll() {
        $stmt = $this->conn->prepare("SELECT * FROM {$this->table} ORDER BY created_at DESC");
        $stmt->execute();
        $items = $stmt->fetchAll();

        foreach ($items as &$item) {
            $item['tags'] = $this->getTags($item['id']);
            $item['details'] = $this->getDetails($item['id']);
        }
        return $items;
    }

    public function findById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        $item = $stmt->fetch();

        if ($item) {
            $item['tags'] = $this->getTags($item['id']);
            $item['details'] = $this->getDetails($item['id']);
        }
        return $item;
    }

    public function findDetails($itemId) {
        return $this->getDetails($itemId);
    }

    public function create($data) {
        $this->conn->beginTransaction();
        try {
            $stmt = $this->conn->prepare(
                "INSERT INTO {$this->table} (name, description, icons, document_id, link, contents, source_code_link) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)"
            );
            $stmt->execute([
                $data['name'], $data['description'] ?? null, $data['icons'] ?? null,
                $data['document_id'] ?? null, $data['link'] ?? true,
                $data['contents'] ?? null, $data['source_code_link'] ?? null
            ]);
            $id = $this->conn->lastInsertId();

            if (!empty($data['tags'])) {
                $this->insertTags($id, $data['tags']);
            }
            if (!empty($data['details'])) {
                foreach ($data['details'] as $detail) {
                    $this->createDetail($id, $detail);
                }
            }

            $this->conn->commit();
            return $id;
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    public function createDetail($itemId, $detail) {
        $stmt = $this->conn->prepare(
            "INSERT INTO {$this->detailsTable} (academic_project_id, icons, image_url, image_description, document_id, contents, display_order) 
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        $imgUrl = '';
        if (isset($detail['image_url'])) {
            $imgUrl = is_array($detail['image_url'])
                ? ($detail['image_url']['path'] ?? $detail['image_url']['url'] ?? $detail['image_url']['relative_path'] ?? '')
                : $detail['image_url'];
        } elseif (isset($detail['icons']) && is_array($detail['icons']) && !empty($detail['icons'])) {
            $first = $detail['icons'][0];
            $imgUrl = is_array($first) ? ($first['path'] ?? $first['url'] ?? $first['relative_path'] ?? '') : $first;
        }
        $stmt->execute([
            $itemId,
            json_encode($detail['icons'] ?? []),
            $imgUrl,
            $detail['image_description'] ?? '',
            $detail['document_id'] ?? null,
            $detail['contents'] ?? '',
            $detail['display_order'] ?? 0,
        ]);
        return $this->conn->lastInsertId();
    }

    public function update($id, $data) {
        $this->conn->beginTransaction();
        try {
            $stmt = $this->conn->prepare(
                "UPDATE {$this->table} SET name = ?, description = ?, icons = ?, document_id = ?, 
                 link = ?, contents = ?, source_code_link = ? WHERE id = ?"
            );
            $stmt->execute([
                $data['name'], $data['description'] ?? null, $data['icons'] ?? null,
                $data['document_id'] ?? null, $data['link'] ?? true,
                $data['contents'] ?? null, $data['source_code_link'] ?? null, $id
            ]);

            if (isset($data['tags'])) {
                $this->deleteTags($id);
                $this->insertTags($id, $data['tags']);
            }
            if (isset($data['details'])) {
                $oldDetails = $this->getDetails($id);
                $this->deleteDetails($id);
                foreach ($data['details'] as $detail) {
                    $this->createDetail($id, $detail);
                }

                require_once __DIR__ . '/Document.php';
                $docModel = new Document($this->conn);
                require_once __DIR__ . '/../middleware/upload.php';
                $uploader = new UploadMiddleware();
                foreach ($oldDetails as $old) {
                    $docId = $old['document_id'] ?? null;
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
            $details = $this->getDetails($id);
            $this->deleteTags($id);
            $this->deleteDetails($id);

            $stmt = $this->conn->prepare("DELETE FROM {$this->table} WHERE id = ?");
            $stmt->execute([$id]);

            $this->conn->commit();
            return ['details' => $details];
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    private function getTags($itemId) {
        $stmt = $this->conn->prepare("SELECT tag FROM {$this->tagsTable} WHERE academic_project_id = ?");
        $stmt->execute([$itemId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    private function insertTags($itemId, $tags) {
        $stmt = $this->conn->prepare("INSERT INTO {$this->tagsTable} (academic_project_id, tag) VALUES (?, ?)");
        foreach ($tags as $tag) {
            $stmt->execute([$itemId, $tag]);
        }
    }

    private function deleteTags($itemId) {
        $stmt = $this->conn->prepare("DELETE FROM {$this->tagsTable} WHERE academic_project_id = ?");
        $stmt->execute([$itemId]);
    }

    private function getDetails($itemId) {
        $stmt = $this->conn->prepare(
            "SELECT pd.id, pd.academic_project_id, pd.icons, pd.image_url, pd.image_description, pd.document_id, pd.contents, pd.display_order,
                    d.relative_path, d.absolute_path
             FROM {$this->detailsTable} pd 
             LEFT JOIN documents d ON pd.document_id = d.id 
             WHERE pd.academic_project_id = ? 
             ORDER BY pd.display_order ASC"
        );
        $stmt->execute([$itemId]);
        $details = $stmt->fetchAll();

        return array_map(function ($detail) {
            $icons = json_decode($detail['icons'] ?? '[]', true);
            $imgUrl = $detail['relative_path'] ?? $detail['image_url'] ?? '';
            return [
                'id' => $detail['id'],
                'icons' => $icons,
                'image_url' => $imgUrl,
                'image_description' => $detail['image_description'],
                'document_id' => $detail['document_id'],
                'contents' => $detail['contents'],
                'display_order' => $detail['display_order'],
            ];
        }, $details);
    }

    private function deleteDetails($itemId) {
        $stmt = $this->conn->prepare("DELETE FROM {$this->detailsTable} WHERE academic_project_id = ?");
        $stmt->execute([$itemId]);
    }
}
