<?php
function handleKnowledgeRoutes($method, $segments, $db) {
    require_once __DIR__ . '/../middleware/auth.php';
    $auth = new AuthMiddleware();

    if ($method === 'POST' && ($segments[1] ?? '') === 'rebuild') {
        $auth->authenticate();

        require_once __DIR__ . '/../services/KnowledgeBuilder.php';
        $builder = new KnowledgeBuilder($db);
        $count = $builder->buildAll();

        echo json_encode([
            "message" => "Knowledge base trained on the latest data",
            "chunks" => $count,
        ]);
        return;
    }

    http_response_code(404);
    echo json_encode(["error" => "Knowledge action not found"]);
}
