<?php
require_once __DIR__ . '/../helpers/uuid.php';
require_once __DIR__ . '/../helpers/url.php';

class Achievement {
    private $conn;
    private $table = 'achievements';
    private $tagsTable = 'entity_tags';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function findAll() {
        $stmt = $this->conn->prepare(
            "SELECT a.*,
                    bg_doc.relative_path AS background_image_url,
                    icon_doc.relative_path AS icon_url
             FROM {$this->table} a
             LEFT JOIN documents bg_doc ON a.background_document_id = bg_doc.id
             LEFT JOIN documents icon_doc ON a.icon_document_id = icon_doc.id
             ORDER BY a.created_at DESC"
        );
        $stmt->execute();
        $achievements = $stmt->fetchAll();

        foreach ($achievements as &$achievement) {
            $achievement['tags'] = $this->getTags($achievement['id']);
            $achievement['icons'] = $this->buildIconData($achievement);
            $achievement['contents'] = $this->getContents($achievement['id']);
            $achievement = resolveRecordUrls($achievement);
        }
        return $achievements;
    }

    public function findById($id) {
        $stmt = $this->conn->prepare(
            "SELECT a.*,
                    bg_doc.relative_path AS background_image_url,
                    icon_doc.relative_path AS icon_url
             FROM {$this->table} a
             LEFT JOIN documents bg_doc ON a.background_document_id = bg_doc.id
             LEFT JOIN documents icon_doc ON a.icon_document_id = icon_doc.id
             WHERE a.id = ?"
        );
        $stmt->execute([$id]);
        $achievement = $stmt->fetch();

        if ($achievement) {
            $achievement['tags'] = $this->getTags($achievement['id']);
            $achievement['icons'] = $this->buildIconData($achievement);
            $achievement['contents'] = $this->getContents($achievement['id']);
            $achievement = resolveRecordUrls($achievement);
        }
        return $achievement;
    }

