<?php
require_once __DIR__ . '/../helpers/uuid.php';

class CV {
    private $conn;
    private $table = 'documents';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function findByUserId($userId) {
        $stmt = $this->conn->prepare(
            "SELECT * FROM {$this->table} WHERE user_id = ? AND file_type = 'cv' ORDER BY created_at DESC"
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function findById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM {$this->table} WHERE id = ? AND file_type = 'cv'");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function findActive($userId) {
        $stmt = $this->conn->prepare(
            "SELECT * FROM {$this->table} WHERE user_id = ? AND file_type = 'cv' AND file_name LIKE '%active%' LIMIT 1"
        );
        $stmt->execute([$userId]);
        return $stmt->fetch();
    }

    public function findAnyActive() {
        $stmt = $this->conn->prepare(
            "SELECT * FROM {$this->table} WHERE file_type = 'cv' AND file_name LIKE '%active%' LIMIT 1"
        );
        $stmt->execute();
        return $stmt->fetch();
    }

    public function create($userId, $title, $fileUrl, $isActive = false, $documentId = null) {
        $id = $documentId ?? generateUUID();
        return $id;
    }

    public function update($id, $title, $isActive = null) {
        return true;
    }

    public function setActive($id) {
        return true;
    }

    public function deactivateAll($userId) {
        return true;
    }

    public function delete($id) {
        $stmt = $this->conn->prepare("DELETE FROM {$this->table} WHERE id = ? AND file_type = 'cv'");
        return $stmt->execute([$id]);
    }
}
