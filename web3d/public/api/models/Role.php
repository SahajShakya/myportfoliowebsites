<?php
class Role {
    private $conn;
    private $table = 'roles';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function findAll() {
        $stmt = $this->conn->prepare("SELECT * FROM {$this->table}");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function findById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function findByName($name) {
        $stmt = $this->conn->prepare("SELECT * FROM {$this->table} WHERE name = ?");
        $stmt->execute([$name]);
        return $stmt->fetch();
    }
}
