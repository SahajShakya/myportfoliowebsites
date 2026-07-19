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
            'buildAcademics',
            'buildJourney',
            'buildProjects',
            'buildAchievements',
            'buildTestimonials',
            'buildAcademicProjects',
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
            'academics'         => 'buildAcademics',
            'journey'           => 'buildJourney',
            'projects'          => 'buildProjects',
            'achievements'      => 'buildAchievements',
            'testimonials'      => 'buildTestimonials',
            'academic_projects' => 'buildAcademicProjects',
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
        $stmt = $this->conn->prepare("SELECT name, email, phone, bio, tagline FROM users WHERE role_id = 1 LIMIT 1");
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

    private function buildAcademics() {
        $stmt = $this->conn->query("
            SELECT a.id, a.title, a.university_name, a.college_name, 
                   a.start_date, a.end_date, a.description, a.contents
            FROM academics a
        ");
        $academics = $stmt->fetchAll();

        foreach ($academics as $acad) {
            $text = "Education: {$acad['title']} at {$acad['university_name']}, {$acad['college_name']}. ";
            $text .= "Duration: {$acad['start_date']} to {$acad['end_date']}. ";
            if ($acad['description']) {
                $text .= strip_tags($acad['description']) . " ";
            }
            if ($acad['contents']) {
                $text .= strip_tags($acad['contents']) . " ";
            }

            $this->chunkModel->insert('academics', $acad['id'], $text, [
                'type' => 'education',
                'title' => $acad['title'],
                'institution' => $acad['university_name'],
            ]);

            $this->buildAcademicContents($acad['id']);
        }
    }

    private function buildAcademicContents($academicId) {
        $stmt = $this->conn->prepare("SELECT content_text FROM academics_contents WHERE academic_id = ? AND content_text IS NOT NULL");
        $stmt->execute([$academicId]);
        $contents = $stmt->fetchAll();

        foreach ($contents as $content) {
            $text = strip_tags($content['content_text']);
            if (strlen($text) > 20) {
                $this->chunkModel->insert('academics_contents', $academicId, $text, [
                    'type' => 'education_detail',
                    'academic_id' => $academicId,
                ]);
            }
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

            $this->buildJourneyContents($journey['id']);
        }
    }

    private function buildJourneyContents($journeyId) {
        $stmt = $this->conn->prepare("SELECT content_text FROM journey_contents WHERE journey_id = ? AND content_text IS NOT NULL");
        $stmt->execute([$journeyId]);
        $contents = $stmt->fetchAll();

        foreach ($contents as $content) {
            $text = strip_tags($content['content_text']);
            if (strlen($text) > 20) {
                $this->chunkModel->insert('journey_contents', $journeyId, $text, [
                    'type' => 'work_detail',
                    'journey_id' => $journeyId,
                ]);
            }
        }
    }

    private function buildProjects() {
        $stmt = $this->conn->query("
            SELECT p.id, p.name, p.description, p.contents, p.source_code_link
            FROM projects p
        ");
        $projects = $stmt->fetchAll();

        foreach ($projects as $project) {
            $text = "Project: {$project['name']}. ";
            if ($project['description']) {
                $text .= strip_tags($project['description']) . " ";
            }
            if ($project['contents']) {
                $text .= strip_tags($project['contents']) . " ";
            }
            if ($project['source_code_link']) {
                $text .= "Source code: {$project['source_code_link']} ";
            }

            $tags = $this->getTags('project_tags', 'project_id', $project['id']);
            if (!empty($tags)) {
                $text .= "Technologies: " . implode(', ', $tags) . ". ";
            }

            $this->chunkModel->insert('projects', $project['id'], $text, [
                'type' => 'project',
                'title' => $project['name'],
                'tags' => $tags,
            ]);

            $this->buildProjectDetails($project['id']);
        }
    }

    private function buildProjectDetails($projectId) {
        $stmt = $this->conn->prepare("SELECT contents FROM project_details WHERE project_id = ? AND contents IS NOT NULL");
        $stmt->execute([$projectId]);
        $details = $stmt->fetchAll();

        foreach ($details as $detail) {
            $text = strip_tags($detail['contents']);
            if (strlen($text) > 20) {
                $this->chunkModel->insert('project_details', $projectId, $text, [
                    'type' => 'project_detail',
                    'project_id' => $projectId,
                ]);
            }
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

            $tags = $this->getTags('achievement_tags', 'achievement_id', $achievement['id']);
            if (!empty($tags)) {
                $text .= "Tags: " . implode(', ', $tags) . ". ";
            }

            $this->chunkModel->insert('achievements', $achievement['id'], $text, [
                'type' => 'achievement',
                'title' => $achievement['name'],
                'tags' => $tags,
            ]);

            $this->buildAchievementDetails($achievement['id']);
        }
    }

    private function buildAchievementDetails($achievementId) {
        $stmt = $this->conn->prepare("SELECT contents FROM achievement_details WHERE achievement_id = ? AND contents IS NOT NULL");
        $stmt->execute([$achievementId]);
        $details = $stmt->fetchAll();

        foreach ($details as $detail) {
            $text = strip_tags($detail['contents']);
            if (strlen($text) > 20) {
                $this->chunkModel->insert('achievement_details', $achievementId, $text, [
                    'type' => 'achievement_detail',
                    'achievement_id' => $achievementId,
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

    private function buildAcademicProjects() {
        $stmt = $this->conn->query("
            SELECT ap.id, ap.name, ap.description, ap.contents, ap.source_code_link
            FROM academic_projects ap
        ");
        $projects = $stmt->fetchAll();

        foreach ($projects as $project) {
            $text = "Academic Project: {$project['name']}. ";
            if ($project['description']) {
                $text .= strip_tags($project['description']) . " ";
            }
            if ($project['contents']) {
                $text .= strip_tags($project['contents']) . " ";
            }

            $tags = $this->getTags('academic_project_tags', 'academic_project_id', $project['id']);
            if (!empty($tags)) {
                $text .= "Technologies: " . implode(', ', $tags) . ". ";
            }

            $this->chunkModel->insert('academic_projects', $project['id'], $text, [
                'type' => 'academic_project',
                'title' => $project['name'],
                'tags' => $tags,
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

            $tags = $this->getTags('photography_tags', 'photography_id', $album['id']);
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

    private function getTags($table, $foreignKey, $id) {
        $stmt = $this->conn->prepare("SELECT tag FROM {$table} WHERE {$foreignKey} = ?");
        $stmt->execute([$id]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
}
