<?php
function handleChatRoutes($method, $segments, $db) {
    require_once __DIR__ . '/../services/RagService.php';

    $apiKey = $_ENV['OPENROUTER_API_KEY'] ?? '';
    $model = $_ENV['OPENROUTER_MODEL'] ?? 'openai/gpt-4o';

    if (!$apiKey) {
        http_response_code(500);
        echo json_encode(["error" => "Chat service not configured"]);
        return;
    }

    $rag = new RagService($db, $apiKey, $model);
    $action = $segments[1] ?? '';

    if ($method === 'POST' && $action === 'message') {
        require_once __DIR__ . '/../models/Chat.php';
        $chat = new Chat($db);

        $input = json_decode(file_get_contents('php://input'), true);
        if (!is_array($input)) {
            $input = $_POST;
        }
        $sessionId = $input['session_id'] ?? '';
        $message = trim($input['message'] ?? '');

        if (!$message) {
            http_response_code(400);
            echo json_encode(["error" => "Message is required"]);
            return;
        }

        if (!$sessionId) {
            $sessionId = $rag->createSession();
        } else {
            $session = $chat->getSession($sessionId);
            if (!$session) {
                $chat->createSession($sessionId);
            }
        }

        $messageId = $chat->addMessage($sessionId, 'user', $message, 'pending');

        echo json_encode([
            'session_id' => $sessionId,
            'message_id' => $messageId,
        ]);
        return;
    }

    if ($method === 'GET' && $action === 'poll') {
        require_once __DIR__ . '/../models/Chat.php';
        $chat = new Chat($db);

        $sessionId = $_GET['session_id'] ?? '';
        $afterId = $_GET['after'] ?? '';

        if (!$sessionId || !$afterId) {
            http_response_code(400);
            echo json_encode(["error" => "session_id and after are required"]);
            return;
        }

        $reply = $chat->getAssistantReplyAfter($sessionId, $afterId);
        if ($reply) {
            echo json_encode([
                'status' => 'complete',
                'session_id' => $sessionId,
                'response' => $reply['content'],
                'sources' => [],
                'relevance' => 'stored',
            ]);
            return;
        }

        $pending = $chat->getPendingUserMessage($sessionId);
        if ($pending && $chat->claimPendingMessage($pending['id'])) {
            $result = $rag->generateReply($sessionId, $pending['content']);
            $chat->markMessageComplete($pending['id']);

            if (isset($result['error'])) {
                http_response_code(429);
                echo json_encode([
                    'status' => 'error',
                    'error' => $result['error'],
                ]);
                return;
            }

            echo json_encode([
                'status' => 'complete',
                'session_id' => $sessionId,
                'response' => $result['response'],
                'sources' => $result['sources'],
                'relevance' => $result['relevance'] ?? 'unknown',
            ]);
            return;
        }

        echo json_encode(['status' => 'processing', 'session_id' => $sessionId]);
        return;
    }

    if ($method === 'GET' && $action === 'history') {
        $sessionId = $segments[2] ?? '';
        if (!$sessionId) {
            http_response_code(400);
            echo json_encode(["error" => "Session ID is required"]);
            return;
        }

        $messages = $rag->getHistory($sessionId);
        echo json_encode(['data' => $messages]);
        return;
    }

    if ($method === 'DELETE' && $action === 'history') {
        $sessionId = $segments[2] ?? '';
        if (!$sessionId) {
            http_response_code(400);
            echo json_encode(["error" => "Session ID is required"]);
            return;
        }

        $rag->clearHistory($sessionId);
        echo json_encode(["message" => "Chat history cleared"]);
        return;
    }

    if ($method === 'POST' && $action === 'session') {
        $sessionId = $rag->createSession();
        echo json_encode(['session_id' => $sessionId]);
        return;
    }

    if ($method === 'POST' && $action === 'rebuild') {
        require_once __DIR__ . '/../services/KnowledgeBuilder.php';
        $builder = new KnowledgeBuilder($db);
        $count = $builder->buildAll();
        echo json_encode(["message" => "Knowledge base rebuilt", "chunks" => $count]);
        return;
    }

    http_response_code(404);
    echo json_encode(["error" => "Chat action not found"]);
}
