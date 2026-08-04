<?php
require_once __DIR__ . '/../helpers/uuid.php';
require_once __DIR__ . '/../helpers/url.php';

class Project {
    private $conn;
    private $table = 'projects';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function findAll() {
        $stmt = $this->conn->prepare(
            "SELECT p.*,
                    bg_doc.relative_path AS background_image_url,
                    COALESCE(icon_doc.relative_path, p.icons) AS icon_url
             FROM {$this->table} p
             LEFT JOIN documents bg_doc ON p.background_document_id = bg_doc.id
             LEFT JOIN documents icon_doc ON p.document_id = icon_doc.id
             ORDER BY p.created_at DESC"
        );
        $stmt->execute();
        $projects = $stmt->fetchAll();

        foreach ($projects as &$project) {
            $project['tags'] = $this->getTags($project['id']);
            $project['contents'] = $this->getContents($project['id']);
            $project['links'] = $this->getLinks($project['id']);
            $project = resolveRecordUrls($project);
            $project['icons'] = $this->buildIconData($project);
        }
        return $projects;
    }

    public function findById($id) {
        $stmt = $this->conn->prepare(
            "SELECT p.*,
                    bg_doc.relative_path AS background_image_url,
                    COALESCE(icon_doc.relative_path, p.icons) AS icon_url
             FROM {$this->table} p
             LEFT JOIN documents bg_doc ON p.background_document_id = bg_doc.id
             LEFT JOIN documents icon_doc ON p.document_id = icon_doc.id
             WHERE p.id = ?"
        );
        $stmt->execute([$id]);
        $project = $stmt->fetch();

        if ($project) {
            $project['content_detail'] = $project['contents'];
            $project['tags'] = $this->getTags($project['id']);
            $project['contents'] = $this->getContents($project['id']);
            $project['links'] = $this->getLinks($project['id']);
            $project = resolveRecordUrls($project);
            $project['icons'] = $this->buildIconData($project);
        }
        return $project;
    }

