<?php
class RagService {
    private $conn;
    private $chunkModel;
    private $chatModel;
    private $openRouter;
    private $maxChunks;
    private $maxHistory;

    private $SAHAJ_KEYWORDS = [
        'sahaj', 'shakya', 'saz', 'portfolio', 'resume', 'cv',
        'project', 'projects', 'achievement', 'achievements',
        'education', 'academic', 'academics', 'journey', 'experience',
        'work', 'job', 'career', 'skill', 'skills', 'technology',
        'programming', 'developer', 'fullstack', 'full stack',
        'machine learning', 'ml', 'cad', 'design', 'lecturing',
        'teaching', 'photography', 'photo', 'testimonial',
        'university', 'college', 'school', 'degree', 'bachelor', 'master',
        'react', 'javascript', 'php', 'python', 'java', 'node',
        'threejs', 'three.js', 'firebase', 'mysql', 'database',
        'github', 'linkedin', 'email', 'phone', 'contact',
        'about', 'who', 'what', 'tell me', 'describe',
        'certification', 'award', 'competition', 'hackathon',
        'web development', 'frontend', 'backend', 'api',
        'low voltage', 'mep', 'drafter', 'draughtsman',
        'nepal', 'kathmandu', 'tribhuvan',
        'hello', 'hi', 'hey', 'thanks', 'thank you', 'who are you',
        'what can you', 'help', 'introduce',
        'graduate', 'graduated', 'graduation', 'studied', 'studying',
        'diploma', 'certificate', 'completed', 'enrolled', 'course',
        'program', 'batch', 'year', 'when', 'where',
        'intern', 'internship', 'company', 'office', 'team',
        'role', 'position', 'responsibilities', 'project',
        'technology', 'tech stack', 'framework', 'language',
        'award', 'prize', 'winner', 'certified',
    ];

    private $OFF_TOPIC_PATTERNS = [
        '/\b(weather|temperature|forecast)\b/i',
        '/\b(recipe|cooking|food|ingredient)\b/i',
        '/\b(movie|film|song|music|album)\b/i',
        '/\b(sports?|football|cricket|basketball|soccer)\b/i',
        '/\b(stock|crypto|bitcoin|invest|trading)\b/i',
        '/\b(games?|gaming|play|minecraft|fortnite)\b/i',
        '/\b(politics|political|election|president)\b/i',
        '/\b(diet|exercise|workout|gym|health|medical)\b/i',
        '/\b(travel|flight|hotel|airbnb|vacation)\b/i',
        '/\b(news|current events|headline)\b/i',
        '/\b(joke|riddle|funny|humor)\b/i',
        '/\b(love|dating|relationship|girlfriend|boyfriend)\b/i',
        '/\b(religion|god|prayer|church|temple|mosque)\b/i',
        '/\b(money|salary|income|earn|pay)\b/i',
        '/\b(how to (?:hack|crack|steal|cheat))\b/i',
    ];

    private $GREETINGS = [
        'hi' => "Hi there! I'm Sahaj's Assistant. I can tell you about Sahaj Shakya's projects, skills, experience, and achievements. What would you like to know?",
        'hello' => "Hello! Welcome to Sahaj's portfolio. Ask me anything about Sahaj's work, skills, or experience!",
        'hey' => "Hey! I'm here to help you learn about Sahaj Shakya. What interests you?",
        'good morning' => "Good morning! How can I help you learn about Sahaj's work today?",
        'good afternoon' => "Good afternoon! Feel free to ask about Sahaj's projects or skills.",
        'good evening' => "Good evening! What would you like to know about Sahaj?",
        'thanks' => "You're welcome! Is there anything else you'd like to know about Sahaj?",
        'thank you' => "Happy to help! Let me know if you have more questions about Sahaj.",
        'who are you' => "I'm Sahaj's Assistant, an AI chatbot on Sahaj Shakya's portfolio website. I can answer questions about his skills, projects, experience, and achievements. What would you like to know?",
        'what can you do' => "I can tell you about Sahaj Shakya's:\n- Projects and portfolio\n- Technical skills\n- Work experience\n- Education\n- Achievements\n\nJust ask me anything about Sahaj!",
        'help' => "I'm here to help you learn about Sahaj Shakya. You can ask about:\n- His projects\n- Technical skills\n- Work experience\n- Education\n- How to contact him",
        'introduce' => "I'd be happy to introduce Sahaj Shakya! He's a full-stack developer with skills in React, PHP, Python, and more. Want to know about a specific area?",
    ];

