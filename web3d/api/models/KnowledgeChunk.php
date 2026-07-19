<?php
class KnowledgeChunk {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function insert($sourceTable, $sourceId, $chunkText, $metadata = []) {
        $stmt = $this->conn->prepare(
            "INSERT INTO knowledge_chunks (source_table, source_id, chunk_text, metadata) VALUES (?, ?, ?, ?)"
        );
        $stmt->execute([$sourceTable, $sourceId, $chunkText, json_encode($metadata)]);
        return $this->conn->lastInsertId();
    }

    public function search($query, $limit = 5) {
        $stmt = $this->conn->prepare(
            "SELECT id, source_table, source_id, chunk_text, metadata,
                    MATCH(chunk_text) AGAINST(? IN NATURAL LANGUAGE MODE) AS relevance
             FROM knowledge_chunks
             WHERE MATCH(chunk_text) AGAINST(? IN NATURAL LANGUAGE MODE)
             ORDER BY relevance DESC
             LIMIT ?"
        );
        $stmt->execute([$query, $query, $limit]);
        return $stmt->fetchAll();
    }

    public function searchWithFallback($query, $limit = 5) {
        $results = $this->search($query, $limit);

        if (empty($results)) {
            $keywords = explode(' ', $query);
            $conditions = [];
            $params = [];
            foreach ($keywords as $word) {
                $word = trim($word);
                if (strlen($word) > 2) {
                    $conditions[] = "chunk_text LIKE ?";
                    $params[] = "%{$word}%";
                }
            }

            if (!empty($conditions)) {
                $where = implode(' OR ', $conditions);
                $stmt = $this->conn->prepare(
                    "SELECT id, source_table, source_id, chunk_text, metadata
                     FROM knowledge_chunks
                     WHERE {$where}
                     LIMIT ?"
                );
                $params[] = $limit;
                $stmt->execute($params);
                $results = $stmt->fetchAll();
            }
        }

        return $results;
    }

    public function searchExact($query, $limit = 3) {
        $keywords = array_filter(array_map('trim', explode(' ', $query)), function($w) {
            return strlen($w) > 1;
        });

        if (empty($keywords)) return [];

        $conditions = [];
        $params = [];
        foreach ($keywords as $word) {
            $conditions[] = "chunk_text LIKE ?";
            $params[] = "%{$word}%";
        }

        $where = implode(' AND ', $conditions);
        $stmt = $this->conn->prepare(
            "SELECT id, source_table, source_id, chunk_text, metadata,
                    (LENGTH(chunk_text) - LENGTH(REPLACE(LOWER(chunk_text), LOWER(?), ''))) AS match_score
             FROM knowledge_chunks
             WHERE {$where}
             ORDER BY match_score DESC
             LIMIT ?"
        );
        array_unshift($params, $query);
        $params[] = $limit;
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function searchByType($type, $query, $limit = 3) {
        $keywords = array_filter(array_map('trim', explode(' ', $query)), function($w) {
            return strlen($w) > 1;
        });

        if (empty($keywords)) return [];

        $conditions = ["JSON_EXTRACT(metadata, '$.type') = ?"];
        $params = [$type];

        foreach ($keywords as $word) {
            $conditions[] = "chunk_text LIKE ?";
            $params[] = "%{$word}%";
        }

        $where = implode(' AND ', $conditions);
        $stmt = $this->conn->prepare(
            "SELECT id, source_table, source_id, chunk_text, metadata
             FROM knowledge_chunks
             WHERE {$where}
             LIMIT ?"
        );
        $params[] = $limit;
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function deleteAll() {
        $stmt = $this->conn->prepare("DELETE FROM knowledge_chunks");
        $stmt->execute();
    }

    public function deleteBySource($sourceTable) {
        $stmt = $this->conn->prepare("DELETE FROM knowledge_chunks WHERE source_table = ?");
        $stmt->execute([$sourceTable]);
    }

    public function getCount() {
        $stmt = $this->conn->prepare("SELECT COUNT(*) as count FROM knowledge_chunks");
        $stmt->execute();
        $result = $stmt->fetch();
        return (int)$result['count'];
    }

    public function findAll($limit = 500, $offset = 0) {
        $stmt = $this->conn->prepare(
            "SELECT * FROM knowledge_chunks ORDER BY id LIMIT ? OFFSET ?"
        );
        $stmt->execute([$limit, $offset]);
        return $stmt->fetchAll();
    }
}
