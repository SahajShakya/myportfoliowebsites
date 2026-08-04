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

    private $SKILL_ORDER = [
        'React', 'React Native', 'Redux', 'React Query', 'React Context API', 'Formik',
        'Node.js', 'Express.js', 'Sequelize', 'PostgreSQL', 'Firebase', 'Socket',
        'Electron', 'Python', 'C', 'C++', 'Arduino', 'Raspberry Pi',
        'SDN', 'EMG', 'Multipath',
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
            $this->chatModel->addMessage($sessionId, 'user', $userMessage);
        } catch (Exception $e) {
            // Continue even if we can't save history
        }

        return $this->generateReply($sessionId, $userMessage);
    }

    public function generateReply($sessionId, $userMessage) {
        try {
            if ($this->chatModel->getMessageCount($sessionId) >= 30) {
                return ['error' => 'Rate limit exceeded. Please start a new conversation.'];
            }
        } catch (Exception $e) {
            // Session table might not exist, continue anyway
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
            if (preg_match('/\b' . preg_quote($key, '/') . '\b/i', $lower)) {
                $response = $greeting;
                $this->safeAddMessage($sessionId, 'assistant', $response);
                return [
                    'response' => $response,
                    'sources' => [],
                    'relevance' => 'greeting',
                ];
            }
        }

        $intentResult = $this->matchIntent($sessionId, $userMessage);
        if ($intentResult !== null) {
            return $intentResult;
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
            if (strpos($lower, $keyword) !== false) {
                return [
                    'is_relevant' => true,
                    'reason' => 'keyword_match',
                ];
            }
        }

        if (str_word_count($lower) <= 3) {
            return [
                'is_relevant' => false,
                'reason' => 'too_short_no_context',
            ];
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
        return $this->handleQueryWithContext($sessionId, $userMessage, 5);
    }

    private function handleComplexQuery($sessionId, $userMessage) {
        return $this->handleQueryWithContext($sessionId, $userMessage, $this->maxChunks);
    }

    private function handleQueryWithContext($sessionId, $userMessage, $maxResults) {
        try {
            $rawResults = $this->chunkModel->searchExact($userMessage, $maxResults * 2);
            if (empty($rawResults)) {
                $rawResults = $this->chunkModel->searchWithFallback($userMessage, $maxResults * 2);
            }
        } catch (Exception $e) {
            $rawResults = [];
        }

        $results = $this->filterRelevantChunks($rawResults, $userMessage);
        if (empty($results)) {
            $seen = [];
            $results = [];
            foreach ($rawResults as $chunk) {
                $key = md5($chunk['chunk_text']);
                if (isset($seen[$key])) {
                    continue;
                }
                $seen[$key] = true;
                $results[] = $chunk;
            }
        }

        $topicTypes = $this->getTopicTypes($userMessage);
        if (count($results) < $maxResults && !empty($topicTypes)) {
            try {
                $topicChunks = $this->chunkModel->searchByTypes($topicTypes, $userMessage, $maxResults * 2);
            } catch (Exception $e) {
                $topicChunks = [];
            }
            $seen = [];
            foreach ($results as $chunk) {
                $seen[md5($chunk['chunk_text'])] = true;
            }
            foreach ($topicChunks as $chunk) {
                $key = md5($chunk['chunk_text']);
                if (isset($seen[$key])) {
                    continue;
                }
                $seen[$key] = true;
                $results[] = $chunk;
            }
        }

        $results = array_slice($results, 0, $maxResults);

        if (empty($results)) {
            $response = $this->getNoInfoResponse($userMessage);
            $this->safeAddMessage($sessionId, 'assistant', $response);
            return [
                'response' => $response,
                'sources' => [],
                'relevance' => 'no_results',
            ];
        }

        $answer = $this->answerFromChunks($sessionId, $userMessage, $results);
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
            'relevance' => 'ai_generated',
        ];
    }

    private function answerFromChunks($sessionId, $userMessage, $results) {
        try {
            $chatHistory = $this->chatModel->getRecentMessages($sessionId, $this->maxHistory);
        } catch (Exception $e) {
            $chatHistory = [];
        }

        $messages = [['role' => 'system', 'content' => $this->buildSystemPrompt($results)]];

        foreach ($chatHistory as $msg) {
            if ($msg['role'] === 'user' && $msg['content'] === $userMessage) {
                continue;
            }
            $messages[] = ['role' => $msg['role'], 'content' => $msg['content']];
        }

        $messages[] = ['role' => 'user', 'content' => $userMessage];

        try {
            return $this->openRouter->chat($messages);
        } catch (Exception $e) {
            return $this->extractDirectAnswer($userMessage, $results);
        }
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
        return "That question isn't related to Sahaj Shakya. Please ask about his journey, academics, projects, or achievements.";
    }

    private function getNoInfoResponse($message) {
        return "I don't have that specific information about Sahaj. Please ask about his journey, academics, projects, or achievements.";
    }

    private function matchIntent($sessionId, $message) {
        $lower = strtolower(trim($message));
        $lower = preg_replace('/\s+/', ' ', $lower);

        $isGraduation = preg_match('/\b(graduat\w*)\b/', $lower)
            || (preg_match('/\b(bachelor|bachelors|undergraduate)\b/', $lower) && preg_match('/\b(when|what year|complete|completed|finish|finish his|did)\b/', $lower));
        if ($isGraduation) {
            $edu = $this->getEducationByKeyword('bachelor');
            if ($edu && !empty($edu['end_date'])) {
                $response = $this->formatEducationAnswer($edu);
                $this->safeAddMessage($sessionId, 'assistant', $response);
                return [
                    'response' => $response,
                    'sources' => [],
                    'relevance' => 'intent',
                ];
            }
        }

        if (preg_match('/\b(master|masters|postgraduate)\b/', $lower) && preg_match('/\b(when|what year|complete|completed|finish|finished|did)\b/', $lower)) {
            $edu = $this->getEducationByKeyword('master');
            if ($edu && !empty($edu['end_date'])) {
                $response = $this->formatEducationAnswer($edu);
                $this->safeAddMessage($sessionId, 'assistant', $response);
                return [
                    'response' => $response,
                    'sources' => [],
                    'relevance' => 'intent',
                ];
            }
        }

        $isStudyQuestion = preg_match('/\b(what|which)\b.*\b(stud\w*|educat\w*|degree|course|academic)\b/i', $lower);
        if ($isStudyQuestion) {
            $response = $this->getAllEducationAnswer();
            if ($response) {
                $this->safeAddMessage($sessionId, 'assistant', $response);
                return [
                    'response' => $response,
                    'sources' => [],
                    'relevance' => 'intent',
                ];
            }
        }

        $isAboutQuestion = preg_match('/\b(tell me about|who is|about)\b\s*(sahaj|shakya|him)\b/i', $lower)
            || $lower === 'tell me about him'
            || $lower === 'about sahaj';
        if ($isAboutQuestion) {
            $response = $this->getAboutAnswer();
            $this->safeAddMessage($sessionId, 'assistant', $response);
            return [
                'response' => $response,
                'sources' => [],
                'relevance' => 'intent',
            ];
        }

        $isCurrentRoleQuestion = preg_match('/\b(current|currently|now|present)\b.*\b(job|work|role|position|company|employ|occupation)\b/i', $lower)
            || preg_match('/\bwhat does he do (now|currently|these days|present)\b/i', $lower);
        if ($isCurrentRoleQuestion) {
            $response = $this->getCurrentRoleResponse();
            $this->safeAddMessage($sessionId, 'assistant', $response);
            return [
                'response' => $response,
                'sources' => [],
                'relevance' => 'intent',
            ];
        }

        $isSkillsQuestion = preg_match('/\b(skills?|technolog(y|ies)|stacks?|tools?)\b/i', $lower)
            && !preg_match('/\b(projects?|clone|app|website|site)\b/i', $lower);
        if ($isSkillsQuestion) {
            $response = $this->getSkillsAnswer();
            $this->safeAddMessage($sessionId, 'assistant', $response);
            return [
                'response' => $response,
                'sources' => [],
                'relevance' => 'intent',
            ];
        }

        $isLatestProjectQuestion = preg_match('/\b(latest|recent|newest|most recent|last)\b.*\b(project|app|work)\b/i', $lower)
            || preg_match('/\b(project|app)\b.*\b(latest|recent|newest|most recent|last)\b/i', $lower);
        if ($isLatestProjectQuestion) {
            $response = $this->getLatestProjectResponse();
            $this->safeAddMessage($sessionId, 'assistant', $response);
            return [
                'response' => $response,
                'sources' => [],
                'relevance' => 'intent',
            ];
        }

        $isCategoryFollowUp = preg_match('/\b(professional|commercial|office|workplace)\s+projects?\b/i', $lower)
            || preg_match('/\b(academic|college|university|school)\s+projects?\b/i', $lower)
            || preg_match('/^(professional|commercial)$/i', $lower)
            || preg_match('/^(academic|college|university|school)$/i', $lower);
        if ($isCategoryFollowUp) {
            $response = $this->getProjectsByCategoryResponse($lower);
            $this->safeAddMessage($sessionId, 'assistant', $response);
            return [
                'response' => $response,
                'sources' => [],
                'relevance' => 'intent',
            ];
        }

        $isProjectQuestion = preg_match('/\b(projects?|works?)\b.*\b(done|made|built|build|created|worked on|developed|has|does he have|did)\b/i', $lower)
            || preg_match('/\bwhat\b.*\bprojects?\b/i', $lower)
            || preg_match('/\bshow\b.*\bprojects?\b/i', $lower)
            || preg_match('/\blist\b.*\bprojects?\b/i', $lower);
        if ($isProjectQuestion) {
            $response = $this->getProjectCategoryResponse();
            $this->safeAddMessage($sessionId, 'assistant', $response);
            return [
                'response' => $response,
                'sources' => [],
                'relevance' => 'intent',
            ];
        }

        return null;
    }

    private function getEducationByKeyword($keyword) {
        try {
            $stmt = $this->conn->prepare(
                "SELECT title, university_name, college_name, start_date, end_date
                 FROM academics
                 WHERE LOWER(title) LIKE ?
                 ORDER BY start_date ASC LIMIT 1"
            );
            $stmt->execute(['%' . strtolower($keyword) . '%']);
            return $stmt->fetch();
        } catch (Exception $e) {
            return null;
        }
    }

    private function formatEducationAnswer($edu) {
        $response = "Sahaj completed his {$edu['title']} in " . substr($edu['end_date'], 0, 4);
        $institution = trim(trim($edu['college_name'] ?? '') . ', ' . trim($edu['university_name'] ?? ''), ', ');
        if ($institution) {
            $response .= " at {$institution}";
        }
        return $response . ".";
    }

    private function getAllEducationAnswer() {
        try {
            $stmt = $this->conn->query(
                "SELECT title, university_name, college_name, start_date, end_date
                 FROM academics ORDER BY start_date ASC"
            );
            $rows = $stmt->fetchAll();
        } catch (Exception $e) {
            return null;
        }
        if (empty($rows)) {
            return null;
        }

        $parts = [];
        foreach ($rows as $edu) {
            $institution = trim(trim($edu['college_name'] ?? '') . ', ' . trim($edu['university_name'] ?? ''), ', ');
            $duration = substr($edu['start_date'], 0, 4) . '-' . substr($edu['end_date'], 0, 4);
            $parts[] = "{$edu['title']} at {$institution} ({$duration})";
        }
        return "Sahaj's education: " . implode('; ', $parts) . ".";
    }

    private function getCurrentRoleResponse() {
        try {
            $stmt = $this->conn->query(
                "SELECT designation, office_name, start_date FROM journey
                 WHERE end_date IS NULL OR end_date < '2000-01-01'
                 ORDER BY start_date DESC"
            );
            $rows = $stmt->fetchAll();
        } catch (Exception $e) {
            $rows = [];
        }

        if (empty($rows)) {
            return "I don't have that specific information about Sahaj. Please ask about his journey, academics, projects, or achievements.";
        }

        $parts = [];
        foreach ($rows as $row) {
            $year = substr($row['start_date'], 0, 4);
            $parts[] = trim($row['designation'] . ' at ' . $row['office_name']) . " (since {$year})";
        }
        return "Sahaj is currently working as " . implode(', and as ', $parts) . ".";
    }

    private function getAboutAnswer() {
        $name = 'Sahaj Shakya';
        $tagline = '';
        $bio = '';
        try {
            $user = $this->conn->query("SELECT name, tagline, bio FROM users ORDER BY created_at ASC LIMIT 1")->fetch();
            if ($user) {
                $name = $user['name'] ?: $name;
                $tagline = trim($user['tagline'] ?? '');
                $bio = trim(strip_tags($user['bio'] ?? ''));
            }
        } catch (Exception $e) {
        }

        $degree = '';
        try {
            $d = $this->conn->query("SELECT title, college_name, university_name FROM academics ORDER BY start_date DESC LIMIT 1")->fetch();
            if ($d) {
                $institution = trim(trim($d['college_name'] ?? '') . ', ' . trim($d['university_name'] ?? ''), ', ');
                $degree = $d['title'] . ($institution ? " from {$institution}" : '');
            }
        } catch (Exception $e) {
        }

        $roles = [];
        try {
            $stmt = $this->conn->query(
                "SELECT designation, office_name FROM journey
                 WHERE end_date IS NULL OR end_date < '2000-01-01'
                 ORDER BY start_date DESC LIMIT 3"
            );
            foreach ($stmt->fetchAll() as $row) {
                $roles[] = trim($row['designation'] . ' at ' . $row['office_name']);
            }
        } catch (Exception $e) {
        }

        $counts = ['workproject' => 0, 'academicsproject' => 0];
        try {
            foreach ($this->conn->query("SELECT category, COUNT(*) AS c FROM projects GROUP BY category") as $row) {
                if (isset($counts[$row['category']])) {
                    $counts[$row['category']] = (int)$row['c'];
                }
            }
        } catch (Exception $e) {
        }

        $parts = [$name];
        if ($tagline) {
            $parts[] = $tagline;
        }

        $body = [];
        if (!empty($roles)) {
            $body[] = 'currently working as ' . implode(' and ', $roles);
        }
        if ($degree) {
            $body[] = 'holding a ' . $degree;
        }
        $body[] = "with {$counts['workproject']} professional and {$counts['academicsproject']} academic projects";
        $parts[] = 'is ' . implode(', ', $body) . '.';
        if ($bio) {
            $parts[] = $bio;
        }

        return implode(' ', $parts) . ' Ask me about his projects, journey, skills, or achievements!';
    }

    private function normalizeSkillName($tag) {
        $map = [
            'node' => 'Node.js',
            'nodejs' => 'Node.js',
            'sequalize' => 'Sequelize',
            'postgres' => 'PostgreSQL',
            'firebase' => 'Firebase',
            'raspberrypi' => 'Raspberry Pi',
        ];
        $key = strtolower($tag);
        return $map[$key] ?? (strtoupper(substr($tag, 0, 1)) . substr($tag, 1));
    }

    private function getSkillsAnswer() {
        try {
            $stmt = $this->conn->query("SELECT DISTINCT tag FROM entity_tags WHERE entity_type = 'project'");
            $skills = [];
            foreach ($stmt->fetchAll() as $row) {
                $skills[$this->normalizeSkillName($row['tag'])] = true;
            }
        } catch (Exception $e) {
            return "I don't have that specific information about Sahaj. Please ask about his journey, academics, projects, or achievements.";
        }

        $skills = array_keys($skills);
        if (empty($skills)) {
            return "I don't have that specific information about Sahaj. Please ask about his journey, academics, projects, or achievements.";
        }

        usort($skills, function ($a, $b) {
            $ai = array_search($a, $this->SKILL_ORDER, true);
            $bi = array_search($b, $this->SKILL_ORDER, true);
            $ai = $ai === false ? 999 : $ai;
            $bi = $bi === false ? 999 : $bi;
            if ($ai === $bi) {
                return strcmp($a, $b);
            }
            return $ai - $bi;
        });

        return "Sahaj's technical skills include " . implode(', ', $skills) . ". These are the tools and technologies he uses across his projects.";
    }

    private function getLatestProjectResponse() {
        $project = false;
        $stopwords = [
            'engineering', 'management', 'college', 'university', 'and', 'of', 'the',
            'ltd', 'pvt', 'private', 'company', 'office', 'center', 'centre',
            'institute', 'limited',
        ];
        try {
            $stmt = $this->conn->query(
                "SELECT office_name FROM journey
                 WHERE end_date IS NULL OR end_date < '2000-01-01'
                 ORDER BY start_date DESC"
            );
            $roles = $stmt->fetchAll();

            $stmt = $this->conn->prepare(
                "SELECT id, name, description, detail FROM projects
                 WHERE category = 'workproject' AND LOWER(name) LIKE ?
                 ORDER BY created_at DESC LIMIT 1"
            );
            foreach ($roles as $role) {
                if (!trim($role['office_name'])) {
                    continue;
                }
                $office = strtolower(trim($role['office_name']));
                $tokens = preg_split('/\s+/', $office);
                $attempts = [$office];
                foreach ($tokens as $token) {
                    if (strlen($token) >= 3 && !in_array($token, $stopwords)) {
                        $attempts[] = $token;
                    }
                }
                foreach (array_unique($attempts) as $attempt) {
                    $stmt->execute(['%' . $attempt . '%']);
                    $candidate = $stmt->fetch();
                    if ($candidate) {
                        $project = $candidate;
                        break 2;
                    }
                }
            }
        } catch (Exception $e) {
        }

        if (!$project) {
            try {
                $stmt = $this->conn->prepare(
                    "SELECT id, name, description, detail FROM projects
                     WHERE category = 'workproject'
                     ORDER BY created_at DESC LIMIT 1"
                );
                $stmt->execute();
                $project = $stmt->fetch();
            } catch (Exception $e) {
            }
        }

        if (!$project) {
            return "I don't have that specific information about Sahaj. Please ask about his journey, academics, projects, or achievements.";
        }

        $tags = [];
        try {
            $stmt = $this->conn->prepare("SELECT tag FROM entity_tags WHERE entity_type = 'project' AND entity_id = ?");
            $stmt->execute([$project['id']]);
            foreach ($stmt->fetchAll() as $row) {
                $tags[$this->normalizeSkillName($row['tag'])] = true;
            }
        } catch (Exception $e) {
        }

        $detail = trim(strip_tags($project['detail'] ?? ''));
        $desc = trim(strip_tags($project['description'] ?? ''));
        $response = "Sahaj's most recent project is {$project['name']}";
        if (!empty($tags)) {
            $response .= ', built with ' . implode(', ', array_keys($tags));
        }
        if ($detail) {
            $response .= '. ' . (strlen($detail) > 500 ? substr($detail, 0, 500) . '...' : $detail);
        } elseif ($desc) {
            $response .= '. ' . $desc;
        } else {
            $response .= '.';
        }
        return $response;
    }

    private function getProjectCategoryResponse() {
        $counts = null;
        try {
            $stmt = $this->conn->query("SELECT category, COUNT(*) AS c FROM projects GROUP BY category");
            $counts = ['workproject' => 0, 'academicsproject' => 0];
            foreach ($stmt->fetchAll() as $row) {
                if (isset($counts[$row['category']])) {
                    $counts[$row['category']] = (int)$row['c'];
                }
            }
        } catch (Exception $e) {
            $counts = null;
        }

        if ($counts) {
            return "Sahaj has worked on {$counts['workproject']} professional project(s) and {$counts['academicsproject']} academic project(s). Would you like to know about his professional projects or his academic projects?";
        }
        return "Sahaj has worked on both professional and academic projects. Would you like to know about his professional projects or his academic projects?";
    }

    private function getProjectsByCategoryResponse($message) {
        $lower = strtolower($message);
        $academic = (bool)preg_match('/\b(academic|college|university|school)\b/', $lower);
        $category = $academic ? 'academicsproject' : 'workproject';

        try {
            $stmt = $this->conn->prepare("SELECT name FROM projects WHERE category = ? ORDER BY created_at ASC");
            $stmt->execute([$category]);
            $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
        } catch (Exception $e) {
            $rows = [];
        }

        if (empty($rows)) {
            return "I don't have a list of " . ($academic ? 'academic' : 'professional') . " projects for Sahaj right now.";
        }

        $label = $academic ? 'academic' : 'professional';
        return "Sahaj's " . $label . " projects: " . implode(', ', $rows) . ".";
    }

    private function extractKeywords($text) {
        $stop = [
            'the', 'and', 'for', 'are', 'was', 'with', 'that', 'this', 'these', 'those',
            'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'how', 'has',
            'have', 'had', 'did', 'does', 'doing', 'his', 'her', 'hers', 'their',
            'there', 'they', 'she', 'he', 'him', 'you', 'your', 'yours', 'about',
            'from', 'into', 'onto', 'over', 'under', 'than', 'then', 'them', 'can',
            'could', 'would', 'should', 'will', 'shall', 'not', 'but', 'also', 'were',
            'been', 'being', 'tell', 'describe', 'list', 'name', 'give', 'show',
            'please', 'sahaj',
        ];

        $words = preg_split('/\s+/', strtolower($text));
        $out = [];
        foreach ($words as $word) {
            $word = preg_replace('/[^a-z0-9]/', '', $word);
            if (strlen($word) >= 4 && !in_array($word, $stop)) {
                $out[$word] = true;
            }
        }
        return array_keys($out);
    }

    private function getTopicTypes($message) {
        $lower = strtolower($message);
        $types = [];

        if (preg_match('/\b(job\w*|work\w*|career\w*|experience|intern\w*|employ\w*|company|office|position|role|freelance\w*|lecturer|engineer|developer)\b/', $lower)) {
            $types[] = 'work_experience';
        }
        if (preg_match('/\b(skill\w*|technolog\w*|tech stack|framework|language|programming|react|javascript|php|python|node|firebase|mysql)\b/', $lower)) {
            $types[] = 'project';
            $types[] = 'achievement';
        }
        if (preg_match('/\b(educat\w*|stud\w*|college|university|school|degree|bachelor|master|course|academic\w*|convocation)\b/', $lower)) {
            $types[] = 'education';
        }
        if (preg_match('/\bproject\w*\b/', $lower)) {
            $types[] = 'project';
            $types[] = 'academic_project';
        }
        if (preg_match('/\b(achiev\w*|award\w*|prize|winner|hackathon|competition|recognized|excellence)\b/', $lower)) {
            $types[] = 'achievement';
        }
        if (preg_match('/\b(testimonial|feedback|review|recommend|said)\b/', $lower)) {
            $types[] = 'testimonial';
        }
        if (preg_match('/\bjourney\b/', $lower)) {
            $types[] = 'work_experience';
            $types[] = 'academic_detail';
        }
        if (preg_match('/\b(photo|photography|album|gallery)\b/', $lower)) {
            $types[] = 'photography';
        }
        if (preg_match('/\b(about|bio|introduce|who is|who are|contact|email|phone)\b/', $lower)) {
            $types[] = 'user_info';
        }

        return $types;
    }

    private function filterRelevantChunks($chunks, $query) {
        $keywords = $this->extractKeywords($query);
        $seen = [];
        $out = [];

        foreach ($chunks as $chunk) {
            $text = strtolower($chunk['chunk_text']);
            $overlap = 0;
            foreach ($keywords as $kw) {
                if (strpos($text, $kw) !== false) {
                    $overlap++;
                }
            }
            if ($overlap === 0) {
                continue;
            }

            $key = md5($chunk['chunk_text']);
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $chunk['_overlap'] = $overlap;
            $out[] = $chunk;
        }

        usort($out, function ($a, $b) {
            return ($b['_overlap'] ?? 0) <=> ($a['_overlap'] ?? 0);
        });

        return $out;
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
You are Sahaj's Assistant, an AI chatbot on Sahaj Shakya's portfolio website. You help visitors learn about Sahaj Shakya.

CONTEXT FROM SAHAJ'S PORTFOLIO:
{$context}

RULES:
1. Answer the user's question using ONLY the context above. Infer details from it when reasonable (for example, list technologies as skills).
2. If the question is clearly not about Sahaj, say exactly: "That question isn't related to Sahaj Shakya. Please ask about his journey, academics, projects, or achievements."
3. If the context has nothing related to the question, say exactly: "I don't have that specific information about Sahaj. Please ask about his journey, academics, projects, or achievements."
4. Use the conversation history to understand follow-up questions.
5. Keep responses concise and professional.
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
