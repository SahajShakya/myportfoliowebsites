<?php
function toAbsoluteUrl($relativePath) {
    if (empty($relativePath) || !is_string($relativePath)) {
        return $relativePath;
    }

    if (strpos($relativePath, 'http://') === 0 || strpos($relativePath, 'https://') === 0) {
        return $relativePath;
    }

    if (strpos($relativePath, '/uploads/') !== 0 && strpos($relativePath, 'uploads/') !== 0) {
        return $relativePath;
    }

    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';

    return $protocol . '://' . $host . '/' . ltrim($relativePath, '/');
}

function resolveRecordUrls($record) {
    if (!is_array($record)) return $record;

    $urlKeys = ['image_url', 'icons', 'document_url', 'photo_url', 'background_image_url', 'profile_image'];

    foreach ($urlKeys as $key) {
        if (empty($record[$key]) || !is_string($record[$key])) continue;

        $val = $record[$key];

        if ($val[0] === '[') {
            $parsed = json_decode($val, true);
            if (is_array($parsed)) {
                $parsed = array_map(function ($item) {
                    if (is_string($item)) {
                        return ['url' => toAbsoluteUrl($item)];
                    }
                    if (is_array($item)) {
                        if (isset($item['url']) && is_string($item['url'])) {
                            $item['url'] = toAbsoluteUrl($item['url']);
                        }
                        if (isset($item['icon']) && is_string($item['icon'])) {
                            $item['icon'] = toAbsoluteUrl($item['icon']);
                        }
                        if (isset($item['path']) && is_string($item['path'])) {
                            $item['path'] = toAbsoluteUrl($item['path']);
                        }
                    }
                    return $item;
                }, $parsed);
                $record[$key] = json_encode($parsed);
            }
        } else {
            $record[$key] = toAbsoluteUrl($val);
        }
    }

    return $record;
}
