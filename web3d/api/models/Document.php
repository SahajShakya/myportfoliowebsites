<?php
class Document {
    private $conn;
    private $table = 'documents';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create($userId, $fileName, $originalName, $relativePath, $absolutePath, $fileType, $mimeType, $fileSize) {
        $stmt = $this->conn->prepare(
            "INSERT INTO {$this->table} (user_id, file_name, original_name, relative_path, absolute_path, file_type, mime_type, file_size, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())"
        );
        $stmt->execute([$userId, $fileName, $originalName, $relativePath, $absolutePath, $fileType, $mimeType, $fileSize]);
        return $this->conn->lastInsertId();
    }

    public function findById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function findByUserId($userId, $fileType = null) {
        if ($fileType) {
            $stmt = $this->conn->prepare(
                "SELECT * FROM {$this->table} WHERE user_id = ? AND file_type = ? ORDER BY created_at DESC"
            );
            $stmt->execute([$userId, $fileType]);
        } else {
            $stmt = $this->conn->prepare(
                "SELECT * FROM {$this->table} WHERE user_id = ? ORDER BY created_at DESC"
            );
            $stmt->execute([$userId]);
        }
        return $stmt->fetchAll();
    }

    public function delete($id) {
        $stmt = $this->conn->prepare("DELETE FROM {$this->table} WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function deleteByUserAndType($userId, $fileType) {
        $stmt = $this->conn->prepare("DELETE FROM {$this->table} WHERE user_id = ? AND file_type = ?");
        return $stmt->execute([$userId, $fileType]);
    }
}
