<?php
require_once __DIR__ . '/../helpers/uuid.php';
require_once __DIR__ . '/../helpers/url.php';

class Academics {
    private $conn;
    private $table = 'academics';

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
             ORDER BY a.start_date ASC"
        );
        $stmt->execute();
        $academics = $stmt->fetchAll();

        foreach ($academics as &$academic) {
            $academic['icons'] = $this->buildIconData($academic);
            $academic['contents'] = $this->getContents($academic['id']);
            $academic = resolveRecordUrls($academic);
        }
        return $academics;
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
        $academic = $stmt->fetch();

        if ($academic) {
            $academic['icons'] = $this->buildIconData($academic);
            $academic['contents'] = $this->getContents($academic['id']);
            $academic = resolveRecordUrls($academic);
        }
        return $academic;
    }

    public function create($data) {
        $this->conn->beginTransaction();
        try {
            $id = generateUUID();

            $stmt = $this->conn->prepare(
                "INSERT INTO {$this->table} (id, title, university_name, college_name, start_date, end_date, description, contents, github_link, url_of_company, background_document_id, icon_document_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $stmt->execute([
                $id,
                $data['title'], $data['university_name'], $data['college_name'],
                $data['startDate'], $data['endDate'],
                $data['description'] ?? null, $data['contents'] ?? null,
                $data['github_link'] ?? null, $data['urlofCompany'] ?? null,
                $data['backgroundDocumentId'] ?? null,
                $data['icon_document_id'] ?? $data['document_id'] ?? null
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
            $oldIconDocId = $oldRecord['icon_document_id'] ?? null;

            $stmt = $this->conn->prepare(
                "UPDATE {$this->table} SET title = ?, university_name = ?, college_name = ?, 
                 start_date = ?, end_date = ?, description = ?, contents = ?, github_link = ?, url_of_company = ?, background_document_id = ?, icon_document_id = ? WHERE id = ?"
            );
            $stmt->execute([
                $data['title'], $data['university_name'], $data['college_name'],
                $data['startDate'], $data['endDate'],
                $data['description'] ?? null, $data['contents'] ?? null,
                $data['github_link'] ?? null, $data['urlofCompany'] ?? null,
                $data['backgroundDocumentId'] ?? null,
                $data['icon_document_id'] ?? $data['document_id'] ?? null, $id
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
            throw new Exception("Academic record not found: $id");
        }
        $contents = $this->getContents($id);
        $this->deleteContents($id);

        $stmt = $this->conn->prepare("DELETE FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);

        return [
            'contents' => $contents,
            'icons' => $record['icons'] ?? [],
            'background_document_id' => $record['background_document_id'] ?? null,
            'icon_document_id' => $record['icon_document_id'] ?? null,
        ];
    }

    private function buildIconData($academic) {
        $docId = $academic['icon_document_id'] ?? $academic['document_id'] ?? null;
        $iconUrl = $academic['icon_url'] ?? null;
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

    private function getContents($academicId) {
        $stmt = $this->conn->prepare(
            "SELECT ec.id, ec.heading, ec.content_text, ec.display_order
             FROM entity_contents ec
             WHERE ec.entity_type = 'academic' AND ec.entity_id = ?
             ORDER BY ec.display_order ASC"
        );
        $stmt->execute([$academicId]);
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
            $firstDocId = null;

            if (!empty($detailMap[$cid])) {
                foreach ($detailMap[$cid] as $d) {
                    if (!empty($d['image_id']) && isset($docUrlMap[$d['image_id']])) {
                        if (!$firstDocId) {
                            $firstDocId = $d['image_id'];
                        }
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
                'content_text' => $item['content_text'] ?? '',
                'title' => $images[0]['title'] ?? ($item['heading'] ?? ''),
                'image_url' => json_encode($images),
                'embed_urls' => json_encode($embeds),
                'document_id' => $firstDocId,
                'display_order' => $item['display_order'],
            ];
        }, $contents);
    }

    private function insertContents($academicId, $contentItems, $documentIds = []) {
        $stmtContent = $this->conn->prepare(
            "INSERT INTO entity_contents (id, entity_type, entity_id, heading, content_text, display_order) VALUES (?, 'academic', ?, ?, ?, ?)"
        );
        $stmtDetail = $this->conn->prepare(
            "INSERT INTO entity_content_details (id, entity_content_id, image_id, title, embedded_url, display_order) VALUES (?, ?, ?, ?, ?, ?)"
        );

        foreach ($contentItems as $index => $item) {
            $contentId = generateUUID();
            $stmtContent->execute([
                $contentId,
                $academicId,
                $item['heading'] ?? '',
                $item['content_text'] ?? '',
                $item['display_order'] ?? $index,
            ]);

            $images = $item['image_url'] ?? [];
            if (is_string($images)) {
                $images = json_decode($images, true) ?? [];
            }
            if (!is_array($images)) {
                $images = [];
            }

            $sectionDocIds = $documentIds[$index] ?? [];
            if (!is_array($sectionDocIds)) {
                $sectionDocIds = $sectionDocIds ? [$sectionDocIds] : [];
            }

            $detailOrder = 0;
            foreach ($images as $imgIdx => $img) {
                if (is_string($img)) {
                    $docId = $sectionDocIds[$imgIdx] ?? null;
                    $title = '';
                } else {
                    $docId = $img['document_id'] ?? ($sectionDocIds[$imgIdx] ?? null);
                    $title = $img['title'] ?? '';
                }
                if ($docId) {
                    $stmtDetail->execute([
                        generateUUID(), $contentId, $docId, $title, null, $detailOrder++,
                    ]);
                }
            }

            $embeds = $item['embed_urls'] ?? [];
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

    private function deleteContents($academicId) {
        $stmt = $this->conn->prepare("DELETE FROM entity_contents WHERE entity_type = 'academic' AND entity_id = ?");
        $stmt->execute([$academicId]);
    }
}
