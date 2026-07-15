<?php
require_once __DIR__ . '/../models/CV.php';

function handleSettingsRoutes($method, $segments, $db) {
    $action = $segments[1] ?? '';

    if ($method === 'GET' && $action === 'cv-active') {
        $cvModel = new CV($db);
        $cv = $cvModel->findAnyActive();
        echo json_encode(["data" => $cv]);
        return;
    }

    if ($method === 'GET' && !$action) {
        $stmt = $db->prepare("SELECT setting_key, setting_value FROM site_settings");
        $stmt->execute();
        $rows = $stmt->fetchAll();

        $settings = [];
        foreach ($rows as $row) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }

        echo json_encode(["data" => $settings]);
        return;
    }

    if ($method === 'GET' && $action) {
        $stmt = $db->prepare("SELECT setting_value FROM site_settings WHERE setting_key = ?");
        $stmt->execute([$action]);
        $row = $stmt->fetch();

        echo json_encode(["data" => ["key" => $action, "value" => $row ? $row['setting_value'] : null]]);
        return;
    }

    http_response_code(404);
    echo json_encode(["error" => "Endpoint not found"]);
}
