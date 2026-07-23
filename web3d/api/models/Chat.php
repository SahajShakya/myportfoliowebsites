<?php
require_once __DIR__ . '/../helpers/uuid.php';

class Chat {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function createSession($sessionId) {
        $stmt = $this->conn->prepare("INSERT INTO chat_sessions (id) VALUES (?)");
        $stmt->execute([$sessionId]);
        return $sessionId;
    }

    public function getSession($sessionId) {
        $stmt = $this->conn->prepare("SELECT * FROM chat_sessions WHERE id = ?");
        $stmt->execute([$sessionId]);
        return $stmt->fetch();
    }

    public function deleteSession($sessionId) {
        $stmt = $this->conn->prepare("DELETE FROM chat_sessions WHERE id = ?");
        $stmt->execute([$sessionId]);
    }

    public function addMessage($sessionId, $role, $content) {
        $id = generateUUID();
        $stmt = $this->conn->prepare("INSERT INTO chat_messages (id, session_id, role, content) VALUES (?, ?, ?, ?)");
        $stmt->execute([$id, $sessionId, $role, $content]);
        return $id;
    }

    public function getMessages($sessionId, $limit = 20) {
        $stmt = $this->conn->prepare(
            "SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT ?"
        );
        $stmt->execute([$sessionId, $limit]);
        return $stmt->fetchAll();
    }

    public function getMessageCount($sessionId) {
        $stmt = $this->conn->prepare(
            "SELECT COUNT(*) as count FROM chat_messages WHERE session_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)"
        );
        $stmt->execute([$sessionId]);
        $result = $stmt->fetch();
        return (int)$result['count'];
    }

    public function getRecentMessages($sessionId, $limit = 10) {
        $stmt = $this->conn->prepare(
            "SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at DESC LIMIT ?"
        );
        $stmt->execute([$sessionId, $limit]);
        $messages = array_reverse($stmt->fetchAll());
        return $messages;
    }
}
