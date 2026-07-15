<?php
class Session {
    private $conn;
    private $table = 'sessions';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create($sessionId, $userId, $accessToken, $refreshToken, $accessExp, $refreshExp, $userAgent = '', $ipAddress = '') {
        $stmt = $this->conn->prepare(
            "INSERT INTO {$this->table} (id, user_id, access_token, refresh_token, access_token_exp, refresh_token_exp, user_agent, ip_address, is_valid)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)"
        );
        return $stmt->execute([$sessionId, $userId, $accessToken, $refreshToken, $accessExp, $refreshExp, $userAgent, $ipAddress]);
    }

    public function findByRefreshToken($refreshToken) {
        $stmt = $this->conn->prepare(
            "SELECT * FROM {$this->table} WHERE refresh_token = ? AND is_valid = TRUE"
        );
        $stmt->execute([$refreshToken]);
        return $stmt->fetch();
    }

    public function findById($sessionId) {
        $stmt = $this->conn->prepare(
            "SELECT * FROM {$this->table} WHERE id = ? AND is_valid = TRUE"
        );
        $stmt->execute([$sessionId]);
        return $stmt->fetch();
    }

    public function findValidByUserId($userId) {
        $stmt = $this->conn->prepare(
            "SELECT * FROM {$this->table} WHERE user_id = ? AND is_valid = TRUE ORDER BY created_at DESC"
        );
        $stmt->execute([$userId]);
        return $stmt->fetch();
    }

    public function updateTokens($sessionId, $newAccessToken, $newRefreshToken, $newAccessExp, $newRefreshExp) {
        $stmt = $this->conn->prepare(
            "UPDATE {$this->table} 
             SET access_token = ?, refresh_token = ?, access_token_exp = ?, refresh_token_exp = ?, updated_at = NOW()
             WHERE id = ? AND is_valid = TRUE"
        );
        return $stmt->execute([$newAccessToken, $newRefreshToken, $newAccessExp, $newRefreshExp, $sessionId]);
    }

    public function invalidate($sessionId) {
        $stmt = $this->conn->prepare(
            "UPDATE {$this->table} SET is_valid = FALSE WHERE id = ?"
        );
        return $stmt->execute([$sessionId]);
    }

    public function invalidateAllForUser($userId) {
        $stmt = $this->conn->prepare(
            "UPDATE {$this->table} SET is_valid = FALSE WHERE user_id = ?"
        );
        return $stmt->execute([$userId]);
    }

    public function invalidateByRefreshToken($refreshToken) {
        $stmt = $this->conn->prepare(
            "UPDATE {$this->table} SET is_valid = FALSE WHERE refresh_token = ?"
        );
        return $stmt->execute([$refreshToken]);
    }

    public function deleteExpired() {
        $stmt = $this->conn->prepare(
            "DELETE FROM {$this->table} WHERE refresh_token_exp < NOW() OR is_valid = FALSE"
        );
        return $stmt->execute();
    }

    public function findByAccessToken($accessToken) {
        $stmt = $this->conn->prepare(
            "SELECT * FROM {$this->table} WHERE access_token = ? AND is_valid = TRUE"
        );
        $stmt->execute([$accessToken]);
        return $stmt->fetch();
    }
}
