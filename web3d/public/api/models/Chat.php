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

    public function addMessage($sessionId, $role, $content, $status = 'complete') {
        $id = generateUUID();
        $stmt = $this->conn->prepare("INSERT INTO chat_messages (id, session_id, role, content, status) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$id, $sessionId, $role, $content, $status]);
        return $id;
    }

    public function getMessage($id) {
        $stmt = $this->conn->prepare("SELECT * FROM chat_messages WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function getPendingUserMessage($sessionId) {
        $stmt = $this->conn->prepare(
            "SELECT * FROM chat_messages WHERE session_id = ? AND role = 'user' AND status = 'pending' ORDER BY seq ASC LIMIT 1"
        );
        $stmt->execute([$sessionId]);
        return $stmt->fetch();
    }

    public function claimPendingMessage($id) {
        $stmt = $this->conn->prepare(
            "UPDATE chat_messages SET status = 'processing' WHERE id = ? AND status = 'pending'"
        );
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    public function markMessageComplete($id) {
        $stmt = $this->conn->prepare("UPDATE chat_messages SET status = 'complete' WHERE id = ?");
        $stmt->execute([$id]);
    }

    public function getAssistantReplyAfter($sessionId, $afterId) {
        $after = $this->getMessage($afterId);
        if (!$after) {
            return null;
        }
        $stmt = $this->conn->prepare(
            "SELECT * FROM chat_messages WHERE session_id = ? AND role = 'assistant' AND seq > ? ORDER BY seq ASC LIMIT 1"
        );
        $stmt->execute([$sessionId, $after['seq']]);
        return $stmt->fetch();
    }

    public function getMessages($sessionId, $limit = 20) {
        $stmt = $this->conn->prepare(
            "SELECT * FROM chat_messages WHERE session_id = ? ORDER BY seq ASC LIMIT ?"
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
            "SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY seq DESC LIMIT ?"
        );
        $stmt->execute([$sessionId, $limit]);
        $messages = array_reverse($stmt->fetchAll());
        return $messages;
    }
}
