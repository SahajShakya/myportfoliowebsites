<?php
class CV {
    private $conn;
    private $table = 'cvs';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function findByUserId($userId) {
        $stmt = $this->conn->prepare(
            "SELECT * FROM {$this->table} WHERE user_id = ? ORDER BY created_at DESC"
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function findById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function findActive($userId) {
        $stmt = $this->conn->prepare(
            "SELECT * FROM {$this->table} WHERE user_id = ? AND is_active = TRUE LIMIT 1"
        );
        $stmt->execute([$userId]);
        return $stmt->fetch();
    }

    public function findAnyActive() {
        $stmt = $this->conn->prepare(
            "SELECT * FROM {$this->table} WHERE is_active = TRUE LIMIT 1"
        );
        $stmt->execute();
        return $stmt->fetch();
    }

    public function create($userId, $title, $fileUrl, $isActive = false, $documentId = null) {
        if ($isActive) {
            $this->deactivateAll($userId);
        }
        $stmt = $this->conn->prepare(
            "INSERT INTO {$this->table} (user_id, title, file_url, is_active, document_id) VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->execute([$userId, $title, $fileUrl, $isActive, $documentId]);
        return $this->conn->lastInsertId();
    }

    public function update($id, $title, $isActive = null) {
        if ($isActive === true) {
            $cv = $this->findById($id);
            if ($cv) {
                $this->deactivateAll($cv['user_id']);
            }
        }
        $stmt = $this->conn->prepare(
            "UPDATE {$this->table} SET title = ?, is_active = COALESCE(?, is_active) WHERE id = ?"
        );
        return $stmt->execute([$title, $isActive, $id]);
    }

    public function setActive($id) {
        $cv = $this->findById($id);
        if (!$cv) return false;
        $this->deactivateAll($cv['user_id']);
        $stmt = $this->conn->prepare(
            "UPDATE {$this->table} SET is_active = TRUE WHERE id = ?"
        );
        return $stmt->execute([$id]);
    }

    public function deactivateAll($userId) {
        $stmt = $this->conn->prepare(
            "UPDATE {$this->table} SET is_active = FALSE WHERE user_id = ?"
        );
        return $stmt->execute([$userId]);
    }

    public function delete($id) {
        $stmt = $this->conn->prepare("DELETE FROM {$this->table} WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
