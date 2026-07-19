<?php
class Photography {
    private $conn;
    private $table = 'photography';
    private $photosTable = 'photography_photos';
    private $tagsTable = 'photography_tags';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function findAll() {
        $stmt = $this->conn->prepare("SELECT * FROM {$this->table} ORDER BY created_at DESC");
        $stmt->execute();
        $items = $stmt->fetchAll();

        foreach ($items as &$item) {
            $item['photos'] = $this->getPhotos($item['id']);
            $item['tags'] = $this->getTags($item['id']);
        }
        return $items;
    }

    public function findById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        $item = $stmt->fetch();

        if ($item) {
            $item['photos'] = $this->getPhotos($item['id']);
            $item['tags'] = $this->getTags($item['id']);
        }
        return $item;
    }

    public function create($data) {
        $this->conn->beginTransaction();
        try {
            $stmt = $this->conn->prepare(
                "INSERT INTO {$this->table} (title, description, created_at, updated_at) 
                 VALUES (?, ?, NOW(), NOW())"
            );
            $stmt->execute([
                $data['title'],
                $data['description'] ?? null
            ]);
            $id = $this->conn->lastInsertId();

            if (!empty($data['photos'])) {
                $this->insertPhotos($id, $data['photos']);
            }
            if (!empty($data['tags'])) {
                $this->insertTags($id, $data['tags']);
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
                "UPDATE {$this->table} SET title = ?, description = ?, updated_at = NOW() WHERE id = ?"
            );
            $stmt->execute([
                $data['title'],
                $data['description'] ?? null,
                $id
            ]);

            if (isset($data['photos'])) {
                $oldPhotos = $this->getPhotos($id);
                $this->deletePhotos($id);
                $this->insertPhotos($id, $data['photos']);

                require_once __DIR__ . '/Document.php';
                $docModel = new Document($this->conn);
                require_once __DIR__ . '/../middleware/upload.php';
                $uploader = new UploadMiddleware();
                foreach ($oldPhotos as $oldPhoto) {
                    $docId = $oldPhoto['document_id'] ?? null;
                    if ($docId) {
                        $doc = $docModel->findById($docId);
                        if ($doc) {
                            $uploader->deleteFileByAbsolute($doc['absolute_path']);
                            $docModel->delete($docId);
                        }
                    }
                }
            }

            if (isset($data['tags'])) {
                $this->deleteTags($id);
                $this->insertTags($id, $data['tags']);
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
            $photos = $this->getPhotos($id);
            $this->deletePhotos($id);
            $this->deleteTags($id);

            $stmt = $this->conn->prepare("DELETE FROM {$this->table} WHERE id = ?");
            $stmt->execute([$id]);

            $this->conn->commit();
            return ['photos' => $photos];
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    private function getPhotos($photographyId) {
        $stmt = $this->conn->prepare(
            "SELECT pp.id, pp.photo_url, pp.caption, pp.display_order, pp.document_id,
                    d.relative_path, d.absolute_path, d.file_name, d.original_name, d.mime_type
             FROM {$this->photosTable} pp 
             LEFT JOIN documents d ON pp.document_id = d.id 
             WHERE pp.photography_id = ? 
             ORDER BY pp.display_order ASC"
        );
        $stmt->execute([$photographyId]);
        $photos = $stmt->fetchAll();

        return array_map(function ($photo) {
            $url = $photo['relative_path'] ?? $photo['photo_url'] ?? '';
            return [
                'id' => $photo['id'],
                'photo_url' => $url,
                'caption' => $photo['caption'],
                'display_order' => $photo['display_order'],
                'document_id' => $photo['document_id'],
            ];
        }, $photos);
    }

    private function insertPhotos($photographyId, $photos) {
        $stmt = $this->conn->prepare(
            "INSERT INTO {$this->photosTable} (photography_id, photo_url, caption, display_order, document_id) VALUES (?, ?, ?, ?, ?)"
        );
        foreach ($photos as $index => $photo) {
            $url = is_array($photo) ? ($photo['path'] ?? $photo['url'] ?? $photo['relative_path'] ?? $photo['photo_url'] ?? '') : $photo;
            $caption = is_array($photo) ? ($photo['caption'] ?? '') : '';
            $docId = is_array($photo) ? ($photo['document_id'] ?? null) : null;
            if ($url) {
                $stmt->execute([$photographyId, $url, $caption, $photo['display_order'] ?? $index, $docId]);
            }
        }
    }

    private function deletePhotos($photographyId) {
        $stmt = $this->conn->prepare("DELETE FROM {$this->photosTable} WHERE photography_id = ?");
        $stmt->execute([$photographyId]);
    }

    private function getTags($photographyId) {
        $stmt = $this->conn->prepare("SELECT id, tag FROM {$this->tagsTable} WHERE photography_id = ?");
        $stmt->execute([$photographyId]);
        return $stmt->fetchAll();
    }

    private function insertTags($photographyId, $tags) {
        $stmt = $this->conn->prepare(
            "INSERT INTO {$this->tagsTable} (photography_id, tag) VALUES (?, ?)"
        );
        foreach ($tags as $tag) {
            $tagName = is_array($tag) ? ($tag['tag'] ?? $tag) : $tag;
            $tagName = trim($tagName);
            if ($tagName !== '') {
                $stmt->execute([$photographyId, $tagName]);
            }
        }
    }

    private function deleteTags($photographyId) {
        $stmt = $this->conn->prepare("DELETE FROM {$this->tagsTable} WHERE photography_id = ?");
        $stmt->execute([$photographyId]);
    }
}