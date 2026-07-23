<?php
require_once __DIR__ . '/../helpers/uuid.php';

class Achievement {
    private $conn;
    private $table = 'achievements';
    private $tagsTable = 'entity_tags';
    private $detailsTable = 'entity_details';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function findAll() {
        $stmt = $this->conn->prepare(
            "SELECT a.*, d.relative_path AS document_url, d.original_name AS document_original_name
             FROM {$this->table} a
             LEFT JOIN documents d ON a.document_id = d.id
             ORDER BY a.created_at DESC"
        );
        $stmt->execute();
        $achievements = $stmt->fetchAll();

        foreach ($achievements as &$achievement) {
            $achievement['tags'] = $this->getTags($achievement['id']);
            $achievement['details'] = $this->getDetails($achievement['id']);
        }
        return $achievements;
    }

    public function findById($id) {
        $stmt = $this->conn->prepare(
            "SELECT a.*, d.relative_path AS document_url, d.original_name AS document_original_name
             FROM {$this->table} a
             LEFT JOIN documents d ON a.document_id = d.id
             WHERE a.id = ?"
        );
        $stmt->execute([$id]);
        $achievement = $stmt->fetch();

        if ($achievement) {
            $achievement['tags'] = $this->getTags($achievement['id']);
            $achievement['details'] = $this->getDetails($achievement['id']);
        }
        return $achievement;
    }

    public function findDetails($achievementId) {
        return $this->getDetails($achievementId);
    }

    public function create($data) {
        $this->conn->beginTransaction();
        try {
            $id = generateUUID();
            $stmt = $this->conn->prepare(
                "INSERT INTO {$this->table} (id, name, description, icons, document_id, link, contents, source_code_link) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $stmt->execute([
                $id, $data['name'], $data['description'] ?? null, $data['icons'] ?? null,
                $data['document_id'] ?? null, $data['link'] ?? true,
                $data['contents'] ?? null, $data['source_code_link'] ?? null
            ]);

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

    public function createDetail($achievementId, $detail) {
        $detailId = generateUUID();
        $stmt = $this->conn->prepare(
            "INSERT INTO {$this->detailsTable} (id, entity_type, entity_id, heading, icons, image_url, image_description, document_id, image_ids, contents, display_order) 
             VALUES (?, 'achievement', ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $imgUrl = '';
        if (isset($detail['image_url'])) {
            if (is_string($detail['image_url']) && ($detail['image_url'][0] ?? '') === '[') {
                $imgUrl = $detail['image_url'];
            } elseif (is_array($detail['image_url'])) {
                $imgUrl = json_encode($detail['image_url']);
            } else {
                $imgUrl = $detail['image_url'];
            }
        } elseif (isset($detail['icons']) && is_array($detail['icons']) && !empty($detail['icons'])) {
            $first = $detail['icons'][0];
            $imgUrl = is_array($first) ? ($first['path'] ?? $first['url'] ?? $first['relative_path'] ?? '') : $first;
        }
        $docIds = $detail['document_ids'] ?? ($detail['document_id'] ? [$detail['document_id']] : []);
        $imageIdsJson = !empty($docIds) ? json_encode(array_filter($docIds)) : null;
        $stmt->execute([
            $detailId,
            $achievementId,
            $detail['heading'] ?? '',
            json_encode($detail['icons'] ?? []),
            $imgUrl,
            $detail['image_description'] ?? '',
            $detail['document_id'] ?? null,
            $imageIdsJson,
            $detail['contents'] ?? '',
            $detail['display_order'] ?? 0,
        ]);
        return $detailId;
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

    private function getTags($achievementId) {
        $stmt = $this->conn->prepare("SELECT tag FROM {$this->tagsTable} WHERE entity_type = 'achievement' AND entity_id = ?");
        $stmt->execute([$achievementId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    private function insertTags($achievementId, $tags) {
        $stmt = $this->conn->prepare("INSERT INTO {$this->tagsTable} (id, entity_type, entity_id, tag) VALUES (?, 'achievement', ?, ?)");
        foreach ($tags as $tag) {
            $stmt->execute([generateUUID(), $achievementId, $tag]);
        }
    }

    private function deleteTags($achievementId) {
        $stmt = $this->conn->prepare("DELETE FROM {$this->tagsTable} WHERE entity_type = 'achievement' AND entity_id = ?");
        $stmt->execute([$achievementId]);
    }

    private function getDetails($achievementId) {
        $stmt = $this->conn->prepare(
            "SELECT ed.id, ed.entity_id, ed.heading, ed.icons, ed.image_url, ed.image_description, ed.document_id, ed.image_ids, ed.contents, ed.display_order
             FROM {$this->detailsTable} ed 
             WHERE ed.entity_type = 'achievement' AND ed.entity_id = ? 
             ORDER BY ed.display_order ASC"
        );
        $stmt->execute([$achievementId]);
        $details = $stmt->fetchAll();

        return array_map(function ($detail) {
            $icons = json_decode($detail['icons'] ?? '[]', true);
            $images = [];

            if (!empty($detail['image_ids'])) {
                $ids = json_decode($detail['image_ids'], true);
                if (is_array($ids) && count($ids) > 0) {
                    $placeholders = implode(',', array_fill(0, count($ids), '?'));
                    $docStmt = $this->conn->prepare(
                        "SELECT id, relative_path FROM documents WHERE id IN ($placeholders)"
                    );
                    $docStmt->execute($ids);
                    $docs = $docStmt->fetchAll(PDO::FETCH_KEY_PAIR);

                    $titles = [];
                    if (!empty($detail['image_url'])) {
                        $parsed = json_decode($detail['image_url'], true);
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

            if (empty($images) && !empty($detail['image_url'])) {
                $imageUrl = $detail['image_url'];
                if ($imageUrl[0] === '[') {
                    $parsed = json_decode($imageUrl, true);
                    if (is_array($parsed)) {
                        $images = array_map(function ($entry) {
                            return [
                                'url' => is_array($entry) ? ($entry['url'] ?? '') : $entry,
                                'title' => is_array($entry) ? ($entry['title'] ?? '') : '',
                                'document_id' => is_array($entry) ? ($entry['document_id'] ?? null) : null,
                            ];
                        }, $parsed);
                    }
                } else {
                    $images[] = [
                        'url' => $imageUrl,
                        'title' => $detail['image_description'] ?? '',
                        'document_id' => $detail['document_id'] ?? null,
                    ];
                }
            }

            return [
                'id' => $detail['id'],
                'heading' => $detail['heading'] ?? '',
                'icons' => $icons,
                'image_url' => json_encode($images),
                'image_description' => $detail['image_description'],
                'document_id' => $detail['document_id'],
                'contents' => $detail['contents'],
                'display_order' => $detail['display_order'],
            ];
        }, $details);
    }

    private function deleteDetails($achievementId) {
        $stmt = $this->conn->prepare("DELETE FROM {$this->detailsTable} WHERE entity_type = 'achievement' AND entity_id = ?");
        $stmt->execute([$achievementId]);
    }
}