    public function __construct($db, $apiKey, $model = 'openai/gpt-4o') {
        $this->conn = $db;
        require_once __DIR__ . '/../models/KnowledgeChunk.php';
        require_once __DIR__ . '/../models/Chat.php';
        require_once __DIR__ . '/OpenRouter.php';

        $this->chunkModel = new KnowledgeChunk($db);
        $this->chatModel = new Chat($db);
        $this->openRouter = new OpenRouter($apiKey, $model);
        $this->maxChunks = (int)($_ENV['CHAT_MAX_CHUNKS'] ?? 5);
        $this->maxHistory = (int)($_ENV['CHAT_MAX_HISTORY'] ?? 10);
    }

    public function sendMessage($sessionId, $userMessage) {
        try {
            if ($this->chatModel->getMessageCount($sessionId) >= 30) {
                return ['error' => 'Rate limit exceeded. Please start a new conversation.'];
            }
        } catch (Exception $e) {
            // Session table might not exist, continue anyway
        }

        try {
            $this->chatModel->addMessage($sessionId, 'user', $userMessage);
        } catch (Exception $e) {
            // Continue even if we can't save history
        }

        $lower = strtolower(trim($userMessage));

        if (isset($this->GREETINGS[$lower])) {
            $response = $this->GREETINGS[$lower];
            $this->safeAddMessage($sessionId, 'assistant', $response);
            return [
                'response' => $response,
                'sources' => [],
                'relevance' => 'greeting',
            ];
        }

        foreach ($this->GREETINGS as $key => $greeting) {
            if (strpos($lower, $key) !== false) {
                $response = $greeting;
                $this->safeAddMessage($sessionId, 'assistant', $response);
                return [
                    'response' => $response,
                    'sources' => [],
                    'relevance' => 'greeting',
                ];
            }
        }

        $relevanceCheck = $this->checkRelevance($userMessage);

        if (!$relevanceCheck['is_relevant']) {
            $response = $this->getIrrelevantResponse($relevanceCheck['reason']);
            $this->safeAddMessage($sessionId, 'assistant', $response);
            return [
                'response' => $response,
                'sources' => [],
                'relevance' => 'off_topic',
            ];
        }

        $chunkCount = 0;
        try {
            $chunkCount = $this->chunkModel->getCount();
        } catch (Exception $e) {
            // Table might not exist
        }

        if ($chunkCount === 0) {
            $response = $this->getFallbackResponse($userMessage);
            $this->safeAddMessage($sessionId, 'assistant', $response);
            return [
                'response' => $response,
                'sources' => [],
                'relevance' => 'fallback',
            ];
        }

        $complexity = $this->classifyQuestion($userMessage);

        if ($complexity === 'simple') {
            $result = $this->handleSimpleQuery($sessionId, $userMessage);
        } else {
            $result = $this->handleComplexQuery($sessionId, $userMessage);
        }

        return $result;
    }

    private function safeAddMessage($sessionId, $role, $content) {
        try {
            $this->chatModel->addMessage($sessionId, $role, $content);
        } catch (Exception $e) {
            // Ignore - table might not exist
        }
    }

    private function getFallbackResponse($message) {
        $lower = strtolower($message);

        $fallbacks = [
            '/\b(hi|hello|hey|greetings)\b/' => "Hello! I'm Sahaj's Assistant. The knowledge base is being set up, but I can still help! What would you like to know about Sahaj?",
            '/\b(project|work|portfolio)\b/' => "Sahaj has worked on several projects including web applications, ML models, and CAD designs. The full project details are being loaded. Check back soon!",
            '/\b(skill|technology|tech)\b/' => "Sahaj's skills include React, PHP, Python, JavaScript, Three.js, Firebase, MySQL, and more. Full details coming soon!",
            '/\b(experience|job|work)\b/' => "Sahaj has experience in full-stack development, ML, CAD design, and lecturing. More details are being added!",
            '/\b(education|academic|university)\b/' => "Sahaj has a strong academic background. Full education details are being loaded into the system.",
            '/\b(about|who)\b/' => "Sahaj Shakya is a full-stack developer, ML enthusiast, CAD designer, and lecturer. The portfolio data is being processed. Ask me anything specific!",
        ];

        foreach ($fallbacks as $pattern => $response) {
            if (preg_match($pattern, $lower)) {
                return $response;
            }
        }

        return "I'm Sahaj's Assistant. The knowledge base is still being built, but I can help! Try asking about Sahaj's projects, skills, experience, or education.";
    }

