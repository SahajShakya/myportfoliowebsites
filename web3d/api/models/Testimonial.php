<?php
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
        $stmt = $this->conn->prepare(
            "INSERT INTO {$this->table} (testimonial, name, designation, company, image) 
             VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $data['testimonial'], $data['name'], $data['designation'],
            $data['company'], $data['image']
        ]);
        return $this->conn->lastInsertId();
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
