<?php
class AuthMiddleware {
    private $secret;
    private $accessSecret;
    private $refreshSecret;

    public function __construct() {
        $this->secret = 'web3d_portfolio_jwt_secret_2026';
        $this->accessSecret = 'web3d_access_token_secret_2026';
        $this->refreshSecret = 'web3d_refresh_token_secret_2026';
    }

    public function generateAccessToken($userId, $email, $role) {
        return $this->generateToken($userId, $email, $role, 900, $this->accessSecret);
    }

    public function generateRefreshToken($userId, $email, $role) {
        return $this->generateToken($userId, $email, $role, 604800, $this->refreshSecret);
    }

    public function verifyAccessToken($token) {
        return $this->verifyToken($token, $this->accessSecret);
    }

    public function verifyRefreshToken($token) {
        return $this->verifyToken($token, $this->refreshSecret);
    }

    private function generateToken($userId, $email, $role, $expiresIn, $secret) {
        $header = $this->base64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = $this->base64url(json_encode([
            'user_id' => $userId,
            'email' => $email,
            'role' => $role,
            'iat' => time(),
            'exp' => time() + $expiresIn
        ]));
        $signature = $this->base64url(hash_hmac('sha256', "$header.$payload", $secret, true));
        return "$header.$payload.$signature";
    }

    private function verifyToken($token, $secret) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        list($header, $payload, $signature) = $parts;
        $expectedSig = $this->base64url(hash_hmac('sha256', "$header.$payload", $secret, true));

        if (!hash_equals($expectedSig, $signature)) {
            return null;
        }

        $data = json_decode(base64_decode(strtr($payload, '-_', '+/')), true);
        if (!$data || !isset($data['exp']) || $data['exp'] < time()) {
            return null;
        }

        return $data;
    }

    public function setTokenCookies($accessToken, $refreshToken) {
        $accessExp = time() + 900;
        $refreshExp = time() + 604800;

        setcookie('access_token', $accessToken, [
            'expires' => $accessExp,
            'path' => '/',
            'httponly' => true,
            'secure' => false,
            'samesite' => 'Lax'
        ]);

        setcookie('refresh_token', $refreshToken, [
            'expires' => $refreshExp,
            'path' => '/',
            'httponly' => true,
            'secure' => false,
            'samesite' => 'Lax'
        ]);
    }

    public function clearTokenCookies() {
        setcookie('access_token', '', [
            'expires' => time() - 3600,
            'path' => '/',
            'httponly' => true,
            'secure' => false,
            'samesite' => 'Lax'
        ]);

        setcookie('refresh_token', '', [
            'expires' => time() - 3600,
            'path' => '/',
            'httponly' => true,
            'secure' => false,
            'samesite' => 'Lax'
        ]);
    }

    public function getAccessTokenFromCookie() {
        return $_COOKIE['access_token'] ?? null;
    }

    public function getRefreshTokenFromCookie() {
        return $_COOKIE['refresh_token'] ?? null;
    }

    public function getAccessTokenFromHeader() {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        if (preg_match('/Bearer\s+(.+)$/i', $authHeader, $matches)) {
            return $matches[1];
        }
        return null;
    }

    public function authenticate() {
        $token = $this->getAccessTokenFromHeader() ?? $this->getAccessTokenFromCookie();

        if (!$token) {
            http_response_code(401);
            echo json_encode(["error" => "No token provided", "code" => "NO_TOKEN"]);
            exit;
        }

        $data = $this->verifyAccessToken($token);

        if (!$data) {
            http_response_code(401);
            echo json_encode(["error" => "Access token expired or invalid", "code" => "TOKEN_EXPIRED"]);
            exit;
        }

        return $data;
    }

    private function base64url($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
