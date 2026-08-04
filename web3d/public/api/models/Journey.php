<?php
require_once __DIR__ . '/../helpers/uuid.php';
require_once __DIR__ . '/../helpers/url.php';

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
             LEFT JOIN documents icon_doc ON j.document_id = icon_doc.id"
        );
        $stmt->execute();
        $items = $stmt->fetchAll();

        foreach ($items as &$item) {
            $item['icons'] = $this->buildIconData($item);
            $item['contents'] = $this->getContents($item['id']);
            $item['links'] = $this->getLinks($item['id']);
            $item['promotions'] = $this->getPromotions($item['id']);
            $this->applyPromotionsToJourney($item);
        }
        unset($item);

        usort($items, function ($a, $b) {
            return (strtotime($a['start_date'] ?? '0000-00-00') ?: 0) - (strtotime($b['start_date'] ?? '0000-00-00') ?: 0);
        });

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
            $item['links'] = $this->getLinks($item['id']);
            $item['promotions'] = $this->getPromotions($item['id']);
            $this->applyPromotionsToJourney($item);
        }
        return $item;
    }

    private function applyPromotionsToJourney(&$item) {
        $promos = $item['promotions'] ?? [];
        if (!empty($promos)) {
            $dates = array_filter(array_column($promos, 'start_date'));
            if (!empty($dates)) {
                $item['start_date'] = min($dates);
            }
            $endDates = array_column($promos, 'end_date');
            $item['end_date'] = in_array(null, $endDates, true) ? null : (!empty($endDates) ? max($endDates) : null);

            $sorted = $promos;
            usort($sorted, function ($a, $b) {
                return (strtotime($b['start_date'] ?? '0000-00-00') ?: 0) - (strtotime($a['start_date'] ?? '0000-00-00') ?: 0);
            });
            $item['designation'] = $sorted[0]['position'] ?? '';
        }
    }

    public function create($data) {
        $this->conn->beginTransaction();
        try {
            $id = generateUUID();

            $iconDocId = $data['icons'][0]['document_id'] ?? $data['document_id'] ?? null;

            $designation = $data['designation'] ?? '';
            $startDate = $data['startDate'] ?? null;
            $endDate = $data['endDate'] ?? null;
            if (!empty($data['promotions'])) {
                $first = $data['promotions'][0];
                if (!$startDate) $startDate = $first['start_date'] ?? $first['year'] ?? null;
                if (!$designation) $designation = $first['position'] ?? '';
            }

            $stmt = $this->conn->prepare(
                "INSERT INTO {$this->table} (id, title, office_name, designation, start_date, end_date, description, contents, url_of_company, background_document_id, document_id, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())"
            );
            $stmt->execute([
                $id,
                $data['title'], $data['office_name'], $designation,
                $startDate, $endDate,
                $data['description'] ?? null, $data['contents'] ?? null,
                $data['urlofCompany'] ?? null,
                $data['backgroundDocumentId'] ?? null,
                $iconDocId
            ]);

            if (!empty($data['contentItems'])) {
                $this->insertContents($id, $data['contentItems'], $data['contentDocumentIds'] ?? []);
            }

            if (!empty($data['links'])) {
                $this->insertLinks($id, $data['links']);
            }

            if (!empty($data['promotions'])) {
                $this->insertPromotions($id, $data['promotions']);
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

            $submittedIconDocId = $data['icons'][0]['document_id'] ?? $data['document_id'] ?? null;

            // Preserve existing document_id if none was submitted (frontend may lose it)
            if (!$submittedIconDocId && $oldIconDocId) {
                $iconDocId = $oldIconDocId;
            } else {
                $iconDocId = $submittedIconDocId;
            }

            $designation = $data['designation'] ?? $oldRecord['designation'] ?? '';
            $startDate = $data['startDate'] ?? $oldRecord['start_date'] ?? null;
            $endDate = $data['endDate'] ?? $oldRecord['end_date'] ?? null;
            if (isset($data['promotions']) && !empty($data['promotions'])) {
                $first = $data['promotions'][0];
                $startDate = $first['start_date'] ?? $first['year'] ?? $startDate;
                if (!$designation) $designation = $first['position'] ?? '';
            }

            $stmt = $this->conn->prepare(
                "UPDATE {$this->table} SET title = ?, office_name = ?, designation = ?, 
                 start_date = ?, end_date = ?, description = ?, contents = ?, url_of_company = ?, background_document_id = ?, document_id = ?, updated_at = NOW() WHERE id = ?"
            );
            $stmt->execute([
                $data['title'], $data['office_name'], $designation,
                $startDate, $endDate,
                $data['description'] ?? null, $data['contents'] ?? null,
                $data['urlofCompany'] ?? null,
                $data['backgroundDocumentId'] ?? null,
                $iconDocId, $id
            ]);

            require_once __DIR__ . '/Document.php';
            $docModel = new Document($this->conn);
            require_once __DIR__ . '/../middleware/upload.php';
            $uploader = new UploadMiddleware();

            $newBgDocId = $data['backgroundDocumentId'] ?? null;
            if ($oldBgDocId && $newBgDocId && $oldBgDocId !== $newBgDocId) {
                $doc = $docModel->findById($oldBgDocId);
                if ($doc) {
                    $uploader->deleteFileByAbsolute($doc['absolute_path']);
                    $docModel->delete($oldBgDocId);
                }
            }

            if ($oldIconDocId && $iconDocId && $oldIconDocId !== $iconDocId) {
                $doc = $docModel->findById($oldIconDocId);
                if ($doc) {
                    $uploader->deleteFileByAbsolute($doc['absolute_path']);
                    $docModel->delete($oldIconDocId);
                }
            }

            if (!empty($data['contentItems'])) {
                $this->deleteContents($id);
                $this->insertContents($id, $data['contentItems'], $data['contentDocumentIds'] ?? []);
            }

            if (isset($data['links'])) {
                $this->deleteLinks($id);
                $this->insertLinks($id, $data['links']);
            }

            if (isset($data['promotions'])) {
                $this->deletePromotions($id);
                $this->insertPromotions($id, $data['promotions']);
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
            $this->deleteLinks($id);
            $this->deletePromotions($id);

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
        // If we have at least a URL, return icon data even if document_id is missing
        if (!$iconUrl) {
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
            "SELECT ec.id, ec.heading, ec.content_text, ec.display_order
             FROM entity_contents ec 
             WHERE ec.entity_type = 'journey' AND ec.entity_id = ? 
             ORDER BY ec.display_order ASC"
        );
        $stmt->execute([$journeyId]);
        return $stmt->fetchAll();
    }

    private function insertContents($journeyId, $contentItems, $documentIds = []) {
        $stmt = $this->conn->prepare(
            "INSERT INTO entity_contents (id, entity_type, entity_id, heading, content_text, display_order) VALUES (?, 'journey', ?, ?, ?, ?)"
        );
        foreach ($contentItems as $index => $item) {
            $stmt->execute([
                generateUUID(),
                $journeyId,
                $item['heading'] ?? '',
                $item['content_text'] ?? '',
                $item['display_order'] ?? $index,
            ]);
        }
    }

    private function deleteContents($journeyId) {
        $stmt = $this->conn->prepare("DELETE FROM entity_contents WHERE entity_type = 'journey' AND entity_id = ?");
        $stmt->execute([$journeyId]);
    }

    private function getLinks($entityId) {
        $stmt = $this->conn->prepare(
            "SELECT id, label, url, display_order FROM entity_links WHERE entity_type = 'journey' AND entity_id = ? ORDER BY display_order ASC"
        );
        $stmt->execute([$entityId]);
        return $stmt->fetchAll();
    }

    private function insertLinks($entityId, $links) {
        $stmt = $this->conn->prepare(
            "INSERT INTO entity_links (id, entity_type, entity_id, label, url, display_order) VALUES (?, 'journey', ?, ?, ?, ?)"
        );
        foreach ($links as $index => $link) {
            $label = $link['label'] ?? '';
            $url = $link['url'] ?? '';
            if (empty($url)) continue;
            $stmt->execute([generateUUID(), $entityId, $label, $url, $link['display_order'] ?? $index]);
        }
    }

    private function deleteLinks($entityId) {
        $stmt = $this->conn->prepare("DELETE FROM entity_links WHERE entity_type = 'journey' AND entity_id = ?");
        $stmt->execute([$entityId]);
    }

    private function getPromotions($journeyId) {
        $stmt = $this->conn->prepare(
            "SELECT id, start_date, end_date, year, position, description, display_order FROM entity_promotions WHERE journey_id = ? ORDER BY display_order ASC, start_date ASC"
        );
        $stmt->execute([$journeyId]);
        $promotions = $stmt->fetchAll();
        
        foreach ($promotions as &$promo) {
            $promo['content_items'] = $this->getPromotionContents($promo['id']);
        }
        return $promotions;
    }

    private function getPromotionContents($promotionId) {
        $stmt = $this->conn->prepare(
            "SELECT id, heading, content_text, display_order FROM entity_promotion_contents WHERE promotion_id = ? ORDER BY display_order ASC"
        );
        $stmt->execute([$promotionId]);
        $contents = $stmt->fetchAll();
        
        foreach ($contents as &$content) {
            $detailStmt = $this->conn->prepare(
                "SELECT epcd.id, epcd.title, epcd.display_order, epcd.embedded_url, d.relative_path AS image_url, epcd.image_id AS document_id
                 FROM entity_promotion_content_details epcd
                 LEFT JOIN documents d ON epcd.image_id = d.id
                 WHERE epcd.promotion_content_id = ?
                 ORDER BY epcd.display_order ASC"
            );
            $detailStmt->execute([$content['id']]);
            $details = $detailStmt->fetchAll();

            $images = [];
            $embeds = [];
            foreach ($details as $d) {
                if (!empty($d['embedded_url'])) {
                    $parsed = json_decode($d['embedded_url'], true);
                    if (is_array($parsed) && !empty($parsed['url'])) {
                        $embeds[] = $parsed;
                    }
                } else {
                    $images[] = [
                        'url' => $d['image_url'] ?? '',
                        'title' => $d['title'] ?? '',
                        'document_id' => $d['document_id'] ?? null,
                    ];
                }
            }

            $content['image_url'] = $images;
            $content['embed_urls'] = $embeds;
        }
        return $contents;
    }

    private function insertPromotions($journeyId, $promotions) {
        $stmtPromo = $this->conn->prepare(
            "INSERT INTO entity_promotions (id, journey_id, start_date, end_date, year, position, description, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmtContent = $this->conn->prepare(
            "INSERT INTO entity_promotion_contents (id, promotion_id, heading, content_text, display_order) VALUES (?, ?, ?, ?, ?)"
        );
        $stmtDetail = $this->conn->prepare(
            "INSERT INTO entity_promotion_content_details (id, promotion_content_id, image_id, title, embedded_url, display_order) VALUES (?, ?, ?, ?, ?, ?)"
        );
        
        foreach ($promotions as $index => $promo) {
            $promoId = generateUUID();
            $stmtPromo->execute([
                $promoId,
                $journeyId,
                $promo['start_date'] ?? $promo['year'] ?? date('Y-m-d'),
                $promo['end_date'] ?? null,
                $promo['year'] ?? $promo['start_date'] ?? date('Y-m-d'),
                $promo['position'] ?? '',
                $promo['description'] ?? '',
                $promo['display_order'] ?? $index,
            ]);
            
            $contentItems = $promo['contentItems'] ?? [];
            foreach ($contentItems as $cIdx => $item) {
                $contentId = generateUUID();
                $stmtContent->execute([
                    $contentId,
                    $promoId,
                    $item['heading'] ?? '',
                    $item['content_text'] ?? '',
                    $item['display_order'] ?? $cIdx,
                ]);
                
                $images = $item['image_url'] ?? [];
                $titles = $item['image_titles'] ?? [];
                if (is_string($images)) {
                    $images = json_decode($images, true) ?? [];
                }
                
                $detailOrder = 0;
                foreach ($images as $imgIdx => $img) {
                    $docId = null;
                    if (is_array($img)) {
                        $docId = $img['document_id'] ?? null;
                    }
                    $stmtDetail->execute([
                        generateUUID(),
                        $contentId,
                        $docId,
                        $titles[$imgIdx] ?? (is_array($img) ? ($img['title'] ?? '') : ''),
                        null,
                        $detailOrder++,
                    ]);
                }

                $embeds = $item['embed_urls'] ?? [];
                if (is_string($embeds)) {
                    $embeds = json_decode($embeds, true) ?? [];
                }
                if (is_array($embeds)) {
                    foreach ($embeds as $embed) {
                        $embedUrl = is_array($embed) ? ($embed['url'] ?? null) : null;
                        if (!empty($embedUrl)) {
                            $stmtDetail->execute([
                                generateUUID(),
                                $contentId,
                                null,
                                '',
                                json_encode($embed),
                                $detailOrder++,
                            ]);
                        }
                    }
                }
            }
        }
    }

    private function deletePromotions($journeyId) {
        $stmt = $this->conn->prepare("DELETE FROM entity_promotions WHERE journey_id = ?");
        $stmt->execute([$journeyId]);
    }
}
