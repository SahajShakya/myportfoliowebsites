<?php
class OpenRouter {
    private $apiKey;
    private $model;
    private $baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

    public function __construct($apiKey, $model = 'openai/gpt-4o') {
        $this->apiKey = $apiKey;
        $this->model = $model;
    }

    public function chat($messages, $maxTokens = 1024, $temperature = 0.7) {
        $payload = json_encode([
            'model' => $this->model,
            'messages' => $messages,
            'max_tokens' => $maxTokens,
            'temperature' => $temperature,
        ]);

        $ch = curl_init($this->baseUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $this->apiKey,
                'Content-Type: application/json',
                'HTTP-Referer: ' . ($_SERVER['HTTP_HOST'] ?? 'localhost'),
                'X-Title: Portfolio Chatbot',
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception("OpenRouter API error: " . $error);
        }

        if ($httpCode !== 200) {
            $decoded = json_decode($response, true);
            $errorMsg = $decoded['error']['message'] ?? "HTTP $httpCode";
            throw new Exception("OpenRouter API error: " . $errorMsg);
        }

        $decoded = json_decode($response, true);
        if (isset($decoded['choices'][0]['message']['content'])) {
            return $decoded['choices'][0]['message']['content'];
        }

        throw new Exception("Invalid response from OpenRouter API");
    }
}
