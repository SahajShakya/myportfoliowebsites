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
        $input = json_decode(file_get_contents('php://input'), true);
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
            require_once __DIR__ . '/../models/Chat.php';
            $chat = new Chat($db);
            $session = $chat->getSession($sessionId);
            if (!$session) {
                $chat->createSession($sessionId);
            }
        }

        $result = $rag->sendMessage($sessionId, $message);

        if (isset($result['error'])) {
            http_response_code(429);
            echo json_encode($result);
            return;
        }

        echo json_encode([
            'session_id' => $sessionId,
            'response' => $result['response'],
            'sources' => $result['sources'],
            'relevance' => $result['relevance'] ?? 'unknown',
        ]);
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
