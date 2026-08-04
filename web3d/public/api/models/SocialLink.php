<?php
require_once __DIR__ . '/../helpers/uuid.php';

class SocialLink {
    private $conn;
    private $table = 'social_links';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function findByUserId($userId) {
        $stmt = $this->conn->prepare(
            "SELECT * FROM {$this->table} WHERE user_id = ? ORDER BY display_order ASC"
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function findById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function create($userId, $platform, $iconName, $url, $displayOrder = 0) {
        $id = generateUUID();
        $stmt = $this->conn->prepare(
            "INSERT INTO {$this->table} (id, user_id, platform, icon_name, url, display_order) VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([$id, $userId, $platform, $iconName, $url, $displayOrder]);
        return $id;
    }

    public function update($id, $platform, $iconName, $url, $displayOrder) {
        $stmt = $this->conn->prepare(
            "UPDATE {$this->table} SET platform = ?, icon_name = ?, url = ?, display_order = ? WHERE id = ?"
        );
        return $stmt->execute([$platform, $iconName, $url, $displayOrder, $id]);
    }

    public function delete($id) {
        $stmt = $this->conn->prepare("DELETE FROM {$this->table} WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
