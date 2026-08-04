<?php
class KnowledgeBuilder {
    private $conn;
    private $chunkModel;

    public function __construct($db) {
        $this->conn = $db;
        require_once __DIR__ . '/../models/KnowledgeChunk.php';
        $this->chunkModel = new KnowledgeChunk($db);
    }

    public function buildAll() {
        $this->chunkModel->deleteAll();

        $methods = [
            'buildUserInfo',
            'buildJourney',
            'buildAcademics',
            'buildProjects',
            'buildAchievements',
            'buildTestimonials',
            'buildPhotography',
        ];

        $skipped = [];
        foreach ($methods as $method) {
            try {
                $this->$method();
            } catch (PDOException $e) {
                $skipped[] = $method;
            }
        }

        if (!empty($skipped)) {
            echo "Skipped (table not found): " . implode(', ', $skipped) . "\n";
        }

        return $this->chunkModel->getCount();
    }

    public function buildTable($tableName) {
        $map = [
            'users'             => 'buildUserInfo',
            'journey'           => 'buildJourney',
            'academics'         => 'buildAcademics',
            'projects'          => 'buildProjects',
            'achievements'      => 'buildAchievements',
            'testimonials'      => 'buildTestimonials',
            'photography'       => 'buildPhotography',
        ];

        if (!isset($map[$tableName])) {
            return;
        }

        $this->chunkModel->deleteBySource($tableName);
        try {
            $this->{$map[$tableName]}();
        } catch (PDOException $e) {
            // table doesn't exist, skip silently
        }
    }

    private function buildUserInfo() {
        $stmt = $this->conn->prepare("SELECT name, email, phone, bio, tagline FROM users ORDER BY created_at ASC LIMIT 1");
        $stmt->execute();
        $user = $stmt->fetch();

        if ($user) {
            $text = "Sahaj Shakya is a professional ";
            if ($user['tagline']) {
                $text .= $user['tagline'] . ". ";
            }
            if ($user['bio']) {
                $text .= $user['bio'] . ". ";
            }
            $text .= "Contact: " . ($user['email'] ?? '') . ". ";
            if ($user['phone']) {
                $text .= "Phone: " . $user['phone'] . ".";
            }

            $this->chunkModel->insert('users', 1, $text, [
                'type' => 'user_info',
                'title' => 'About Sahaj Shakya',
            ]);
        }
    }

