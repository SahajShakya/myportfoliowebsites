<?php
class User {
    private $conn;
    private $table = 'users';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function findAll() {
        $stmt = $this->conn->prepare(
            "SELECT u.*, r.name as role_name FROM {$this->table} u 
             LEFT JOIN roles r ON u.role_id = r.id"
        );
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function findById($id) {
        $stmt = $this->conn->prepare(
            "SELECT u.*, r.name as role_name FROM {$this->table} u 
             LEFT JOIN roles r ON u.role_id = r.id 
             WHERE u.id = ?"
        );
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function findByEmail($email) {
        $stmt = $this->conn->prepare("SELECT * FROM {$this->table} WHERE email = ?");
        $stmt->execute([$email]);
        return $stmt->fetch();
    }

    public function create($id, $name, $email, $passwordHash, $roleId) {
        $stmt = $this->conn->prepare(
            "INSERT INTO {$this->table} (id, name, email, password_hash, role_id, created_at, updated_at, last_login, is_logged_in) 
             VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NOW(), FALSE)"
        );
        return $stmt->execute([$id, $name, $email, $passwordHash, $roleId]);
    }

    public function updateProfile($id, $name, $email, $phone, $bio, $tagline, $profileImage) {
        $stmt = $this->conn->prepare(
            "UPDATE {$this->table} SET name = ?, email = ?, phone = ?, bio = ?, tagline = ?, profile_image = ?, updated_at = NOW() WHERE id = ?"
        );
        return $stmt->execute([$name, $email, $phone, $bio, $tagline, $profileImage, $id]);
    }

    public function updateMaterialsUrl($id, $materialsUrl) {
        $stmt = $this->conn->prepare(
            "UPDATE {$this->table} SET materials_url = ?, updated_at = NOW() WHERE id = ?"
        );
        return $stmt->execute([$materialsUrl, $id]);
    }

    public function updateDocumentId($id, $documentId) {
        $stmt = $this->conn->prepare(
            "UPDATE {$this->table} SET document_id = ?, updated_at = NOW() WHERE id = ?"
        );
        return $stmt->execute([$documentId, $id]);
    }

    public function clearDocumentId($id) {
        $stmt = $this->conn->prepare(
            "UPDATE {$this->table} SET document_id = NULL, updated_at = NOW() WHERE id = ?"
        );
        return $stmt->execute([$id]);
    }

    public function updatePassword($id, $passwordHash) {
        $stmt = $this->conn->prepare(
            "UPDATE {$this->table} SET password_hash = ?, updated_at = NOW() WHERE id = ?"
        );
        return $stmt->execute([$passwordHash, $id]);
    }

    public function updateLogin($id, $isLoggedIn) {
        $stmt = $this->conn->prepare(
            "UPDATE {$this->table} SET is_logged_in = ?, last_login = NOW() WHERE id = ?"
        );
        return $stmt->execute([$isLoggedIn, $id]);
    }

    public function updateLastLogin($id) {
        $stmt = $this->conn->prepare(
            "UPDATE {$this->table} SET last_login = NOW() WHERE id = ?"
        );
        return $stmt->execute([$id]);
    }

    public function delete($id) {
        $stmt = $this->conn->prepare("DELETE FROM {$this->table} WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
