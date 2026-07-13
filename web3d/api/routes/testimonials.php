<?php
function handleTestimonialsRoutes($method, $segments, $db) {
    require_once __DIR__ . '/../models/Testimonial.php';
    require_once __DIR__ . '/../middleware/auth.php';

    $model = new Testimonial($db);
    $auth = new AuthMiddleware();

    $id = $segments[1] ?? null;

    if ($method === 'GET' && !$id) {
        $items = $model->findAll();
        echo json_encode(["data" => $items]);
        return;
    }

    if ($method === 'GET' && $id) {
        $item = $model->findById($id);
        if (!$item) {
            http_response_code(404);
            echo json_encode(["error" => "Not found"]);
            return;
        }
        echo json_encode(["data" => $item]);
        return;
    }

    if ($method === 'POST') {
        $auth->authenticate();
        $data = json_decode(file_get_contents('php://input'), true);

        $id = $model->create($data);
        echo json_encode(["message" => "Testimonial created", "id" => $id]);
        return;
    }

    if ($method === 'PUT' && $id) {
        $auth->authenticate();
        $data = json_decode(file_get_contents('php://input'), true);

        $model->update($id, $data);
        echo json_encode(["message" => "Testimonial updated"]);
        return;
    }

    if ($method === 'DELETE' && $id) {
        $auth->authenticate();
        $model->delete($id);
        echo json_encode(["message" => "Testimonial deleted"]);
        return;
    }

    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}
