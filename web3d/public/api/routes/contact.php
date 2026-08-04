<?php

require_once __DIR__ . '/../config/smtp.php';
require_once __DIR__ . '/../services/SmtpMail.php';

function handleContactRoutes($method, $segments, $db) {
    global $smtpConfig;

    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid request body"]);
        return;
    }

    $name    = trim($input['name']    ?? '');
    $email   = trim($input['email']   ?? '');
    $phone   = trim($input['phone']   ?? '');
    $address = trim($input['address'] ?? '');
    $category = trim($input['category'] ?? '');
    $title   = trim($input['title']   ?? '');
    $message = trim($input['message'] ?? '');

    if ($name === '' || $email === '' || $message === '' || $category === '') {
        http_response_code(400);
        echo json_encode(["error" => "Name, email, category, and message are required"]);
        return;
    }

    $categoryLabels = [
        'fullstack'  => 'Full Stack (Web Development)',
        'ml'         => 'ML Project',
        'cad'        => 'Low Voltage CAD Design (MEP)',
        'lecturing'  => 'Lecturing',
    ];
    $categoryLabel = $categoryLabels[$category] ?? $category;

    $htmlBody  = "<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;'>";
    $htmlBody .= "<h2 style='color:#2563eb;border-bottom:2px solid #2563eb;padding-bottom:8px;'>New Contact Request</h2>";
    $htmlBody .= "<table style='width:100%;border-collapse:collapse;margin-top:12px;'>";
    $htmlBody .= "<tr><td style='padding:8px;font-weight:bold;color:#374151;width:140px;'>Category</td><td style='padding:8px;color:#1f2937;'>{$categoryLabel}</td></tr>";
    $htmlBody .= "<tr><td style='padding:8px;font-weight:bold;color:#374151;'>Name</td><td style='padding:8px;color:#1f2937;'>{$name}</td></tr>";
    $htmlBody .= "<tr><td style='padding:8px;font-weight:bold;color:#374151;'>Email</td><td style='padding:8px;color:#1f2937;'>{$email}</td></tr>";
    if ($phone) {
        $htmlBody .= "<tr><td style='padding:8px;font-weight:bold;color:#374151;'>Phone</td><td style='padding:8px;color:#1f2937;'>{$phone}</td></tr>";
    }
    if ($address) {
        $htmlBody .= "<tr><td style='padding:8px;font-weight:bold;color:#374151;'>Address</td><td style='padding:8px;color:#1f2937;'>{$address}</td></tr>";
    }
    if ($title) {
        $htmlBody .= "<tr><td style='padding:8px;font-weight:bold;color:#374151;'>Reason</td><td style='padding:8px;color:#1f2937;'>{$title}</td></tr>";
    }
    $htmlBody .= "</table>";
    $htmlBody .= "<div style='margin-top:16px;padding:12px;background:#f3f4f6;border-radius:8px;'>";
    $htmlBody .= "<h3 style='margin:0 0 8px 0;color:#374151;'>Message</h3>";
    $htmlBody .= "<p style='margin:0;color:#1f2937;white-space:pre-wrap;'>{$message}</p>";
    $htmlBody .= "</div>";
    $htmlBody .= "</div>";

    $subject = "Portfolio Contact: {$categoryLabel} - {$name}";

    if (empty($smtpConfig['username'])) {
        http_response_code(500);
        echo json_encode(["error" => "SMTP not configured"]);
        return;
    }

    try {
        $smtp = new SmtpMail($smtpConfig);
        $smtp->send(
            $smtpConfig['to_email'],
            $smtpConfig['to_name'],
            $subject,
            $htmlBody
        );

        echo json_encode(["success" => true, "message" => "Email sent successfully"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to send email: " . $e->getMessage()]);
    }
}
