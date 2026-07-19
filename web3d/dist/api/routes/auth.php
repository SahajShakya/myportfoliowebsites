<?php
function handleAuthRoutes($method, $segments, $db) {
    require_once __DIR__ . '/../models/User.php';
    require_once __DIR__ . '/../models/Role.php';
    require_once __DIR__ . '/../models/Session.php';
    require_once __DIR__ . '/../models/SocialLink.php';
    require_once __DIR__ . '/../models/CV.php';
    require_once __DIR__ . '/../models/Document.php';
    require_once __DIR__ . '/../middleware/auth.php';
    require_once __DIR__ . '/../middleware/upload.php';

    $auth = new AuthMiddleware();
    $userModel = new User($db);
    $roleModel = new Role($db);
    $sessionModel = new Session($db);
    $socialLinkModel = new SocialLink($db);
    $cvModel = new CV($db);
    $documentModel = new Document($db);
    $uploader = new UploadMiddleware();

    $action = $segments[1] ?? '';

    if ($method === 'POST' && $action === 'register') {
        $data = json_decode(file_get_contents('php://input'), true);
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';
        $name = $data['name'] ?? '';
        $roleName = $data['role'] ?? 'user';

        if (!$email || !$password || !$name) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required fields"]);
            return;
        }

        $existing = $userModel->findByEmail($email);
        if ($existing) {
            http_response_code(409);
            echo json_encode(["error" => "Email already registered"]);
            return;
        }

        $role = $roleModel->findByName($roleName);
        if (!$role) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid role"]);
            return;
        }

        $userId = bin2hex(random_bytes(16));
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);

        $userModel->create($userId, $name, $email, $passwordHash, $role['id']);

        $accessToken = $auth->generateAccessToken($userId, $email, $role['name']);
        $refreshToken = $auth->generateRefreshToken($userId, $email, $role['name']);

        $sessionId = bin2hex(random_bytes(16));
        $accessExp = date('Y-m-d H:i:s', time() + 900);
        $refreshExp = date('Y-m-d H:i:s', time() + 604800);
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';

        $sessionModel->create($sessionId, $userId, $accessToken, $refreshToken, $accessExp, $refreshExp, $userAgent, $ipAddress);
        $userModel->updateLogin($userId, true);

        $auth->setTokenCookies($accessToken, $refreshToken);

        echo json_encode([
            "message" => "User registered successfully",
            "user" => ["id" => $userId, "name" => $name, "email" => $email, "role" => $role['name'], "materials_url" => null, "profile_image" => null]
        ]);
        return;
    }

    if ($method === 'POST' && $action === 'login') {
        $data = json_decode(file_get_contents('php://input'), true);
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';

        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode(["error" => "Missing email or password"]);
            return;
        }

        $user = $userModel->findByEmail($email);
        if (!$user || !password_verify($password, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(["error" => "Invalid email or password"]);
            return;
        }

        $role = $roleModel->findById($user['role_id']);
        $roleName = $role ? $role['name'] : 'user';

        $accessToken = $auth->generateAccessToken($user['id'], $email, $roleName);
        $refreshToken = $auth->generateRefreshToken($user['id'], $email, $roleName);

        $sessionModel->invalidateAllForUser($user['id']);

        $sessionId = bin2hex(random_bytes(16));
        $accessExp = date('Y-m-d H:i:s', time() + 900);
        $refreshExp = date('Y-m-d H:i:s', time() + 604800);
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';

        $sessionModel->create($sessionId, $user['id'], $accessToken, $refreshToken, $accessExp, $refreshExp, $userAgent, $ipAddress);
        $userModel->updateLogin($user['id'], true);

        $auth->setTokenCookies($accessToken, $refreshToken);

        echo json_encode([
            "message" => "Login successful",
            "user" => [
                "id" => $user['id'],
                "name" => $user['name'],
                "email" => $user['email'],
                "role" => $roleName,
                "materials_url" => $user['materials_url'] ?? null,
                "profile_image" => $user['profile_image'] ?? null,
            ]
        ]);
        return;
    }

    if ($method === 'POST' && $action === 'refresh') {
        $refreshToken = $auth->getRefreshTokenFromCookie();

        if (!$refreshToken) {
            http_response_code(401);
            echo json_encode(["error" => "No refresh token", "code" => "NO_REFRESH"]);
            return;
        }

        $refreshData = $auth->verifyRefreshToken($refreshToken);
        if (!$refreshData) {
            $auth->clearTokenCookies();
            http_response_code(401);
            echo json_encode(["error" => "Refresh token expired or invalid", "code" => "REFRESH_EXPIRED"]);
            return;
        }

        $session = $sessionModel->findByRefreshToken($refreshToken);
        if (!$session) {
            $auth->clearTokenCookies();
            http_response_code(401);
            echo json_encode(["error" => "Session not found", "code" => "SESSION_NOT_FOUND"]);
            return;
        }

        $user = $userModel->findById($refreshData['user_id']);
        if (!$user) {
            $auth->clearTokenCookies();
            http_response_code(401);
            echo json_encode(["error" => "User not found", "code" => "USER_NOT_FOUND"]);
            return;
        }

        $role = $roleModel->findById($user['role_id']);
        $roleName = $role ? $role['name'] : 'user';

        $newAccessToken = $auth->generateAccessToken($user['id'], $user['email'], $roleName);
        $newRefreshToken = $auth->generateRefreshToken($user['id'], $user['email'], $roleName);

        $newAccessExp = date('Y-m-d H:i:s', time() + 900);
        $newRefreshExp = date('Y-m-d H:i:s', time() + 604800);

        $sessionModel->updateTokens($session['id'], $newAccessToken, $newRefreshToken, $newAccessExp, $newRefreshExp);

        $auth->setTokenCookies($newAccessToken, $newRefreshToken);

        echo json_encode([
            "message" => "Token refreshed",
            "user" => [
                "id" => $user['id'],
                "name" => $user['name'],
                "email" => $user['email'],
                "role" => $roleName,
                "materials_url" => $user['materials_url'] ?? null,
                "profile_image" => $user['profile_image'] ?? null,
            ]
        ]);
        return;
    }

    if ($method === 'POST' && $action === 'logout') {
        $refreshToken = $auth->getRefreshTokenFromCookie();
        if ($refreshToken) {
            $sessionModel->invalidateByRefreshToken($refreshToken);
        }

        $auth->clearTokenCookies();

        $accessToken = $auth->getAccessTokenFromCookie();
        if ($accessToken) {
            $sessionData = $sessionModel->findByAccessToken($accessToken);
            if ($sessionData) {
                $userModel->updateLogin($sessionData['user_id'], false);
            }
        }

        echo json_encode(["message" => "Logged out successfully"]);
        return;
    }

    if ($method === 'GET' && $action === 'user') {
        $userId = $segments[2] ?? '';
        if (!$userId) {
            http_response_code(400);
            echo json_encode(["error" => "User ID required"]);
            return;
        }

        $user = $userModel->findById($userId);
        if (!$user) {
            http_response_code(404);
            echo json_encode(["error" => "User not found"]);
            return;
        }

        unset($user['password_hash']);
        echo json_encode(["user" => $user]);
        return;
    }

    if ($method === 'GET' && $action === 'me') {
        $payload = $auth->authenticate();
        if (!$payload) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
            return;
        }

        $user = $userModel->findById($payload['user_id']);
        if (!$user) {
            http_response_code(404);
            echo json_encode(["error" => "User not found"]);
            return;
        }

        unset($user['password_hash']);
        echo json_encode(["user" => $user]);
        return;
    }

    if ($method === 'PUT' && $action === 'profile') {
        $payload = $auth->authenticate();
        if (!$payload) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $name = $data['name'] ?? '';
        $email = $data['email'] ?? '';
        $phone = $data['phone'] ?? null;
        $bio = $data['bio'] ?? null;
        $tagline = $data['tagline'] ?? null;
        $profileImage = $data['profile_image'] ?? null;

        if (!$name || !$email) {
            http_response_code(400);
            echo json_encode(["error" => "Name and email are required"]);
            return;
        }

        $existing = $userModel->findByEmail($email);
        if ($existing && $existing['id'] !== $payload['user_id']) {
            http_response_code(409);
            echo json_encode(["error" => "Email already in use"]);
            return;
        }

        $userModel->updateProfile($payload['user_id'], $name, $email, $phone, $bio, $tagline, $profileImage);

        $user = $userModel->findById($payload['user_id']);
        unset($user['password_hash']);

        echo json_encode(["message" => "Profile updated", "user" => $user]);
        return;
    }

    if ($method === 'PUT' && $action === 'materials-url') {
        $payload = $auth->authenticate();
        if (!$payload) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $materialsUrl = $data['materials_url'] ?? null;

        if ($materialsUrl && !preg_match('#^https?://#i', $materialsUrl)) {
            $materialsUrl = 'https://' . $materialsUrl;
        }

        $userModel->updateMaterialsUrl($payload['user_id'], $materialsUrl);

        $stmt = $db->prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES ('materials_url', ?) ON DUPLICATE KEY UPDATE setting_value = ?");
        $stmt->execute([$materialsUrl, $materialsUrl]);

        $user = $userModel->findById($payload['user_id']);
        unset($user['password_hash']);

        echo json_encode(["message" => "Materials URL updated", "user" => $user]);
        return;
    }

    if ($method === 'POST' && $action === 'profile-image') {
        $payload = $auth->authenticate();
        if (!$payload) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
            return;
        }

        $result = $uploader->handleUpload($_FILES, 'profile');
        if (isset($result['error'])) {
            http_response_code(400);
            echo json_encode($result);
            return;
        }

        if (empty($result)) {
            http_response_code(400);
            echo json_encode(["error" => "Upload failed"]);
            return;
        }

        $fileInfo = $result[0];
        $user = $userModel->findById($payload['user_id']);

        if ($user && !empty($user['document_id'])) {
            $oldDoc = $documentModel->findById($user['document_id']);
            if ($oldDoc) {
                $uploader->deleteFileByAbsolute($oldDoc['absolute_path']);
                $documentModel->delete($oldDoc['id']);
            }
        }

        if ($user && !empty($user['profile_image']) && empty($user['document_id'])) {
            $oldPath = $_SERVER['DOCUMENT_ROOT'] . $user['profile_image'];
            if (file_exists($oldPath)) {
                unlink($oldPath);
            }
        }

        $docId = $documentModel->create(
            $payload['user_id'],
            $fileInfo['file_name'],
            $fileInfo['original_name'],
            $fileInfo['relative_path'],
            $fileInfo['absolute_path'],
            'profile',
            $fileInfo['mime_type'],
            $fileInfo['file_size']
        );

        $userModel->updateDocumentId($payload['user_id'], $docId);

        echo json_encode(["message" => "Profile image uploaded", "url" => $fileInfo['relative_path'], "document_id" => $docId]);
        return;
    }

    if ($method === 'POST' && $action === 'about-bg-image') {
        $payload = $auth->authenticate();
        if (!$payload) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
            return;
        }

        $result = $uploader->handleUpload($_FILES, 'site_images');
        if (isset($result['error'])) {
            http_response_code(400);
            echo json_encode($result);
            return;
        }

        if (empty($result)) {
            http_response_code(400);
            echo json_encode(["error" => "Upload failed"]);
            return;
        }

        $fileInfo = $result[0];
        $url = $fileInfo['relative_path'];

        $stmt = $db->prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES ('about_bg_image', ?) ON DUPLICATE KEY UPDATE setting_value = ?");
        $stmt->execute([$url, $url]);

        echo json_encode(["message" => "Background image updated", "url" => $url]);
        return;
    }

    if ($method === 'PUT' && $action === 'password') {
        $payload = $auth->authenticate();
        if (!$payload) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $currentPassword = $data['current_password'] ?? '';
        $newPassword = $data['new_password'] ?? '';

        if (!$currentPassword || !$newPassword) {
            http_response_code(400);
            echo json_encode(["error" => "Current and new password are required"]);
            return;
        }

        if (strlen($newPassword) < 6) {
            http_response_code(400);
            echo json_encode(["error" => "New password must be at least 6 characters"]);
            return;
        }

        $user = $userModel->findById($payload['user_id']);
        if (!password_verify($currentPassword, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(["error" => "Current password is incorrect"]);
            return;
        }

        $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
        $userModel->updatePassword($payload['user_id'], $newHash);

        echo json_encode(["message" => "Password updated successfully"]);
        return;
    }

    if ($method === 'GET' && $action === 'social-links') {
        $userId = $segments[2] ?? '';
        if (!$userId) {
            $links = $socialLinkModel->findByUserId('admin001');
        } else {
            $links = $socialLinkModel->findByUserId($userId);
        }
        echo json_encode(["data" => $links]);
        return;
    }

    if ($method === 'POST' && $action === 'social-links') {
        $payload = $auth->authenticate();
        if (!$payload) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $platform = $data['platform'] ?? '';
        $iconName = $data['icon_name'] ?? '';
        $url = $data['url'] ?? '';
        $displayOrder = $data['display_order'] ?? 0;

        if (!$platform || !$iconName || !$url) {
            http_response_code(400);
            echo json_encode(["error" => "Platform, icon, and URL are required"]);
            return;
        }

        $id = $socialLinkModel->create($payload['user_id'], $platform, $iconName, $url, $displayOrder);
        $link = $socialLinkModel->findById($id);

        echo json_encode(["message" => "Social link added", "data" => $link]);
        return;
    }

    if ($method === 'PUT' && $action === 'social-links') {
        $payload = $auth->authenticate();
        if (!$payload) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
            return;
        }

        $linkId = $segments[2] ?? '';
        if (!$linkId) {
            http_response_code(400);
            echo json_encode(["error" => "Link ID required"]);
            return;
        }

        $existing = $socialLinkModel->findById($linkId);
        if (!$existing || $existing['user_id'] !== $payload['user_id']) {
            http_response_code(404);
            echo json_encode(["error" => "Social link not found"]);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $platform = $data['platform'] ?? $existing['platform'];
        $iconName = $data['icon_name'] ?? $existing['icon_name'];
        $url = $data['url'] ?? $existing['url'];
        $displayOrder = $data['display_order'] ?? $existing['display_order'];

        $socialLinkModel->update($linkId, $platform, $iconName, $url, $displayOrder);
        $link = $socialLinkModel->findById($linkId);

        echo json_encode(["message" => "Social link updated", "data" => $link]);
        return;
    }

    if ($method === 'DELETE' && $action === 'social-links') {
        $payload = $auth->authenticate();
        if (!$payload) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
            return;
        }

        $linkId = $segments[2] ?? '';
        if (!$linkId) {
            http_response_code(400);
            echo json_encode(["error" => "Link ID required"]);
            return;
        }

        $existing = $socialLinkModel->findById($linkId);
        if (!$existing || $existing['user_id'] !== $payload['user_id']) {
            http_response_code(404);
            echo json_encode(["error" => "Social link not found"]);
            return;
        }

        $socialLinkModel->delete($linkId);
        echo json_encode(["message" => "Social link deleted"]);
        return;
    }

    if ($method === 'GET' && $action === 'cvs') {
        $payload = $auth->authenticate();
        if (!$payload) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
            return;
        }
        $cvs = $cvModel->findByUserId($payload['user_id']);
        echo json_encode(["data" => $cvs]);
        return;
    }

    if ($method === 'GET' && $action === 'cv-active') {
        $userId = $segments[2] ?? '';
        if (!$userId) {
            $payload = $auth->getAccessTokenFromHeader() || $auth->getAccessTokenFromCookie();
            if ($payload) {
                $verified = $auth->verifyAccessToken($payload);
                $userId = $verified['user_id'] ?? '';
            }
        }
        $cv = $userId ? $cvModel->findActive($userId) : null;
        echo json_encode(["data" => $cv]);
        return;
    }

    if ($method === 'POST' && $action === 'cvs') {
        $payload = $auth->authenticate();
        if (!$payload) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
            return;
        }

        $result = $uploader->handleUpload($_FILES, 'cvs');
        if (isset($result['error'])) {
            http_response_code(400);
            echo json_encode($result);
            return;
        }

        if (empty($result)) {
            http_response_code(400);
            echo json_encode(["error" => "Upload failed"]);
            return;
        }

        $fileInfo = $result[0];
        $title = $_POST['title'] ?? 'Untitled CV';
        $isActive = isset($_POST['is_active']) && $_POST['is_active'] === 'true';

        $docId = $documentModel->create(
            $payload['user_id'],
            $fileInfo['file_name'],
            $fileInfo['original_name'],
            $fileInfo['relative_path'],
            $fileInfo['absolute_path'],
            'cv',
            $fileInfo['mime_type'],
            $fileInfo['file_size']
        );

        $id = $cvModel->create($payload['user_id'], $title, $fileInfo['relative_path'], $isActive, $docId);
        $cv = $cvModel->findById($id);

        echo json_encode(["message" => "CV uploaded", "data" => $cv]);
        return;
    }

    if ($method === 'PUT' && $action === 'cvs') {
        $payload = $auth->authenticate();
        if (!$payload) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
            return;
        }

        $cvId = $segments[2] ?? '';
        if (!$cvId) {
            http_response_code(400);
            echo json_encode(["error" => "CV ID required"]);
            return;
        }

        $existing = $cvModel->findById($cvId);
        if (!$existing || $existing['user_id'] !== $payload['user_id']) {
            http_response_code(404);
            echo json_encode(["error" => "CV not found"]);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $title = $data['title'] ?? $existing['title'];

        if (isset($data['is_active']) && $data['is_active'] === true) {
            $cvModel->setActive($cvId);
        } else {
            $cvModel->update($cvId, $title);
        }

        $cv = $cvModel->findById($cvId);
        echo json_encode(["message" => "CV updated", "data" => $cv]);
        return;
    }

    if ($method === 'DELETE' && $action === 'cvs') {
        $payload = $auth->authenticate();
        if (!$payload) {
            http_response_code(401);
            echo json_encode(["error" => "Unauthorized"]);
            return;
        }

        $cvId = $segments[2] ?? '';
        if (!$cvId) {
            http_response_code(400);
            echo json_encode(["error" => "CV ID required"]);
            return;
        }

        $existing = $cvModel->findById($cvId);
        if (!$existing || $existing['user_id'] !== $payload['user_id']) {
            http_response_code(404);
            echo json_encode(["error" => "CV not found"]);
            return;
        }

        if (!empty($existing['document_id'])) {
            $doc = $documentModel->findById($existing['document_id']);
            if ($doc) {
                $uploader->deleteFileByAbsolute($doc['absolute_path']);
                $documentModel->delete($doc['id']);
            }
        } elseif ($existing['file_url']) {
            $uploader->deleteFile($existing['file_url']);
        }

        $cvModel->delete($cvId);
        echo json_encode(["message" => "CV deleted"]);
        return;
    }

    if ($method === 'GET' && $action === 'roles') {
        $roles = $roleModel->findAll();
        echo json_encode(["roles" => $roles]);
        return;
    }

    http_response_code(404);
    echo json_encode(["error" => "Auth action not found"]);
}