    private function checkRelevance($message) {
        $lower = strtolower($message);

        foreach ($this->OFF_TOPIC_PATTERNS as $pattern) {
            if (preg_match($pattern, $lower)) {
                return [
                    'is_relevant' => false,
                    'reason' => 'off_topic_pattern',
                ];
            }
        }

        foreach ($this->SAHAJ_KEYWORDS as $keyword) {
            if (strpos($lower, strtolower($keyword)) !== false) {
                return [
                    'is_relevant' => true,
                    'reason' => 'keyword_match',
                ];
            }
        }

        $wordCount = str_word_count($lower);
        if ($wordCount <= 3) {
            return [
                'is_relevant' => false,
                'reason' => 'too_short_no_context',
            ];
        }

        // If it looks like a question (starts with question words), allow it through
        // even without keyword matches — let the search + LLM determine relevance
        if (preg_match('/^(who|what|when|where|how|which|tell|describe|list|name|do|does|did|is|are|was|were|can|could|would|should)\b/', $lower)) {
            return [
                'is_relevant' => true,
                'reason' => 'question_pattern',
            ];
        }

        try {
            $sqlResults = $this->chunkModel->searchExact($message, 1);
            if (!empty($sqlResults)) {
                return [
                    'is_relevant' => true,
                    'reason' => 'sql_match',
                ];
            }
        } catch (Exception $e) {
            // Table might not exist
        }

        return [
            'is_relevant' => false,
            'reason' => 'no_sahaj_context',
        ];
    }

    private function classifyQuestion($message) {
        $lower = strtolower($message);

        $simplePatterns = [
            '/^(who|what|when|where)\s+(is|are|was|were)\s+/i',
            '/^(tell me about|describe|show)\s+/i',
            '/^(how many|how much)\s+/i',
            '/^(list|name|give me)\s+/i',
            '/^(is|are|does|do)\s+(he|she|sahaj)\s+/i',
        ];

        foreach ($simplePatterns as $pattern) {
            if (preg_match($pattern, $lower)) {
                return 'simple';
            }
        }

        $simpleKeywords = ['name', 'email', 'phone', 'address', 'when', 'where', 'which', 'how many'];
        foreach ($simpleKeywords as $kw) {
            if (strpos($lower, $kw) !== false && str_word_count($lower) < 8) {
                return 'simple';
            }
        }

        if (str_word_count($lower) < 6) {
            return 'simple';
        }

        return 'complex';
    }

    private function handleSimpleQuery($sessionId, $userMessage) {
        try {
            $results = $this->chunkModel->searchExact($userMessage, 3);

            if (empty($results)) {
                $results = $this->chunkModel->searchWithFallback($userMessage, 3);
            }
        } catch (Exception $e) {
            $results = [];
        }

        if (empty($results)) {
            $response = $this->getFallbackResponse($userMessage);
            $this->safeAddMessage($sessionId, 'assistant', $response);
            return [
                'response' => $response,
                'sources' => [],
                'relevance' => 'no_results',
            ];
        }

        $answer = $this->extractDirectAnswer($userMessage, $results);
        $this->safeAddMessage($sessionId, 'assistant', $answer);

        return [
            'response' => $answer,
            'sources' => array_map(function($chunk) {
                $meta = json_decode($chunk['metadata'], true);
                return [
                    'type' => $meta['type'] ?? 'unknown',
                    'title' => $meta['title'] ?? '',
                ];
            }, $results),
            'relevance' => 'sql_direct',
        ];
    }