    public function create($data) {
        $this->conn->beginTransaction();
        try {
            $id = generateUUID();

            $iconUrl = null;
            $iconDocId = null;
            if (!empty($data['icons'])) {
                if (is_array($data['icons'])) {
                    $iconUrl = $data['icons'][0]['url'] ?? $data['icons'][0]['icon'] ?? null;
                    $iconDocId = $data['icons'][0]['document_id'] ?? null;
                } else {
                    $iconUrl = $data['icons'];
                }
            }
            if (!$iconDocId) {
                $iconDocId = $data['document_id'] ?? null;
            }

            $stmt = $this->conn->prepare(
                "INSERT INTO {$this->table} (id, name, category, description, detail, icons, document_id, link, contents, source_code_link, background_document_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $stmt->execute([
                $id, $data['name'], $data['category'] ?? 'workproject',
                $data['description'] ?? null,
                $data['detail'] ?? null,
                $iconUrl,
                $iconDocId, $data['link'] ?? true,
                $data['contents'] ?? null, $data['source_code_link'] ?? null,
                $data['backgroundDocumentId'] ?? null
            ]);

            if (!empty($data['tags'])) {
                $this->insertTags($id, $data['tags']);
            }
            if (!empty($data['links'])) {
                $this->insertLinks($id, $data['links']);
            }
            if (!empty($data['contentItems'])) {
                $this->insertContents($id, $data['contentItems']);
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
            $old = $this->findById($id);

            $iconUrl = null;
            $iconDocId = null;
            if (!empty($data['icons'])) {
                if (is_array($data['icons'])) {
                    $iconUrl = $data['icons'][0]['url'] ?? $data['icons'][0]['icon'] ?? null;
                    $iconDocId = $data['icons'][0]['document_id'] ?? null;
                } else {
                    $iconUrl = $data['icons'];
                }
            }
            if (!$iconDocId) {
                $iconDocId = $data['document_id'] ?? ($old['document_id'] ?? null);
            }
            if (!$iconUrl) {
                $iconUrl = $old['icons'] ?? null;
            }

            $stmt = $this->conn->prepare(
                "UPDATE {$this->table} SET name = ?, category = ?, description = ?, detail = ?, icons = ?, document_id = ?,
                 link = ?, contents = ?, source_code_link = ?, background_document_id = ? WHERE id = ?"
            );
            $stmt->execute([
                $data['name'], $data['category'] ?? 'workproject',
                $data['description'] ?? null,
                $data['detail'] ?? null,
                $iconUrl,
                $iconDocId, $data['link'] ?? true,
                $data['contents'] ?? null, $data['source_code_link'] ?? null,
                $data['backgroundDocumentId'] ?? null, $id
            ]);

            if (isset($data['tags'])) {
                $this->deleteTags($id);
                $this->insertTags($id, $data['tags']);
            }
            if (isset($data['links'])) {
                $this->deleteLinks($id);
                $this->insertLinks($id, $data['links']);
            }
            if (isset($data['contentItems'])) {
                $oldContents = $this->getContents($id);
                $this->deleteContents($id);
                $this->insertContents($id, $data['contentItems']);

                require_once __DIR__ . '/Document.php';
                $docModel = new Document($this->conn);
                require_once __DIR__ . '/../middleware/upload.php';
                $uploader = new UploadMiddleware();

                $newDocIds = [];
                foreach ($data['contentItems'] as $section) {
                    $images = $section['image_url'] ?? [];
                    if (is_string($images)) {
                        $images = json_decode($images, true) ?? [];
                    }
                    foreach ((array)$images as $img) {
                        if (is_array($img) && !empty($img['document_id'])) {
                            $newDocIds[] = $img['document_id'];
                        }
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
            $stmt = $this->conn->prepare(
                "SELECT ecd.image_id
                 FROM entity_content_details ecd
                 JOIN entity_contents ec ON ecd.entity_content_id = ec.id
                 WHERE ec.entity_type = 'project' AND ec.entity_id = ?"
            );
            $stmt->execute([$id]);
            $contentDocs = $stmt->fetchAll();

            $this->deleteTags($id);
            $this->deleteLinks($id);
            $this->deleteContents($id);

            $stmt = $this->conn->prepare("DELETE FROM {$this->table} WHERE id = ?");
            $stmt->execute([$id]);

            $this->conn->commit();
            return ['contents' => $contentDocs];
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    private function buildIconData($project) {
        $icons = [];
        if (!empty($project['icon_url'])) {
            $icons[] = [
                'icon_url' => $project['icon_url'],
                'document_id' => $project['document_id'] ?? null,
            ];
        }
        return $icons;
    }

    private function getTags($projectId) {
        $stmt = $this->conn->prepare("SELECT tag FROM entity_tags WHERE entity_type = 'project' AND entity_id = ?");
        $stmt->execute([$projectId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    private function insertTags($projectId, $tags) {
        $stmt = $this->conn->prepare("INSERT INTO entity_tags (id, entity_type, entity_id, tag) VALUES (?, 'project', ?, ?)");
        foreach ($tags as $tag) {
            if (trim($tag)) {
                $stmt->execute([generateUUID(), $projectId, trim($tag)]);
            }
        }
    }

    private function deleteTags($projectId) {
        $stmt = $this->conn->prepare("DELETE FROM entity_tags WHERE entity_type = 'project' AND entity_id = ?");
        $stmt->execute([$projectId]);
    }

    private function getLinks($projectId) {
        $stmt = $this->conn->prepare(
            "SELECT id, label, url FROM entity_links WHERE entity_type = 'project' AND entity_id = ? ORDER BY display_order ASC"
        );
        $stmt->execute([$projectId]);
        return $stmt->fetchAll();
    }

    private function insertLinks($projectId, $links) {
        $stmt = $this->conn->prepare(
            "INSERT INTO entity_links (id, entity_type, entity_id, label, url, display_order) VALUES (?, 'project', ?, ?, ?, ?)"
        );
        foreach ($links as $index => $link) {
            if (!empty($link['url'])) {
                $stmt->execute([generateUUID(), $projectId, $link['label'] ?? '', $link['url'], $link['display_order'] ?? $index]);
            }
        }
    }

    private function deleteLinks($projectId) {
        $stmt = $this->conn->prepare("DELETE FROM entity_links WHERE entity_type = 'project' AND entity_id = ?");
        $stmt->execute([$projectId]);
    }

    private function getContents($projectId) {
        $stmt = $this->conn->prepare(
            "SELECT ec.id, ec.heading, ec.content_text, ec.display_order
             FROM entity_contents ec
             WHERE ec.entity_type = 'project' AND ec.entity_id = ?
             ORDER BY ec.display_order ASC"
        );
        $stmt->execute([$projectId]);
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
                'content_text' => $item['content_text'] ?? '',
                'title' => $images[0]['title'] ?? ($item['heading'] ?? ''),
                'image_url' => json_encode($images),
                'embed_urls' => json_encode($embeds),
                'display_order' => $item['display_order'],
            ];
        }, $contents);
    }

    private function insertContents($projectId, $contents) {
        $stmtContent = $this->conn->prepare(
            "INSERT INTO entity_contents (id, entity_type, entity_id, heading, content_text, display_order) VALUES (?, 'project', ?, ?, ?, ?)"
        );
        $stmtDetail = $this->conn->prepare(
            "INSERT INTO entity_content_details (id, entity_content_id, image_id, title, embedded_url, display_order) VALUES (?, ?, ?, ?, ?, ?)"
        );

        foreach ($contents as $index => $item) {
            $contentId = generateUUID();
            $stmtContent->execute([
                $contentId,
                $projectId,
                $item['heading'] ?? ($item['title'] ?? ''),
                $item['content_text'] ?? '',
                $item['display_order'] ?? $index,
            ]);

            $images = $item['image_url'] ?? [];
            if (is_string($images)) {
                $images = json_decode($images, true) ?? [];
            }

            $detailOrder = 0;
            foreach ($images as $img) {
                if (is_string($img)) {
                    $docId = null;
                    $title = $img;
                } else {
                    $docId = $img['document_id'] ?? null;
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

    private function deleteContents($projectId) {
        $stmt = $this->conn->prepare("DELETE FROM entity_contents WHERE entity_type = 'project' AND entity_id = ?");
        $stmt->execute([$projectId]);
    }
}