    public function create($data) {
        $this->conn->beginTransaction();
        try {
            $id = generateUUID();

            $stmt = $this->conn->prepare(
                "INSERT INTO {$this->table} (id, name, description, link, contents, source_code_link, background_document_id, icon_document_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $stmt->execute([
                $id,
                $data['name'],
                $data['description'] ?? null,
                $data['link'] ?? true,
                $data['contents'] ?? null,
                $data['source_code_link'] ?? null,
                $data['backgroundDocumentId'] ?? null,
                $data['icon_document_id'] ?? $data['document_id'] ?? null
            ]);

            if (!empty($data['tags'])) {
                $this->insertTags($id, $data['tags']);
            }
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
            $oldIconDocId = $oldRecord['icon_document_id'] ?? null;

            $stmt = $this->conn->prepare(
                "UPDATE {$this->table} SET name = ?, description = ?, link = ?, contents = ?, source_code_link = ?, background_document_id = ?, icon_document_id = ? WHERE id = ?"
            );
            $stmt->execute([
                $data['name'],
                $data['description'] ?? null,
                $data['link'] ?? true,
                $data['contents'] ?? null,
                $data['source_code_link'] ?? null,
                $data['backgroundDocumentId'] ?? null,
                $data['icon_document_id'] ?? $data['document_id'] ?? null,
                $id
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

            if ($oldIconDocId && $oldIconDocId !== ($data['icon_document_id'] ?? $data['document_id'] ?? null)) {
                $doc = $docModel->findById($oldIconDocId);
                if ($doc) {
                    $uploader->deleteFileByAbsolute($doc['absolute_path']);
                    $docModel->delete($oldIconDocId);
                }
            }

            if (isset($data['tags'])) {
                $this->deleteTags($id);
                $this->insertTags($id, $data['tags']);
            }

            if (isset($data['contentItems'])) {
                $oldContents = $this->getContents($id);
                $this->deleteContents($id);
                $this->insertContents($id, $data['contentItems'], $data['contentDocumentIds'] ?? []);

                $newDocIds = [];
                foreach ($data['contentDocumentIds'] ?? [] as $sectionDocs) {
                    foreach ((array)$sectionDocs as $d) {
                        if ($d) $newDocIds[] = $d;
                    }
                }

                foreach ($oldContents as $oldItem) {
                    $imageUrlData = json_decode($oldItem['image_url'] ?? '[]', true);
                    if (is_array($imageUrlData)) {
                        foreach ($imageUrlData as $img) {
                            if (is_array($img) && !empty($img['document_id'])) {
                                $docId = $img['document_id'];
                                if (!in_array($docId, $newDocIds)) {
                                    $doc = $docModel->findById($docId);
                                    if ($doc) {
                                        $uploader->deleteFileByAbsolute($doc['absolute_path']);
                                        $docModel->delete($docId);
                                    }
                                }
                            }
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
            $result = $this->deleteWithinTransaction($id);
            $this->conn->commit();
            return $result;
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    public function deleteWithinTransaction($id) {
        $record = $this->findById($id);
        if (!$record) {
            throw new Exception("Achievement record not found: $id");
        }
        $contents = $this->getContents($id);
        $this->deleteContents($id);
        $this->deleteTags($id);

        $stmt = $this->conn->prepare("DELETE FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);

        return [
            'contents' => $contents,
            'icons' => $record['icons'] ?? [],
            'background_document_id' => $record['background_document_id'] ?? null,
            'icon_document_id' => $record['icon_document_id'] ?? null,
        ];
    }

    private function buildIconData($achievement) {
        $docId = $achievement['icon_document_id'] ?? $achievement['document_id'] ?? null;
        $iconUrl = $achievement['icon_url'] ?? null;
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

    private function getTags($achievementId) {
        $stmt = $this->conn->prepare("SELECT tag FROM {$this->tagsTable} WHERE entity_type = 'achievement' AND entity_id = ?");
        $stmt->execute([$achievementId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    private function insertTags($achievementId, $tags) {
        $stmt = $this->conn->prepare("INSERT INTO {$this->tagsTable} (id, entity_type, entity_id, tag) VALUES (?, 'achievement', ?, ?)");
        foreach ($tags as $tag) {
            $tagValue = is_array($tag) ? ($tag['name'] ?? $tag['tag'] ?? '') : $tag;
            if ($tagValue === '') continue;
            $stmt->execute([generateUUID(), $achievementId, $tagValue]);
        }
    }

    private function deleteTags($achievementId) {
        $stmt = $this->conn->prepare("DELETE FROM {$this->tagsTable} WHERE entity_type = 'achievement' AND entity_id = ?");
        $stmt->execute([$achievementId]);
    }

    private function getContents($achievementId) {
        $stmt = $this->conn->prepare(
            "SELECT ec.id, ec.heading, ec.content_text, ec.display_order
             FROM entity_contents ec
             WHERE ec.entity_type = 'achievement' AND ec.entity_id = ?
             ORDER BY ec.display_order ASC"
        );
        $stmt->execute([$achievementId]);
        $contents = $stmt->fetchAll();

        $contentIds = array_column($contents, 'id');
        $detailMap = [];

        if (!empty($contentIds)) {
            $placeholders = implode(',', array_fill(0, count($contentIds), '?'));
            $detailStmt = $this->conn->prepare(
                "SELECT entity_content_id, image_id, title, embedded_url
                 FROM entity_content_details
                 WHERE entity_content_id IN ($placeholders)
                 ORDER BY display_order ASC"
            );
            $detailStmt->execute($contentIds);
            $details = $detailStmt->fetchAll();

            foreach ($details as $d) {
                $detailMap[$d['entity_content_id']][] = $d;
            }
        }

        $allImageIds = [];
        foreach ($contents as $item) {
            $cid = $item['id'];
            if (!empty($detailMap[$cid])) {
                foreach ($detailMap[$cid] as $d) {
                    if (!empty($d['image_id'])) {
                        $allImageIds[] = $d['image_id'];
                    }
                }
            }
        }

        $docUrlMap = [];
        if (!empty($allImageIds)) {
            $uniqueIds = array_unique($allImageIds);
            $placeholders = implode(',', array_fill(0, count($uniqueIds), '?'));
            $docStmt = $this->conn->prepare(
                "SELECT id, relative_path FROM documents WHERE id IN ($placeholders)"
            );
            $docStmt->execute($uniqueIds);
            $docUrlMap = $docStmt->fetchAll(PDO::FETCH_KEY_PAIR);
        }

        return array_map(function ($item) use ($docUrlMap, $detailMap) {
            $cid = $item['id'];
            $images = [];
            $embeds = [];

            if (!empty($detailMap[$cid])) {
                foreach ($detailMap[$cid] as $d) {
                    if (!empty($d['image_id']) && isset($docUrlMap[$d['image_id']])) {
                        $images[] = [
                            'url' => $docUrlMap[$d['image_id']],
                            'document_id' => $d['image_id'],
                            'title' => $d['title'] ?? '',
                        ];
                    } elseif (!empty($d['embedded_url'])) {
                        $parsed = json_decode($d['embedded_url'], true);
                        if ($parsed) {
                            $embeds[] = $parsed;
                        }
                    }
                }
            }

            return [
                'id' => $item['id'],
                'heading' => $item['heading'] ?? '',
                'content_text' => $item['content_text'],
                'image_url' => json_encode($images),
                'embed_urls' => json_encode($embeds),
                'display_order' => $item['display_order'],
            ];
        }, $contents);
    }

    private function insertContents($achievementId, $contentItems, $documentIds = []) {
        $stmtContent = $this->conn->prepare(
            "INSERT INTO entity_contents (id, entity_type, entity_id, heading, content_text, display_order) VALUES (?, 'achievement', ?, ?, ?, ?)"
        );
        $stmtDetail = $this->conn->prepare(
            "INSERT INTO entity_content_details (id, entity_content_id, image_id, title, embedded_url, display_order) VALUES (?, ?, ?, ?, ?, ?)"
        );

        foreach ($contentItems as $index => $item) {
            $contentId = generateUUID();
            $stmtContent->execute([
                $contentId,
                $achievementId,
                $item['heading'] ?? '',
                $item['content_text'] ?? '',
                $item['display_order'] ?? $index,
            ]);

            $sectionDocIds = $documentIds[$index] ?? [];
            if (!is_array($sectionDocIds)) {
                $sectionDocIds = $sectionDocIds ? [$sectionDocIds] : [];
            }

            $detailOrder = 0;

            // image_url arrives as a JSON string from the frontend
            $imageUrlRaw = $item['image_url'] ?? '[]';
            $imageEntries = is_string($imageUrlRaw) ? json_decode($imageUrlRaw, true) : $imageUrlRaw;
            if (!is_array($imageEntries)) {
                $imageEntries = [];
            }

            // Insert image details
            if (!empty($sectionDocIds)) {
                foreach ($sectionDocIds as $idx => $dId) {
                    if (empty($dId)) continue;
                    $title = '';
                    if (isset($imageEntries[$idx]) && is_array($imageEntries[$idx])) {
                        $title = $imageEntries[$idx]['title'] ?? '';
                    }
                    $stmtDetail->execute([
                        generateUUID(), $contentId, $dId, $title, null, $detailOrder++,
                    ]);
                }
            }

            // Insert embed details
            $embeds = !empty($item['embed_urls']) ? $item['embed_urls'] : [];
            if (is_array($embeds)) {
                foreach ($embeds as $embed) {
                    $embedUrl = is_array($embed) ? ($embed['url'] ?? null) : null;
                    if (!empty($embedUrl)) {
                        $stmtDetail->execute([
                            generateUUID(), $contentId, null, '', json_encode($embed), $detailOrder++,
                        ]);
                    }
                }
            }
        }
    }

    private function deleteContents($achievementId) {
        $stmt = $this->conn->prepare("DELETE FROM entity_contents WHERE entity_type = 'achievement' AND entity_id = ?");
        $stmt->execute([$achievementId]);
    }
}