    private function handleComplexQuery($sessionId, $userMessage) {
        try {
            $results = $this->chunkModel->searchWithFallback($userMessage, $this->maxChunks);
        } catch (Exception $e) {
            $results = [];
        }

        if (empty($results)) {
            $response = $this->getFallbackResponse($userMessage);
            $this->safeAddMessage($sessionId, 'assistant', $response);
            return [
                'response' => $response,
                'sources' => [],
                'relevance' => 'fallback',
            ];
        }

        try {
            $chatHistory = $this->chatModel->getRecentMessages($sessionId, $this->maxHistory);
        } catch (Exception $e) {
            $chatHistory = [];
        }

        $systemPrompt = $this->buildSystemPrompt($results);

        $messages = [['role' => 'system', 'content' => $systemPrompt]];

        foreach ($chatHistory as $msg) {
            $messages[] = [
                'role' => $msg['role'],
                'content' => $msg['content'],
            ];
        }

        try {
            $response = $this->openRouter->chat($messages);
        } catch (Exception $e) {
            $response = "I'm having trouble connecting to my AI service. Please try again in a moment.";
        }

        $this->safeAddMessage($sessionId, 'assistant', $response);

        return [
            'response' => $response,
            'sources' => array_map(function($chunk) {
                $meta = json_decode($chunk['metadata'], true);
                return [
                    'type' => $meta['type'] ?? 'unknown',
                    'title' => $meta['title'] ?? '',
                ];
            }, $results),
            'relevance' => 'ai_generated',
        ];
    }

    private function extractDirectAnswer($query, $results) {
        $answers = [];
        foreach ($results as $chunk) {
            $text = $chunk['chunk_text'];
            $meta = json_decode($chunk['metadata'], true);
            $type = $meta['type'] ?? '';
            $title = $meta['title'] ?? '';

            if ($type === 'user_info') {
                $answers[] = $text;
            } elseif ($type === 'work_experience') {
                $answers[] = $text;
            } elseif ($type === 'education') {
                $answers[] = $text;
            } elseif ($type === 'project') {
                $answers[] = "Project: {$title}\n" . $text;
            } elseif ($type === 'achievement') {
                $answers[] = "Achievement: {$title}\n" . $text;
            } elseif ($type === 'testimonial') {
                $answers[] = $text;
            } else {
                $answers[] = $text;
            }
        }

        return implode("\n\n", $answers);
    }

    private function getIrrelevantResponse($reason) {
        $responses = [
            'off_topic_pattern' => "That question doesn't relate to Sahaj Shakya's portfolio. I'm here to tell you about his skills, projects, experience, and achievements. Please ask something about Sahaj!",
            'too_short_no_context' => "Could you provide more context? I can help with questions about Sahaj Shakya's work, skills, projects, or experience.",
            'no_sahaj_context' => "I don't see how that relates to Sahaj Shakya. Feel free to ask about his projects, technical skills, work experience, education, or achievements!",
        ];

        return $responses[$reason] ?? $responses['no_sahaj_context'];
    }

    private function buildSystemPrompt($chunks) {
        $contextParts = [];
        foreach ($chunks as $chunk) {
            $meta = json_decode($chunk['metadata'], true);
            $type = $meta['type'] ?? '';
            $title = $meta['title'] ?? '';
            $contextParts[] = "[{$type}: {$title}] " . $chunk['chunk_text'];
        }

        $context = implode("\n\n", $contextParts);

        return <<<PROMPT
You are Sahaj's Assistant, an AI chatbot on Sahaj Shakya's portfolio website. You ONLY answer questions about Sahaj Shakya.

STRICT RULES:
1. ONLY answer questions directly related to Sahaj Shakya's portfolio, skills, projects, experience, education, and achievements.
2. If the question is not about Sahaj, respond EXACTLY: "This question doesn't define Sahaj. Please ask about his work, skills, or experience."
3. NEVER discuss politics, religion, health, weather, movies, sports, or any topic unrelated to Sahaj's professional portfolio.
4. NEVER generate creative content, stories, poems, or jokes.
5. NEVER answer hypothetical or philosophical questions.
6. If you don't have information about something related to Sahaj, say "I don't have that information about Sahaj."
7. Keep responses concise and professional.
8. Use only the provided context. Do not make up information.
9. If asked about contact, direct to the contact form.
10. You are NOT a general-purpose AI. You are a portfolio assistant.

CONTEXT FROM SAHAJ'S PORTFOLIO:
{$context}

Remember: You ONLY discuss Sahaj Shakya. Period.
PROMPT;
    }

    public function getHistory($sessionId) {
        try {
            return $this->chatModel->getMessages($sessionId);
        } catch (Exception $e) {
            return [];
        }
    }

    public function clearHistory($sessionId) {
        try {
            $this->chatModel->deleteSession($sessionId);
        } catch (Exception $e) {
            // Ignore
        }
    }

    public function createSession() {
        $sessionId = bin2hex(random_bytes(16));
        try {
            $this->chatModel->createSession($sessionId);
        } catch (Exception $e) {
            // Table might not exist, but we can still use the session ID
        }
        return $sessionId;
    }
}
