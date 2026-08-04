<?php
require_once __DIR__ . '/../helpers/uuid.php';

class Testimonial {
    private $conn;
    private $table = 'testimonials';

    public function __construct($db) {
        $this->conn = $db;
    }

    private function imageUrl($relativePath) {
        if (empty($relativePath)) {
            return null;
        }
        if (strpos($relativePath, 'http://') === 0 || strpos($relativePath, 'https://') === 0) {
            return $relativePath;
        }
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost:8000';
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        return $protocol . '://' . $host . $relativePath;
    }

    private function mapRow($row) {
        $image = $this->imageUrl($row['image_path'] ?? '');
        unset($row['image_path']);
        $row['image'] = $image;
        return $row;
    }

    private function selectWithImage() {
        return "SELECT t.id, t.testimonial, t.name, t.designation, t.company, t.image_id, t.created_at,
                       d.relative_path AS image_path
                FROM {$this->table} t
                LEFT JOIN documents d ON t.image_id = d.id";
    }

    public function findAll() {
        $stmt = $this->conn->prepare($this->selectWithImage() . " ORDER BY t.created_at DESC");
        $stmt->execute();
        return array_map([$this, 'mapRow'], $stmt->fetchAll());
    }

    public function findById($id) {
        $stmt = $this->conn->prepare($this->selectWithImage() . " WHERE t.id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? $this->mapRow($row) : false;
    }

    public function create($data) {
        $id = generateUUID();
        $stmt = $this->conn->prepare(
            "INSERT INTO {$this->table} (id, testimonial, name, designation, company, image_id) 
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $id,
            $data['testimonial'], $data['name'], $data['designation'],
            $data['company'], $data['image_id'] ?? null
        ]);
        return $id;
    }

    public function update($id, $data) {
        $stmt = $this->conn->prepare(
            "UPDATE {$this->table} SET testimonial = ?, name = ?, designation = ?, company = ?, image_id = ? WHERE id = ?"
        );
        $stmt->execute([
            $data['testimonial'], $data['name'], $data['designation'],
            $data['company'], $data['image_id'] ?? null, $id
        ]);
        return true;
    }

    public function delete($id) {
        $stmt = $this->conn->prepare("SELECT image_id FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        $imageId = $row['image_id'] ?? null;

        $del = $this->conn->prepare("DELETE FROM {$this->table} WHERE id = ?");
        $del->execute([$id]);

        return ['image_id' => $imageId];
    }
}
