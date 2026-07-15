<?php
class ActiveUser {
    private $conn;
    private $table = 'active_users';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function findById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function create($id, $name, $email, $role, $token) {
        $stmt = $this->conn->prepare(
            "REPLACE INTO {$this->table} (id, name, email, role, token, active_time, is_logged_in) 
             VALUES (?, ?, ?, ?, ?, NOW(), TRUE)"
        );
        return $stmt->execute([$id, $name, $email, $role, $token]);
    }

    public function delete($id) {
        $stmt = $this->conn->prepare("DELETE FROM {$this->table} WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function deleteAll() {
        $stmt = $this->conn->prepare("DELETE FROM {$this->table}");
        return $stmt->execute();
    }
}
