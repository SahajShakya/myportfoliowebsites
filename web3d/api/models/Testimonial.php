<?php
require_once __DIR__ . '/../helpers/uuid.php';

class Testimonial {
    private $conn;
    private $table = 'testimonials';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function findAll() {
        $stmt = $this->conn->prepare("SELECT * FROM {$this->table} ORDER BY created_at DESC");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function findById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function create($data) {
        $id = generateUUID();
        $stmt = $this->conn->prepare(
            "INSERT INTO {$this->table} (id, testimonial, name, designation, company, image) 
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $id,
            $data['testimonial'], $data['name'], $data['designation'],
            $data['company'], $data['image']
        ]);
        return $id;
    }

    public function update($id, $data) {
        $stmt = $this->conn->prepare(
            "UPDATE {$this->table} SET testimonial = ?, name = ?, designation = ?, company = ?, image = ? WHERE id = ?"
        );
        $stmt->execute([
            $data['testimonial'], $data['name'], $data['designation'],
            $data['company'], $data['image'], $id
        ]);
        return true;
    }

    public function delete($id) {
        $stmt = $this->conn->prepare("DELETE FROM {$this->table} WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
