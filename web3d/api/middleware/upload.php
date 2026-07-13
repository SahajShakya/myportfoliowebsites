<?php
class UploadMiddleware {
    private $uploadDir;
    private $maxFileSize;
    private $allowedTypes;

    public function __construct($uploadDir = null, $maxFileSize = 10485760) {
        $this->uploadDir = $uploadDir ?? dirname(__DIR__, 2) . '/uploads';
        $this->maxFileSize = $maxFileSize;
        $this->allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
            'application/pdf', 'video/mp4', 'video/webm',
            'application/octet-stream'
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

            if (move_uploaded_file($fileTmp, $savedPath)) {
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