    private function buildJourney() {
        $stmt = $this->conn->query("
            SELECT j.id, j.title, j.office_name, j.designation, 
                   j.start_date, j.end_date, j.description, j.contents
            FROM journey j
        ");
        $journeys = $stmt->fetchAll();

        foreach ($journeys as $journey) {
            $text = "Work Experience: {$journey['designation']} at {$journey['office_name']}. ";
            $text .= "Project: {$journey['title']}. ";
            $text .= "Duration: {$journey['start_date']} to " . ($journey['end_date'] ?: 'Present') . ". ";
            if ($journey['description']) {
                $text .= strip_tags($journey['description']) . " ";
            }
            if ($journey['contents']) {
                $text .= strip_tags($journey['contents']) . " ";
            }

            $this->chunkModel->insert('journey', $journey['id'], $text, [
                'type' => 'work_experience',
                'title' => $journey['title'],
                'company' => $journey['office_name'],
                'designation' => $journey['designation'],
            ]);

            $this->buildEntityContents('journey', $journey['id']);
        }
    }

    private function buildAcademics() {
        $stmt = $this->conn->query("
            SELECT id, title, university_name, college_name, start_date, end_date, description
            FROM academics
            ORDER BY start_date ASC
        ");
        $academics = $stmt->fetchAll();

        foreach ($academics as $academic) {
            $text = "Education: {$academic['title']}";
            if ($academic['college_name']) {
                $text .= ", {$academic['college_name']}";
            }
            if ($academic['university_name']) {
                $text .= ", {$academic['university_name']}";
            }
            if ($academic['start_date']) {
                $text .= ". Duration: {$academic['start_date']} to " . ($academic['end_date'] ?: 'Present');
            }
            if ($academic['description']) {
                $text .= ". " . strip_tags($academic['description']);
            }

            $this->chunkModel->insert('academics', $academic['id'], $text, [
                'type' => 'education',
                'title' => $academic['title'],
            ]);

            $this->buildEntityContents('academic', $academic['id']);
        }
    }

    private function buildEntityContents($entityType, $entityId) {
        $stmt = $this->conn->prepare("SELECT content_text FROM entity_contents WHERE entity_type = ? AND entity_id = ? AND content_text IS NOT NULL");
        $stmt->execute([$entityType, $entityId]);
        $contents = $stmt->fetchAll();

        foreach ($contents as $content) {
            $text = strip_tags($content['content_text']);
            if (strlen($text) > 20) {
                $this->chunkModel->insert('entity_contents', $entityId, $text, [
                    'type' => $entityType . '_detail',
                    'entity_type' => $entityType,
                    'entity_id' => $entityId,
                ]);
            }
        }
    }

    private function buildProjects() {
        $stmt = $this->conn->query("
            SELECT p.id, p.name, p.category, p.description, p.contents, p.source_code_link
            FROM projects p
        ");
        $projects = $stmt->fetchAll();

        foreach ($projects as $project) {
            $isAcademic = ($project['category'] ?? 'workproject') === 'academicsproject';
            $text = $isAcademic
                ? "Academic Project: {$project['name']}. "
                : "Project: {$project['name']}. ";
            if ($project['description']) {
                $text .= strip_tags($project['description']) . " ";
            }
            if ($project['contents']) {
                $text .= strip_tags($project['contents']) . " ";
            }
            if ($project['source_code_link']) {
                $text .= "Source code: {$project['source_code_link']} ";
            }

            $tags = $this->getEntityTags('project', $project['id']);
            if (!empty($tags)) {
                $text .= "Technologies: " . implode(', ', $tags) . ". ";
            }

            $this->chunkModel->insert('projects', $project['id'], $text, [
                'type' => $isAcademic ? 'academic_project' : 'project',
                'category' => $project['category'] ?? 'workproject',
                'title' => $project['name'],
                'tags' => $tags,
            ]);

            $this->buildEntityContents('project', $project['id']);
            $this->buildEntityDetails('project', $project['id']);
        }
    }

    private function buildAchievements() {
        $stmt = $this->conn->query("
            SELECT a.id, a.name, a.description, a.contents
            FROM achievements a
        ");
        $achievements = $stmt->fetchAll();

        foreach ($achievements as $achievement) {
            $text = "Achievement: {$achievement['name']}. ";
            if ($achievement['description']) {
                $text .= strip_tags($achievement['description']) . " ";
            }
            if ($achievement['contents']) {
                $text .= strip_tags($achievement['contents']) . " ";
            }

            $tags = $this->getEntityTags('achievement', $achievement['id']);
            if (!empty($tags)) {
                $text .= "Tags: " . implode(', ', $tags) . ". ";
            }

            $this->chunkModel->insert('achievements', $achievement['id'], $text, [
                'type' => 'achievement',
                'title' => $achievement['name'],
                'tags' => $tags,
            ]);

            $this->buildEntityDetails('achievement', $achievement['id']);
        }
    }

    private function buildEntityDetails($entityType, $entityId) {
        $stmt = $this->conn->prepare("SELECT contents FROM entity_details WHERE entity_type = ? AND entity_id = ? AND contents IS NOT NULL");
        $stmt->execute([$entityType, $entityId]);
        $details = $stmt->fetchAll();

        foreach ($details as $detail) {
            $text = strip_tags($detail['contents']);
            if (strlen($text) > 20) {
                $this->chunkModel->insert('entity_details', $entityId, $text, [
                    'type' => $entityType . '_detail',
                    'entity_type' => $entityType,
                    'entity_id' => $entityId,
                ]);
            }
        }
    }

    private function buildTestimonials() {
        $stmt = $this->conn->query("SELECT id, testimonial, name, designation, company FROM testimonials");
        $testimonials = $stmt->fetchAll();

        foreach ($testimonials as $testimonial) {
            $text = "Testimonial from {$testimonial['name']}";
            if ($testimonial['designation']) {
                $text .= ", {$testimonial['designation']}";
            }
            if ($testimonial['company']) {
                $text .= " at {$testimonial['company']}";
            }
            $text .= ": {$testimonial['testimonial']}";

            $this->chunkModel->insert('testimonials', $testimonial['id'], $text, [
                'type' => 'testimonial',
                'author' => $testimonial['name'],
                'designation' => $testimonial['designation'],
                'company' => $testimonial['company'],
            ]);
        }
    }

    private function buildPhotography() {
        $stmt = $this->conn->query("SELECT id, title, description FROM photography");
        $albums = $stmt->fetchAll();

        foreach ($albums as $album) {
            $text = "Photography Album: {$album['title']}. ";
            if ($album['description']) {
                $text .= strip_tags($album['description']) . " ";
            }

            $tags = $this->getEntityTags('photography', $album['id']);
            if (!empty($tags)) {
                $text .= "Tags: " . implode(', ', $tags) . ". ";
            }

            $this->chunkModel->insert('photography', $album['id'], $text, [
                'type' => 'photography',
                'title' => $album['title'],
                'tags' => $tags,
            ]);
        }
    }

    private function getEntityTags($entityType, $entityId) {
        $stmt = $this->conn->prepare("SELECT tag FROM entity_tags WHERE entity_type = ? AND entity_id = ?");
        $stmt->execute([$entityType, $entityId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
}
