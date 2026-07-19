<?php

require_once __DIR__ . '/database.php';

$smtpConfig = [
    'host'       => $_ENV['SMTP_HOST']   ?? 'smtp.gmail.com',
    'port'       => (int)($_ENV['SMTP_PORT'] ?? 587),
    'username'   => $_ENV['SMTP_USER']   ?? '',
    'password'   => $_ENV['SMTP_PASS']   ?? '',
    'from_email' => $_ENV['SMTP_USER']   ?? '',
    'from_name'  => $_ENV['SMTP_FROM']   ?? 'Portfolio Contact Form',
    'to_email'   => 'saz.shakya@gmail.com',
    'to_name'    => 'Sahaj Shakya',
];
