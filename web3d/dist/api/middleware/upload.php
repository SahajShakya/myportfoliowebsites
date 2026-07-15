<?php
class UploadMiddleware {
    private $uploadDir;
    private $maxFileSize;
    private $allowedTypes;
    private $imageQuality;
    private $maxImageWidth;

    public function __construct($uploadDir = null, $maxFileSize = 10485760) {
        $this->uploadDir = $uploadDir ?? dirname(__DIR__, 2) . '/uploads';
        $this->maxFileSize = $maxFileSize;
        $this->imageQuality = 82;
        $this->maxImageWidth = 1920;
        $this->allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
            'application/pdf', 'video/mp4', 'video/webm',
            'application/octet-stream',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
    }

    public function handleUpload($files, $basePath = '') {
        $uploadedFiles = [];
        $now = new DateTime();
        $year = $now->format('Y');
        $month = $now->format('m');

        $targetDir = $this->uploadDir;
        if ($basePath) {
            $targetDir .= '/' . $basePath;
        }
        $targetDir .= '/' . $year . '/' . $month;

        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        if (!isset($files['files']) || empty($files['files']['name'][0])) {
            $singleFile = $files['files'] ?? $files['file'] ?? null;
            if ($singleFile && isset($singleFile['name']) && $singleFile['name'] !== '') {
                $files['files'] = [
                    'name' => [$singleFile['name']],
                    'type' => [$singleFile['type']],
                    'tmp_name' => [$singleFile['tmp_name']],
                    'error' => [$singleFile['error']],
                    'size' => [$singleFile['size']],
                ];
            } else {
                return ["error" => "No files provided"];
            }
        }

        $count = count($files['files']['name']);

        for ($i = 0; $i < $count; $i++) {
            $fileName = $files['files']['name'][$i];
            $fileType = $files['files']['type'][$i];
            $fileTmp = $files['files']['tmp_name'][$i];
            $fileError = $files['files']['error'][$i];
            $fileSize = $files['files']['size'][$i];

            if ($fileError !== UPLOAD_ERR_OK) {
                continue;
            }

            if ($fileSize > $this->maxFileSize) {
                continue;
            }

            $cleanName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $fileName);
            $timestamp = $now->format('YmdHis');
            $savedName = $timestamp . '_' . $cleanName;
            $savedPath = $targetDir . '/' . $savedName;

            if ($this->isImage($fileType)) {
                $compressed = $this->compressImage($fileTmp, $savedPath, $fileType);
                if ($compressed) {
                    $fileSize = filesize($savedPath);
                } else {
                    move_uploaded_file($fileTmp, $savedPath);
                }
            } else {
                move_uploaded_file($fileTmp, $savedPath);
            }

            if (file_exists($savedPath)) {
                $relativePath = '/uploads/' . ltrim(str_replace($this->uploadDir, '', $savedPath), '/');
                $absolutePath = $savedPath;
                $uploadedFiles[] = [
                    'relative_path' => $relativePath,
                    'absolute_path' => $absolutePath,
                    'file_name' => $savedName,
                    'original_name' => $fileName,
                    'mime_type' => $fileType,
                    'file_size' => $fileSize,
                ];
            }
        }

        return $uploadedFiles;
    }

    private function isImage($mimeType) {
        return in_array($mimeType, ['image/jpeg', 'image/png', 'image/webp']);
    }

    private function compressImage($sourcePath, $destPath, $mimeType) {
        if (!function_exists('imagecreatefromjpeg') && !function_exists('imagecreatefrompng')) {
            return false;
        }

        $imageInfo = @getimagesize($sourcePath);
        if (!$imageInfo) {
            return false;
        }

        $origWidth = $imageInfo[0];
        $origHeight = $imageInfo[1];
        $imageType = $imageInfo[2];

        switch ($imageType) {
            case IMAGETYPE_JPEG:
                $resource = @imagecreatefromjpeg($sourcePath);
                break;
            case IMAGETYPE_PNG:
                $resource = @imagecreatefrompng($sourcePath);
                break;
            case IMAGETYPE_WEBP:
                if (function_exists('imagecreatefromwebp')) {
                    $resource = @imagecreatefromwebp($sourcePath);
                } else {
                    return false;
                }
                break;
            default:
                return false;
        }

        if (!$resource) {
            return false;
        }

        $newWidth = $origWidth;
        $newHeight = $origHeight;

        if ($origWidth > $this->maxImageWidth) {
            $ratio = $this->maxImageWidth / $origWidth;
            $newWidth = $this->maxImageWidth;
            $newHeight = (int)($origHeight * $ratio);
        }

        $resized = imagecreatetruecolor($newWidth, $newHeight);

        if ($imageType === IMAGETYPE_PNG || $imageType === IMAGETYPE_WEBP) {
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            $transparent = imagecolorallocatealpha($resized, 0, 0, 0, 127);
            imagefilledrectangle($resized, 0, 0, $newWidth, $newHeight, $transparent);
        }

        imagecopyresampled($resized, $resource, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);

        $saved = false;

        switch ($imageType) {
            case IMAGETYPE_JPEG:
                $destPath = preg_replace('/\.[^.]+$/', '.jpg', $destPath);
                $saved = imagejpeg($resized, $destPath, $this->imageQuality);
                break;
            case IMAGETYPE_PNG:
                $pngQuality = (int)floor((100 - $this->imageQuality) / 10);
                $pngQuality = max(0, min(9, $pngQuality));
                $destPath = preg_replace('/\.[^.]+$/', '.png', $destPath);
                $saved = imagepng($resized, $destPath, $pngQuality);
                break;
            case IMAGETYPE_WEBP:
                $destPath = preg_replace('/\.[^.]+$/', '.webp', $destPath);
                $saved = imagewebp($resized, $destPath, $this->imageQuality);
                break;
        }

        if (version_compare(PHP_VERSION, '8.0.0', '<')) {
            imagedestroy($resource);
            imagedestroy($resized);
        }

        return $saved;
    }

    public function deleteFile($urlPath) {
        $fullPath = $this->uploadDir . '/' . ltrim($urlPath, '/');

        if (file_exists($fullPath)) {
            return unlink($fullPath);
        }
        return false;
    }

    public function deleteFileByAbsolute($absolutePath) {
        if ($absolutePath && file_exists($absolutePath)) {
            return unlink($absolutePath);
        }
        return false;
    }

    public function getUploadDir() {
        return $this->uploadDir;
    }
}
